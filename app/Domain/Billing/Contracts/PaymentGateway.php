<?php

namespace App\Domain\Billing\Contracts;

use App\Domain\Billing\Models\Payment;

interface PaymentGateway
{
    public function name(): string;

    public function label(): string;

    public function isEnabled(): bool;

    public function isConfigured(): bool;

    public function requiresRedirect(): bool;

    public function charge(Payment $payment): Payment;

    public function checkoutUrl(Payment $payment): ?string;
}
