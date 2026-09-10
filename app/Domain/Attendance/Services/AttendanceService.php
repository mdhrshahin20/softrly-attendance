<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Events\AttendanceCheckedIn;
use App\Domain\Attendance\Events\AttendanceCheckedOut;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Models\Shift;
use App\Domain\Employee\Models\Employee;
use App\Domain\Holiday\Services\HolidayService;
use App\Domain\Leave\Services\LeaveService;
use App\Domain\Tenant\Models\ActivityLog;
use App\Domain\Tenant\Models\Tenant;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AttendanceService
{
    public function __construct(
        private readonly NetworkVerificationService $networks,
        private readonly AttendancePolicyService $policy,
        private readonly WorkingDayService $workingDays,
        private readonly HolidayService $holidays,
        private readonly LeaveService $leaves,
    ) {}

    public function checkIn(Request $request, Employee $employee): Attendance
    {
        $this->assertActiveEmployee($employee);

        $today = $this->today($employee);
        $this->assertWorkableDay($employee, $today);
        $existing = $this->todayRecord($employee, $today);

        if ($existing?->check_in_at) {
            throw ValidationException::withMessages([
                'attendance' => 'You have already checked in today.',
            ]);
        }

        $authorized = $this->policy->authorize($request, $employee);
        $shift = $employee->shift;
        $now = now($this->timezone());
        $lateMinutes = $this->lateMinutes($now, $shift);
        $status = $lateMinutes > 0 ? AttendanceStatus::Late : AttendanceStatus::Present;

        $attendance = Attendance::query()->updateOrCreate(
            [
                'employee_id' => $employee->id,
                'attendance_date' => $today->toDateString(),
            ],
            [
                'office_id' => $authorized['office']->id,
                'check_in_at' => $now,
                'check_in_ip' => $this->networks->getClientIp($request),
                'check_in_device_id' => $authorized['device']['device_id'],
                'check_in_latitude' => $request->input('latitude'),
                'check_in_longitude' => $request->input('longitude'),
                'status' => $status,
                'late_minutes' => $lateMinutes,
                'check_in_method' => $authorized['method'],
            ],
        );

        $this->log('attendance.checked_in', $attendance, $request);

        event(new AttendanceCheckedIn($attendance));

        return $attendance->fresh(['office', 'employee']) ?? $attendance;
    }

    public function checkOut(Request $request, Employee $employee): Attendance
    {
        $this->assertActiveEmployee($employee);

        $today = $this->today($employee);
        $attendance = $this->todayRecord($employee, $today);

        if ($attendance === null || $attendance->check_in_at === null) {
            throw ValidationException::withMessages([
                'attendance' => 'You must check in before checking out.',
            ]);
        }

        if ($attendance->check_out_at !== null) {
            throw ValidationException::withMessages([
                'attendance' => 'You have already checked out today.',
            ]);
        }

        $authorized = $this->policy->authorize($request, $employee);
        $now = now($this->timezone());
        $shift = $employee->shift;
        $workMinutes = max(0, (int) $attendance->check_in_at->diffInMinutes($now));
        $earlyLeave = $this->earlyLeaveMinutes($now, $shift);
        $overtime = $this->overtimeMinutes($workMinutes, $shift);

        $attendance->fill([
            'office_id' => $authorized['office']->id,
            'check_out_at' => $now,
            'check_out_ip' => $this->networks->getClientIp($request),
            'check_out_device_id' => $authorized['device']['device_id'],
            'check_out_latitude' => $request->input('latitude'),
            'check_out_longitude' => $request->input('longitude'),
            'work_minutes' => $workMinutes,
            'early_leave_minutes' => $earlyLeave,
            'overtime_minutes' => $overtime,
            'check_out_method' => $authorized['method'],
        ])->save();

        $this->log('attendance.checked_out', $attendance, $request);

        event(new AttendanceCheckedOut($attendance));

        return $attendance->fresh(['office', 'employee']) ?? $attendance;
    }

    /**
     * @param  array{
     *     employee_id: int,
     *     attendance_date: string,
     *     check_in_at?: string|null,
     *     check_out_at?: string|null,
     *     status?: string,
     *     reason: string
     * }  $input
     */
    public function recordManual(Request $request, array $input): Attendance
    {
        $employee = Employee::query()->findOrFail($input['employee_id']);
        $this->assertActiveEmployee($employee);

        $date = CarbonImmutable::parse($input['attendance_date'])->startOfDay();
        $office = $employee->office;
        $shift = $employee->shift;
        $timezone = $this->timezone();

        $checkIn = filled($input['check_in_at'] ?? null)
            ? CarbonImmutable::parse($date->toDateString().' '.$input['check_in_at'], $timezone)
            : null;
        $checkOut = filled($input['check_out_at'] ?? null)
            ? CarbonImmutable::parse($date->toDateString().' '.$input['check_out_at'], $timezone)
            : null;

        $lateMinutes = $checkIn ? $this->lateMinutes($checkIn, $shift) : 0;
        $workMinutes = $checkIn && $checkOut ? max(0, (int) $checkIn->diffInMinutes($checkOut)) : 0;
        $requested = AttendanceStatus::tryFrom((string) ($input['status'] ?? ''));
        $fallback = $lateMinutes > 0 ? AttendanceStatus::Late : AttendanceStatus::Manual;
        $status = $requested !== null && in_array($requested, AttendanceStatus::recordable(), true)
            ? $requested
            : $fallback;

        $attendance = Attendance::query()->updateOrCreate(
            [
                'employee_id' => $employee->id,
                'attendance_date' => $date->toDateString(),
            ],
            [
                'office_id' => $office?->id,
                'check_in_at' => $checkIn,
                'check_out_at' => $checkOut,
                'check_in_method' => 'manual',
                'check_out_method' => $checkOut ? 'manual' : null,
                'status' => $status,
                'late_minutes' => $lateMinutes,
                'work_minutes' => $workMinutes,
                'early_leave_minutes' => $checkOut ? $this->earlyLeaveMinutes($checkOut, $shift) : 0,
                'overtime_minutes' => $this->overtimeMinutes($workMinutes, $shift),
                'notes' => $input['reason'],
            ],
        );

        $this->log('attendance.manual', $attendance, $request);

        return $attendance->fresh(['office', 'employee']) ?? $attendance;
    }

    public function lateMinutes(CarbonImmutable $now, ?Shift $shift): int
    {
        if ($shift === null) {
            return 0;
        }

        $start = $now->copy()->setTimeFromTimeString($shift->start_time);
        $graceEnds = $start->copy()->addMinutes($shift->grace_minutes);

        if ($now->lte($graceEnds)) {
            return 0;
        }

        return (int) $graceEnds->diffInMinutes($now);
    }

    public function earlyLeaveMinutes(CarbonImmutable $now, ?Shift $shift): int
    {
        if ($shift === null) {
            return 0;
        }

        $end = $now->copy()->setTimeFromTimeString($shift->end_time);

        if ($now->gte($end)) {
            return 0;
        }

        return (int) $now->diffInMinutes($end);
    }

    public function overtimeMinutes(int $workMinutes, ?Shift $shift): int
    {
        if ($shift === null) {
            return 0;
        }

        return max(0, $workMinutes - $shift->minimum_work_minutes);
    }

    public function todayRecord(Employee $employee, ?CarbonImmutable $date = null): ?Attendance
    {
        $date ??= $this->today($employee);

        return Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereDate('attendance_date', $date->toDateString())
            ->first();
    }

    public function today(Employee $employee): CarbonImmutable
    {
        return now($employee->office?->timezone ?: $this->timezone())->startOfDay();
    }

    private function timezone(): string
    {
        return Tenant::current()?->timezone ?: config('app.timezone');
    }

    private function assertWorkableDay(Employee $employee, CarbonImmutable $today): void
    {
        if (! $this->workingDays->isConfiguredWorkingWeekday($today)) {
            throw ValidationException::withMessages([
                'attendance' => 'Today is a weekly off. Attendance is not required.',
            ]);
        }

        $holiday = $this->holidays->forDate($today, $employee);

        if ($holiday) {
            throw ValidationException::withMessages([
                'attendance' => 'Today is a holiday: '.$holiday->name.'.',
            ]);
        }

        if ($this->leaves->hasApprovedLeaveOn($employee, $today)) {
            throw ValidationException::withMessages([
                'attendance' => 'You are on approved leave today.',
            ]);
        }
    }

    private function assertActiveEmployee(Employee $employee): void
    {
        if (! $employee->isActive()) {
            abort(403, 'Only active employees can mark attendance.');
        }
    }

    private function log(string $action, Attendance $attendance, Request $request): void
    {
        ActivityLog::query()->create([
            'tenant_id' => Tenant::current()?->getKey(),
            'user_id' => $request->user()?->id,
            'action' => $action,
            'entity_type' => Attendance::class,
            'entity_id' => $attendance->id,
            'new_values' => $attendance->only([
                'status',
                'check_in_at',
                'check_out_at',
                'late_minutes',
                'work_minutes',
            ]),
            'ip_address' => $this->networks->getClientIp($request),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
