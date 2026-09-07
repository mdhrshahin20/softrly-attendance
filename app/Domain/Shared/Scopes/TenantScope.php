<?php

namespace App\Domain\Shared\Scopes;

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * @param  Builder<Model>  $builder
     */
    public function apply(Builder $builder, Model $model): void
    {
        $tenant = Tenant::current();

        if ($tenant === null) {
            return;
        }

        $builder->where($model->qualifyColumn('tenant_id'), $tenant->getKey());
    }
}
