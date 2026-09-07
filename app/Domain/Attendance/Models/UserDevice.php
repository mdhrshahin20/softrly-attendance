<?php

namespace App\Domain\Attendance\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id',
    'user_id',
    'device_uuid',
    'device_name',
    'browser',
    'os',
    'last_ip',
    'last_seen_at',
    'trusted',
])]
class UserDevice extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
            'trusted' => 'boolean',
        ];
    }
}
