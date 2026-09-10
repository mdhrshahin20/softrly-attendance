<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Services\FaceVerificationService;
use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FaceEnrolmentController extends Controller
{
    public function __construct(
        private readonly FaceVerificationService $faces,
        private readonly SubscriptionService $subscriptions,
        private readonly AuditLogger $audit,
    ) {}

    public function edit(Request $request): Response
    {
        $user = $this->currentUser($request);

        $template = $this->faces->templateFor($user);
        $employee = $user->employee;

        return Inertia::render('face/enrol', [
            'enrolled' => $template?->isActive() ?? false,
            'enrolledAt' => $template?->enrolled_at?->toIso8601String(),
            'sampleCount' => $template?->sample_count,
            'hasPhoto' => filled($template?->photo_path),
            'required' => $this->faces->isEnabled(),
            'threshold' => $this->faces->threshold(),
            'employeeCode' => $employee?->employee_code,
            'canEnrol' => $this->subscriptions->hasFeature(PlanFeature::FaceVerification),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $this->currentUser($request);

        $this->subscriptions->assertFeature(PlanFeature::FaceVerification);

        // The browser posts the descriptor list as a JSON string via a hidden
        // input, so decode it before validating. A real array is passed through
        // untouched for API clients.
        $this->decodeDescriptors($request);

        $data = $request->validate([
            // Each descriptor is a 128-float array from face-api.js.
            'descriptors' => ['required', 'array', 'min:1', 'max:'.FaceVerificationService::MAX_SAMPLES],
            'descriptors.*' => ['required', 'array', 'size:'.FaceVerificationService::DESCRIPTOR_LENGTH],
            'descriptors.*.*' => ['required', 'numeric'],
            'selfie' => ['nullable', 'string'],
        ], [
            'descriptors.*.size' => 'A face sample was incomplete. Please capture your face again.',
            'descriptors.*.*.numeric' => 'The face data was not readable. Please capture your face again.',
        ]);

        /** @var list<list<float>> $descriptors */
        $descriptors = $data['descriptors'];
        $employee = $user->employee;

        if (! $employee instanceof Employee) {
            abort(403, 'Only employees can enrol a face.');
        }

        $template = $this->faces->enroll(
            $user,
            $descriptors,
            $employee,
            $data['selfie'] ?? null,
        );

        $this->audit->record('face.enrolled', $template, newValues: [
            'samples' => $template->sample_count,
            'has_photo' => filled($template->photo_path),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Face enrolled. You can now check in with face verification.',
        ]);

        return to_route('face.edit');
    }

    /**
     * Match a captured descriptor against the employee's own template.
     *
     * Used for the live "verify as you look at the camera" experience. It has no
     * side effects — the authoritative check still runs when attendance is
     * actually marked.
     */
    public function verify(Request $request): JsonResponse
    {
        $user = $this->currentUser($request);

        $this->subscriptions->assertFeature(PlanFeature::FaceVerification);

        $data = $request->validate([
            'face_descriptor' => ['required'],
        ]);

        $result = $this->faces->verify($user, $data['face_descriptor']);

        return response()->json([
            'matched' => $result['matched'],
            'score' => $result['score'],
            'threshold' => $result['threshold'],
            'message' => $result['message'],
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = $this->currentUser($request);

        $template = $this->faces->templateFor($user);

        if ($template !== null) {
            $this->faces->revoke($template);

            $this->audit->record('face.revoked', $template, oldValues: [
                'samples' => $template->sample_count,
            ]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Face data removed. You will need to enrol again to use face verification.',
        ]);

        return back();
    }

    /**
     * Show the enrolment photo to the employee it belongs to, or to HR.
     */
    public function photo(Request $request): StreamedResponse
    {
        $user = $this->currentUser($request);

        $template = $this->faces->templateFor($user);
        $path = $template?->photo_path;

        if (! is_string($path) || $path === '' || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return Storage::disk('local')->response($path);
    }

    private function currentUser(Request $request): User
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        return $user;
    }

    /**
     * Turn the JSON string submitted by the hidden input into a real array.
     *
     * Anything that is not a decodable JSON array is left alone so the
     * `array` validation rule reports it.
     */
    private function decodeDescriptors(Request $request): void
    {
        $descriptors = $request->input('descriptors');

        if (! is_string($descriptors)) {
            return;
        }

        $decoded = json_decode($descriptors, true);

        if (is_array($decoded)) {
            $request->merge(['descriptors' => $decoded]);
        }
    }
}
