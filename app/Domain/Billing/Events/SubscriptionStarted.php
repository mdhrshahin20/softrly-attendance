<?php

namespace App\Domain\Billing\Events;

use App\Domain\Billing\Models\Subscription;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubscriptionStarted
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Subscription $subscription) {}
}
