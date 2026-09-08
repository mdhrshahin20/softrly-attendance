<?php

namespace App\Domain\Payroll\Models;

use App\Domain\Employee\Models\Employee;
use App\Domain\Payroll\Enums\PayrollRunStatus;
use App\Domain\Payroll\Enums\PayslipStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property PayslipStatus $status
 * @property Carbon|null $paid_at
 */

#[Fillable([
    'tenant_id',
    'payroll_run_id',
    'employee_id',
    'working_days',
    'present_days',
    'late_days',
    'leave_days',
    'absent_days',
    'overtime_minutes',
    'late_minutes',
    'basic_salary',
    'house_rent',
    'medical',
    'other_allowance',
    'overtime_pay',
    'absence_deduction',
    'late_deduction',
    'advance_deduction',
    'tax',
    'gross',
    'deductions',
    'net',
    'status',
    'paid_at',
])]
class Payslip extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<PayrollRun, $this>
     */
    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class);
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function isPaid(): bool
    {
        return $this->status === PayslipStatus::Paid || $this->paid_at !== null;
    }

    public function canMarkPaid(): bool
    {
        if ($this->isPaid()) {
            return false;
        }

        $run = $this->payrollRun;

        return $run !== null && $run->status !== PayrollRunStatus::Draft;
    }

    protected function casts(): array
    {
        return [
            'working_days' => 'integer',
            'present_days' => 'integer',
            'late_days' => 'integer',
            'leave_days' => 'integer',
            'absent_days' => 'integer',
            'overtime_minutes' => 'integer',
            'late_minutes' => 'integer',
            'basic_salary' => 'float',
            'house_rent' => 'float',
            'medical' => 'float',
            'other_allowance' => 'float',
            'overtime_pay' => 'float',
            'absence_deduction' => 'float',
            'late_deduction' => 'float',
            'advance_deduction' => 'float',
            'tax' => 'float',
            'gross' => 'float',
            'deductions' => 'float',
            'net' => 'float',
            'status' => PayslipStatus::class,
            'paid_at' => 'datetime',
        ];
    }
}
