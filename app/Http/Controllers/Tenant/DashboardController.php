<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Services\AttendancePolicyService;
use App\Domain\Attendance\Services\AttendanceService;
use App\Domain\Attendance\Services\NetworkVerificationService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Holiday\Services\HolidayService;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Leave\Services\LeaveBalanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(
        Request $request,
        AttendanceService $attendance,
        NetworkVerificationService $networks,
        AttendancePolicyService $policy,
        HolidayService $holidays,
        LeaveBalanceService $balances,
    ): Response|RedirectResponse {
        if ($request->user()?->is_platform_admin) {
            return redirect()->route('platform.dashboard');
        }

        $user = $request->user();
        $employee = $user?->employee()?->with(['office', 'shift'])->first();
        $today = $employee ? $attendance->todayRecord($employee)?->load('office') : null;
        $network = $employee ? $networks->inspect($request, $employee) : null;
        $shift = $employee?->shift;

        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();

        $monthCounts = [
            'present' => 0,
            'late' => 0,
            'absent' => 0,
            'leave' => 0,
        ];

        $leaveBalances = [];
        $upcomingHolidays = [];
        $recentLeaves = [];

        if ($employee) {
            $balances->ensureForEmployee($employee);

            $records = Attendance::query()
                ->where('employee_id', $employee->id)
                ->whereBetween('attendance_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->get();

            $monthCounts['present'] = $records->where('status', AttendanceStatus::Present)->count();
            $monthCounts['late'] = $records->where('status', AttendanceStatus::Late)->count();
            $monthCounts['absent'] = $records->where('status', AttendanceStatus::Absent)->count();
            $monthCounts['leave'] = $records->where('status', AttendanceStatus::Leave)->count();

            $leaveBalances = $employee->leaveBalances()
                ->with('leaveType')
                ->where('year', now()->year)
                ->get()
                ->map(fn ($balance): array => [
                    'name' => $balance->leaveType?->name,
                    'remaining' => $balance->remaining,
                    'allocated' => $balance->allocated,
                ]);

            $upcomingHolidays = $holidays->upcoming($employee, 4)->map(fn ($holiday): array => [
                'name' => $holiday->name,
                'date' => $holiday->date->toDateString(),
            ]);

            $recentLeaves = LeaveRequest::query()
                ->with('leaveType')
                ->where('employee_id', $employee->id)
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (LeaveRequest $leave): array => [
                    'id' => $leave->id,
                    'type' => $leave->leaveType?->name,
                    'start_date' => $leave->start_date->toDateString(),
                    'end_date' => $leave->end_date->toDateString(),
                    'status' => $leave->status->value,
                    'status_label' => $leave->status->label(),
                ]);
        }

        $isHr = $user?->can('employee.view') ?? false;
        $canApprove = $user?->can('leave.approve') ?? false;

        $teamToday = null;
        $pendingLeaveCount = 0;

        if ($isHr || $canApprove) {
            $pendingQuery = LeaveRequest::query()->where('status', LeaveRequestStatus::Pending);

            if (! $isHr) {
                $pendingQuery->whereHas('employee', fn ($query) => $query->where('manager_id', $employee?->id));
            }

            $pendingLeaveCount = $pendingQuery->count();
        }

        if ($isHr) {
            $todayDate = now()->toDateString();
            $totalEmployees = Employee::query()->active()->count();
            $presentToday = Attendance::query()
                ->whereDate('attendance_date', $todayDate)
                ->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])
                ->count();
            $lateToday = Attendance::query()
                ->whereDate('attendance_date', $todayDate)
                ->where('status', AttendanceStatus::Late)
                ->count();
            $onLeaveToday = Attendance::query()
                ->whereDate('attendance_date', $todayDate)
                ->where('status', AttendanceStatus::Leave)
                ->count();

            $teamToday = [
                'total_employees' => $totalEmployees,
                'present' => $presentToday,
                'late' => $lateToday,
                'on_leave' => $onLeaveToday,
                'absent' => max(0, $totalEmployees - $presentToday - $onLeaveToday),
            ];
        }

        return Inertia::render('dashboard', [
            'employee' => $employee ? [
                'id' => $employee->id,
                'full_name' => $employee->full_name,
                'employee_code' => $employee->employee_code,
                'office' => $employee->office?->only(['id', 'name', 'code']),
                'shift' => $shift ? [
                    'name' => $shift->name,
                    'start_time' => substr((string) $shift->start_time, 0, 5),
                    'end_time' => substr((string) $shift->end_time, 0, 5),
                    'grace_minutes' => $shift->grace_minutes,
                ] : null,
            ] : null,
            'today' => $today ? [
                'status' => $today->status->value,
                'status_label' => $today->status->label(),
                'check_in_at' => $today->check_in_at?->timezone(config('app.timezone'))->toIso8601String(),
                'check_out_at' => $today->check_out_at?->timezone(config('app.timezone'))->toIso8601String(),
                'late_minutes' => $today->late_minutes,
                'work_minutes' => $today->work_minutes,
                'office' => $today->office?->only(['id', 'name']),
            ] : null,
            'network' => $network ? [
                'allowed' => $network['allowed'],
                'ip' => $network['ip'],
                'office' => $network['office']?->only(['id', 'name']),
                'network' => $network['network']?->only(['id', 'name', 'ip_address']),
                'message' => $network['message'],
            ] : null,
            'attendancePolicy' => $policy->snapshot(),
            'month' => $monthCounts,
            'teamToday' => $teamToday,
            'leaveBalances' => $leaveBalances,
            'upcomingHolidays' => $upcomingHolidays,
            'recentLeaves' => $recentLeaves,
            'pendingLeaveCount' => $pendingLeaveCount,
        ]);
    }
}
