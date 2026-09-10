<?php

namespace App\Domain\Billing\Models;

use App\Domain\Billing\Enums\InvoiceStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int|null $payment_id
 * @property int|null $subscription_id
 * @property string $number
 * @property InvoiceStatus $status
 * @property int $amount
 * @property string $currency
 * @property string|null $billed_to_name
 * @property string|null $billed_to_email
 * @property string|null $billed_to_company
 * @property Carbon|null $issued_at
 * @property Carbon|null $due_at
 * @property Carbon|null $sent_at
 * @property Carbon|null $due_reminder_sent_at
 * @property Carbon|null $overdue_reminder_sent_at
 * @property string|null $notes
 * @property-read Collection<int, InvoiceItem> $items
 */
#[Fillable([
    'tenant_id',
    'payment_id',
    'subscription_id',
    'number',
    'status',
    'amount',
    'currency',
    'billed_to_name',
    'billed_to_email',
    'billed_to_company',
    'issued_at',
    'due_at',
    'sent_at',
    'due_reminder_sent_at',
    'overdue_reminder_sent_at',
    'notes',
])]
class Invoice extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<Payment, $this>
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * @return BelongsTo<Subscription, $this>
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * @return HasMany<InvoiceItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toAdminArray(): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'amount' => $this->amount,
            'currency' => $this->currency,
            'tenant' => $this->tenant?->name,
            'tenant_id' => $this->tenant_id,
            'plan' => $this->subscription?->plan?->name,
            'gateway' => $this->payment?->gateway,
            'billed_to_name' => $this->billed_to_name,
            'billed_to_email' => $this->billed_to_email,
            'billed_to_company' => $this->billed_to_company,
            'issued_at' => $this->issued_at?->toDateTimeString(),
            'sent_at' => $this->sent_at?->toDateTimeString(),
            'notes' => $this->notes,
            'items' => $this->relationLoaded('items')
                ? $this->items->map(fn (InvoiceItem $item): array => [
                    'id' => $item->id,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_amount' => $item->unit_amount,
                    'amount' => $item->amount,
                ])->values()->all()
                : [],
        ];
    }

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'status' => InvoiceStatus::class,
            'issued_at' => 'datetime',
            'due_at' => 'datetime',
            'sent_at' => 'datetime',
            'due_reminder_sent_at' => 'datetime',
            'overdue_reminder_sent_at' => 'datetime',
        ];
    }
}
