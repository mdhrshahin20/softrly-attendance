<?php

namespace App\Domain\Holiday\Models;

use App\Domain\Employee\Models\Department;
use App\Domain\Holiday\Enums\HolidayType;
use App\Domain\Office\Models\Office;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable([
    'tenant_id',
    'name',
    'date',
    'end_date',
    'holiday_type',
    'office_id',
    'department_id',
    'status',
])]
class Holiday extends Model
{
    use BelongsToTenant;

    /**
     * @return BelongsTo<Office, $this>
     */
    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    /**
     * @return BelongsTo<Department, $this>
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function covers(Carbon|string $date): bool
    {
        $day = $date instanceof Carbon ? $date->toDateString() : $date;
        $end = $this->end_date?->toDateString() ?? $this->date->toDateString();

        return $day >= $this->date->toDateString() && $day <= $end;
    }

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'end_date' => 'date',
            'holiday_type' => HolidayType::class,
        ];
    }
}
