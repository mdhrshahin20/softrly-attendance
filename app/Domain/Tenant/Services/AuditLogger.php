<?php

namespace App\Domain\Tenant\Services;

use App\Domain\Tenant\Models\ActivityLog;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogger
{
    /**
     * @param  array<string, mixed>  $oldValues
     * @param  array<string, mixed>  $newValues
     */
    public function record(
        string $action,
        Model|User|null $entity = null,
        array $oldValues = [],
        array $newValues = [],
        ?User $user = null,
        ?Request $request = null,
        ?Tenant $tenant = null,
    ): ActivityLog {
        $request ??= request();
        $actor = $user ?? ($request->user() instanceof User ? $request->user() : null);
        $tenant ??= Tenant::current();

        if ($tenant === null && $actor instanceof User) {
            $tenant = $actor->currentTenant ?? $actor->tenants()->first();
        }

        return ActivityLog::query()->create([
            'tenant_id' => $tenant?->getKey(),
            'user_id' => $actor?->id,
            'action' => $action,
            'entity_type' => $entity instanceof Model ? $entity::class : null,
            'entity_id' => $entity instanceof Model ? $entity->getKey() : null,
            'old_values' => $oldValues === [] ? null : $oldValues,
            'new_values' => $newValues === [] ? null : $newValues,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
