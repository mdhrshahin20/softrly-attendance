<?php

namespace App\Domain\Marketing\Models;

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'company_name',
    'name',
    'email',
    'source',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'referrer',
    'landing_page',
    'ip_address',
    'tenant_id',
    'status',
])]
class Lead extends Model
{
    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
