<?php

namespace App\Domain\Billing\Events;

use App\Domain\Billing\Models\Payment;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Payment $payment) {}
}
