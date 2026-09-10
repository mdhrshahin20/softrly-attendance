<?php

namespace App\Domain\Billing\Listeners;

use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Billing\Events\SubscriptionExpired;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Billing\Notifications\SubscriptionStatusNotification;
use App\Domain\Platform\Notifications\TenantSubscriptionExpiredNotification;
use App\Domain\Platform\Services\PlatformNotifier;
use App\Domain\Tenant\Services\TenantNotifier;

class HandleSubscriptionNotifications
{
    public function __construct(
        private readonly PlatformNotifier $platform,
        private readonly TenantNotifier $tenants,
    ) {}

    public function expired(SubscriptionExpired $event): void
    {
        $subscription = $event->subscription->loadMissing(['tenant', 'plan']);

        $this->tenants->notify(
            $subscription->tenant,
            new SubscriptionStatusNotification($subscription, SubscriptionStatus::Expired),
        );

        $this->platform->notify(new TenantSubscriptionExpiredNotification($subscription));
    }

    public function cancelled(Subscription $subscription): void
    {
        $subscription->loadMissing(['tenant', 'plan']);

        $this->tenants->notify(
            $subscription->tenant,
            new SubscriptionStatusNotification($subscription, SubscriptionStatus::Cancelled),
        );
    }
}
