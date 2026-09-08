<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Services\AdvancedReportService;
use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Department;
use App\Domain\Office\Models\Office;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdvancedReportController extends Controller
{
    public function index(Request $request, AdvancedReportService $reports): Response|StreamedResponse
    {
        abort_unless($request->user()?->can('employee.view'), 403);
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::AdvancedReports), 403);

        $from = $request->date('from')?->toDateString() ?: now()->startOfMonth()->toDateString();
        $to = $request->date('to')?->toDateString() ?: now()->toDateString();
        $departmentId = $request->integer('department_id') ?: null;
        $officeId = $request->integer('office_id') ?: null;

        $report = $reports->build($from, $to, $departmentId, $officeId);

        if ($request->string('export')->toString() === 'csv') {
            abort_unless($request->user()?->can('attendance.export'), 403);
            app(SubscriptionService::class)->assertFeature(PlanFeature::Exports);

            return $this->csv($report);
        }

        $employeeRows = collect($report['employees']);
        $page = max(1, $request->integer('page', 1));
        $perPage = 25;
        $report['employees'] = new LengthAwarePaginator(
            $employeeRows->forPage($page, $perPage)->values(),
            $employeeRows->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return Inertia::render('reports/advanced', [
            'report' => $report,
            'filters' => [
                'from' => $from,
                'to' => $to,
                'department_id' => $departmentId,
                'office_id' => $officeId,
            ],
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'offices' => Office::query()->orderBy('name')->get(['id', 'name']),
            'canExport' => app(SubscriptionService::class)->hasFeature(PlanFeature::Exports),
        ]);
    }

    /**
     * @param  array{from: string, to: string, employees: list<array<string, mixed>>}  $report
     */
    private function csv(array $report): StreamedResponse
    {
        $filename = "advanced-attendance-{$report['from']}-{$report['to']}.csv";

        return response()->streamDownload(function () use ($report): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Employee', 'Code', 'Department', 'Office', 'Present', 'Late', 'Absent', 'Leave', 'Work minutes', 'Overtime', 'Late minutes']);

            foreach ($report['employees'] as $row) {
                fputcsv($handle, [
                    $row['name'],
                    $row['code'],
                    $row['department'],
                    $row['office'],
                    $row['present'],
                    $row['late'],
                    $row['absent'],
                    $row['leave'],
                    $row['work_minutes'],
                    $row['overtime_minutes'],
                    $row['late_minutes'],
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
