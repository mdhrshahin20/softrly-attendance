<?php

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Domain\Shared\Enums\TenantStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('signup starts a starter trial subscription', function () {
    $this->post(route('register.store'), [
        'company_name' => 'North Billing',
        'name' => 'Owner User',
        'email' => 'owner@billing.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('verification.notice'));

    $subscription = Subscription::query()->with('plan')->first();

    expect($subscription?->status)->toBe(SubscriptionStatus::Trial)
        ->and($subscription?->plan?->slug)->toBe('starter')
        ->and($subscription?->allowsAccess())->toBeTrue();
});

test('starter plan blocks extra offices and the eleventh employee', function () {
    $workspace = createWorkspace(['owner_email' => 'limit@example.com']);
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    actingAsOwner($workspace)
        ->from('/offices')
        ->post('/offices', [
            'name' => 'Uttara',
            'code' => 'UT001',
            'country' => 'BD',
            'timezone' => 'Asia/Dhaka',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('office');

    for ($i = 2; $i <= 10; $i++) {
        Employee::query()->create([
            'tenant_id' => $workspace['tenant']->id,
            'employee_code' => 'EMP'.str_pad((string) $i, 3, '0', STR_PAD_LEFT),
            'first_name' => 'Person',
            'last_name' => (string) $i,
            'email' => "person{$i}@example.com",
            'office_id' => $workspace['employee']->office_id,
            'joining_date' => now()->toDateString(),
            'employment_type' => EmploymentType::Permanent,
            'status' => EmployeeStatus::Active,
        ]);
    }

    actingAsOwner($workspace)
        ->from('/employees/create')
        ->post('/employees', [
            'employee_code' => 'EMP011',
            'first_name' => 'Overflow',
            'last_name' => 'Hire',
            'email' => 'overflow@example.com',
            'office_id' => $workspace['employee']->office_id,
            'employment_type' => EmploymentType::Permanent->value,
            'status' => EmployeeStatus::Active->value,
        ])
        ->assertSessionHasErrors('employee');
});

test('csv export requires the exports feature', function () {
    $workspace = createWorkspace(['owner_email' => 'export@example.com']);

    actingAsOwner($workspace)
        ->from('/reports/attendance')
        ->get('/reports/attendance?export=csv')
        ->assertSessionHasErrors('plan');
});

test('paying for business activates the subscription and unlocks exports', function () {
    $workspace = createWorkspace(['owner_email' => 'paid@example.com']);
    $business = Plan::query()->where('slug', 'business')->firstOrFail();

    actingAsOwner($workspace)
        ->post('/billing/subscribe', [
            'plan_id' => $business->id,
            'billing_cycle' => 'monthly',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $workspace['tenant']->refresh();
    $subscription = app(SubscriptionService::class)->current($workspace['tenant']);

    expect($workspace['tenant']->status)->toBe(TenantStatus::Active)
        ->and($subscription?->status)->toBe(SubscriptionStatus::Active)
        ->and($subscription?->plan?->slug)->toBe('business')
        ->and(app(SubscriptionService::class)->hasFeature(PlanFeature::Exports, $workspace['tenant']))->toBeTrue();

    actingAsOwner($workspace)
        ->get('/reports/attendance?export=csv')
        ->assertOk();
});

test('expired subscriptions block check-in but still allow billing', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(9, 5));

    $workspace = createWorkspace(['owner_email' => 'expired@example.com']);
    $subscription = app(SubscriptionService::class)->current($workspace['tenant']);
    $subscription?->update([
        'trial_ends_at' => now()->subDay(),
        'current_period_end' => now()->subDay(),
    ]);

    $this->artisan('billing:expire-subscriptions')->assertSuccessful();

    $workspace['tenant']->refresh();
    expect($workspace['tenant']->status)->toBe(TenantStatus::Expired);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in')
        ->assertForbidden();

    actingAsOwner($workspace)
        ->get('/billing')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('billing/index'));
});

test('platform admin can view billing dashboard and assign a plan', function () {
    $workspace = createWorkspace(['owner_email' => 'assigned@example.com']);
    $admin = User::factory()->create([
        'email' => 'admin@platform.test',
        'is_platform_admin' => true,
        'email_verified_at' => now(),
    ]);
    $business = Plan::query()->where('slug', 'business')->firstOrFail();

    $this->actingAs($admin)
        ->get('/platform')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('platform/dashboard'));

    $this->actingAs($admin)
        ->patch("/platform/tenants/{$workspace['tenant']->id}/plan", [
            'plan_id' => $business->id,
            'billing_cycle' => 'yearly',
        ])
        ->assertRedirect();

    $workspace['tenant']->makeCurrent();
    $subscription = app(SubscriptionService::class)->current($workspace['tenant']);

    expect($subscription?->plan?->slug)->toBe('business')
        ->and($subscription?->status)->toBe(SubscriptionStatus::Active);
});

test('guests can view public pricing', function () {
    createWorkspace(['owner_email' => 'pricing@example.com']);

    $this->get('/pricing')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('pricing')
            ->has('plans', 4));
});
