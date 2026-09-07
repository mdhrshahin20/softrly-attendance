<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Services\AttendanceService;
use App\Domain\Attendance\Services\EmployeeMonthReportService;
use App\Http\Controllers\Controller;
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

    public function calendar(Request $request, EmployeeMonthReportService $monthReport): Response
    {
        $employee = $request->user()?->employee;
        abort_unless($employee, 403);

        $month = (int) $request->integer('month', (int) now()->month);
        $year = (int) $request->integer('year', (int) now()->year);
        $report = $monthReport->build($employee, $year, $month);

        return Inertia::render('attendance/calendar', [
            'month' => $report['month'],
            'year' => $report['year'],
            'days' => $report['days'],
            'legend' => $report['legend'],
        ]);
    }
}
