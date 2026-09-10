<?php

namespace App\Domain\Platform\Notifications;

use App\Domain\Shared\Notifications\InAppNotification;
use App\Domain\Tenant\Models\Tenant;

class TenantSignedUpNotification extends InAppNotification
{
    public function __construct(private readonly Tenant $tenant) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New workspace signup',
            'message' => $this->tenant->name.' just created a workspace.',
            'url' => '/platform/tenants/'.$this->tenant->id,
            'level' => 'success',
        ];
    }
}
