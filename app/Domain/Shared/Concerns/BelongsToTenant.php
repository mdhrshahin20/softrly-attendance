<?php

namespace App\Domain\Shared\Concerns;

use App\Domain\Shared\Scopes\TenantScope;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

/**
 * @property int|null $tenant_id
 *
 * @mixin Model
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (Model $model): void {
            if ($model->getAttribute('tenant_id')) {
                return;
            }

            $tenant = Tenant::current();

            if ($tenant === null) {
                throw new RuntimeException('Cannot create a tenant-owned record without a current tenant.');
            }

            $model->setAttribute('tenant_id', $tenant->getKey());
        });
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
