<?php

namespace App\Domain\Platform\Models;

use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $id
 * @property int|null $tenant_id
 * @property string $channel
 * @property string|null $driver
 * @property string $to
 * @property string|null $subject
 * @property string|null $body
 * @property string $status
 * @property string|null $error
 */
#[Fillable([
    'tenant_id',
    'channel',
    'driver',
    'to',
    'subject',
    'body',
    'status',
    'error',
    'related_type',
    'related_id',
])]
class MessageLog extends Model
{
    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function related(): MorphTo
    {
        return $this->morphTo();
    }
}
