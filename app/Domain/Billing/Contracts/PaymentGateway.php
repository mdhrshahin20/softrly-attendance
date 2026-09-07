<?php

namespace App\Domain\Billing\Contracts;

use App\Domain\Billing\Models\Payment;

interface PaymentGateway
{
    public function name(): string;

    public function charge(Payment $payment): Payment;
}
