<?php

namespace App\Domain\Api\Models;

use App\Domain\Api\Models\ApiToken;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $user_id
 * @property string $name
 * @property string $token
 * @property Carbon|null $last_used_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */

#[Fillable([
    'tenant_id',
    'user_id',
    'name',
    'token',
    'last_used_at',
])]
#[Hidden(['token'])]
class ApiToken extends Model
{
    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
        ];
    }
}
