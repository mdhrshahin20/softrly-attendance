<?php

namespace App\Domain\Billing\Notifications;

use App\Domain\Billing\Models\Payment;
use App\Domain\Shared\Notifications\InAppNotification;

class PaymentSucceededNotification extends InAppNotification
{
    public function __construct(private readonly Payment $payment) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $plan = $this->payment->subscription?->plan?->name;

        return [
            'title' => 'Payment successful',
            'message' => $this->payment->currency.' '.number_format($this->payment->amount).' received'
                .($plan ? ' for the '.$plan.' plan' : '').'. Your subscription is active.',
            'url' => '/billing',
            'level' => 'success',
        ];
    }
}
