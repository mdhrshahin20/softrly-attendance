<?php

namespace App\Domain\Leave\Services;

use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Models\LeaveBalance;
use App\Domain\Leave\Models\LeaveType;

class LeaveBalanceService
{
    public function ensureForEmployee(Employee $employee, ?int $year = null): void
    {
        $year ??= (int) now()->year;

        LeaveType::query()->where('status', 'active')->each(function (LeaveType $type) use ($employee, $year): void {
            $balance = LeaveBalance::query()->firstOrCreate(
                [
                    'employee_id' => $employee->id,
                    'leave_type_id' => $type->id,
                    'year' => $year,
                ],
                [
                    'allocated' => $type->is_paid ? $type->days_per_year : 0,
                    'used' => 0,
                    'pending' => 0,
                    'carried_forward' => 0,
                    'remaining' => $type->is_paid ? $type->days_per_year : 0,
                ],
            );

            $balance->recalculate();
        });
    }

    public function for(Employee $employee, LeaveType $type, ?int $year = null): LeaveBalance
    {
        $year ??= (int) now()->year;

        $balance = LeaveBalance::query()->firstOrCreate(
            [
                'employee_id' => $employee->id,
                'leave_type_id' => $type->id,
                'year' => $year,
            ],
            [
                'allocated' => $type->is_paid ? $type->days_per_year : 0,
                'used' => 0,
                'pending' => 0,
                'carried_forward' => 0,
                'remaining' => $type->is_paid ? $type->days_per_year : 0,
            ],
        );

        return $balance;
    }

    public function reserve(Employee $employee, LeaveType $type, float $days, ?int $year = null): LeaveBalance
    {
        $balance = $this->for($employee, $type, $year);
        $balance->pending = round((float) $balance->pending + $days, 1);
        $balance->recalculate();

        return $balance;
    }

    public function consume(Employee $employee, LeaveType $type, float $days, ?int $year = null): LeaveBalance
    {
        $balance = $this->for($employee, $type, $year);
        $balance->pending = round(max(0, (float) $balance->pending - $days), 1);
        $balance->used = round((float) $balance->used + $days, 1);
        $balance->recalculate();

        return $balance;
    }

    public function releasePending(Employee $employee, LeaveType $type, float $days, ?int $year = null): LeaveBalance
    {
        $balance = $this->for($employee, $type, $year);
        $balance->pending = round(max(0, (float) $balance->pending - $days), 1);
        $balance->recalculate();

        return $balance;
    }

    public function restoreUsed(Employee $employee, LeaveType $type, float $days, ?int $year = null): LeaveBalance
    {
        $balance = $this->for($employee, $type, $year);
        $balance->used = round(max(0, (float) $balance->used - $days), 1);
        $balance->recalculate();

        return $balance;
    }
}
