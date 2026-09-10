<?php

namespace App\Domain\Billing\Notifications;

use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Shared\Notifications\InAppNotification;

class SubscriptionStatusNotification extends InAppNotification
{
    public function __construct(
        private readonly Subscription $subscription,
        private readonly SubscriptionStatus $status,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $plan = $this->subscription->plan->name;

        return match ($this->status) {
            SubscriptionStatus::Cancelled => [
                'title' => 'Subscription cancelled',
                'message' => 'Your '.$plan.' subscription was cancelled. You can resubscribe at any time.',
                'url' => '/billing',
                'level' => 'warning',
            ],
            default => [
                'title' => 'Subscription expired',
                'message' => 'Your '.$plan.' subscription expired'
                    .($this->subscription->current_period_end ? ' on '.$this->subscription->current_period_end->toDateString() : '')
                    .'. Renew to restore access.',
                'url' => '/billing',
                'level' => 'danger',
            ],
        };
    }
}
