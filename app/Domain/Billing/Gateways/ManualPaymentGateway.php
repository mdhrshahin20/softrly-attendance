<?php

namespace App\Domain\Billing\Gateways;

use App\Domain\Billing\Models\Payment;

class ManualPaymentGateway extends AbstractPaymentGateway
{
    public function name(): string
    {
        return 'manual';
    }

    public function label(): string
    {
        return 'Manual / bank transfer';
    }

    public function isEnabled(): bool
    {
        return true;
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function charge(Payment $payment): Payment
    {
        return $this->markPaid(
            $payment,
            notes: $payment->notes ?: 'Recorded through the billing desk (demo/manual gateway).',
        );
    }
}
