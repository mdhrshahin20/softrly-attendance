<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Leave\Services\LeaveService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveApprovalController extends Controller
{
    public function __construct(private readonly LeaveService $leaves) {}

    public function index(Request $request): Response
    {
        abort_unless(
            $request->user()?->can('leave.approve') || $request->user()?->can('leave.reject'),
            403,
        );

        $user = $request->user();
        $employeeId = $user?->employee?->id;

        $query = LeaveRequest::query()
            ->with(['leaveType', 'employee.department', 'employee.user'])
            ->where('status', LeaveRequestStatus::Pending)
            ->latest();

        if (! $user?->can('leave.manage') && ! $user?->can('employee.view')) {
            $query->whereHas('employee', fn ($builder) => $builder->where('manager_id', $employeeId));
        }

        return Inertia::render('leave/approvals', [
            'requests' => $query->paginate(20)->withQueryString()->through(fn (LeaveRequest $leave): array => [
                'id' => $leave->id,
                'employee' => $leave->employee?->full_name,
                'avatar' => $leave->employee?->avatar,
                'employee_code' => $leave->employee?->employee_code,
                'department' => $leave->employee?->department?->name,
                'leave_type' => $leave->leaveType?->name,
                'start_date' => $leave->start_date->toDateString(),
                'end_date' => $leave->end_date->toDateString(),
                'total_days' => $leave->total_days,
                'duration_type' => $leave->duration_type->label(),
                'reason' => $leave->reason,
                'status' => $leave->status->value,
                'attachment' => $leave->attachmentPayload(),
            ]),
        ]);
    }

    public function approve(Request $request, LeaveRequest $leave): RedirectResponse
    {
        $this->authorize('approve', $leave);

        $validated = $request->validate([
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        $this->leaves->approve($leave, $request->user(), $validated['comment'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Leave approved.']);

        return back();
    }

    public function reject(Request $request, LeaveRequest $leave): RedirectResponse
    {
        $this->authorize('reject', $leave);

        $validated = $request->validate([
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        $this->leaves->reject($leave, $request->user(), $validated['comment'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Leave rejected.']);

        return back();
    }
}
