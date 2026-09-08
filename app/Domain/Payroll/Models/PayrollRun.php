<?php

namespace App\Domain\Payroll\Models;

use App\Domain\Payroll\Enums\PayrollRunStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property PayrollRunStatus $status
 * @property Carbon|null $generated_at
 * @property Carbon|null $paid_at
 */
#[Fillable([
    'tenant_id',
    'year',
    'month',
    'status',
    'employee_count',
    'total_gross',
    'total_deductions',
    'total_net',
    'generated_by',
    'generated_at',
    'paid_at',
])]
class PayrollRun extends Model
{
    use BelongsToTenant;

    /**
     * @return HasMany<Payslip, $this>
     */
    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function label(): string
    {
        return Carbon::createFromDate($this->year, $this->month, 1)->format('F Y');
    }

    public function isPaid(): bool
    {
        return $this->status === PayrollRunStatus::Paid;
    }

    public function isLocked(): bool
    {
        return $this->status === PayrollRunStatus::Paid;
    }

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'status' => PayrollRunStatus::class,
            'employee_count' => 'integer',
            'total_gross' => 'float',
            'total_deductions' => 'float',
            'total_net' => 'float',
            'generated_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }
}
