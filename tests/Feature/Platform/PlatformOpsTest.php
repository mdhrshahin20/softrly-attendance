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
        ->put('/platform/gateways/payments', [
            'default_gateway' => 'sslcommerz',
            'mode' => 'sandbox',
            'sslcommerz_enabled' => '1',
            'sslcommerz_store_id' => 'softrlytest',
        ])
        ->assertRedirect();

    $manager = app(PaymentGatewayManager::class);

    expect($manager->defaultDriver())->toBe('sslcommerz')
        ->and($manager->driver('sslcommerz')->label())->toBe('SSLCommerz')
        ->and($manager->driver('bkash')->label())->toBe('bKash')
        ->and($manager->driver('manual')->isConfigured())->toBeTrue();
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
