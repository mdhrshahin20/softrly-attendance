<?php

namespace App\Domain\Billing\Listeners;

use App\Domain\Billing\Events\SubscriptionExpired;
use App\Domain\Billing\Events\SubscriptionStarted;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Platform\Services\PlatformMailer;
use App\Mail\SubscriptionStartedMail;
use App\Mail\SubscriptionStatusMail;
use Throwable;

class HandleSubscriptionMail
{
    public function __construct(
        private readonly PlatformMailer $mailer,
    ) {}

    public function started(SubscriptionStarted $event): void
    {
        $this->send($event->subscription, 'started');
    }

    public function expired(SubscriptionExpired $event): void
    {
        $this->send($event->subscription, 'expired');
    }

    public function cancelled(Subscription $subscription): void
    {
        $this->send($subscription, 'cancelled');
    }

    private function send(Subscription $subscription, string $event): void
    {
        $subscription->loadMissing(['tenant.users', 'plan']);
        $email = $subscription->tenant->billingEmail();

        if (! filled($email)) {
            return;
        }

        try {
            $mailable = $event === 'started'
                ? new SubscriptionStartedMail($subscription)
                : new SubscriptionStatusMail($subscription, $event);

            $this->mailer->send($email, $mailable, $subscription->tenant, $subscription);
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
