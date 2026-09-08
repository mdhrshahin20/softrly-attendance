<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Payroll\Enums\PayslipStatus;
use App\Domain\Payroll\Enums\SalaryAdvanceStatus;
use App\Domain\Payroll\Models\Payslip;
use App\Domain\Payroll\Models\SalaryAdvance;
use App\Domain\Payroll\Services\PayrollService;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalaryAdvanceController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::Payroll), 403);
        abort_unless($request->user()?->can('payroll.manage') || $request->user()?->can('payroll.view'), 403);

        $query = SalaryAdvance::query()
            ->with(['employee.user', 'employee.department'])
            ->latest();

        return Inertia::render('payroll/advances', [
            'advances' => $query->paginate(15)->withQueryString()->through(fn (SalaryAdvance $advance): array => [
                'id' => $advance->id,
                'employee' => $advance->employee?->full_name,
                'avatar' => $advance->employee?->avatar,
                'employee_code' => $advance->employee?->employee_code,
                'department' => $advance->employee?->department?->name,
                'amount' => $advance->amount,
                'reason' => $advance->reason,
                'status' => $advance->status->value,
                'status_label' => $advance->status->label(),
                'created_at' => $advance->created_at?->toDateTimeString(),
                'can_decide' => $advance->isPending(),
            ]),
            'employees' => Employee::query()->active()->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'employee_code']),
            'currency' => Tenant::current()?->currency ?? 'BDT',
            'canManage' => $request->user()?->can('payroll.manage') ?? false,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::Payroll), 403);

        $user = $request->user();
        abort_unless($user, 403);

        $isHr = $user->can('payroll.manage');
        $employee = $isHr && $request->filled('employee_id')
            ? Employee::query()->findOrFail($request->integer('employee_id'))
            : $user->employee;

        abort_unless($employee instanceof Employee, 403);
        abort_unless($isHr || $user->can('payroll.payslip'), 403);

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $advance = SalaryAdvance::query()->create([
            'employee_id' => $employee->id,
            'amount' => $validated['amount'],
            'reason' => $validated['reason'],
            'status' => $isHr ? SalaryAdvanceStatus::Approved : SalaryAdvanceStatus::Pending,
            'requested_by' => $user->id,
            'decided_by' => $isHr ? $user->id : null,
            'decided_at' => $isHr ? now() : null,
        ]);

        app(AuditLogger::class)->record('salary.advance.requested', $advance);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $isHr ? 'Salary advance recorded.' : 'Advance request submitted.',
        ]);

        return back();
    }

    public function approve(Request $request, SalaryAdvance $advance): RedirectResponse
    {
        $this->decide($request, $advance, SalaryAdvanceStatus::Approved, 'Advance approved.');

        return back();
    }

    public function reject(Request $request, SalaryAdvance $advance): RedirectResponse
    {
        $this->decide($request, $advance, SalaryAdvanceStatus::Rejected, 'Advance rejected.');

        return back();
    }

    public function mine(Request $request, PayrollService $payroll): Response
    {
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::Payroll), 403);

        $user = $request->user();
        $employee = $user?->employee;
        abort_unless($employee instanceof Employee, 403);
        abort_unless($user?->can('payroll.payslip') || $user?->can('payroll.view'), 403);

        $salary = $payroll->currentSalary($employee);

        return Inertia::render('payroll/mine', [
            'salary' => $salary ? [
                'gross' => $salary->gross(),
                'basic_salary' => $salary->basic_salary,
                'house_rent' => $salary->house_rent,
                'medical' => $salary->medical,
                'other_allowance' => $salary->other_allowance,
                'tax_percent' => $salary->tax_percent,
                'effective_from' => $salary->effective_from->toDateString(),
            ] : null,
            'payslips' => Payslip::query()
                ->with('payrollRun')
                ->where('employee_id', $employee->id)
                ->latest()
                ->paginate(15, ['*'], 'payslip_page')
                ->withQueryString()
                ->through(function (Payslip $payslip): array {
                    $status = $payslip->isPaid() ? PayslipStatus::Paid : PayslipStatus::Unpaid;

                    return [
                        'id' => $payslip->id,
                        'period' => $payslip->payrollRun?->label(),
                        'status' => $status->value,
                        'status_label' => $status->label(),
                        'gross' => $payslip->gross,
                        'deductions' => $payslip->deductions,
                        'net' => $payslip->net,
                    ];
                }),
            'advances' => SalaryAdvance::query()
                ->where('employee_id', $employee->id)
                ->latest()
                ->paginate(10, ['*'], 'advance_page')
                ->withQueryString()
                ->through(fn (SalaryAdvance $advance): array => [
                    'id' => $advance->id,
                    'amount' => $advance->amount,
                    'reason' => $advance->reason,
                    'status' => $advance->status->value,
                    'status_label' => $advance->status->label(),
                    'created_at' => $advance->created_at?->toDateTimeString(),
                ]),
            'currency' => Tenant::current()?->currency ?? 'BDT',
        ]);
    }

    private function decide(Request $request, SalaryAdvance $advance, SalaryAdvanceStatus $status, string $message): void
    {
        abort_unless(app(SubscriptionService::class)->hasFeature(PlanFeature::Payroll), 403);
        abort_unless($request->user()?->can('payroll.manage'), 403);
        abort_unless($advance->isPending(), 403);

        $advance->update([
            'status' => $status,
            'decided_by' => $request->user()?->id,
            'decided_at' => now(),
        ]);

        app(AuditLogger::class)->record('salary.advance.'.$status->value, $advance);
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);
    }
}
