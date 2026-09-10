<?php

namespace App\Domain\Attendance\Models;

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Employee\Models\Employee;
use App\Domain\Office\Models\Office;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\AttendanceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $employee_id
 * @property int|null $office_id
 * @property Carbon $attendance_date
 * @property Carbon|null $check_in_at
 * @property Carbon|null $check_out_at
 * @property string|null $check_in_ip
 * @property string|null $check_out_ip
 * @property string|null $check_in_device_id
 * @property string|null $check_out_device_id
 * @property string|null $check_in_latitude
 * @property string|null $check_in_longitude
 * @property string|null $check_out_latitude
 * @property string|null $check_out_longitude
 * @property AttendanceStatus $status
 * @property int $late_minutes
 * @property int $early_leave_minutes
 * @property int $work_minutes
 * @property int $overtime_minutes
 * @property string|null $check_in_method
 * @property string|null $check_out_method
 * @property float|null $check_in_face_score
 * @property Carbon|null $check_in_face_verified_at
 * @property string|null $check_in_selfie_path
 * @property float|null $check_out_face_score
 * @property Carbon|null $check_out_face_verified_at
 * @property string|null $check_out_selfie_path
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'tenant_id',
    'employee_id',
    'office_id',
    'attendance_date',
    'check_in_at',
    'check_out_at',
    'check_in_ip',
    'check_out_ip',
    'check_in_device_id',
    'check_out_device_id',
    'check_in_latitude',
    'check_in_longitude',
    'check_out_latitude',
    'check_out_longitude',
    'status',
    'late_minutes',
    'early_leave_minutes',
    'work_minutes',
    'overtime_minutes',
    'check_in_method',
    'check_out_method',
    'check_in_face_score',
    'check_in_face_verified_at',
    'check_in_selfie_path',
    'check_out_face_score',
    'check_out_face_verified_at',
    'check_out_selfie_path',
    'notes',
])]
class Attendance extends Model
{
    /** @use HasFactory<AttendanceFactory> */
    use BelongsToTenant, HasFactory;

    protected static function newFactory(): AttendanceFactory
    {
        return AttendanceFactory::new();
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * @return BelongsTo<Office, $this>
     */
    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function isCheckedIn(): bool
    {
        return $this->check_in_at !== null && $this->check_out_at === null;
    }

    protected function casts(): array
    {
        return [
            'attendance_date' => 'date',
            'check_in_at' => 'datetime',
            'check_out_at' => 'datetime',
            'status' => AttendanceStatus::class,
            'late_minutes' => 'integer',
            'early_leave_minutes' => 'integer',
            'work_minutes' => 'integer',
            'overtime_minutes' => 'integer',
            'check_in_face_score' => 'float',
            'check_in_face_verified_at' => 'datetime',
            'check_out_face_score' => 'float',
            'check_out_face_verified_at' => 'datetime',
        ];
    }
}
