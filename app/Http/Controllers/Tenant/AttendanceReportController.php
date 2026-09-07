<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Models\Shift;
use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Department;
use App\Domain\Employee\Models\Employee;
use App\Domain\Office\Models\Office;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceReportController extends Controller
{
    public function index(Request $request): Response|StreamedResponse
    {
        abort_unless($request->user()?->can('attendance.view'), 403);

        $from = $request->date('from')?->toDateString() ?: now()->startOfMonth()->toDateString();
        $to = $request->date('to')?->toDateString() ?: now()->toDateString();

        $query = Attendance::query()
            ->with(['employee.department', 'office'])
            ->whereBetween('attendance_date', [$from, $to])
            ->when($request->integer('employee_id'), fn ($q, int $id) => $q->where('employee_id', $id))
            ->when($request->integer('department_id'), fn ($q, int $id) => $q->whereHas('employee', fn ($e) => $e->where('department_id', $id)))
            ->when($request->integer('office_id'), fn ($q, int $id) => $q->where('office_id', $id))
            ->when($request->string('status')->toString(), fn ($q, string $status) => $q->where('status', $status))
            ->orderByDesc('attendance_date');

        if ($request->string('export')->toString() === 'csv') {
            abort_unless($request->user()?->can('attendance.export'), 403);
            app(SubscriptionService::class)
                ->assertFeature(PlanFeature::Exports);

            return $this->csv($query->get(), $from, $to);
        }

        $records = $query->paginate(25)->withQueryString();

        return Inertia::render('reports/attendance', [
            'records' => $records,
            'filters' => [
                'from' => $from,
                'to' => $to,
                'employee_id' => $request->integer('employee_id') ?: null,
                'department_id' => $request->integer('department_id') ?: null,
                'office_id' => $request->integer('office_id') ?: null,
                'status' => $request->string('status')->toString() ?: null,
            ],
            'employees' => Employee::query()->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'employee_code']),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'offices' => Office::query()->orderBy('name')->get(['id', 'name']),
            'shifts' => Shift::query()->orderBy('name')->get(['id', 'name']),
            'statuses' => collect(AttendanceStatus::cases())->map(fn (AttendanceStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
            'canExport' => app(SubscriptionService::class)
                ->hasFeature(PlanFeature::Exports),
            'canAdvanced' => app(SubscriptionService::class)
                ->hasFeature(PlanFeature::AdvancedReports),
            'canManual' => $request->user()?->can('attendance.edit') ?? false,
        ]);
    }

    /**
     * @param  Collection<int, Attendance>  $records
     */
    private function csv($records, string $from, string $to): StreamedResponse
    {
        $filename = "attendance-{$from}-{$to}.csv";

        return response()->streamDownload(function () use ($records): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Date', 'Employee', 'Code', 'Department', 'Office', 'Status', 'Check In', 'Check Out', 'Late', 'Work Minutes']);

            foreach ($records as $record) {
                fputcsv($handle, [
                    $record->attendance_date->toDateString(),
                    $record->employee?->full_name,
                    $record->employee?->employee_code,
                    $record->employee?->department?->name,
                    $record->office?->name,
                    $record->status->value,
                    $record->check_in_at?->format('H:i'),
                    $record->check_out_at?->format('H:i'),
                    $record->late_minutes,
                    $record->work_minutes,
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
