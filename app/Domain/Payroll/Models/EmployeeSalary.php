<?php

namespace App\Domain\Payroll\Models;

use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property float $basic_salary
 * @property float $house_rent
 * @property float $medical
 * @property float $other_allowance
 * @property float $tax_percent
 * @property Carbon $effective_from
 */
#[Fillable([
    'tenant_id',
    'employee_id',
    'basic_salary',
    'house_rent',
    'medical',
    'other_allowance',
    'tax_percent',
    'effective_from',
    'status',
])]
class EmployeeSalary extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function gross(): float
    {
        return round($this->basic_salary + $this->house_rent + $this->medical + $this->other_allowance, 2);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    protected function casts(): array
    {
        return [
            'basic_salary' => 'float',
            'house_rent' => 'float',
            'medical' => 'float',
            'other_allowance' => 'float',
            'tax_percent' => 'float',
            'effective_from' => 'date',
        ];
    }
}
