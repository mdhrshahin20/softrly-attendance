<?php

namespace App\Domain\Billing\Gateways;

use App\Domain\Billing\Contracts\PaymentGateway;
use App\Domain\Billing\Enums\PaymentStatus;
use App\Domain\Billing\Models\Payment;
use Illuminate\Support\Str;

abstract class AbstractPaymentGateway implements PaymentGateway
{
    public function requiresRedirect(): bool
    {
        return false;
    }

    public function checkoutUrl(Payment $payment): ?string
    {
        return null;
    }

    protected function markPaid(Payment $payment, ?string $transactionId = null, ?string $notes = null): Payment
    {
        $payment->update([
            'status' => PaymentStatus::Paid,
            'gateway' => $this->name(),
            'transaction_id' => $transactionId ?: $payment->transaction_id ?: $this->name().'_'.Str::lower(Str::ulid()),
            'paid_at' => now(),
            'notes' => $notes ?? $payment->notes,
        ]);

        return $payment->refresh();
    }
}
