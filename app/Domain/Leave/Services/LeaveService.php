<?php

namespace App\Domain\Leave\Services;

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Services\WorkingDayService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Enums\LeaveApprovalStatus;
use App\Domain\Leave\Enums\LeaveDurationType;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Events\LeaveApproved;
use App\Domain\Leave\Events\LeaveRejected;
use App\Domain\Leave\Events\LeaveRequested;
use App\Domain\Leave\Models\LeaveApproval;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Leave\Models\LeaveType;
use App\Domain\Leave\Notifications\LeaveDecisionNotification;
use App\Domain\Leave\Notifications\LeaveRequestedNotification;
use App\Domain\Tenant\Models\ActivityLog;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LeaveService
{
    public function __construct(
        private readonly WorkingDayService $workingDays,
        private readonly LeaveBalanceService $balances,
    ) {}

    /**
     * @param  array{
     *     leave_type_id: int,
     *     start_date: string,
     *     end_date: string,
     *     duration_type: string,
     *     reason: string,
     *     attachment?: UploadedFile|null
     * }  $input
     */
    public function apply(Employee $employee, User $actor, array $input): LeaveRequest
    {
        $type = LeaveType::query()->findOrFail($input['leave_type_id']);
        $duration = LeaveDurationType::from($input['duration_type']);
        $start = CarbonImmutable::parse($input['start_date'])->startOfDay();
        $end = CarbonImmutable::parse($input['end_date'])->startOfDay();

        if ($end->lt($start)) {
            throw ValidationException::withMessages(['end_date' => 'End date must be on or after the start date.']);
        }

        if ($duration !== LeaveDurationType::FullDay && ! $start->isSameDay($end)) {
            throw ValidationException::withMessages(['duration_type' => 'Half-day leave can only cover a single date.']);
        }

        if ($type->requires_attachment && empty($input['attachment'])) {
            throw ValidationException::withMessages(['attachment' => 'This leave type requires an attachment.']);
        }

        $noticeDeadline = now()->startOfDay()->addDays($type->minimum_notice_days);

        if ($start->lt($noticeDeadline)) {
            throw ValidationException::withMessages([
                'start_date' => 'This leave type requires '.$type->minimum_notice_days.' day(s) notice.',
            ]);
        }

        $days = $this->workingDays->countDays($start, $end, $employee, $duration !== LeaveDurationType::FullDay);

        if ($days <= 0) {
            throw ValidationException::withMessages([
                'start_date' => 'The selected dates do not include any working days.',
            ]);
        }

        $this->assertNoOverlap($employee, $start->toDateString(), $end->toDateString());

        if ($type->is_paid) {
            $balance = $this->balances->for($employee, $type, (int) $start->year);

            if ($balance->remaining < $days) {
                throw ValidationException::withMessages([
                    'leave_type_id' => 'Insufficient leave balance. Remaining: '.$balance->remaining.' day(s).',
                ]);
            }
        }

        $path = null;

        if (($input['attachment'] ?? null) instanceof UploadedFile) {
            $file = $input['attachment'];
            $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
            $basename = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
            $filename = ($basename !== '' ? $basename : 'attachment').'-'.Str::lower(Str::random(8)).'.'.$extension;
            $path = $file->storeAs('leave-attachments/'.Tenant::current()?->id, $filename, 'public');
        }

        $request = DB::transaction(function () use ($employee, $type, $start, $end, $days, $duration, $input, $path): LeaveRequest {
            $approverId = $employee->manager?->user_id;

            $leaveRequest = LeaveRequest::query()->create([
                'employee_id' => $employee->id,
                'leave_type_id' => $type->id,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'total_days' => $days,
                'duration_type' => $duration,
                'reason' => $input['reason'],
                'attachment' => $path,
                'status' => LeaveRequestStatus::Pending,
                'current_approver_id' => $approverId,
            ]);

            if ($type->is_paid) {
                $this->balances->reserve($employee, $type, $days, (int) $start->year);
            }

            return $leaveRequest->load(['employee.user', 'employee.manager.user', 'leaveType']);
        });

        $this->notifyApprovers($request);
        $this->log('leave.requested', $request, $actor);

        event(new LeaveRequested($request));

        return $request;
    }

    public function approve(LeaveRequest $leaveRequest, User $actor, ?string $comment = null): LeaveRequest
    {
        $this->assertPending($leaveRequest);

        $leaveRequest = DB::transaction(function () use ($leaveRequest, $actor, $comment): LeaveRequest {
            $leaveRequest->update([
                'status' => LeaveRequestStatus::Approved,
                'approved_at' => now(),
                'current_approver_id' => null,
            ]);

            LeaveApproval::query()->create([
                'leave_request_id' => $leaveRequest->id,
                'approver_id' => $actor->id,
                'level' => 1,
                'status' => LeaveApprovalStatus::Approved,
                'comment' => $comment,
                'action_at' => now(),
            ]);

            if ($leaveRequest->leaveType?->is_paid) {
                $this->balances->consume(
                    $leaveRequest->employee,
                    $leaveRequest->leaveType,
                    (float) $leaveRequest->total_days,
                    (int) $leaveRequest->start_date->year,
                );
            }

            $this->markAttendanceDays($leaveRequest);

            return $leaveRequest->fresh(['employee.user', 'leaveType']) ?? $leaveRequest;
        });

        $leaveRequest->employee?->user?->notify(new LeaveDecisionNotification($leaveRequest, 'approved', $comment));
        $this->log('leave.approved', $leaveRequest, $actor);
        event(new LeaveApproved($leaveRequest));

        return $leaveRequest;
    }

    public function reject(LeaveRequest $leaveRequest, User $actor, ?string $comment = null): LeaveRequest
    {
        $this->assertPending($leaveRequest);

        $leaveRequest = DB::transaction(function () use ($leaveRequest, $actor, $comment): LeaveRequest {
            $leaveRequest->update([
                'status' => LeaveRequestStatus::Rejected,
                'rejected_at' => now(),
                'current_approver_id' => null,
            ]);

            LeaveApproval::query()->create([
                'leave_request_id' => $leaveRequest->id,
                'approver_id' => $actor->id,
                'level' => 1,
                'status' => LeaveApprovalStatus::Rejected,
                'comment' => $comment,
                'action_at' => now(),
            ]);

            if ($leaveRequest->leaveType?->is_paid) {
                $this->balances->releasePending(
                    $leaveRequest->employee,
                    $leaveRequest->leaveType,
                    (float) $leaveRequest->total_days,
                    (int) $leaveRequest->start_date->year,
                );
            }

            return $leaveRequest->fresh(['employee.user', 'leaveType']) ?? $leaveRequest;
        });

        $leaveRequest->employee?->user?->notify(new LeaveDecisionNotification($leaveRequest, 'rejected', $comment));
        $this->log('leave.rejected', $leaveRequest, $actor);
        event(new LeaveRejected($leaveRequest));

        return $leaveRequest;
    }

    public function cancel(LeaveRequest $leaveRequest, User $actor): LeaveRequest
    {
        if (! $leaveRequest->isPending()) {
            throw ValidationException::withMessages([
                'leave' => 'Only pending leave requests can be cancelled.',
            ]);
        }

        $leaveRequest = DB::transaction(function () use ($leaveRequest): LeaveRequest {
            $leaveRequest->update([
                'status' => LeaveRequestStatus::Cancelled,
                'cancelled_at' => now(),
                'current_approver_id' => null,
            ]);

            if ($leaveRequest->leaveType?->is_paid) {
                $this->balances->releasePending(
                    $leaveRequest->employee,
                    $leaveRequest->leaveType,
                    (float) $leaveRequest->total_days,
                    (int) $leaveRequest->start_date->year,
                );
            }

            return $leaveRequest->fresh(['employee.user', 'leaveType']) ?? $leaveRequest;
        });

        $this->log('leave.cancelled', $leaveRequest, $actor);

        return $leaveRequest;
    }

    public function hasApprovedLeaveOn(Employee $employee, CarbonImmutable|string $date): bool
    {
        $day = $date instanceof CarbonImmutable ? $date->toDateString() : $date;

        return LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', LeaveRequestStatus::Approved)
            ->whereDate('start_date', '<=', $day)
            ->whereDate('end_date', '>=', $day)
            ->exists();
    }

    private function assertPending(LeaveRequest $leaveRequest): void
    {
        if (! $leaveRequest->isPending()) {
            throw ValidationException::withMessages([
                'leave' => 'This leave request is no longer pending.',
            ]);
        }
    }

    private function assertNoOverlap(Employee $employee, string $start, string $end): void
    {
        $overlap = LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->whereIn('status', [LeaveRequestStatus::Pending, LeaveRequestStatus::Approved])
            ->whereDate('start_date', '<=', $end)
            ->whereDate('end_date', '>=', $start)
            ->exists();

        if ($overlap) {
            throw ValidationException::withMessages([
                'start_date' => 'This period overlaps an existing pending or approved leave request.',
            ]);
        }
    }

    private function markAttendanceDays(LeaveRequest $leaveRequest): void
    {
        $employee = $leaveRequest->employee;

        if ($employee === null) {
            return;
        }

        $dates = $this->workingDays->datesBetween($leaveRequest->start_date, $leaveRequest->end_date, $employee);

        foreach ($dates as $date) {
            $existing = Attendance::query()
                ->where('employee_id', $employee->id)
                ->whereDate('attendance_date', $date->toDateString())
                ->first();

            if ($existing?->check_in_at) {
                continue;
            }

            Attendance::query()->updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'attendance_date' => $date->toDateString(),
                ],
                [
                    'status' => AttendanceStatus::Leave,
                    'notes' => 'Approved '.$leaveRequest->leaveType?->name,
                ],
            );
        }
    }

    private function notifyApprovers(LeaveRequest $leaveRequest): void
    {
        $managerUser = $leaveRequest->employee?->manager?->user;

        if ($managerUser) {
            $managerUser->notify(new LeaveRequestedNotification($leaveRequest));

            return;
        }

        $recipients = User::query()
            ->where('is_platform_admin', false)
            ->whereHas('tenants', fn ($query) => $query->where('tenants.id', Tenant::current()?->id))
            ->get()
            ->filter(fn (User $user): bool => $user->can('leave.approve') && $user->id !== $leaveRequest->employee?->user_id)
            ->values();

        Notification::send($recipients, new LeaveRequestedNotification($leaveRequest));
    }

    private function log(string $action, LeaveRequest $leaveRequest, User $actor): void
    {
        ActivityLog::query()->create([
            'tenant_id' => Tenant::current()?->id,
            'user_id' => $actor->id,
            'action' => $action,
            'entity_type' => LeaveRequest::class,
            'entity_id' => $leaveRequest->id,
            'new_values' => [
                'status' => $leaveRequest->status->value,
                'total_days' => $leaveRequest->total_days,
            ],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
