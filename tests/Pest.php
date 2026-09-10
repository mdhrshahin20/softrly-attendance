<?php

use App\Domain\Billing\Enums\BillingCycle;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Services\PlanCatalog;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\TenantProvisioner;
use App\Models\User;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->in('Feature');

/**
 * @return array{tenant: Tenant, user: User, employee: Employee}
 */
function createWorkspace(array $overrides = []): array
{
    $result = app(TenantProvisioner::class)->provision([
        'company_name' => $overrides['company_name'] ?? 'Softrly Ltd',
        'slug' => $overrides['slug'] ?? 'softrly-'.fake()->unique()->numerify('###'),
        'owner_name' => $overrides['owner_name'] ?? 'Hasan Shahin',
        'owner_email' => $overrides['owner_email'] ?? fake()->unique()->safeEmail(),
        'password' => $overrides['password'] ?? 'password',
    ]);

    $result['user']->forceFill(['email_verified_at' => now()])->save();

    return $result;
}

function actingAsOwner(array $workspace): mixed
{
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    return test()->actingAs($workspace['user']);
}

function grantPlan(array $workspace, string $slug = 'professional'): void
{
    $workspace['tenant']->makeCurrent();
    app(PlanCatalog::class)->seed();
    $plan = Plan::query()->where('slug', $slug)->firstOrFail();
    app(SubscriptionService::class)->assignPlan($workspace['tenant'], $plan, BillingCycle::Monthly, $workspace['user']);
}
