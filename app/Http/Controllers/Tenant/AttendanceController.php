<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Services\AttendanceService;
use App\Domain\Attendance\Services\WorkingDayService;
use App\Domain\Holiday\Services\HolidayService;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Models\LeaveRequest;
use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendance) {}

    public function checkIn(Request $request): RedirectResponse
    {
        $employee = $request->user()?->employee;
        abort_unless($employee, 403);

        $this->authorize('create', Attendance::class);

        $this->attendance->checkIn($request, $employee);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Checked in successfully.']);

        return back();
    }

    public function checkOut(Request $request): RedirectResponse
    {
        $employee = $request->user()?->employee;
        abort_unless($employee, 403);

        $this->authorize('create', Attendance::class);

        $this->attendance->checkOut($request, $employee);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Checked out successfully.']);

        return back();
    }

    public function storeManual(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('attendance.edit'), 403);

        $data = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'attendance_date' => ['required', 'date'],
            'check_in_at' => ['nullable', 'date_format:H:i'],
            'check_out_at' => ['nullable', 'date_format:H:i'],
            'status' => ['nullable', 'string'],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $this->attendance->recordManual($request, $data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Attendance saved.']);

        return back();
    }

    public function calendar(
        Request $request,
        WorkingDayService $workingDays,
        HolidayService $holidays,
    ): Response {
        $employee = $request->user()?->employee;
        abort_unless($employee, 403);

        $month = (int) $request->integer('month', (int) now()->month);
        $year = (int) $request->integer('year', (int) now()->year);
        $start = CarbonImmutable::create($year, $month, 1)->startOfMonth();
        $end = $start->endOfMonth();

        $records = Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('attendance_date', [$start->toDateString(), $end->toDateString()])
            ->get()
            ->keyBy(fn (Attendance $attendance): string => $attendance->attendance_date->toDateString());

        $leaveDays = LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', LeaveRequestStatus::Approved)
            ->whereDate('start_date', '<=', $end->toDateString())
            ->whereDate('end_date', '>=', $start->toDateString())
            ->get();

        $holidayDays = $holidays->inRange($start, $end, $employee);

        $days = [];

        for ($date = $start; $date->lte($end); $date = $date->addDay()) {
            $key = $date->toDateString();
            $record = $records->get($key);
            $holiday = $holidayDays->first(fn ($holiday): bool => $holiday->covers($date));
            $onLeave = $leaveDays->contains(
                fn (LeaveRequest $leave): bool => $leave->start_date->toDateString() <= $key && $leave->end_date->toDateString() >= $key,
            );

            $status = $record?->status;
            $code = $record?->status->shortCode();

            if ($status === null) {
                if ($onLeave) {
                    $status = AttendanceStatus::Leave;
                    $code = AttendanceStatus::Leave->shortCode();
                } elseif ($holiday) {
                    $status = AttendanceStatus::Holiday;
                    $code = AttendanceStatus::Holiday->shortCode();
                } elseif (! $workingDays->isConfiguredWorkingWeekday($date)) {
                    $status = AttendanceStatus::Weekend;
                    $code = AttendanceStatus::Weekend->shortCode();
                }
            }

            $days[] = [
                'date' => $key,
                'day' => $date->day,
                'status' => $status?->value,
                'code' => $code,
                'label' => $holiday?->name,
                'check_in_at' => $record?->check_in_at?->format('H:i'),
                'check_out_at' => $record?->check_out_at?->format('H:i'),
                'late_minutes' => $record?->late_minutes,
                'work_minutes' => $record?->work_minutes,
            ];
        }

        return Inertia::render('attendance/calendar', [
            'month' => $month,
            'year' => $year,
            'days' => $days,
            'legend' => collect(AttendanceStatus::cases())->map(fn (AttendanceStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
                'code' => $status->shortCode(),
            ]),
        ]);
    }
}
