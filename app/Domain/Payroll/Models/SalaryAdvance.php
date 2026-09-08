<?php

namespace App\Domain\Payroll\Models;

use App\Domain\Employee\Models\Employee;
use App\Domain\Payroll\Enums\SalaryAdvanceStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id',
    'employee_id',
    'amount',
    'reason',
    'status',
    'requested_by',
    'decided_by',
    'payroll_run_id',
    'decided_at',
])]
class SalaryAdvance extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function isPending(): bool
    {
        return $this->status === SalaryAdvanceStatus::Pending;
    }

    public function isApproved(): bool
    {
        return $this->status === SalaryAdvanceStatus::Approved;
    }

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'status' => SalaryAdvanceStatus::class,
            'decided_at' => 'datetime',
        ];
    }
}
