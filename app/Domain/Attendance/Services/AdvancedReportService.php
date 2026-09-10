<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Employee\Models\Employee;
use App\Domain\Holiday\Services\HolidayService;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Models\LeaveRequest;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class AdvancedReportService
{
    public function __construct(
        private readonly WorkingDayService $workingDays,
        private readonly HolidayService $holidays,
    ) {}

    /**
     * @return array{
     *     from: string,
     *     to: string,
     *     totals: array<string, int|float>,
     *     employees: list<array<string, mixed>>,
     *     leave: array<int, array<string, mixed>>
     * }
     */
    public function build(string $from, string $to, ?int $departmentId = null, ?int $officeId = null): array
    {
        $start = CarbonImmutable::parse($from)->startOfDay();
        $end = CarbonImmutable::parse($to)->startOfDay();

        $employees = Employee::query()
            ->with(['department', 'office', 'shift', 'user'])
            ->active()
            ->when($departmentId, fn ($query, int $id) => $query->where('department_id', $id))
            ->when($officeId, fn ($query, int $id) => $query->where('office_id', $id))
            ->orderBy('first_name')
            ->get();

        $attendance = Attendance::query()
            ->whereBetween('attendance_date', [$start->toDateString(), $end->toDateString()])
            ->when($departmentId, fn ($query, int $id) => $query->whereHas('employee', fn ($employee) => $employee->where('department_id', $id)))
            ->when($officeId, fn ($query, int $id) => $query->where('office_id', $id))
            ->get()
            ->groupBy('employee_id');

        $leave = LeaveRequest::query()
            ->with('leaveType')
            ->where('status', LeaveRequestStatus::Approved)
            ->whereDate('start_date', '<=', $end->toDateString())
            ->whereDate('end_date', '>=', $start->toDateString())
            ->get()
            ->groupBy('employee_id');

        $rows = [];
        $totals = [
            'present' => 0,
            'late' => 0,
            'absent' => 0,
            'leave' => 0,
            'work_minutes' => 0,
            'overtime_minutes' => 0,
            'late_minutes' => 0,
        ];

        foreach ($employees as $employee) {
            $records = $attendance->get($employee->id, collect());
            $summary = $this->summarizeEmployee($employee, $records, $start, $end, $leave->get($employee->id, collect()));

            foreach (['present', 'late', 'absent', 'leave', 'work_minutes', 'overtime_minutes', 'late_minutes'] as $key) {
                $totals[$key] += $summary[$key];
            }

            $rows[] = $summary;
        }

        $leaveRows = LeaveRequest::query()
            ->with(['employee.user', 'leaveType'])
            ->where('status', LeaveRequestStatus::Approved)
            ->whereDate('start_date', '<=', $end->toDateString())
            ->whereDate('end_date', '>=', $start->toDateString())
            ->when($departmentId, fn ($query, int $id) => $query->whereHas('employee', fn ($employee) => $employee->where('department_id', $id)))
            ->orderBy('start_date')
            ->get()
            ->map(fn (LeaveRequest $request): array => [
                'employee' => $request->employee?->full_name,
                'avatar' => $request->employee?->avatar,
                'code' => $request->employee?->employee_code,
                'type' => $request->leaveType?->name,
                'days' => $request->total_days,
                'start_date' => $request->start_date->toDateString(),
                'end_date' => $request->end_date->toDateString(),
            ])
            ->all();

        return [
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
            'totals' => $totals,
            'employees' => $rows,
            'leave' => $leaveRows,
        ];
    }

    /**
     * @param  Collection<int, Attendance>  $records
     * @param  Collection<int, LeaveRequest>  $leaves
     * @return array<string, mixed>
     */
    private function summarizeEmployee(
        Employee $employee,
        Collection $records,
        CarbonImmutable $start,
        CarbonImmutable $end,
        Collection $leaves,
    ): array {
        $present = $records->whereIn('status', [
            AttendanceStatus::Present,
            AttendanceStatus::WorkFromHome,
            AttendanceStatus::Manual,
        ])->count();
        $late = $records->where('status', AttendanceStatus::Late)->count();
        $leaveDays = (float) $leaves->sum('total_days');
        $absent = 0;
        $joiningDate = $employee->joining_date?->toDateString();

        for ($date = $start; $date->lte($end); $date = $date->addDay()) {
            // Days before the employee joined are not absences.
            if ($joiningDate !== null && $date->toDateString() < $joiningDate) {
                continue;
            }

            if (! $this->workingDays->isConfiguredWorkingWeekday($date)) {
                continue;
            }

            if ($this->holidays->forDate($date, $employee)) {
                continue;
            }

            $onLeave = $leaves->contains(
                fn (LeaveRequest $leave): bool => $leave->start_date->toDateString() <= $date->toDateString()
                    && $leave->end_date->toDateString() >= $date->toDateString(),
            );

            if ($onLeave) {
                continue;
            }

            $hasRecord = $records->contains(
                fn (Attendance $attendance): bool => $attendance->attendance_date->toDateString() === $date->toDateString()
                    && in_array($attendance->status->value, ['present', 'late', 'half_day', 'work_from_home', 'manual'], true),
            );

            if (! $hasRecord) {
                $absent++;
            }
        }

        return [
            'employee_id' => $employee->id,
            'name' => $employee->full_name,
            'avatar' => $employee->avatar,
            'code' => $employee->employee_code,
            'department' => $employee->department?->name,
            'office' => $employee->office?->name,
            'present' => $present + $late,
            'late' => $late,
            'absent' => $absent,
            'leave' => $leaveDays,
            'work_minutes' => (int) $records->sum('work_minutes'),
            'overtime_minutes' => (int) $records->sum('overtime_minutes'),
            'late_minutes' => (int) $records->sum('late_minutes'),
            'early_leave_minutes' => (int) $records->sum('early_leave_minutes'),
        ];
    }
}
