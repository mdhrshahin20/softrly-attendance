<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Enums\LeaveDurationType;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Leave\Models\LeaveType;
use App\Domain\Leave\Services\LeaveBalanceService;
use App\Domain\Leave\Services\LeaveService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreLeaveRequestRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    public function __construct(
        private readonly LeaveService $leaves,
        private readonly LeaveBalanceService $balances,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('leave.view') || $request->user()?->can('leave.apply'), 403);

        $employee = $request->user()?->employee;
        abort_unless($employee, 403);

        $this->balances->ensureForEmployee($employee);

        return Inertia::render('leave/index', [
            'requests' => LeaveRequest::query()
                ->with('leaveType')
                ->where('employee_id', $employee->id)
                ->latest()
                ->get()
                ->map(fn (LeaveRequest $leave): array => $this->payload($leave)),
            'balances' => $employee->leaveBalances()
                ->with('leaveType')
                ->where('year', now()->year)
                ->get()
                ->map(fn ($balance): array => [
                    'id' => $balance->id,
                    'leave_type' => $balance->leaveType?->name,
                    'code' => $balance->leaveType?->code,
                    'allocated' => $balance->allocated,
                    'used' => $balance->used,
                    'pending' => $balance->pending,
                    'remaining' => $balance->remaining,
                ]),
            'types' => LeaveType::query()->where('status', 'active')->orderBy('name')->get([
                'id', 'name', 'code', 'requires_attachment', 'minimum_notice_days', 'is_paid',
            ]),
            'durationTypes' => collect(LeaveDurationType::cases())->map(fn (LeaveDurationType $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    public function store(StoreLeaveRequestRequest $request): RedirectResponse
    {
        $employee = $request->user()?->employee;
        abort_unless($employee instanceof Employee, 403);
        $this->authorize('create', LeaveRequest::class);

        $this->leaves->apply($employee, $request->user(), [
            ...$request->safe()->except('attachment'),
            'attachment' => $request->file('attachment'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Leave request submitted.']);

        return back();
    }

    public function cancel(Request $request, LeaveRequest $leave): RedirectResponse
    {
        $this->authorize('cancel', $leave);

        $this->leaves->cancel($leave, $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Leave request cancelled.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(LeaveRequest $leave): array
    {
        return [
            'id' => $leave->id,
            'leave_type' => $leave->leaveType?->name,
            'start_date' => $leave->start_date->toDateString(),
            'end_date' => $leave->end_date->toDateString(),
            'total_days' => $leave->total_days,
            'duration_type' => $leave->duration_type->value,
            'reason' => $leave->reason,
            'status' => $leave->status->value,
            'status_label' => $leave->status->label(),
            'can_cancel' => $leave->status === LeaveRequestStatus::Pending,
        ];
    }
}
