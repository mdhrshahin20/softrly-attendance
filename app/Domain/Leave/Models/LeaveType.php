<?php

namespace App\Domain\Leave\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'tenant_id',
    'name',
    'code',
    'days_per_year',
    'is_paid',
    'carry_forward',
    'maximum_carry_forward',
    'requires_attachment',
    'minimum_notice_days',
    'status',
])]
class LeaveType extends Model
{
    use BelongsToTenant;

    /**
     * @return HasMany<LeaveBalance, $this>
     */
    public function balances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    /**
     * @return HasMany<LeaveRequest, $this>
     */
    public function requests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    protected function casts(): array
    {
        return [
            'days_per_year' => 'integer',
            'is_paid' => 'boolean',
            'carry_forward' => 'boolean',
            'maximum_carry_forward' => 'integer',
            'requires_attachment' => 'boolean',
            'minimum_notice_days' => 'integer',
        ];
    }
}
