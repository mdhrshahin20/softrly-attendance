<?php

namespace App\Domain\Platform\Notifications;

use App\Domain\Billing\Models\Subscription;
use App\Domain\Shared\Notifications\InAppNotification;

class TenantSubscriptionExpiredNotification extends InAppNotification
{
    public function __construct(private readonly Subscription $subscription) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $tenant = $this->subscription->tenant;
        $plan = $this->subscription->plan->name;

        return [
            'title' => 'Subscription expired',
            'message' => $tenant->name."'s ".$plan.' plan expired.',
            'url' => '/platform/tenants/'.$this->subscription->tenant_id,
            'level' => 'warning',
        ];
    }
}
