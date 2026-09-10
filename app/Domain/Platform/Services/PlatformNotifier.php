<?php

namespace App\Domain\Platform\Services;

use App\Models\User;
use Illuminate\Notifications\Notification;

class PlatformNotifier
{
    public function notify(Notification $notification): void
    {
        User::query()
            ->where('is_platform_admin', true)
            ->get()
            ->each(fn (User $admin) => $admin->notify(clone $notification));
    }
}
