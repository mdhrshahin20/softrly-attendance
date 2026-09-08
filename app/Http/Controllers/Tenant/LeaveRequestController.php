<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Enums\LeaveDurationType;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Leave\Models\LeaveType;
use App\Domain\Leave\Services\LeaveBalanceService;
use App\Domain\Leave\Services\LeaveService;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreLeaveRequestRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
                ->paginate(15)
                ->withQueryString()
                ->through(fn (LeaveRequest $leave): array => $this->payload($leave)),
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

    public function applications(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user && $this->canReviewApplications($user), 403);

        $from = filled($request->input('from')) ? $request->date('from')?->toDateString() : null;
        $to = filled($request->input('to')) ? $request->date('to')?->toDateString() : null;
        $status = $request->string('status')->toString();
        $employeeId = $request->integer('employee_id') ?: null;

        $query = LeaveRequest::query()
            ->with(['leaveType', 'employee.department', 'employee.user'])
            ->latest();

        if (! $user->can('leave.manage') && ! $user->can('employee.view')) {
            $query->whereHas('employee', fn ($builder) => $builder->where('manager_id', $user->employee?->id));
        }

        $query
            ->when($employeeId, fn ($builder, int $id) => $builder->where('employee_id', $id))
            ->when(
                $status !== '' && LeaveRequestStatus::tryFrom($status),
                fn ($builder) => $builder->where('status', $status),
            )
            ->when($from, fn ($builder, string $date) => $builder->whereDate('end_date', '>=', $date))
            ->when($to, fn ($builder, string $date) => $builder->whereDate('start_date', '<=', $date));

        $employees = Employee::query()->orderBy('first_name');

        if (! $user->can('leave.manage') && ! $user->can('employee.view')) {
            $employees->where('manager_id', $user->employee?->id);
        }

        return Inertia::render('leave/applications', [
            'requests' => $query->paginate(20)->withQueryString()->through(
                fn (LeaveRequest $leave): array => [
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
                    'status_label' => $leave->status->label(),
                    'attachment' => $leave->attachmentPayload(),
                ],
            ),
            'filters' => [
                'from' => $from,
                'to' => $to,
                'employee_id' => $employeeId,
                'status' => $status !== '' ? $status : null,
            ],
            'employees' => $employees->get(['id', 'first_name', 'last_name', 'employee_code']),
            'statuses' => collect(LeaveRequestStatus::cases())
                ->reject(fn (LeaveRequestStatus $item): bool => $item === LeaveRequestStatus::Draft)
                ->map(fn (LeaveRequestStatus $item): array => [
                    'value' => $item->value,
                    'label' => $item->label(),
                ])
                ->values(),
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
            'attachment' => $leave->attachmentPayload(),
        ];
    }

    public function show(Request $request, LeaveRequest $leave): Response
    {
        $this->authorize('view', $leave);

        $leave->load(['leaveType', 'employee.department', 'employee.office', 'employee.user']);

        $user = $request->user();
        $timezone = Tenant::current()?->timezone ?? config('app.timezone');

        return Inertia::render('leave/show', [
            'leave' => [
                'id' => $leave->id,
                'employee' => $leave->employee?->full_name,
                'avatar' => $leave->employee?->avatar,
                'employee_code' => $leave->employee?->employee_code,
                'department' => $leave->employee?->department?->name,
                'office' => $leave->employee?->office?->name,
                'leave_type' => $leave->leaveType?->name,
                'start_date' => $leave->start_date->toDateString(),
                'end_date' => $leave->end_date->toDateString(),
                'total_days' => $leave->total_days,
                'duration_type' => $leave->duration_type->label(),
                'reason' => $leave->reason,
                'status' => $leave->status->value,
                'status_label' => $leave->status->label(),
                'submitted_at' => $leave->created_at?->timezone($timezone)->format('d M Y, h:i A'),
                'attachment' => $leave->attachmentPayload(),
            ],
            'canApprove' => $user !== null && $user->can('approve', $leave) && $leave->isPending(),
            'canCancel' => $user !== null && $user->can('cancel', $leave) && $leave->isPending(),
            'backHref' => $this->backHref($user, $leave),
        ]);
    }

    public function attachment(LeaveRequest $leave): StreamedResponse
    {
        $this->authorize('view', $leave);

        abort_unless(is_string($leave->attachment) && $leave->attachment !== '', 404);
        abort_unless(Storage::disk('public')->exists($leave->attachment), 404);

        return Storage::disk('public')->response($leave->attachment, basename($leave->attachment));
    }

    private function canReviewApplications(User $user): bool
    {
        return $user->can('employee.view')
            || $user->can('leave.manage')
            || $user->can('leave.approve');
    }

    private function backHref(?User $user, LeaveRequest $leave): string
    {
        if ($user === null) {
            return '/leave';
        }

        if ($this->canReviewApplications($user) && $user->employee?->id !== $leave->employee_id) {
            return '/leave/applications';
        }

        if ($this->canReviewApplications($user) && $user->can('employee.view')) {
            return '/leave/applications';
        }

        return '/leave';
    }
}
