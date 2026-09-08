<?php

namespace App\Domain\Payroll\Services;

use App\Domain\Payroll\Enums\PayslipStatus;
use App\Domain\Payroll\Models\Payslip;
use Illuminate\Database\Eloquent\Builder;

class SalaryReportService
{
    public function query(int $year, int $month, ?int $departmentId, ?int $officeId, ?string $paymentStatus): Builder
    {
        return Payslip::query()
            ->with(['employee.user', 'employee.department', 'employee.office', 'payrollRun'])
            ->whereHas(
                'payrollRun',
                fn (Builder $builder) => $builder->where('year', $year)->where('month', $month),
            )
            ->when(
                $departmentId,
                fn (Builder $builder) => $builder->whereHas(
                    'employee',
                    fn (Builder $employee) => $employee->where('department_id', $departmentId),
                ),
            )
            ->when(
                $officeId,
                fn (Builder $builder) => $builder->whereHas(
                    'employee',
                    fn (Builder $employee) => $employee->where('office_id', $officeId),
                ),
            )
            ->when(
                $paymentStatus === PayslipStatus::Paid->value,
                fn (Builder $builder) => $builder->where('status', PayslipStatus::Paid),
            )
            ->when(
                $paymentStatus === PayslipStatus::Unpaid->value,
                fn (Builder $builder) => $builder->where('status', PayslipStatus::Unpaid),
            );
    }

    /**
     * @return array<string, mixed>
     */
    public function row(Payslip $payslip): array
    {
        $status = $payslip->isPaid() ? PayslipStatus::Paid : PayslipStatus::Unpaid;

        return [
            'id' => $payslip->id,
            'employee' => $payslip->employee?->full_name,
            'avatar' => $payslip->employee?->avatar,
            'employee_code' => $payslip->employee?->employee_code,
            'department' => $payslip->employee?->department?->name,
            'office' => $payslip->employee?->office?->name,
            'period' => $payslip->payrollRun?->label(),
            'working_days' => $payslip->working_days,
            'present_days' => $payslip->present_days,
            'late_days' => $payslip->late_days,
            'leave_days' => $payslip->leave_days,
            'absent_days' => $payslip->absent_days,
            'overtime_minutes' => $payslip->overtime_minutes,
            'basic_salary' => $payslip->basic_salary,
            'overtime_pay' => $payslip->overtime_pay,
            'advance_deduction' => $payslip->advance_deduction,
            'tax' => $payslip->tax,
            'gross' => $payslip->gross,
            'deductions' => $payslip->deductions,
            'net' => $payslip->net,
            'status' => $status->value,
            'status_label' => $status->label(),
            'paid_at' => $payslip->paid_at?->toDateTimeString(),
            'can_pay' => $payslip->canMarkPaid(),
        ];
    }

    /**
     * @return array<string, float|int>
     */
    public function totals(Builder $query): array
    {
        $rows = (clone $query)->get();
        $paid = $rows->filter(fn (Payslip $payslip): bool => $payslip->isPaid());
        $unpaid = $rows->reject(fn (Payslip $payslip): bool => $payslip->isPaid());

        return [
            'employees' => $rows->count(),
            'present_days' => (int) $rows->sum('present_days'),
            'absent_days' => (int) $rows->sum('absent_days'),
            'overtime_minutes' => (int) $rows->sum('overtime_minutes'),
            'gross' => round((float) $rows->sum('gross'), 2),
            'deductions' => round((float) $rows->sum('deductions'), 2),
            'net' => round((float) $rows->sum('net'), 2),
            'paid_count' => $paid->count(),
            'unpaid_count' => $unpaid->count(),
            'paid_net' => round((float) $paid->sum('net'), 2),
            'unpaid_net' => round((float) $unpaid->sum('net'), 2),
        ];
    }
}
