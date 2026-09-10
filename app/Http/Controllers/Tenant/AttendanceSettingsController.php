<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Enums\AttendanceMode;
use App\Domain\Attendance\Models\FaceTemplate;
use App\Domain\Attendance\Services\FaceVerificationService;
use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantSetting;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceSettingsController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('settings.manage'), 403);

        $tenant = Tenant::current();
        $faces = app(FaceVerificationService::class);

        return Inertia::render('settings/attendance', [
            'mode' => $tenant?->attendanceMode()->value,
            'modes' => collect(AttendanceMode::cases())->map(fn (AttendanceMode $mode): array => [
                'value' => $mode->value,
                'label' => $mode->label(),
                'description' => $mode->description(),
                'requires_location' => $mode->requiresLocation(),
            ]),
            'canUseLocation' => app(SubscriptionService::class)->hasFeature(PlanFeature::LocationAttendance),
            'canUseFace' => app(SubscriptionService::class)->hasFeature(PlanFeature::FaceVerification),
            'face' => [
                'enabled' => $faces->isEnabled($tenant),
                'threshold' => $faces->threshold($tenant),
                'store_selfie' => $faces->shouldStoreSelfie($tenant),
                'enrolled_count' => FaceTemplate::query()->whereNull('revoked_at')->count(),
                'total_employees' => Employee::query()->active()->count(),
            ],
        ]);
    }

    public function update(Request $request, SubscriptionService $subscriptions, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.manage'), 403);

        $data = $request->validate([
            'attendance_method' => ['required', Rule::enum(AttendanceMode::class)],
            'face_verification' => ['sometimes', 'boolean'],
            'face_store_selfie' => ['sometimes', 'boolean'],
            'face_match_threshold' => ['nullable', 'numeric', 'min:0.1', 'max:1.2'],
        ]);

        $mode = AttendanceMode::from($data['attendance_method']);

        if ($mode->requiresLocationFeature()) {
            $subscriptions->assertFeature(PlanFeature::LocationAttendance);
        }

        $faceEnabled = $request->boolean('face_verification');

        if ($faceEnabled) {
            $subscriptions->assertFeature(PlanFeature::FaceVerification);
        }

        $tenant = Tenant::current();
        abort_unless($tenant instanceof Tenant, 404);

        $old = $tenant->attendanceMode()->value;

        $this->putSetting($tenant, 'attendance_method', $mode->value, 'string');
        $this->putSetting($tenant, 'location_required', $mode->requiresLocation() ? 'true' : 'false', 'boolean');
        $this->putSetting($tenant, 'face_verification', $faceEnabled ? 'true' : 'false', 'boolean');
        $this->putSetting($tenant, 'face_store_selfie', $request->boolean('face_store_selfie') ? 'true' : 'false', 'boolean');

        if ($request->filled('face_match_threshold')) {
            $this->putSetting($tenant, 'face_match_threshold', (string) $data['face_match_threshold'], 'string');
        }

        $audit->record('settings.attendance_mode', $tenant, oldValues: ['mode' => $old], newValues: [
            'mode' => $mode->value,
            'face_verification' => $faceEnabled,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Attendance settings updated.']);

        return back();
    }

    private function putSetting(Tenant $tenant, string $key, string $value, string $type): void
    {
        TenantSetting::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => $key],
            ['value' => $value, 'type' => $type],
        );
    }
}
