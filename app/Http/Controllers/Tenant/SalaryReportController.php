<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Department;
use App\Domain\Employee\Models\Employee;
use App\Domain\Office\Models\Office;
use App\Domain\Payroll\Enums\PayslipStatus;
use App\Domain\Payroll\Models\Payslip;
use App\Domain\Payroll\Services\SalaryReportService;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SalaryReportController extends Controller
{
    public function index(Request $request, SalaryReportService $reports): Response|StreamedResponse
    {
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::Payroll), 403);
        abort_unless($request->user()?->can('payroll.view') || $request->user()?->can('payroll.manage'), 403);

        $year = $request->integer('year') ?: (int) now()->year;
        $month = $request->integer('month') ?: (int) now()->month;
        $month = max(1, min(12, $month));
        $departmentId = $request->integer('department_id') ?: null;
        $officeId = $request->integer('office_id') ?: null;
        $paymentStatus = $request->string('status')->toString();
        $paymentStatus = in_array($paymentStatus, [PayslipStatus::Paid->value, PayslipStatus::Unpaid->value], true)
            ? $paymentStatus
            : null;

        $query = $reports->query($year, $month, $departmentId, $officeId, $paymentStatus);
        $totals = $reports->totals($query);

        if ($request->string('export')->toString() === 'csv') {
            abort_unless($request->user()?->can('attendance.export') || $request->user()?->can('payroll.manage'), 403);
            app(SubscriptionService::class)->assertFeature(PlanFeature::Exports);

            return $this->csv($query->orderBy('id')->get()->map(fn (Payslip $payslip): array => $reports->row($payslip))->all(), $year, $month);
        }

        $rows = $query
            ->orderBy(
                Employee::query()->select('first_name')->whereColumn('employees.id', 'payslips.employee_id')
            )
            ->orderBy(
                Employee::query()->select('last_name')->whereColumn('employees.id', 'payslips.employee_id')
            )
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Payslip $payslip): array => $reports->row($payslip));

        return Inertia::render('reports/salary', [
            'rows' => $rows,
            'totals' => $totals,
            'filters' => [
                'year' => $year,
                'month' => $month,
                'department_id' => $departmentId,
                'office_id' => $officeId,
                'status' => $paymentStatus,
            ],
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'offices' => Office::query()->orderBy('name')->get(['id', 'name']),
            'currency' => Tenant::current()?->currency ?? 'BDT',
            'canExport' => app(SubscriptionService::class)->hasFeature(PlanFeature::Exports),
            'canManage' => $request->user()?->can('payroll.manage') ?? false,
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function csv(array $rows, int $year, int $month): StreamedResponse
    {
        $filename = sprintf('salary-report-%04d-%02d.csv', $year, $month);

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'Employee', 'Code', 'Department', 'Office', 'Period', 'Present', 'Leave', 'Absent',
                'Overtime minutes', 'Gross', 'Deductions', 'Tax', 'Advance', 'Net', 'Status', 'Paid at',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['employee'],
                    $row['employee_code'],
                    $row['department'],
                    $row['office'],
                    $row['period'],
                    $row['present_days'],
                    $row['leave_days'],
                    $row['absent_days'],
                    $row['overtime_minutes'],
                    $row['gross'],
                    $row['deductions'],
                    $row['tax'],
                    $row['advance_deduction'],
                    $row['net'],
                    $row['status_label'],
                    $row['paid_at'],
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
