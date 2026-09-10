<?php

namespace App\Domain\Platform\Notifications;

use App\Domain\Billing\Models\Payment;
use App\Domain\Shared\Notifications\InAppNotification;

class PaymentReceivedNotification extends InAppNotification
{
    public function __construct(private readonly Payment $payment) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $plan = $this->payment->subscription?->plan?->name;

        return [
            'title' => 'Payment received',
            'message' => $this->payment->currency.' '.number_format($this->payment->amount)
                .' from '.$this->payment->tenant->name
                .' via '.$this->payment->gateway.($plan ? ' ('.$plan.')' : '').'.',
            'url' => '/platform/payments',
            'level' => 'success',
        ];
    }
}
