<?php

use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $this->get(route('register'))->assertOk();
});

test('new companies can start a trial workspace', function () {
    $response = $this->post(route('register.store'), [
        'company_name' => 'Softrly Ltd',
        'name' => 'Hasan Shahin',
        'email' => 'hasan@softrly.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
    expect(Tenant::query()->where('slug', 'softrly-ltd')->exists())->toBeTrue();

    $subscription = Subscription::query()->with('plan')->first();
    expect($subscription?->status)->toBe(SubscriptionStatus::Trial)
        ->and($subscription?->plan?->slug)->toBe('starter');

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('dashboard'));
});

test('inertia registration redirects instead of returning json', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Requested-With' => 'XMLHttpRequest',
        'Accept' => 'application/json',
    ])->post(route('register.store'), [
        'company_name' => 'Acme Attendance',
        'name' => 'Owner User',
        'email' => 'owner@acme.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
    $response->assertStatus(302);
});

test('duplicate company names still create a workspace', function () {
    $this->post(route('register.store'), [
        'company_name' => 'Softrly Ltd',
        'name' => 'Hasan Shahin',
        'email' => 'hasan@softrly.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('dashboard', absolute: false));

    $this->post(route('logout'))->assertRedirect();
    $this->assertGuest();

    $response = $this->post(route('register.store'), [
        'company_name' => 'Softrly Ltd',
        'name' => 'Second Owner',
        'email' => 'second@softrly.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
    expect(Tenant::query()->where('slug', 'softrly-ltd-1')->exists())->toBeTrue();
});
