<?php

use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Models\Invoice;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Services\PaymentGatewayManager;
use App\Domain\Billing\Services\PlanCatalog;
use App\Domain\Platform\Services\PlatformSettingsService;
use App\Mail\InvoiceMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

function platformAdmin(): User
{
    return User::factory()->create([
        'email' => 'ops@platform.test',
        'is_platform_admin' => true,
        'email_verified_at' => now(),
    ]);
}

test('plan catalog seed does not overwrite admin edits', function () {
    createWorkspace(['owner_email' => 'seed@example.com']);

    $plan = Plan::query()->where('slug', 'starter')->firstOrFail();
    $plan->update(['name' => 'Starter Plus', 'monthly_price' => 999]);

    app(PlanCatalog::class)->seed();

    $plan->refresh();

    expect($plan->name)->toBe('Starter Plus')
        ->and($plan->monthly_price)->toBe(999);
});

test('platform admin can create a dynamic plan with features', function () {
    createWorkspace(['owner_email' => 'plans@example.com']);
    $admin = platformAdmin();

    $this->actingAs($admin)
        ->post('/platform/plans', [
            'name' => 'Growth',
            'description' => 'Custom growth plan',
            'monthly_price' => 7000,
            'yearly_price' => 70000,
            'trial_days' => 7,
            'features' => ['attendance', 'leave_management', 'payroll'],
            'is_public' => '1',
            'is_active' => '1',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $plan = Plan::query()->where('slug', 'growth')->with('features')->first();

    expect($plan)->not->toBeNull()
        ->and($plan?->monthly_price)->toBe(7000)
        ->and($plan?->hasFeature(PlanFeature::Payroll))->toBeTrue()
        ->and($plan?->hasFeature(PlanFeature::Attendance))->toBeTrue();
});

test('completed payment issues an invoice and emails the tenant admin', function () {
    Mail::fake();

    $workspace = createWorkspace(['owner_email' => 'invoice@example.com']);
    $business = Plan::query()->where('slug', 'business')->firstOrFail();

    actingAsOwner($workspace)
        ->post('/billing/subscribe', [
            'plan_id' => $business->id,
            'billing_cycle' => 'monthly',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $invoice = Invoice::query()->first();

    expect($invoice)->not->toBeNull()
        ->and($invoice?->billed_to_email)->toBe('invoice@example.com')
        ->and($invoice?->amount)->toBe($business->monthly_price);

    Mail::assertSent(InvoiceMail::class);

    $admin = platformAdmin();

    $this->actingAs($admin)
        ->get("/platform/invoices/{$invoice->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('platform/invoice-show'));

    $this->actingAs($admin)
        ->get("/platform/invoices/{$invoice->id}/download")
        ->assertOk()
        ->assertHeader('content-disposition');

    $this->actingAs($admin)
        ->post("/platform/invoices/{$invoice->id}/send")
        ->assertRedirect();
});

test('platform admin can save marketing pixels and payment gateways', function () {
    $admin = platformAdmin();

    $this->actingAs($admin)
        ->put('/platform/marketing', [
            'ga_measurement_id' => 'G-TEST123',
            'fb_pixel_id' => '999888777',
            'gtm_container_id' => 'GTM-TEST',
        ])
        ->assertRedirect();

    expect(app(PlatformSettingsService::class)->get('marketing.ga_measurement_id'))->toBe('G-TEST123')
        ->and(app(PlatformSettingsService::class)->get('marketing.fb_pixel_id'))->toBe('999888777');

    $this->actingAs($admin)
        ->put('/platform/gateways/payments/sslcommerz', [
            'enabled' => '1',
            'mode' => 'sandbox',
            'store_id' => 'softrlytest',
            'store_password' => 'secret',
            'is_preferred' => '1',
        ])
        ->assertRedirect();

    $this->actingAs($admin)
        ->put('/platform/gateways/payments/bkash', [
            'enabled' => '1',
            'mode' => 'live',
            'app_key' => 'key',
            'app_secret' => 'secret',
            'username' => 'user',
            'password' => 'pass',
        ])
        ->assertRedirect();

    $this->actingAs($admin)
        ->put('/platform/gateways/payments/manual', [
            'enabled' => '1',
        ])
        ->assertRedirect();

    $manager = app(PaymentGatewayManager::class);
    $settings = app(PlatformSettingsService::class);

    expect($manager->defaultDriver())->toBe('sslcommerz')
        ->and($settings->get('payments.sslcommerz.mode'))->toBe('sandbox')
        ->and($settings->get('payments.bkash.mode'))->toBe('live')
        ->and(collect($manager->available())->pluck('name')->all())->toContain('manual', 'sslcommerz', 'bkash')
        ->and($manager->driver('sslcommerz')->label())->toBe('SSLCommerz')
        ->and($manager->driver('bkash')->label())->toBe('bKash')
        ->and($manager->driver('manual')->isConfigured())->toBeTrue();

    $this->actingAs($admin)
        ->get('/platform/gateways/payments/sslcommerz/configure')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/gateway-configure')
            ->where('gateway.name', 'sslcommerz')
            ->where('config.mode', 'sandbox'));
});

test('platform admin can set a tenant owner password', function () {
    $workspace = createWorkspace(['owner_email' => 'owner-pass@example.com']);
    $admin = platformAdmin();

    $this->actingAs($admin)
        ->patch("/platform/tenants/{$workspace['tenant']->id}/password", [
            'password' => 'brand-new-owner-pass',
            'password_confirmation' => 'brand-new-owner-pass',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Hash::check('brand-new-owner-pass', $workspace['user']->refresh()->password))->toBeTrue();
});

test('platform admin can generate a tenant owner password', function () {
    $workspace = createWorkspace(['owner_email' => 'owner-gen@example.com']);
    $admin = platformAdmin();

    $this->actingAs($admin)
        ->patch("/platform/tenants/{$workspace['tenant']->id}/password")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $generated = session('tenant_owner_password');

    expect($generated)->toBeArray()
        ->and($generated['email'])->toBe('owner-gen@example.com')
        ->and(Hash::check($generated['password'], $workspace['user']->refresh()->password))->toBeTrue();

    $this->actingAs($admin)
        ->get("/platform/tenants/{$workspace['tenant']->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/tenant-show')
            ->where('ownerPasswordReset.email', 'owner-gen@example.com')
            ->where('ownerPasswordReset.password', $generated['password']));
});

test('tenant owner password update requires a matching confirmation', function () {
    $workspace = createWorkspace(['owner_email' => 'owner-mismatch@example.com']);
    $admin = platformAdmin();

    $this->actingAs($admin)
        ->patch("/platform/tenants/{$workspace['tenant']->id}/password", [
            'password' => 'brand-new-owner-pass',
            'password_confirmation' => 'different-pass',
        ])
        ->assertSessionHasErrors('password');

    expect(Hash::check('brand-new-owner-pass', $workspace['user']->refresh()->password))->toBeFalse();
});

test('non platform admins cannot change a tenant owner password', function () {
    $workspace = createWorkspace(['owner_email' => 'owner-deny@example.com']);
    $intruder = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($intruder)
        ->patch("/platform/tenants/{$workspace['tenant']->id}/password", [
            'password' => 'brand-new-owner-pass',
            'password_confirmation' => 'brand-new-owner-pass',
        ])
        ->assertForbidden();
});

test('platform dashboard and reports render analytics', function () {
    createWorkspace(['owner_email' => 'analytics@example.com']);
    $admin = platformAdmin();

    $this->actingAs($admin)
        ->get('/platform')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/dashboard')
            ->has('stats')
            ->has('series'));

    $this->actingAs($admin)
        ->get('/platform/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('platform/reports'));

    $this->actingAs($admin)
        ->get('/platform/reports/export')
        ->assertOk();
});
