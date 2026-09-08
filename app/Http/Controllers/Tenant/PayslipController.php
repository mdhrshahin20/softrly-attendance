<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Payroll\Enums\PayslipStatus;
use App\Domain\Payroll\Models\Payslip;
use App\Domain\Tenant\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayslipController extends Controller
{
    public function show(Request $request, Payslip $payslip): Response
    {
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::Payroll), 403);
        $this->authorize('viewPayslip', $payslip);

        $payslip->load(['employee.user', 'employee.department', 'employee.designation', 'employee.office', 'payrollRun']);
        $employee = $payslip->employee;
        $run = $payslip->payrollRun;
        $payment = $payslip->isPaid() ? PayslipStatus::Paid : PayslipStatus::Unpaid;
        $canManage = $request->user()?->can('payroll.manage') ?? false;

        return Inertia::render('payroll/payslip', [
            'payslip' => [
                'id' => $payslip->id,
                'period' => $run?->label(),
                'status' => $payment->value,
                'status_label' => $payment->label(),
                'run_status' => $run?->status->value,
                'employee' => $employee?->full_name,
                'avatar' => $employee?->avatar,
                'employee_code' => $employee?->employee_code,
                'department' => $employee?->department?->name,
                'designation' => $employee?->designation?->name,
                'office' => $employee?->office?->name,
                'working_days' => $payslip->working_days,
                'present_days' => $payslip->present_days,
                'late_days' => $payslip->late_days,
                'leave_days' => $payslip->leave_days,
                'absent_days' => $payslip->absent_days,
                'overtime_minutes' => $payslip->overtime_minutes,
                'late_minutes' => $payslip->late_minutes,
                'basic_salary' => $payslip->basic_salary,
                'house_rent' => $payslip->house_rent,
                'medical' => $payslip->medical,
                'other_allowance' => $payslip->other_allowance,
                'overtime_pay' => $payslip->overtime_pay,
                'absence_deduction' => $payslip->absence_deduction,
                'late_deduction' => $payslip->late_deduction,
                'advance_deduction' => $payslip->advance_deduction,
                'tax' => $payslip->tax,
                'gross' => $payslip->gross,
                'deductions' => $payslip->deductions,
                'net' => $payslip->net,
                'paid_at' => $payslip->paid_at?->toDateTimeString(),
                'can_pay' => $canManage && $payslip->canMarkPaid(),
            ],
            'currency' => Tenant::current()?->currency ?? 'BDT',
            'backHref' => $request->user()?->can('payroll.view')
                ? '/payroll/runs/'.($run?->id ?? '')
                : '/payroll/me',
        ]);
    }
}
