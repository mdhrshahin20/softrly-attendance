<?php

namespace App\Domain\Billing\Models;

use App\Domain\Billing\Enums\PlanFeature;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property int|null $employee_limit
 * @property int|null $office_limit
 * @property int $monthly_price
 * @property int $yearly_price
 * @property string $currency
 * @property int $trial_days
 * @property bool $is_public
 * @property bool $is_active
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, PlanFeatureModel> $features
 */
#[Fillable([
    'name',
    'slug',
    'description',
    'employee_limit',
    'office_limit',
    'monthly_price',
    'yearly_price',
    'currency',
    'trial_days',
    'is_public',
    'is_active',
    'sort_order',
])]
class Plan extends Model
{
    /**
     * @return HasMany<PlanFeatureModel, $this>
     */
    public function features(): HasMany
    {
        return $this->hasMany(PlanFeatureModel::class);
    }

    /**
     * @return HasMany<Subscription, $this>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function hasFeature(PlanFeature|string $feature): bool
    {
        $key = $feature instanceof PlanFeature ? $feature->value : $feature;

        if ($this->relationLoaded('features')) {
            return $this->features->contains(fn (PlanFeatureModel $row): bool => $row->key === $key);
        }

        return $this->features()->where('key', $key)->exists();
    }

    /**
     * @return list<string>
     */
    public function featureKeys(): array
    {
        return $this->features->pluck('key')->all();
    }

    public function priceFor(string $cycle): int
    {
        return $cycle === 'yearly' ? $this->yearly_price : $this->monthly_price;
    }

    public function employeeLimitLabel(): string
    {
        return $this->employee_limit === null ? 'Unlimited employees' : $this->employee_limit.' employees';
    }

    public function officeLimitLabel(): string
    {
        return $this->office_limit === null ? 'Unlimited offices' : $this->office_limit.' '.($this->office_limit === 1 ? 'office' : 'offices');
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'employee_limit' => $this->employee_limit,
            'office_limit' => $this->office_limit,
            'employee_limit_label' => $this->employeeLimitLabel(),
            'office_limit_label' => $this->officeLimitLabel(),
            'monthly_price' => $this->monthly_price,
            'yearly_price' => $this->yearly_price,
            'currency' => $this->currency,
            'trial_days' => $this->trial_days,
            'features' => $this->featureKeys(),
            'feature_labels' => collect($this->featureKeys())
                ->map(fn (string $key): string => PlanFeature::tryFrom($key)?->label() ?? $key)
                ->values()
                ->all(),
        ];
    }

    protected function casts(): array
    {
        return [
            'employee_limit' => 'integer',
            'office_limit' => 'integer',
            'monthly_price' => 'integer',
            'yearly_price' => 'integer',
            'trial_days' => 'integer',
            'is_public' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
