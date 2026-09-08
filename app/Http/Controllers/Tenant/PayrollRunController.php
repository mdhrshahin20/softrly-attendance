<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Payroll\Enums\PayrollRunStatus;
use App\Domain\Payroll\Enums\PayslipStatus;
use App\Domain\Payroll\Models\PayrollRun;
use App\Domain\Payroll\Models\Payslip;
use App\Domain\Payroll\Services\PayrollService;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayrollRunController extends Controller
{
    public function __construct(
        private readonly PayrollService $payroll,
        private readonly SubscriptionService $billing,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorizePayroll($request);

        return Inertia::render('payroll/runs', [
            'runs' => PayrollRun::query()
                ->withCount(['payslips as unpaid_count' => fn ($query) => $query->where('status', PayslipStatus::Unpaid)])
                ->latest('year')
                ->latest('month')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (PayrollRun $run): array => $this->runPayload($run)),
            'defaultYear' => (int) now()->year,
            'defaultMonth' => (int) now()->month,
            'currency' => Tenant::current()?->currency ?? 'BDT',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizePayroll($request, manage: true);

        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $run = $this->payroll->generate((int) $validated['year'], (int) $validated['month'], $request->user());

        app(AuditLogger::class)->record('payroll.generated', $run, newValues: [
            'period' => $run->label(),
            'employees' => $run->employee_count,
            'net' => $run->total_net,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payroll generated for '.$run->label().'.']);

        return to_route('payroll.runs.show', $run);
    }

    public function show(Request $request, PayrollRun $run): Response
    {
        $this->authorizePayroll($request);
        $run->loadCount(['payslips as unpaid_count' => fn ($query) => $query->where('status', PayslipStatus::Unpaid)]);

        $payslips = Payslip::query()
            ->where('payroll_run_id', $run->id)
            ->with(['employee.user', 'employee.department', 'payrollRun'])
            ->orderBy(
                Employee::query()->select('first_name')->whereColumn('employees.id', 'payslips.employee_id')
            )
            ->orderBy(
                Employee::query()->select('last_name')->whereColumn('employees.id', 'payslips.employee_id')
            )
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Payslip $payslip): array => $this->payslipRow($payslip));

        return Inertia::render('payroll/run-show', [
            'run' => $this->runPayload($run),
            'payslips' => $payslips,
            'currency' => Tenant::current()?->currency ?? 'BDT',
            'canManage' => $request->user()?->can('payroll.manage') ?? false,
        ]);
    }

    public function pay(Request $request, PayrollRun $run): RedirectResponse
    {
        $this->authorizePayroll($request, manage: true);

        $this->payroll->markPaid($run);
        app(AuditLogger::class)->record('payroll.paid', $run);

        Inertia::flash('toast', ['type' => 'success', 'message' => $run->label().' marked as paid.']);

        return back();
    }

    public function payPayslip(Request $request, Payslip $payslip): RedirectResponse
    {
        $this->authorizePayroll($request, manage: true);

        $payslip = $this->payroll->markPayslipPaid($payslip);
        $payslip->loadMissing('employee');
        app(AuditLogger::class)->record('payslip.paid', $payslip, newValues: [
            'employee_id' => $payslip->employee_id,
            'net' => $payslip->net,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => ($payslip->employee?->full_name ?? 'Payslip').' marked as paid.',
        ]);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function runPayload(PayrollRun $run): array
    {
        $unpaid = (int) ($run->unpaid_count ?? $run->payslips()->where('status', PayslipStatus::Unpaid)->count());

        return [
            'id' => $run->id,
            'year' => $run->year,
            'month' => $run->month,
            'label' => $run->label(),
            'status' => $run->status->value,
            'status_label' => $run->status->label(),
            'employee_count' => $run->employee_count,
            'total_gross' => $run->total_gross,
            'total_deductions' => $run->total_deductions,
            'total_net' => $run->total_net,
            'generated_at' => $run->generated_at?->toDateTimeString(),
            'paid_at' => $run->paid_at?->toDateTimeString(),
            'unpaid_count' => $unpaid,
            'can_pay' => $run->status === PayrollRunStatus::Processed && $unpaid > 0,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function payslipRow(Payslip $payslip): array
    {
        $status = $payslip->isPaid() ? PayslipStatus::Paid : PayslipStatus::Unpaid;

        return [
            'id' => $payslip->id,
            'employee' => $payslip->employee?->full_name,
            'avatar' => $payslip->employee?->avatar,
            'employee_code' => $payslip->employee?->employee_code,
            'department' => $payslip->employee?->department?->name,
            'present_days' => $payslip->present_days,
            'absent_days' => $payslip->absent_days,
            'leave_days' => $payslip->leave_days,
            'gross' => $payslip->gross,
            'deductions' => $payslip->deductions,
            'net' => $payslip->net,
            'status' => $status->value,
            'status_label' => $status->label(),
            'can_pay' => $payslip->canMarkPaid(),
        ];
    }

    private function authorizePayroll(Request $request, bool $manage = false): void
    {
        abort_unless($this->billing->hasFeature(PlanFeature::Payroll), 403);
        abort_unless($request->user()?->can($manage ? 'payroll.manage' : 'payroll.view'), 403);
    }
}
