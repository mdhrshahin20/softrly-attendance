<?php

namespace App\Domain\Office\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\OfficeNetworkFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $office_id
 * @property string $name
 * @property string|null $ip_address
 * @property string|null $ip_range
 * @property string $network_type
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'tenant_id',
    'office_id',
    'name',
    'ip_address',
    'ip_range',
    'network_type',
    'status',
])]
class OfficeNetwork extends Model
{
    /** @use HasFactory<OfficeNetworkFactory> */
    use BelongsToTenant, HasFactory;

    protected static function newFactory(): OfficeNetworkFactory
    {
        return OfficeNetworkFactory::new();
    }

    /**
     * @return BelongsTo<Office, $this>
     */
    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }
}
