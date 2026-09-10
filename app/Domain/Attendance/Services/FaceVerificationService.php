<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Models\FaceTemplate;
use App\Domain\Employee\Models\Employee;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Matches a face descriptor captured in the browser against the template
 * enrolled by the employee.
 *
 * The browser only extracts the descriptor; the decision is always made here so
 * a tampered client cannot simply claim a successful match.
 */
class FaceVerificationService
{
    /** Descriptors are 128-dimensional for this model. */
    public const DESCRIPTOR_LENGTH = 128;

    /** Tenants can override this; lower is stricter. */
    public const DEFAULT_THRESHOLD = 0.5;

    /** Upper bound on a single enrolment batch. */
    public const MAX_SAMPLES = 10;

    /** Selfies are stored on a private disk, never the public one. */
    private const DISK = 'local';

    public function isEnabled(?Tenant $tenant = null): bool
    {
        $tenant ??= Tenant::current();

        if ($tenant === null) {
            return false;
        }

        return filter_var(
            $tenant->setting('face_verification', 'false'),
            FILTER_VALIDATE_BOOLEAN,
        );
    }

    public function threshold(?Tenant $tenant = null): float
    {
        $tenant ??= Tenant::current();
        $value = $tenant?->setting('face_match_threshold');

        if ($value === null || $value === '') {
            return self::DEFAULT_THRESHOLD;
        }

        return max(0.1, min(1.2, (float) $value));
    }

    public function shouldStoreSelfie(?Tenant $tenant = null): bool
    {
        $tenant ??= Tenant::current();

        if ($tenant === null) {
            return false;
        }

        return filter_var($tenant->setting('face_store_selfie', 'true'), FILTER_VALIDATE_BOOLEAN);
    }

    public function templateFor(?User $user): ?FaceTemplate
    {
        if ($user === null) {
            return null;
        }

        return FaceTemplate::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->latest('id')
            ->first();
    }

    public function isEnrolled(?User $user): bool
    {
        return $this->templateFor($user)?->isActive() ?? false;
    }

    /**
     * Euclidean distance between two descriptors. Mirrors the metric face-api.js
     * uses internally, so thresholds carry over directly.
     *
     * @param  list<float>  $left
     * @param  list<float>  $right
     */
    public function distance(array $left, array $right): float
    {
        $length = min(count($left), count($right));
        $sum = 0.0;

        for ($i = 0; $i < $length; $i++) {
            $delta = $left[$i] - $right[$i];
            $sum += $delta * $delta;
        }

        return sqrt($sum);
    }

    /**
     * Enrol (or re-enrol) an employee from one or more captured descriptors.
     *
     * @param  list<list<float>>  $descriptors
     */
    public function enroll(
        User $user,
        array $descriptors,
        ?Employee $employee = null,
        ?string $selfieData = null,
    ): FaceTemplate {
        $vectors = array_values(array_filter(
            array_map(fn ($descriptor): array => $this->normalizeDescriptor($descriptor), $descriptors),
            fn (array $vector): bool => $vector !== [],
        ));

        if ($vectors === []) {
            throw ValidationException::withMessages([
                'face' => 'No usable face was detected. Look at the camera in good lighting and try again.',
            ]);
        }

        if (count($vectors) > self::MAX_SAMPLES) {
            $vectors = array_slice($vectors, 0, self::MAX_SAMPLES);
        }

        $tenant = Tenant::current();

        if ($tenant === null) {
            throw ValidationException::withMessages(['face' => 'No active workspace.']);
        }

        $template = FaceTemplate::query()->firstOrNew([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
        ]);

        // Replacing an enrolment invalidates the previous template immediately.
        $template->fill([
            'employee_id' => $employee?->id,
            'descriptor' => $this->meanVector($vectors),
            'sample_count' => count($vectors),
            'enrolled_at' => now(),
            'revoked_at' => null,
        ]);

        if ($selfieData !== null) {
            $template->photo_path = $this->storeSelfie($selfieData, 'enrolment');
        }

        $template->save();

        return $template;
    }

    public function revoke(?FaceTemplate $template): bool
    {
        if ($template === null) {
            return false;
        }

        return (bool) $template->forceFill(['revoked_at' => now()])->save();
    }

    /**
     * Verify a captured descriptor against the stored template.
     *
     * @return array{matched: bool, score: float, threshold: float, message: string|null}
     */
    public function verify(User $user, mixed $descriptor, ?Tenant $tenant = null): array
    {
        $threshold = $this->threshold($tenant);
        $vector = $this->normalizeDescriptor($descriptor);

        if ($vector === []) {
            return [
                'matched' => false,
                'score' => 1.0,
                'threshold' => $threshold,
                'message' => 'We could not read a face from the camera. Face the camera and try again.',
            ];
        }

        $template = $this->templateFor($user);

        if ($template === null || ! $template->isActive()) {
            return [
                'matched' => false,
                'score' => 1.0,
                'threshold' => $threshold,
                'message' => 'You have not enrolled your face yet. Set it up from your profile first.',
            ];
        }

        $score = $this->distance($vector, $template->vector());

        return [
            'matched' => $score < $threshold,
            'score' => round($score, 4),
            'threshold' => $threshold,
            'message' => $score < $threshold
                ? null
                : 'Face verification failed. Make sure your face is clearly visible and try again.',
        ];
    }

    /**
     * Store a browser-captured selfie (base64 data URL) on the private disk.
     */
    public function storeSelfie(string $dataUrl, string $prefix): ?string
    {
        if (! preg_match('/^data:image\/(jpeg|png|webp);base64,(.+)$/', trim($dataUrl), $matches)) {
            return null;
        }

        $binary = base64_decode($matches[2], true);

        if ($binary === false || strlen($binary) > 3_000_000) {
            return null;
        }

        $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
        $path = 'faces/'.$prefix.'-'.Str::uuid().'.'.$extension;

        Storage::disk(self::DISK)->put($path, $binary);

        return $path;
    }

    /**
     * @return list<float>
     */
    private function normalizeDescriptor(mixed $descriptor): array
    {
        if (is_string($descriptor)) {
            $decoded = json_decode($descriptor, true);
            $descriptor = is_array($decoded) ? $decoded : null;
        }

        if (! is_array($descriptor) || count($descriptor) !== self::DESCRIPTOR_LENGTH) {
            return [];
        }

        $vector = [];

        foreach ($descriptor as $value) {
            if (! is_numeric($value)) {
                return [];
            }

            $vector[] = (float) $value;
        }

        return $vector;
    }

    /**
     * @param  list<list<float>>  $vectors
     * @return list<float>
     */
    private function meanVector(array $vectors): array
    {
        $count = count($vectors);
        $length = self::DESCRIPTOR_LENGTH;
        $mean = array_fill(0, $length, 0.0);

        foreach ($vectors as $vector) {
            for ($i = 0; $i < $length; $i++) {
                $mean[$i] += $vector[$i] ?? 0.0;
            }
        }

        return array_values(array_map(fn (float $value): float => round($value / $count, 6), $mean));
    }

    /**
     * Enforce face verification for a check-in or check-out request.
     *
     * Returns the outcome so the caller can persist the score, or throws when
     * the face does not match — the server, never the browser, decides.
     *
     * @return array{required: bool, score: float|null, selfie_path: string|null}
     */
    public function assertVerified(Request $request, Employee $employee): array
    {
        $tenant = Tenant::current();

        if (! $this->isEnabled($tenant)) {
            return ['required' => false, 'score' => null, 'selfie_path' => null];
        }

        $user = $request->user();

        if (! $user instanceof User) {
            throw ValidationException::withMessages([
                'face' => 'You must be signed in to verify your face.',
            ]);
        }

        $result = $this->verify($user, $this->descriptorFromRequest($request), $tenant);

        if (! $result['matched']) {
            throw ValidationException::withMessages([
                'attendance' => $result['message'] ?? 'Face verification failed.',
            ]);
        }

        $selfiePath = null;

        if ($this->shouldStoreSelfie($tenant)) {
            $selfie = $request->input('face_selfie');

            if (is_string($selfie) && $selfie !== '') {
                $selfiePath = $this->storeSelfie($selfie, 'check-'.$employee->id);
            }
        }

        return [
            'required' => true,
            'score' => $result['score'],
            'selfie_path' => $selfiePath,
        ];
    }

    /**
     * Read the descriptor submitted with a check-in / check-out request.
     */
    public function descriptorFromRequest(Request $request): mixed
    {
        return $request->input('face_descriptor');
    }
}
