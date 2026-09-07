<?php

namespace App\Domain\Billing\Gateways;

use App\Domain\Billing\Contracts\PaymentGateway;
use App\Domain\Billing\Enums\PaymentStatus;
use App\Domain\Billing\Models\Payment;
use Illuminate\Support\Str;

class ManualPaymentGateway implements PaymentGateway
{
    public function name(): string
    {
        return 'manual';
    }

    public function charge(Payment $payment): Payment
    {
        $payment->update([
            'status' => PaymentStatus::Paid,
            'gateway' => $this->name(),
            'transaction_id' => $payment->transaction_id ?: 'manual_'.Str::lower(Str::ulid()),
            'paid_at' => now(),
            'notes' => $payment->notes ?: 'Recorded through the billing desk (demo/manual gateway).',
        ]);

        return $payment->refresh();
    }
}
