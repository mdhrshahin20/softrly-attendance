<?php

namespace App\Domain\Billing\Models;

use App\Domain\Billing\Enums\PaymentStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int|null $subscription_id
 * @property int $amount
 * @property string $currency
 * @property string $gateway
 * @property string|null $transaction_id
 * @property PaymentStatus $status
 * @property string|null $notes
 * @property Carbon|null $paid_at
 */
#[Fillable([
    'tenant_id',
    'subscription_id',
    'amount',
    'currency',
    'gateway',
    'transaction_id',
    'status',
    'notes',
    'paid_at',
])]
class Payment extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<Subscription, $this>
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'status' => PaymentStatus::class,
            'paid_at' => 'datetime',
        ];
    }
}
