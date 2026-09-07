<?php

namespace App\Domain\Employee\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\DepartmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $name
 * @property string $code
 * @property int|null $manager_id
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['tenant_id', 'name', 'code', 'manager_id', 'status'])]
class Department extends Model
{
    /** @use HasFactory<DepartmentFactory> */
    use BelongsToTenant, HasFactory;

    protected static function newFactory(): DepartmentFactory
    {
        return DepartmentFactory::new();
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    /**
     * @return HasMany<Employee, $this>
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * @return HasMany<Designation, $this>
     */
    public function designations(): HasMany
    {
        return $this->hasMany(Designation::class);
    }
}
