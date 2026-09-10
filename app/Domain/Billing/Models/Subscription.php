<?php

namespace App\Domain\Billing\Models;

use App\Domain\Billing\Enums\BillingCycle;
use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $plan_id
 * @property SubscriptionStatus $status
 * @property BillingCycle $billing_cycle
 * @property Carbon|null $started_at
 * @property Carbon|null $trial_ends_at
 * @property Carbon|null $current_period_start
 * @property Carbon|null $current_period_end
 * @property Carbon|null $cancelled_at
 * @property Carbon|null $trial_reminder_sent_at
 * @property Carbon|null $renewal_reminder_sent_at
 * @property-read Plan $plan
 * @property-read Tenant $tenant
 */
#[Fillable([
    'tenant_id',
    'plan_id',
    'status',
    'billing_cycle',
    'started_at',
    'trial_ends_at',
    'current_period_start',
    'current_period_end',
    'cancelled_at',
    'trial_reminder_sent_at',
    'renewal_reminder_sent_at',
])]
class Subscription extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function allowsAccess(): bool
    {
        if ($this->status === SubscriptionStatus::Active) {
            return $this->current_period_end === null || $this->current_period_end->isFuture();
        }

        if ($this->status === SubscriptionStatus::Trial) {
            return $this->trial_ends_at === null || $this->trial_ends_at->isFuture();
        }

        return false;
    }

    public function isOnTrial(): bool
    {
        return $this->status === SubscriptionStatus::Trial && $this->allowsAccess();
    }

    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'billing_cycle' => BillingCycle::class,
            'started_at' => 'datetime',
            'trial_ends_at' => 'datetime',
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
            'cancelled_at' => 'datetime',
            'trial_reminder_sent_at' => 'datetime',
            'renewal_reminder_sent_at' => 'datetime',
        ];
    }
}
