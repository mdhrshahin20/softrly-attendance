<?php

namespace App\Domain\Office\Models;

use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\OfficeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $name
 * @property string $code
 * @property string|null $address
 * @property string|null $city
 * @property string $country
 * @property string|null $latitude
 * @property string|null $longitude
 * @property int $allowed_radius
 * @property string $timezone
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, OfficeNetwork> $networks
 */
#[Fillable([
    'tenant_id',
    'name',
    'code',
    'address',
    'city',
    'country',
    'latitude',
    'longitude',
    'allowed_radius',
    'timezone',
    'status',
])]
class Office extends Model
{
    /** @use HasFactory<OfficeFactory> */
    use BelongsToTenant, HasFactory;

    protected static function newFactory(): OfficeFactory
    {
        return OfficeFactory::new();
    }

    /**
     * @return HasMany<OfficeNetwork, $this>
     */
    public function networks(): HasMany
    {
        return $this->hasMany(OfficeNetwork::class);
    }

    /**
     * @return HasMany<Employee, $this>
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'allowed_radius' => 'integer',
        ];
    }
}
