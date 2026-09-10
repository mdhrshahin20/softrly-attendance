<?php

use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
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
    $response->assertRedirect(route('verification.notice'));
    expect(Tenant::query()->where('slug', 'softrly-ltd')->exists())->toBeTrue();

    $subscription = Subscription::query()->with('plan')->first();
    expect($subscription?->status)->toBe(SubscriptionStatus::Trial)
        ->and($subscription?->plan?->slug)->toBe('starter');
});

test('a freshly registered owner must verify their email before reaching the dashboard', function () {
    $this->post(route('register.store'), [
        'company_name' => 'Softrly Ltd',
        'name' => 'Hasan Shahin',
        'email' => 'hasan@softrly.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('verification.notice'));

    $owner = User::query()->where('email', 'hasan@softrly.test')->firstOrFail();

    expect($owner->email_verified_at)->toBeNull()
        ->and($owner->hasVerifiedEmail())->toBeFalse();

    $this->get(route('dashboard'))->assertRedirect(route('verification.notice'));
});

test('registration sends the owner a verification notification', function () {
    Notification::fake();

    $this->post(route('register.store'), [
        'company_name' => 'Softrly Ltd',
        'name' => 'Hasan Shahin',
        'email' => 'hasan@softrly.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('verification.notice'));

    $owner = User::query()->where('email', 'hasan@softrly.test')->firstOrFail();

    Notification::assertSentTo($owner, VerifyEmail::class);
});

test('a registered owner can verify their email through the signed link', function () {
    $this->post(route('register.store'), [
        'company_name' => 'Softrly Ltd',
        'name' => 'Hasan Shahin',
        'email' => 'hasan@softrly.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $owner = User::query()->where('email', 'hasan@softrly.test')->firstOrFail();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $owner->id, 'hash' => sha1($owner->email)],
    );

    $this->get($verificationUrl)->assertRedirect(route('dashboard', absolute: false).'?verified=1');

    expect($owner->fresh()->hasVerifiedEmail())->toBeTrue();

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
    $response->assertRedirect(route('verification.notice'));
    $response->assertStatus(302);
});

test('duplicate company names still create a workspace', function () {
    $this->post(route('register.store'), [
        'company_name' => 'Softrly Ltd',
        'name' => 'Hasan Shahin',
        'email' => 'hasan@softrly.test',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('verification.notice'));

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
    $response->assertRedirect(route('verification.notice'));
    expect(Tenant::query()->where('slug', 'softrly-ltd-1')->exists())->toBeTrue();
});
