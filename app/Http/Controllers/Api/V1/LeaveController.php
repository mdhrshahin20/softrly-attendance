<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Enums\LeaveDurationType;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Leave\Services\LeaveService;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeaveController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $employee = $request->user()?->employee;
        abort_unless($employee instanceof Employee, 403, 'No employee profile.');

        $items = LeaveRequest::query()
            ->with('leaveType')
            ->where('employee_id', $employee->id)
            ->latest()
            ->limit(50)
            ->get();

        $data = [];

        foreach ($items as $leave) {
            $status = $leave->status;
            $data[] = [
                'id' => $leave->id,
                'type' => $leave->leaveType?->name,
                'start_date' => $leave->start_date->toDateString(),
                'end_date' => $leave->end_date->toDateString(),
                'status' => $status instanceof LeaveRequestStatus ? $status->value : (string) $status,
                'total_days' => $leave->total_days,
            ];
        }

        return response()->json(['data' => $data]);
    }

    public function store(Request $request, LeaveService $leaves): JsonResponse
    {
        $user = $request->user();
        $employee = $user?->employee;
        abort_unless($employee instanceof Employee, 403, 'No employee profile.');
        abort_unless($user instanceof User && $user->can('leave.apply'), 403);

        $data = $request->validate([
            'leave_type_id' => ['required', 'integer', 'exists:leave_types,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'duration_type' => ['required', Rule::enum(LeaveDurationType::class)],
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $leave = $leaves->apply($employee, $user, [
            'leave_type_id' => (int) $data['leave_type_id'],
            'start_date' => (string) $data['start_date'],
            'end_date' => (string) $data['end_date'],
            'duration_type' => (string) $data['duration_type'],
            'reason' => (string) $data['reason'],
            'attachment' => null,
        ]);

        $status = $leave->status;

        return response()->json([
            'message' => 'Leave request submitted.',
            'leave' => [
                'id' => $leave->id,
                'status' => $status instanceof LeaveRequestStatus ? $status->value : (string) $status,
                'total_days' => $leave->total_days,
            ],
        ], 201);
    }
}
