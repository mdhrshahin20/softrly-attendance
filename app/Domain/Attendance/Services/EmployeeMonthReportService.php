<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Employee\Models\Employee;
use App\Domain\Holiday\Services\HolidayService;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Models\LeaveRequest;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;

class EmployeeMonthReportService
{
    public function __construct(
        private readonly WorkingDayService $workingDays,
        private readonly HolidayService $holidays,
    ) {}

    /**
     * @return array{
     *     month: int,
     *     year: int,
     *     month_label: string,
     *     days: list<array<string, mixed>>,
     *     legend: list<array{value: string, label: string, code: string}>,
     *     summary: array<string, int>,
     *     report: string,
     *     leaveBalances: list<array{name: string|null, remaining: float|int, allocated: float|int}>,
     *     recentLeaves: list<array<string, mixed>>
     * }
     */
    public function build(Employee $employee, int $year, int $month): array
    {
        $month = max(1, min(12, $month));
        $start = CarbonImmutable::create($year, $month, 1)->startOfMonth();
        $end = $start->endOfMonth();
        $today = now()->toDateString();

        $records = Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('attendance_date', [$start->toDateString(), $end->toDateString()])
            ->get()
            ->keyBy(fn (Attendance $attendance): string => $attendance->attendance_date->toDateString());

        $leaveDays = LeaveRequest::query()
            ->with('leaveType')
            ->where('employee_id', $employee->id)
            ->where('status', LeaveRequestStatus::Approved)
            ->whereDate('start_date', '<=', $end->toDateString())
            ->whereDate('end_date', '>=', $start->toDateString())
            ->get();

        $holidayDays = $this->holidays->inRange($start, $end, $employee);
        $joiningDate = $employee->joining_date?->toDateString();

        $summary = [
            'on_time' => 0,
            'late' => 0,
            'leave' => 0,
            'absent' => 0,
            'late_minutes' => 0,
            'work_minutes' => 0,
        ];

        $days = [];

        for ($date = $start; $date->lte($end); $date = $date->addDay()) {
            $key = $date->toDateString();
            $record = $records->get($key);
            $holiday = $holidayDays->first(fn ($holiday): bool => $holiday->covers($date));
            $leave = $leaveDays->first(
                fn (LeaveRequest $request): bool => $request->start_date->toDateString() <= $key
                    && $request->end_date->toDateString() >= $key,
            );

            $status = $record?->status;
            $code = $record?->status->shortCode();
            $label = $holiday?->name ?? $leave?->leaveType?->name;

            if ($status === null) {
                if ($joiningDate !== null && $key < $joiningDate) {
                    // Not employed yet — never count these as absent.
                    $status = AttendanceStatus::NotJoined;
                    $code = AttendanceStatus::NotJoined->shortCode();
                    $label = null;
                } elseif ($leave) {
                    $status = AttendanceStatus::Leave;
                    $code = AttendanceStatus::Leave->shortCode();
                } elseif ($holiday) {
                    $status = AttendanceStatus::Holiday;
                    $code = AttendanceStatus::Holiday->shortCode();
                } elseif (! $this->workingDays->isConfiguredWorkingWeekday($date)) {
                    $status = AttendanceStatus::Weekend;
                    $code = AttendanceStatus::Weekend->shortCode();
                } elseif ($key < $today) {
                    $status = AttendanceStatus::Absent;
                    $code = AttendanceStatus::Absent->shortCode();
                    $label = null;
                }
            }

            if ($status === AttendanceStatus::Late) {
                $summary['late']++;
                $summary['late_minutes'] += (int) $record?->late_minutes;
            } elseif (in_array($status, [AttendanceStatus::Present, AttendanceStatus::WorkFromHome, AttendanceStatus::Manual, AttendanceStatus::HalfDay], true)) {
                $summary['on_time']++;
            } elseif ($status === AttendanceStatus::Leave) {
                $summary['leave']++;
            } elseif ($status === AttendanceStatus::Absent) {
                $summary['absent']++;
            }

            $summary['work_minutes'] += (int) $record?->work_minutes;

            $days[] = [
                'date' => $key,
                'day' => $date->day,
                'status' => $status?->value,
                'code' => $code,
                'label' => $label,
                'check_in_at' => $record?->check_in_at?->format('H:i'),
                'check_out_at' => $record?->check_out_at?->format('H:i'),
                'late_minutes' => $record?->late_minutes,
                'work_minutes' => $record?->work_minutes,
            ];
        }

        $leaveBalances = $employee->leaveBalances()
            ->with('leaveType')
            ->where('year', $year)
            ->get()
            ->map(fn ($balance): array => [
                'name' => $balance->leaveType?->name,
                'remaining' => $balance->remaining,
                'allocated' => $balance->allocated,
            ])
            ->values()
            ->all();

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
            ])
            ->all();

        return [
            'month' => $month,
            'year' => $year,
            'month_label' => $start->format('F Y'),
            'days' => $days,
            'legend' => collect(AttendanceStatus::cases())->map(fn (AttendanceStatus $status): array => [
                'value' => $status->value,
                'label' => $status === AttendanceStatus::Present ? 'On time' : $status->label(),
                'code' => $status->shortCode(),
            ])->all(),
            'summary' => $summary,
            'report' => $this->narrative($employee->first_name, $start, $summary),
            'leaveBalances' => $leaveBalances,
            'recentLeaves' => $recentLeaves,
        ];
    }

    /**
     * @param  array{on_time: int, late: int, leave: int, absent: int, late_minutes: int, work_minutes: int}  $summary
     */
    private function narrative(string $firstName, CarbonImmutable $start, array $summary): string
    {
        $hasActivity = $summary['on_time'] + $summary['late'] + $summary['leave'] + $summary['absent'] > 0;

        if (! $hasActivity) {
            return "{$firstName} has no attendance recorded yet for {$start->format('F Y')}.";
        }

        $lateTotal = $summary['late_minutes'] > 0
            ? " ({$summary['late_minutes']} min late in total)"
            : '';

        return sprintf(
            '%s was on time %d %s, late %d %s%s, on leave %d %s, and absent %d %s in %s.',
            $firstName,
            $summary['on_time'],
            Str::plural('day', $summary['on_time']),
            $summary['late'],
            Str::plural('day', $summary['late']),
            $lateTotal,
            $summary['leave'],
            Str::plural('day', $summary['leave']),
            $summary['absent'],
            Str::plural('day', $summary['absent']),
            $start->format('F Y'),
        );
    }
}
