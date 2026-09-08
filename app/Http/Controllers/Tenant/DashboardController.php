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
        $employee = $user?->employee()?->with(['office', 'shift', 'user'])->first();
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
        $lateToday = [];
        $onLeaveToday = [];
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
            $todayRecords = Attendance::query()
                ->with(['employee.department', 'employee.office', 'employee.user'])
                ->whereDate('attendance_date', $todayDate)
                ->get();

            $lateRecords = $todayRecords
                ->where('status', AttendanceStatus::Late)
                ->sortByDesc('late_minutes')
                ->values();
            $leaveRecords = $todayRecords
                ->where('status', AttendanceStatus::Leave)
                ->sortBy(fn (Attendance $record): string => $record->employee?->full_name ?? '')
                ->values();

            $leaveTypesByEmployee = $this->leaveTypesFor($leaveRecords->pluck('employee_id')->filter()->all(), $todayDate);

            $lateToday = $this->mapTeamAttendance($lateRecords);
            $onLeaveToday = $this->mapTeamAttendance($leaveRecords, $leaveTypesByEmployee);

            $totalEmployees = Employee::query()->active()->count();
            $presentToday = $todayRecords
                ->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])
                ->count();
            $onLeaveCount = $leaveRecords->count();

            $teamToday = [
                'total_employees' => $totalEmployees,
                'present' => $presentToday,
                'late' => $lateRecords->count(),
                'on_leave' => $onLeaveCount,
                'absent' => max(0, $totalEmployees - $presentToday - $onLeaveCount),
            ];
        }

        return Inertia::render('dashboard', [
            'employee' => $employee ? [
                'id' => $employee->id,
                'full_name' => $employee->full_name,
                'employee_code' => $employee->employee_code,
                'avatar' => $employee->avatar,
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
            'lateToday' => $lateToday,
            'onLeaveToday' => $onLeaveToday,
            'leaveBalances' => $leaveBalances,
            'upcomingHolidays' => $upcomingHolidays,
            'recentLeaves' => $recentLeaves,
            'pendingLeaveCount' => $pendingLeaveCount,
        ]);
    }

    /**
     * @param  iterable<int, Attendance>  $records
     * @param  array<int, string|null>  $leaveTypesByEmployee
     * @return list<array{
     *     id: int,
     *     full_name: string,
     *     avatar: string|null,
     *     employee_code: string|null,
     *     department: string|null,
     *     office: string|null,
     *     check_in_at: string|null,
     *     late_minutes: int,
     *     leave_type: string|null
     * }>
     */
    private function mapTeamAttendance(iterable $records, array $leaveTypesByEmployee = []): array
    {
        return collect($records)
            ->filter(fn (Attendance $record): bool => $record->employee !== null)
            ->map(fn (Attendance $record): array => [
                'id' => $record->employee->id,
                'full_name' => $record->employee->full_name,
                'avatar' => $record->employee->avatar,
                'employee_code' => $record->employee->employee_code,
                'department' => $record->employee->department?->name,
                'office' => $record->employee->office?->name,
                'check_in_at' => $record->check_in_at?->timezone(config('app.timezone'))->toIso8601String(),
                'late_minutes' => $record->late_minutes,
                'leave_type' => $leaveTypesByEmployee[$record->employee_id] ?? null,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  list<int>  $employeeIds
     * @return array<int, string|null>
     */
    private function leaveTypesFor(array $employeeIds, string $todayDate): array
    {
        if ($employeeIds === []) {
            return [];
        }

        return LeaveRequest::query()
            ->with('leaveType')
            ->where('status', LeaveRequestStatus::Approved)
            ->whereIn('employee_id', $employeeIds)
            ->whereDate('start_date', '<=', $todayDate)
            ->whereDate('end_date', '>=', $todayDate)
            ->get()
            ->mapWithKeys(fn (LeaveRequest $leave): array => [
                $leave->employee_id => $leave->leaveType?->name,
            ])
            ->all();
    }
}
