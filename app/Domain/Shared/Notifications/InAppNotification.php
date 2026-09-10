<?php

namespace App\Domain\Shared\Notifications;

use Illuminate\Notifications\Notification;

abstract class InAppNotification extends Notification
{
    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }
}
