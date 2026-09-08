<?php

namespace App\Policies;

use App\Domain\Payroll\Models\Payslip;
use App\Domain\Payroll\Models\SalaryAdvance;
use App\Models\User;

class PayrollPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('payroll.view') || $user->can('payroll.manage');
    }

    public function manage(User $user): bool
    {
        return $user->can('payroll.manage');
    }

    public function viewPayslip(User $user, Payslip $payslip): bool
    {
        if ($user->can('payroll.view') || $user->can('payroll.manage')) {
            return true;
        }

        return $user->can('payroll.payslip') && $user->employee?->id === $payslip->employee_id;
    }

    public function viewAdvance(User $user, SalaryAdvance $advance): bool
    {
        if ($user->can('payroll.view') || $user->can('payroll.manage')) {
            return true;
        }

        return $user->employee?->id === $advance->employee_id;
    }
}
