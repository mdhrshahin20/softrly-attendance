<?php

namespace App\Domain\Platform\Models;

use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $uuid
 * @property string $type
 * @property int|null $tenant_id
 * @property string $status
 * @property string $filename
 * @property string $path
 * @property int $size_bytes
 * @property int $table_count
 * @property int $row_count
 * @property int $file_count
 * @property string|null $error
 * @property int|null $created_by
 * @property Carbon|null $completed_at
 * @property-read Tenant|null $tenant
 * @property-read User|null $creator
 */
#[Fillable([
    'uuid',
    'type',
    'tenant_id',
    'status',
    'filename',
    'path',
    'size_bytes',
    'table_count',
    'row_count',
    'file_count',
    'error',
    'created_by',
    'completed_at',
])]
class Backup extends Model
{
    public const TYPE_FULL = 'full';

    public const TYPE_TENANT = 'tenant';

    public const STATUS_RUNNING = 'running';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isFull(): bool
    {
        return $this->type === self::TYPE_FULL;
    }

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'table_count' => 'integer',
            'row_count' => 'integer',
            'file_count' => 'integer',
            'completed_at' => 'datetime',
        ];
    }
}
