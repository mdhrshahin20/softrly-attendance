<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Attendance\Services\AttendanceService;
use App\Domain\Employee\Models\Employee;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendance) {}

    public function today(Request $request): JsonResponse
    {
        $employee = $request->user()?->employee;
        abort_unless($employee instanceof Employee, 403, 'No employee profile.');

        $record = $this->attendance->todayRecord($employee);

        return response()->json([
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->full_name,
                'code' => $employee->employee_code,
            ],
            'attendance' => $record ? [
                'date' => $record->attendance_date->toDateString(),
                'status' => $record->status->value,
                'check_in_at' => $record->check_in_at?->toIso8601String(),
                'check_out_at' => $record->check_out_at?->toIso8601String(),
                'late_minutes' => $record->late_minutes,
                'work_minutes' => $record->work_minutes,
            ] : null,
        ]);
    }

    public function checkIn(Request $request): JsonResponse
    {
        $employee = $request->user()?->employee;
        abort_unless($employee instanceof Employee, 403, 'No employee profile.');
        abort_unless($request->user()?->can('attendance.create'), 403);

        $record = $this->attendance->checkIn($request, $employee);

        return response()->json([
            'message' => 'Checked in.',
            'attendance' => [
                'id' => $record->id,
                'status' => $record->status->value,
                'check_in_at' => $record->check_in_at?->toIso8601String(),
            ],
        ], 201);
    }

    public function checkOut(Request $request): JsonResponse
    {
        $employee = $request->user()?->employee;
        abort_unless($employee instanceof Employee, 403, 'No employee profile.');
        abort_unless($request->user()?->can('attendance.create'), 403);

        $record = $this->attendance->checkOut($request, $employee);

        return response()->json([
            'message' => 'Checked out.',
            'attendance' => [
                'id' => $record->id,
                'status' => $record->status->value,
                'check_out_at' => $record->check_out_at?->toIso8601String(),
                'work_minutes' => $record->work_minutes,
            ],
        ]);
    }
}
