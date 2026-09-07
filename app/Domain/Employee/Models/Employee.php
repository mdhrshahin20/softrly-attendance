<?php

namespace App\Domain\Employee\Models;

use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Models\Shift;
use App\Domain\Leave\Models\LeaveBalance;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Office\Models\Office;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Models\User;
use Database\Factories\EmployeeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int|null $user_id
 * @property string $employee_code
 * @property string $first_name
 * @property string|null $last_name
 * @property string $email
 * @property string|null $phone
 * @property int|null $department_id
 * @property int|null $designation_id
 * @property int|null $manager_id
 * @property int|null $office_id
 * @property int|null $shift_id
 * @property Carbon|null $joining_date
 * @property EmploymentType $employment_type
 * @property EmployeeStatus $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read string $full_name
 * @property-read User|null $user
 * @property-read Department|null $department
 * @property-read Designation|null $designation
 * @property-read Office|null $office
 * @property-read Shift|null $shift
 */
#[Fillable([
    'tenant_id',
    'user_id',
    'employee_code',
    'first_name',
    'last_name',
    'email',
    'phone',
    'department_id',
    'designation_id',
    'manager_id',
    'office_id',
    'shift_id',
    'joining_date',
    'employment_type',
    'status',
])]
class Employee extends Model
{
    /** @use HasFactory<EmployeeFactory> */
    use BelongsToTenant, HasFactory;

    /**
     * @var list<string>
     */
    protected $appends = ['full_name'];

    protected static function newFactory(): EmployeeFactory
    {
        return EmployeeFactory::new();
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Department, $this>
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * @return BelongsTo<Designation, $this>
     */
    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class);
    }

    /**
     * @return BelongsTo<self, $this>
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(self::class, 'manager_id');
    }

    /**
     * @return BelongsTo<Office, $this>
     */
    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    /**
     * @return BelongsTo<Shift, $this>
     */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    /**
     * @return HasMany<Attendance, $this>
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * @return HasMany<LeaveRequest, $this>
     */
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    /**
     * @return HasMany<LeaveBalance, $this>
     */
    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', EmployeeStatus::Active);
    }

    public function isActive(): bool
    {
        return $this->status === EmployeeStatus::Active;
    }

    protected function casts(): array
    {
        return [
            'joining_date' => 'date',
            'employment_type' => EmploymentType::class,
            'status' => EmployeeStatus::class,
        ];
    }
}
