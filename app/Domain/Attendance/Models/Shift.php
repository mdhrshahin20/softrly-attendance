<?php

namespace App\Domain\Attendance\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\ShiftFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $name
 * @property string $start_time
 * @property string $end_time
 * @property int $grace_minutes
 * @property int $minimum_work_minutes
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'tenant_id',
    'name',
    'start_time',
    'end_time',
    'grace_minutes',
    'minimum_work_minutes',
    'status',
])]
class Shift extends Model
{
    /** @use HasFactory<ShiftFactory> */
    use BelongsToTenant, HasFactory;

    protected static function newFactory(): ShiftFactory
    {
        return ShiftFactory::new();
    }

    protected function casts(): array
    {
        return [
            'grace_minutes' => 'integer',
            'minimum_work_minutes' => 'integer',
        ];
    }
}
