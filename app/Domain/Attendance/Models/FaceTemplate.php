<?php

namespace App\Domain\Attendance\Models;

use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A stored face descriptor for an employee.
 *
 * Only the numeric descriptor is used for matching. The enrolment selfie is
 * kept separately as a human reference for revocation and support.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $user_id
 * @property int|null $employee_id
 * @property list<float>|null $descriptor
 * @property int $sample_count
 * @property string|null $photo_path
 * @property Carbon|null $enrolled_at
 * @property Carbon|null $revoked_at
 * @property-read User|null $user
 * @property-read Employee|null $employee
 */
#[Fillable([
    'tenant_id',
    'user_id',
    'employee_id',
    'descriptor',
    'sample_count',
    'photo_path',
    'enrolled_at',
    'revoked_at',
])]
class FaceTemplate extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function isActive(): bool
    {
        return $this->revoked_at === null && is_array($this->descriptor) && $this->descriptor !== [];
    }

    /**
     * @return list<float>
     */
    public function vector(): array
    {
        $descriptor = $this->descriptor;

        if (! is_array($descriptor)) {
            return [];
        }

        return array_map(fn ($value): float => (float) $value, $descriptor);
    }

    protected function casts(): array
    {
        return [
            'descriptor' => 'array',
            'sample_count' => 'integer',
            'enrolled_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }
}
