<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Payroll\Enums\PayslipStatus;
use App\Domain\Payroll\Models\EmployeeSalary;
use App\Domain\Payroll\Models\Payslip;
use App\Domain\Payroll\Services\PayrollService;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeSalaryController extends Controller
{
    public function __construct(
        private readonly PayrollService $payroll,
        private readonly SubscriptionService $billing,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorizePayroll($request, manage: true);

        $search = $request->string('search')->trim()->toString();
        $end = now()->endOfMonth()->toDateString();

        $employees = Employee::query()
            ->active()
            ->with(['user', 'department', 'designation'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('first_name', 'like', '%'.$search.'%')
                        ->orWhere('last_name', 'like', '%'.$search.'%')
                        ->orWhere('employee_code', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%');
                });
            })
            ->orderBy('first_name')
            ->paginate(15)
            ->withQueryString();

        $employeeIds = collect($employees->items())->pluck('id');

        $salaries = EmployeeSalary::query()
            ->whereIn('employee_id', $employeeIds)
            ->where('status', 'active')
            ->whereDate('effective_from', '<=', $end)
            ->orderByDesc('effective_from')
            ->orderByDesc('id')
            ->get()
            ->unique('employee_id')
            ->keyBy('employee_id');

        $payslips = Payslip::query()
            ->with('payrollRun')
            ->whereIn('employee_id', $employeeIds)
            ->orderByDesc('id')
            ->get()
            ->unique('employee_id')
            ->keyBy('employee_id');

        return Inertia::render('payroll/salaries', [
            'employees' => $employees->through(function (Employee $employee) use ($salaries, $payslips): array {
                $salary = $salaries->get($employee->id);
                $payslip = $payslips->get($employee->id);
                $status = $payslip
                    ? ($payslip->isPaid() ? PayslipStatus::Paid : PayslipStatus::Unpaid)
                    : null;

                return [
                    'id' => $employee->id,
                    'full_name' => $employee->full_name,
                    'avatar' => $employee->avatar,
                    'employee_code' => $employee->employee_code,
                    'department' => $employee->department?->name,
                    'designation' => $employee->designation?->name,
                    'salary' => $salary ? $this->salaryPayload($salary) : null,
                    'latest_payslip' => $payslip ? [
                        'id' => $payslip->id,
                        'period' => $payslip->payrollRun?->label(),
                        'net' => $payslip->net,
                        'status' => $status?->value,
                        'status_label' => $status?->label(),
                        'can_pay' => $payslip->canMarkPaid(),
                    ] : null,
                ];
            }),
            'filters' => ['search' => $search],
            'currency' => $request->user()?->currentTenant?->currency ?? 'BDT',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizePayroll($request, manage: true);

        $data = $this->validated($request);
        $employee = Employee::query()->findOrFail($data['employee_id']);

        EmployeeSalary::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'active')
            ->update(['status' => 'inactive']);

        $salary = EmployeeSalary::query()->create([
            ...$data,
            'status' => 'active',
        ]);

        app(AuditLogger::class)->record('salary.assigned', $salary, newValues: [
            'employee_id' => $employee->id,
            'gross' => $salary->gross(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Salary saved for '.$employee->full_name.'.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'house_rent' => ['nullable', 'numeric', 'min:0'],
            'medical' => ['nullable', 'numeric', 'min:0'],
            'other_allowance' => ['nullable', 'numeric', 'min:0'],
            'tax_percent' => ['nullable', 'numeric', 'min:0', 'max:50'],
            'effective_from' => ['required', 'date'],
        ]);

        $data['house_rent'] = (float) ($data['house_rent'] ?? 0);
        $data['medical'] = (float) ($data['medical'] ?? 0);
        $data['other_allowance'] = (float) ($data['other_allowance'] ?? 0);
        $data['tax_percent'] = (float) ($data['tax_percent'] ?? 0);

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function salaryPayload(EmployeeSalary $salary): array
    {
        return [
            'id' => $salary->id,
            'basic_salary' => $salary->basic_salary,
            'house_rent' => $salary->house_rent,
            'medical' => $salary->medical,
            'other_allowance' => $salary->other_allowance,
            'tax_percent' => $salary->tax_percent,
            'gross' => $salary->gross(),
            'effective_from' => $salary->effective_from->toDateString(),
        ];
    }

    private function authorizePayroll(Request $request, bool $manage = false): void
    {
        abort_unless($this->billing->hasFeature(PlanFeature::Payroll), 403);
        abort_unless($request->user()?->can($manage ? 'payroll.manage' : 'payroll.view'), 403);
    }
}
