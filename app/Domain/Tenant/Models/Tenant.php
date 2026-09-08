<?php

namespace App\Domain\Tenant\Models;

use App\Domain\Attendance\Enums\AttendanceMode;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Employee\Models\Employee;
use App\Domain\Office\Models\Office;
use App\Domain\Shared\Enums\TenantStatus;
use App\Models\User;
use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Spatie\Multitenancy\Models\Tenant as BaseTenant;

/**
 * @property int $id
 * @property string $uuid
 * @property string $name
 * @property string $slug
 * @property string $email
 * @property string|null $phone
 * @property string|null $logo
 * @property string $country
 * @property string $timezone
 * @property string $currency
 * @property TenantStatus $status
 * @property Carbon|null $trial_ends_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, TenantDomain> $domains
 * @property-read Collection<int, TenantSetting> $settings
 * @property-read Collection<int, User> $users
 */
#[Fillable([
    'uuid',
    'name',
    'slug',
    'email',
    'phone',
    'logo',
    'country',
    'timezone',
    'currency',
    'status',
    'trial_ends_at',
])]
class Tenant extends BaseTenant
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    protected static function newFactory(): TenantFactory
    {
        return TenantFactory::new();
    }

    protected static function booted(): void
    {
        static::creating(function (Tenant $tenant): void {
            $tenant->uuid ??= (string) Str::uuid();
        });
    }

    /**
     * @return HasMany<TenantDomain, $this>
     */
    public function domains(): HasMany
    {
        return $this->hasMany(TenantDomain::class);
    }

    /**
     * @return HasMany<TenantSetting, $this>
     */
    public function settings(): HasMany
    {
        return $this->hasMany(TenantSetting::class);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_users')
            ->withPivot('is_owner')
            ->withTimestamps();
    }

    public function owner(): ?User
    {
        return $this->users()->wherePivot('is_owner', true)->first()
            ?? $this->users()->first();
    }

    public function billingEmail(): ?string
    {
        return $this->owner()?->email ?: $this->email;
    }

    /**
     * @return HasMany<Employee, $this>
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * @return HasMany<Office, $this>
     */
    public function offices(): HasMany
    {
        return $this->hasMany(Office::class);
    }

    /**
     * @return HasMany<Subscription, $this>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * @return HasOne<Subscription, $this>
     */
    public function currentSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    public function attendanceMode(): AttendanceMode
    {
        return AttendanceMode::tryFrom((string) $this->setting('attendance_method', AttendanceMode::Network->value))
            ?? AttendanceMode::Network;
    }

    public function setting(string $key, mixed $default = null): mixed
    {
        $setting = $this->settings()->where('key', $key)->first();

        if ($setting === null) {
            return $default;
        }

        return $setting->typedValue();
    }

    /**
     * @return array<string, mixed>
     */
    public function settingsMap(): array
    {
        return $this->settings
            ->mapWithKeys(fn (TenantSetting $setting): array => [$setting->key => $setting->typedValue()])
            ->all();
    }

    protected function casts(): array
    {
        return [
            'status' => TenantStatus::class,
            'trial_ends_at' => 'datetime',
        ];
    }
}
