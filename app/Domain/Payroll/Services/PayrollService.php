<?php

namespace App\Domain\Payroll\Services;

use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Services\EmployeeMonthReportService;
use App\Domain\Attendance\Services\WorkingDayService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Payroll\Enums\PayrollRunStatus;
use App\Domain\Payroll\Enums\PayslipStatus;
use App\Domain\Payroll\Enums\SalaryAdvanceStatus;
use App\Domain\Payroll\Models\EmployeeSalary;
use App\Domain\Payroll\Models\PayrollRun;
use App\Domain\Payroll\Models\Payslip;
use App\Domain\Payroll\Models\SalaryAdvance;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class PayrollService
{
    public function __construct(
        private readonly EmployeeMonthReportService $monthReport,
        private readonly WorkingDayService $workingDays,
    ) {}

    public function currentSalary(Employee $employee, ?CarbonImmutable $on = null): ?EmployeeSalary
    {
        $on ??= CarbonImmutable::now();

        return EmployeeSalary::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'active')
            ->whereDate('effective_from', '<=', $on->toDateString())
            ->latest('effective_from')
            ->latest('id')
            ->first();
    }

    public function generate(int $year, int $month, User $actor): PayrollRun
    {
        $month = max(1, min(12, $month));
        $existing = PayrollRun::query()->where('year', $year)->where('month', $month)->first();

        if ($existing?->isLocked()) {
            throw ValidationException::withMessages([
                'payroll' => 'This month is already marked paid and cannot be regenerated.',
            ]);
        }

        $run = $existing ?? new PayrollRun([
            'year' => $year,
            'month' => $month,
            'status' => PayrollRunStatus::Draft,
        ]);

        if (! $run->exists) {
            $run->save();
        }

        $run->payslips()->delete();

        if ($existing) {
            SalaryAdvance::query()
                ->where('payroll_run_id', $run->id)
                ->where('status', SalaryAdvanceStatus::Deducted)
                ->update([
                    'status' => SalaryAdvanceStatus::Approved,
                    'payroll_run_id' => null,
                ]);
        }

        $employees = Employee::query()->active()->with(['user', 'department', 'office'])->orderBy('first_name')->get();
        $end = CarbonImmutable::create($year, $month, 1)->endOfMonth();

        $count = 0;
        $grossTotal = 0.0;
        $deductionTotal = 0.0;
        $netTotal = 0.0;

        foreach ($employees as $employee) {
            $salary = $this->currentSalary($employee, $end);

            if ($salary === null) {
                continue;
            }

            $payslip = $this->buildPayslip($run, $employee, $salary, $year, $month);
            $count++;
            $grossTotal += $payslip->gross;
            $deductionTotal += $payslip->deductions;
            $netTotal += $payslip->net;
        }

        $run->update([
            'status' => PayrollRunStatus::Processed,
            'employee_count' => $count,
            'total_gross' => round($grossTotal, 2),
            'total_deductions' => round($deductionTotal, 2),
            'total_net' => round($netTotal, 2),
            'generated_by' => $actor->id,
            'generated_at' => now(),
        ]);

        return $run->fresh(['payslips.employee.user']) ?? $run;
    }

    public function markPaid(PayrollRun $run): PayrollRun
    {
        if ($run->status === PayrollRunStatus::Paid) {
            return $run;
        }

        if ($run->status !== PayrollRunStatus::Processed) {
            throw ValidationException::withMessages([
                'payroll' => 'Process payroll before marking it paid.',
            ]);
        }

        $paidAt = now();

        $run->payslips()
            ->where(function ($query): void {
                $query->where('status', PayslipStatus::Unpaid)->orWhereNull('paid_at');
            })
            ->update([
                'status' => PayslipStatus::Paid,
                'paid_at' => $paidAt,
            ]);

        $run->update([
            'status' => PayrollRunStatus::Paid,
            'paid_at' => $paidAt,
        ]);

        return $run->fresh() ?? $run;
    }

    public function markPayslipPaid(Payslip $payslip): Payslip
    {
        $payslip->loadMissing('payrollRun');

        if ($payslip->isPaid()) {
            return $payslip;
        }

        if (! $payslip->canMarkPaid()) {
            throw ValidationException::withMessages([
                'payroll' => 'Generate payroll before marking this payslip paid.',
            ]);
        }

        $payslip->update([
            'status' => PayslipStatus::Paid,
            'paid_at' => now(),
        ]);

        $run = $payslip->payrollRun;

        if ($run && $run->payslips()->where('status', '!=', PayslipStatus::Paid)->doesntExist()) {
            $run->update([
                'status' => PayrollRunStatus::Paid,
                'paid_at' => now(),
            ]);
        }

        return $payslip->fresh(['payrollRun', 'employee.user']) ?? $payslip;
    }

    private function buildPayslip(PayrollRun $run, Employee $employee, EmployeeSalary $salary, int $year, int $month): Payslip
    {
        $start = CarbonImmutable::create($year, $month, 1)->startOfMonth();
        $end = $start->endOfMonth();

        if ($employee->joining_date && $employee->joining_date->gt($start)) {
            $start = CarbonImmutable::parse($employee->joining_date->toDateString());
        }

        $report = $this->monthReport->build($employee, $year, $month);
        $workingDays = max(1, $this->workingDays->datesBetween($start, $end, $employee)->count());
        $days = collect($report['days'])->filter(
            fn (array $day): bool => $day['date'] >= $start->toDateString() && $day['date'] <= $end->toDateString(),
        );
        $present = $days->whereIn('status', ['present', 'late', 'work_from_home', 'manual', 'half_day'])->count();
        $lateDays = $days->where('status', 'late')->count();
        $leaveDays = $days->where('status', 'leave')->count();
        $absentDays = $days->where('status', 'absent')->count();
        $lateMinutes = (int) $days->sum('late_minutes');
        $overtimeMinutes = (int) Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('attendance_date', [$start->toDateString(), $end->toDateString()])
            ->sum('overtime_minutes');

        $grossComponents = $salary->gross();
        $dailyRate = $grossComponents / $workingDays;
        $hourlyRate = $dailyRate / 8;
        $overtimePay = round(($overtimeMinutes / 60) * $hourlyRate * 1.5, 2);
        $absenceDeduction = round($dailyRate * $absentDays, 2);
        $lateDeduction = 0.0;
        $taxable = max(0, $grossComponents + $overtimePay - $absenceDeduction);
        $tax = round($taxable * ($salary->tax_percent / 100), 2);

        $advances = $this->openAdvances($employee);
        $advanceDeduction = round((float) $advances->sum('amount'), 2);

        $earnings = round($grossComponents + $overtimePay, 2);
        $deductions = round($absenceDeduction + $lateDeduction + $advanceDeduction + $tax, 2);
        $net = round(max(0, $earnings - $deductions), 2);

        $payslip = Payslip::query()->create([
            'payroll_run_id' => $run->id,
            'employee_id' => $employee->id,
            'working_days' => $workingDays,
            'present_days' => $present,
            'late_days' => $lateDays,
            'leave_days' => $leaveDays,
            'absent_days' => $absentDays,
            'overtime_minutes' => $overtimeMinutes,
            'late_minutes' => $lateMinutes,
            'basic_salary' => $salary->basic_salary,
            'house_rent' => $salary->house_rent,
            'medical' => $salary->medical,
            'other_allowance' => $salary->other_allowance,
            'overtime_pay' => $overtimePay,
            'absence_deduction' => $absenceDeduction,
            'late_deduction' => $lateDeduction,
            'advance_deduction' => $advanceDeduction,
            'tax' => $tax,
            'gross' => $earnings,
            'deductions' => $deductions,
            'net' => $net,
            'status' => PayslipStatus::Unpaid,
            'paid_at' => null,
        ]);

        foreach ($advances as $advance) {
            $advance->update([
                'status' => SalaryAdvanceStatus::Deducted,
                'payroll_run_id' => $run->id,
            ]);
        }

        return $payslip;
    }

    /**
     * @return Collection<int, SalaryAdvance>
     */
    private function openAdvances(Employee $employee): Collection
    {
        return SalaryAdvance::query()
            ->where('employee_id', $employee->id)
            ->where('status', SalaryAdvanceStatus::Approved)
            ->orderBy('id')
            ->get();
    }
}
