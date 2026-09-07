<?php

namespace App\Domain\Leave\Models;

use App\Domain\Leave\Enums\LeaveApprovalStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id',
    'leave_request_id',
    'approver_id',
    'level',
    'status',
    'comment',
    'action_at',
])]
class LeaveApproval extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<LeaveRequest, $this>
     */
    public function leaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'status' => LeaveApprovalStatus::class,
            'action_at' => 'datetime',
        ];
    }
}
