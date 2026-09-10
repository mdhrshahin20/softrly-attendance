<?php

namespace App\Domain\Tenant\Services;

use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Spatie\Permission\PermissionRegistrar;

class TenantNotifier
{
    public function notify(Tenant $tenant, Notification $notification): void
    {
        foreach ($this->recipients($tenant) as $user) {
            $user->notify(clone $notification);
        }
    }

    /**
     * @return Collection<int, User>
     */
    private function recipients(Tenant $tenant): Collection
    {
        $owners = $tenant->users()->wherePivot('is_owner', true)->get();

        if ($owners->isNotEmpty()) {
            return $owners;
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);

        return $tenant->users()->get()->filter(
            fn (User $user): bool => $user->can('settings.manage'),
        );
    }
}
