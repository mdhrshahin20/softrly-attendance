<?php

namespace App\Domain\Leave\Models;

use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id',
    'employee_id',
    'leave_type_id',
    'year',
    'allocated',
    'used',
    'pending',
    'carried_forward',
    'remaining',
])]
class LeaveBalance extends Model
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
     * @return BelongsTo<LeaveType, $this>
     */
    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function recalculate(): void
    {
        $this->remaining = round(
            (float) $this->allocated + (float) $this->carried_forward - (float) $this->used - (float) $this->pending,
            1,
        );
        $this->save();
    }

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'allocated' => 'float',
            'used' => 'float',
            'pending' => 'float',
            'carried_forward' => 'float',
            'remaining' => 'float',
        ];
    }
}
