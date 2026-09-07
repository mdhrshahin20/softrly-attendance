<?php

namespace App\Console\Commands;

use App\Domain\Billing\Services\SubscriptionService;
use Illuminate\Console\Command;

class ExpireSubscriptionsCommand extends Command
{
    protected $signature = 'billing:expire-subscriptions';

    protected $description = 'Mark overdue trials and paid periods as expired.';

    public function handle(SubscriptionService $subscriptions): int
    {
        $count = $subscriptions->expireOverdue();
        $this->info("Expired {$count} subscription(s).");

        return self::SUCCESS;
    }
}
