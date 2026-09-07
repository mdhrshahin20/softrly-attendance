<?php

namespace App\Domain\Leave\Models;

use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Enums\LeaveDurationType;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property Carbon $start_date
 * @property Carbon $end_date
 */
#[Fillable([
    'tenant_id',
    'employee_id',
    'leave_type_id',
    'start_date',
    'end_date',
    'total_days',
    'duration_type',
    'reason',
    'attachment',
    'status',
    'current_approver_id',
    'approved_at',
    'rejected_at',
    'cancelled_at',
])]
class LeaveRequest extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * @return BelongsTo<LeaveType, $this>
     */
    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function currentApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_approver_id');
    }

    /**
     * @return HasMany<LeaveApproval, $this>
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(LeaveApproval::class);
    }

    public function isPending(): bool
    {
        return $this->status === LeaveRequestStatus::Pending;
    }

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'total_days' => 'float',
            'duration_type' => LeaveDurationType::class,
            'status' => LeaveRequestStatus::class,
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }
}
