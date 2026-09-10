<?php

namespace App\Domain\Billing\Notifications;

use App\Domain\Billing\Models\Subscription;
use App\Domain\Shared\Notifications\InAppNotification;

class TrialEndingNotification extends InAppNotification
{
    public function __construct(private readonly Subscription $subscription) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $endsAt = $this->subscription->trial_ends_at;
        $days = $endsAt !== null
            ? max(0, (int) now()->startOfDay()->diffInDays($endsAt->startOfDay(), false))
            : null;

        return [
            'title' => 'Trial ending soon',
            'message' => 'Your trial ends '.($endsAt?->toDateString() ?? 'soon')
                .($days !== null ? ' ('.$days.' day(s) left)' : '')
                .'. Choose a plan to keep access.',
            'url' => '/billing',
            'level' => 'warning',
        ];
    }
}
