<?php

namespace App\Domain\Billing\Gateways;

use App\Domain\Billing\Models\Payment;
use App\Domain\Platform\Services\PlatformSettingsService;

class ManualPaymentGateway extends AbstractPaymentGateway
{
    public function __construct(
        private readonly PlatformSettingsService $settings,
    ) {}

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
        return $this->settings->bool('payments.manual.enabled');
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
