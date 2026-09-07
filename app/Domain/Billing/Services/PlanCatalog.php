<?php

namespace App\Domain\Billing\Services;

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Models\PlanFeatureModel;
use Illuminate\Database\Eloquent\Collection;

class PlanCatalog
{
    /**
     * @return list<array<string, mixed>>
     */
    public function catalog(): array
    {
        return [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Attendance, leave, and holidays for small teams.',
                'employee_limit' => 10,
                'office_limit' => 1,
                'monthly_price' => 1500,
                'yearly_price' => 15000,
                'trial_days' => 14,
                'is_public' => true,
                'sort_order' => 1,
                'features' => [
                    PlanFeature::Attendance,
                    PlanFeature::LeaveManagement,
                    PlanFeature::Holidays,
                    PlanFeature::BasicReports,
                ],
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'description' => 'Multi-office teams with exports and stronger reporting.',
                'employee_limit' => 50,
                'office_limit' => 5,
                'monthly_price' => 4500,
                'yearly_price' => 45000,
                'trial_days' => 14,
                'is_public' => true,
                'sort_order' => 2,
                'features' => [
                    PlanFeature::Attendance,
                    PlanFeature::LeaveManagement,
                    PlanFeature::Holidays,
                    PlanFeature::BasicReports,
                    PlanFeature::Exports,
                    PlanFeature::MultipleOffices,
                ],
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'Advanced reports, custom roles, and room to grow.',
                'employee_limit' => 200,
                'office_limit' => null,
                'monthly_price' => 9000,
                'yearly_price' => 90000,
                'trial_days' => 14,
                'is_public' => true,
                'sort_order' => 3,
                'features' => [
                    PlanFeature::Attendance,
                    PlanFeature::LeaveManagement,
                    PlanFeature::Holidays,
                    PlanFeature::BasicReports,
                    PlanFeature::Exports,
                    PlanFeature::AdvancedReports,
                    PlanFeature::MultipleOffices,
                    PlanFeature::CustomRoles,
                    PlanFeature::AuditLog,
                ],
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Custom limits, API, and dedicated support.',
                'employee_limit' => null,
                'office_limit' => null,
                'monthly_price' => 0,
                'yearly_price' => 0,
                'trial_days' => 14,
                'is_public' => true,
                'sort_order' => 4,
                'features' => PlanFeature::cases(),
            ],
        ];
    }

    public function seed(): void
    {
        foreach ($this->catalog() as $item) {
            /** @var list<PlanFeature> $features */
            $features = $item['features'];
            unset($item['features']);

            $plan = Plan::query()->updateOrCreate(
                ['slug' => $item['slug']],
                [...$item, 'currency' => 'BDT', 'is_active' => true],
            );

            $keys = collect($features)->map(fn (PlanFeature $feature): string => $feature->value)->all();
            $plan->features()->whereNotIn('key', $keys)->delete();

            foreach ($keys as $key) {
                PlanFeatureModel::query()->firstOrCreate([
                    'plan_id' => $plan->id,
                    'key' => $key,
                ]);
            }
        }
    }

    public function starter(): Plan
    {
        $this->seed();

        return Plan::query()->where('slug', 'starter')->firstOrFail();
    }

    /**
     * @return Collection<int, Plan>
     */
    public function publicPlans()
    {
        $this->seed();

        return Plan::query()
            ->with('features')
            ->where('is_public', true)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }
}
