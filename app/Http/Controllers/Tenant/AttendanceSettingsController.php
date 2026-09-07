<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Enums\AttendanceMode;
use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
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

        return Inertia::render('settings/attendance', [
            'mode' => $tenant?->attendanceMode()->value,
            'modes' => collect(AttendanceMode::cases())->map(fn (AttendanceMode $mode): array => [
                'value' => $mode->value,
                'label' => $mode->label(),
                'description' => $mode->description(),
                'requires_location' => $mode->requiresLocation(),
            ]),
            'canUseLocation' => app(SubscriptionService::class)->hasFeature(PlanFeature::LocationAttendance),
        ]);
    }

    public function update(Request $request, SubscriptionService $subscriptions, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.manage'), 403);

        $data = $request->validate([
            'attendance_method' => ['required', Rule::enum(AttendanceMode::class)],
        ]);

        $mode = AttendanceMode::from($data['attendance_method']);

        if ($mode->requiresLocationFeature()) {
            $subscriptions->assertFeature(PlanFeature::LocationAttendance);
        }

        $tenant = Tenant::current();
        abort_unless($tenant instanceof Tenant, 404);

        $old = $tenant->attendanceMode()->value;

        TenantSetting::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'attendance_method'],
            ['value' => $mode->value, 'type' => 'string'],
        );

        TenantSetting::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'location_required'],
            ['value' => $mode->requiresLocation() ? 'true' : 'false', 'type' => 'boolean'],
        );

        $audit->record('settings.attendance_mode', $tenant, oldValues: ['mode' => $old], newValues: ['mode' => $mode->value]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Attendance mode updated.']);

        return back();
    }
}
