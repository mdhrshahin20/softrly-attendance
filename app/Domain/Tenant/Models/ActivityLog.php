<?php

namespace App\Domain\Tenant\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'tenant_id',
    'user_id',
    'action',
    'entity_type',
    'entity_id',
    'old_values',
    'new_values',
    'ip_address',
    'user_agent',
])]
class ActivityLog extends Model
{
    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }
}
