<?php

namespace App\Http\Middleware;

use App\Domain\Attendance\Services\FaceVerificationService;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Platform\Services\PlatformSettingsService;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * @var string
     */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Face verification state for the frontend.
     *
     * The enrolment lookup only runs when the tenant has the feature switched on
     * and the visitor is an employee, so most requests pay nothing.
     *
     * @return array{required: bool, enrolled: bool, threshold: float}
     */
    private function faceState(Request $request): array
    {
        $user = $request->user();
        $faces = app(FaceVerificationService::class);

        $required = false;
        $enrolled = false;

        if ($user !== null && Tenant::current() !== null && $faces->isEnabled()) {
            $required = true;
            $enrolled = $user->employee !== null && $faces->isEnrolled($user);
        }

        return [
            'required' => $required,
            'enrolled' => $enrolled,
            'threshold' => $required ? $faces->threshold() : FaceVerificationService::DEFAULT_THRESHOLD,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $tenant = Tenant::current();
        $employee = $user?->employee;
        $subscription = $tenant ? app(SubscriptionService::class)->snapshot($tenant) : null;

        return [
            ...parent::share($request),
            'name' => $tenant?->name ?: config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'status' => $tenant->status->value,
                'timezone' => $tenant->timezone,
            ] : null,
            'employee' => $employee ? [
                'id' => $employee->id,
                'full_name' => $employee->full_name,
                'employee_code' => $employee->employee_code,
                'avatar' => $user?->avatar,
            ] : null,
            'subscription' => $subscription,
            'can' => [
                'manageEmployees' => $user?->can('employee.view') ?? false,
                'createEmployees' => $user?->can('employee.create') ?? false,
                'manageDepartments' => $user?->can('department.manage') ?? false,
                'manageDesignations' => $user?->can('designation.manage') ?? false,
                'manageOffices' => $user?->can('office.manage') ?? false,
                'manageShifts' => $user?->can('shift.manage') ?? false,
                'viewReports' => $user?->can('employee.view') ?? false,
                'markAttendance' => $user?->can('attendance.create') ?? false,
                'applyLeave' => $user?->can('leave.apply') ?? false,
                'approveLeave' => $user?->can('leave.approve') ?? false,
                'manageLeave' => $user?->can('leave.manage') ?? false,
                'viewLeaveApplications' => ($user?->can('employee.view') || $user?->can('leave.manage') || $user?->can('leave.approve')) ?? false,
                'viewHolidays' => $user?->can('holiday.view') ?? false,
                'manageHolidays' => $user?->can('holiday.manage') ?? false,
                'manageSettings' => $user?->can('settings.manage') ?? false,
                'manageRoles' => ($user?->can('role.manage') ?? false) && in_array('custom_roles', $subscription['features'] ?? [], true),
                'viewAudit' => ($user?->can('audit.view') ?? false) && in_array('audit_log', $subscription['features'] ?? [], true),
                'manageBilling' => $user?->can('settings.manage') ?? false,
                'exportReports' => ($user?->can('attendance.export') ?? false) && in_array('exports', $subscription['features'] ?? [], true),
                'advancedReports' => ($user?->can('employee.view') ?? false) && in_array('advanced_reports', $subscription['features'] ?? [], true),
                'managePayroll' => ($user?->can('payroll.manage') ?? false) && in_array('payroll', $subscription['features'] ?? [], true),
                'viewPayroll' => ($user?->can('payroll.view') ?? false) && in_array('payroll', $subscription['features'] ?? [], true),
                'viewPayslips' => ($user?->can('payroll.payslip') || $user?->can('payroll.view') || $user?->can('payroll.manage')) && in_array('payroll', $subscription['features'] ?? [], true),
                'apiAccess' => ($user?->can('settings.manage') ?? false) && in_array('api_access', $subscription['features'] ?? [], true),
                'customDomain' => ($user?->can('settings.manage') ?? false) && in_array('custom_domain', $subscription['features'] ?? [], true),
                'locationAttendance' => in_array('location_attendance', $subscription['features'] ?? [], true),
                'faceVerification' => in_array('face_verification', $subscription['features'] ?? [], true),
                'platform' => $user?->is_platform_admin ?? false,
            ],
            // Face verification state is only computed when the tenant has it switched on.
            'face' => $this->faceState($request),
            'unreadNotifications' => $user?->unreadNotifications()->count() ?? 0,
            'recentNotifications' => $user
                ? $user->notifications()
                    ->latest()
                    ->limit(10)
                    ->get()
                    ->map(fn ($notification): array => [
                        'id' => $notification->id,
                        'title' => $notification->data['title'] ?? 'Notification',
                        'message' => $notification->data['message'] ?? '',
                        'url' => $notification->data['url'] ?? null,
                        'level' => $notification->data['level'] ?? 'info',
                        'read_at' => $notification->read_at?->toIso8601String(),
                        'created_at' => $notification->created_at?->toIso8601String(),
                    ])
                    ->values()
                    ->all()
                : [],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'marketing' => app(PlatformSettingsService::class)->marketingPublic(),
        ];
    }
}
