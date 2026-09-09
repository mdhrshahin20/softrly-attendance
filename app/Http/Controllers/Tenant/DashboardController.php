<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Services\AttendancePolicyService;
use App\Domain\Attendance\Services\AttendanceService;
use App\Domain\Attendance\Services\NetworkVerificationService;
use App\Domain\Employee\Models\Department;
use App\Domain\Employee\Models\Employee;
use App\Domain\Holiday\Services\HolidayService;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Leave\Services\LeaveBalanceService;
use App\Domain\Office\Models\Office;
use App\Http\Controllers\Controller;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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

        $kpis = [];
        $analytics = [];
        $todayAttendance = [];
        $exceptions = [];
        $departmentPerformance = [];
        $officeStatus = [];

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

            // --- Yesterday baselines for KPI deltas -------------------------
            $yesterdayCounts = $this->countsForDate(now()->subDay()->toDateString(), $totalEmployees);

            // --- KPI cards (admin) ------------------------------------------
            $onTimeToday = $todayRecords->where('status', AttendanceStatus::Present)->count();
            $absentToday = max(0, $totalEmployees - $onTimeToday - $lateRecords->count() - $onLeaveCount);

            $kpis = [
                [
                    'key' => 'employees',
                    'value' => $totalEmployees,
                    'hint' => 'Active employees',
                    'delta' => null,
                ],
                $this->kpi('present', $onTimeToday, $yesterdayCounts['present']),
                $this->kpi('late', $lateRecords->count(), $yesterdayCounts['late']),
                $this->kpi('absent', $absentToday, $yesterdayCounts['absent']),
                $this->kpi('leave', $onLeaveCount, $yesterdayCounts['leave']),
            ];

            // --- KPI sparklines (last 7 working days) ------------------------
            $sparkSeries = $this->dailyBreakdown(now()->subDays(6), now());
            $sparks = [
                'employees' => [],
                'present' => array_values(array_map(fn (array $day): int => $day['present'], $sparkSeries)),
                'late' => array_values(array_map(fn (array $day): int => $day['late'], $sparkSeries)),
                'absent' => array_values(array_map(fn (array $day): int => $day['absent'], $sparkSeries)),
                'leave' => array_values(array_map(fn (array $day): int => $day['leave'], $sparkSeries)),
            ];

            foreach ($kpis as &$kpi) {
                $kpi['sparkline'] = $sparks[$kpi['key']] ?? [];
            }
            unset($kpi);

            // --- Analytics series (driven by range filter) -------------------
            $analytics = $this->analyticsForRequest($request);

            // --- Today's attendance rows -------------------------------------
            $todayAttendance = $this->mapTeamAttendance(
                $todayRecords
                    ->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])
                    ->sortByDesc(fn (Attendance $record) => $record->check_in_at)
                    ->take(120)
                    ->values(),
            );

            // --- Needs-attention exceptions ----------------------------------
            $exceptions = $this->exceptionsFor($todayRecords, $totalEmployees, $todayDate);

            // --- Department performance --------------------------------------
            $departmentPerformance = $this->departmentPerformance($todayRecords);

            // --- Office / Wi-Fi status ---------------------------------------
            $officeStatus = $this->officeStatus($todayRecords);
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
            'kpis' => $kpis,
            'analytics' => $analytics,
            'todayAttendance' => $todayAttendance,
            'exceptions' => $exceptions,
            'departmentPerformance' => $departmentPerformance,
            'officeStatus' => $officeStatus,
        ]);
    }

    /**
     * @param  array{key: string, value: int, hint: string, delta: array<string, mixed>|null}  $kpi
     */
    private function kpi(string $key, int $value, int $yesterday): array
    {
        $diff = $value - $yesterday;
        $direction = $diff > 0 ? 'up' : ($diff < 0 ? 'down' : 'flat');
        $delta = $diff === 0 ? null : [
            'delta' => ($diff > 0 ? '+' : '').$diff,
            'direction' => $direction,
            'label' => 'vs yesterday',
        ];

        return [
            'key' => $key,
            'value' => $value,
            'hint' => 'Today',
            'delta' => $delta,
        ];
    }

    /**
     * Total attendance counts for a single date, used as KPI baseline.
     *
     * @return array{present: int, late: int, absent: int, leave: int}
     */
    private function countsForDate(string $date, int $totalEmployees): array
    {
        $rows = Attendance::query()
            ->whereDate('attendance_date', $date)
            ->get(['status']);

        $present = $rows->where('status', AttendanceStatus::Present)->count();
        $late = $rows->where('status', AttendanceStatus::Late)->count();
        $leave = $rows->where('status', AttendanceStatus::Leave)->count();

        return [
            'present' => $present,
            'late' => $late,
            'absent' => max(0, $totalEmployees - $present - $late - $leave),
            'leave' => $leave,
        ];
    }

    /**
     * Per-day status series for the analytics chart. Bounded to 92 days.
     *
     * @return list<array{
     *     date: string,
     *     label: string,
     *     present: int,
     *     late: int,
     *     absent: int,
     *     leave: int
     * }>
     */
    private function dailyBreakdown(CarbonInterface $from, CarbonInterface $to): array
    {
        $from = $from->copy()->startOfDay();
        $to = $to->copy()->startOfDay();

        if ($from->greaterThan($to)) {
            $to = $from->copy();
        }

        $rows = Attendance::query()
            ->whereBetween('attendance_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('attendance_date, status, COUNT(*) as total')
            ->groupBy('attendance_date', 'status')
            ->get();

        $grouped = [];

        foreach ($rows as $row) {
            $date = $row->attendance_date instanceof CarbonInterface
                ? $row->attendance_date->toDateString()
                : Carbon::parse($row->attendance_date)->toDateString();
            $grouped[$date][$row->status->value] = (int) $row->total;
        }

        $series = [];

        foreach (CarbonPeriod::create($from, $to)->days() as $day) {
            $date = $day->format('Y-m-d');
            $counts = $grouped[$date] ?? [];
            $series[] = [
                'date' => $date,
                'label' => $day->format('M j'),
                'present' => $counts['present'] ?? 0,
                'late' => $counts['late'] ?? 0,
                'absent' => $counts['absent'] ?? 0,
                'leave' => $counts['leave'] ?? 0,
            ];
        }

        return $series;
    }

    /**
     * Resolve the requested analytics range (7d default) into a bounded series.
     *
     * @return list<array{date: string, label: string, present: int, late: int, absent: int, leave: int}>
     */
    private function analyticsForRequest(Request $request): array
    {
        $range = (string) $request->query('range', '7d');
        $today = now()->startOfDay();

        if ($range === '30d') {
            return $this->dailyBreakdown($today->copy()->subDays(29), $today->copy());
        }

        if ($range === 'month') {
            return $this->dailyBreakdown($today->copy()->startOfMonth(), $today->copy());
        }

        if ($range === 'custom' && $request->filled(['from', 'to'])) {
            $from = Carbon::parse((string) $request->query('from'))->startOfDay();
            $to = Carbon::parse((string) $request->query('to'))->startOfDay();

            if ($from->diffInDays($to) > 92) {
                $to = $from->copy()->addDays(92);
            }

            return $this->dailyBreakdown($from, $to);
        }

        return $this->dailyBreakdown($today->copy()->subDays(6), $today->copy());
    }

    /**
     * Build the "needs attention" list for the admin dashboard.
     *
     * @param  Collection<int, Attendance>  $todayRecords
     * @return list<array{
     *     id: string,
     *     type: string,
     *     title: string,
     *     detail: string,
     *     severity: string,
     *     employee: array{id: int, full_name: string, avatar: string|null, employee_code: string|null, department: string|null}|null,
     *     action_label: string,
     *     action_href: string
     * }>
     */
    private function exceptionsFor($todayRecords, int $totalEmployees, string $todayDate): array
    {
        $exceptions = [];

        // Pending leave approvals first (highest value).
        $pending = LeaveRequest::query()
            ->with(['employee.department', 'leaveType'])
            ->where('status', LeaveRequestStatus::Pending)
            ->latest()
            ->limit(4)
            ->get();

        foreach ($pending as $leave) {
            if ($leave->employee === null) {
                continue;
            }

            $exceptions[] = [
                'id' => 'leave-'.$leave->id,
                'type' => 'approval',
                'title' => 'Leave request pending',
                'detail' => sprintf(
                    '%s · %s – %s',
                    $leave->leaveType?->name ?? 'Leave',
                    $leave->start_date->format('M j'),
                    $leave->end_date->format('M j'),
                ),
                'severity' => 'high',
                'employee' => $this->employeeShape($leave->employee),
                'action_label' => 'Review',
                'action_href' => '/leave/'.$leave->id,
            ];
        }

        if (! now()->isWeekend() && $totalEmployees > 0) {
            $recordedIds = $todayRecords->pluck('employee_id')->filter();

            $missing = Employee::query()
                ->active()
                ->with('department:id,name')
                ->whereNotIn('id', $recordedIds)
                ->limit(6)
                ->get();

            foreach ($missing as $person) {
                $exceptions[] = [
                    'id' => 'missing-'.$person->id,
                    'type' => 'not_checked_in',
                    'title' => "Hasn't checked in",
                    'detail' => 'No attendance record yet today',
                    'severity' => 'medium',
                    'employee' => $this->employeeShape($person),
                    'action_label' => 'View',
                    'action_href' => '/employees/'.$person->id,
                ];
            }
        }

        // Late arrivals (sorted by minutes late).
        $late = $todayRecords
            ->where('status', AttendanceStatus::Late)
            ->sortByDesc('late_minutes')
            ->take(5);

        foreach ($late as $record) {
            if ($record->employee === null) {
                continue;
            }

            $exceptions[] = [
                'id' => 'late-'.$record->employee_id,
                'type' => 'late',
                'title' => 'Arrived late',
                'detail' => sprintf(
                    '%s late · checked in %s',
                    $record->late_minutes.' min',
                    $record->check_in_at?->format('g:i A') ?? '—',
                ),
                'severity' => 'low',
                'employee' => $this->employeeShape($record->employee),
                'action_label' => 'View',
                'action_href' => '/employees/'.$record->employee_id,
            ];
        }

        return array_slice($exceptions, 0, 12);
    }

    /**
     * Per-department attendance aggregates for today.
     *
     * @param  Collection<int, Attendance>  $todayRecords
     * @return list<array{
     *     id: int|null,
     *     name: string,
     *     employees: int,
     *     present: int,
     *     late: int,
     *     absent: int,
     *     attendance_rate: int
     * }>
     */
    private function departmentPerformance($todayRecords): array
    {
        $departments = Department::query()
            ->withCount(['employees' => fn ($query) => $query->active()])
            ->orderBy('name')
            ->get()
            ->filter(fn (Department $department): bool => $department->employees_count > 0);

        $byEmployee = [];
        $statusKey = fn (Attendance $record): ?string => match ($record->status) {
            AttendanceStatus::Present => 'present',
            AttendanceStatus::Late => 'late',
            AttendanceStatus::Leave => 'leave',
            default => null,
        };

        foreach ($todayRecords as $record) {
            if ($record->employee === null) {
                continue;
            }

            $key = $statusKey($record);

            if ($key === null) {
                continue;
            }

            $byEmployee[$record->employee_id] = [
                'department_id' => $record->employee->department_id,
                'key' => $key,
            ];
        }

        $result = [];

        foreach ($departments as $department) {
            $total = $department->employees_count;
            $present = 0;
            $late = 0;
            $leave = 0;

            foreach ($byEmployee as $entry) {
                if ($entry['department_id'] !== $department->id) {
                    continue;
                }

                match ($entry['key']) {
                    'present' => $present++,
                    'late' => $late++,
                    'leave' => $leave++,
                    default => null,
                };
            }

            $expected = max(1, $total - $leave);

            $result[] = [
                'id' => $department->id,
                'name' => $department->name,
                'employees' => $total,
                'present' => $present,
                'late' => $late,
                'absent' => max(0, $total - $present - $late - $leave),
                'attendance_rate' => (int) round((($present + $late) / $expected) * 100),
            ];
        }

        usort($result, fn (array $a, array $b): int => [$b['attendance_rate'], $a['name']] <=> [$a['attendance_rate'], $b['name']]);

        return array_values($result);
    }

    /**
     * Office status panel for the admin dashboard.
     *
     * @param  Collection<int, Attendance>  $todayRecords
     * @return list<array{
     *     id: int,
     *     name: string,
     *     code: string,
     *     employees: int,
     *     connected_today: int,
     *     network_count: int,
     *     has_authorized_network: bool
     * }>
     */
    private function officeStatus($todayRecords): array
    {
        return Office::query()
            ->withCount('networks')
            ->orderBy('name')
            ->get()
            ->map(fn (Office $office): array => [
                'id' => $office->id,
                'name' => $office->name,
                'code' => $office->code,
                'employees' => $office->employees()->active()->count(),
                'connected_today' => $todayRecords
                    ->filter(fn (Attendance $record) => $record->employee?->office_id === $office->id)
                    ->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])
                    ->pluck('employee_id')
                    ->unique()
                    ->count(),
                'network_count' => $office->networks_count,
                'has_authorized_network' => $office->networks_count > 0,
            ])
            ->filter(fn (array $office): bool => $office['employees'] > 0 || $office['network_count'] > 0)
            ->values()
            ->all();
    }

    /**
     * @return array{id: int, full_name: string, avatar: string|null, employee_code: string|null, department: string|null}
     */
    private function employeeShape(Employee $person): array
    {
        return [
            'id' => $person->id,
            'full_name' => $person->full_name,
            'avatar' => $person->avatar,
            'employee_code' => $person->employee_code,
            'department' => $person->department?->name,
        ];
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
     *     check_out_at: string|null,
     *     late_minutes: int,
     *     status: string|null,
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
                'check_out_at' => $record->check_out_at?->timezone(config('app.timezone'))->toIso8601String(),
                'late_minutes' => $record->late_minutes,
                'status' => $record->status?->value,
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
