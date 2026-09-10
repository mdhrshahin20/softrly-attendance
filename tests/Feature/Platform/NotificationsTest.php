<?php

use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Notifications\PaymentSucceededNotification;
use App\Domain\Billing\Notifications\SubscriptionStatusNotification;
use App\Domain\Platform\Notifications\PaymentReceivedNotification;
use App\Domain\Platform\Notifications\TenantSignedUpNotification;
use App\Domain\Platform\Notifications\TenantSubscriptionExpiredNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function makePlatformAdmin(): User
{
    return User::factory()->create([
        'email' => 'notify-admin@platform.test',
        'is_platform_admin' => true,
        'email_verified_at' => now(),
    ]);
}

test('platform admins are notified when a workspace is provisioned', function () {
    Notification::fake();

    $admin = makePlatformAdmin();

    createWorkspace(['owner_email' => 'provision-notify@example.com']);

    Notification::assertSentTo($admin, TenantSignedUpNotification::class);
});

test('a completed payment notifies the platform admin and the tenant owner', function () {
    Notification::fake();
    Mail::fake();

    $admin = makePlatformAdmin();
    $workspace = createWorkspace(['owner_email' => 'payment-notify@example.com']);
    $business = Plan::query()->where('slug', 'business')->firstOrFail();

    actingAsOwner($workspace)
        ->post('/billing/subscribe', [
            'plan_id' => $business->id,
            'billing_cycle' => 'monthly',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    Notification::assertSentTo($admin, PaymentReceivedNotification::class);
    Notification::assertSentTo($workspace['user'], PaymentSucceededNotification::class);
});

test('an expired subscription notifies the tenant owner and the platform admin', function () {
    Notification::fake();

    $admin = makePlatformAdmin();
    $workspace = createWorkspace(['owner_email' => 'expired-notify@example.com']);

    $workspace['tenant']->currentSubscription?->update([
        'status' => SubscriptionStatus::Trial,
        'trial_ends_at' => now()->subDay(),
        'current_period_end' => now()->subDay(),
    ]);

    $this->artisan('billing:expire-subscriptions')->assertSuccessful();

    Notification::assertSentTo($workspace['user'], SubscriptionStatusNotification::class);
    Notification::assertSentTo($admin, TenantSubscriptionExpiredNotification::class);
});

test('platform admins can open the notifications page', function () {
    $admin = makePlatformAdmin();

    $this->actingAs($admin)
        ->get('/notifications')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('notifications/index')
            ->has('notifications'));
});

test('the private user channel only authorizes its owner', function () {
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
        'broadcasting.connections.reverb.secret' => 'test-secret',
        'broadcasting.connections.reverb.app_id' => 'test-app',
    ]);

    // Channels are registered against the driver that was default at boot,
    // so re-load the real channel definitions for the reverb driver.
    require base_path('routes/channels.php');

    $workspace = createWorkspace(['owner_email' => 'channel@example.com']);
    $owner = $workspace['user'];

    $payload = ['channel_name' => 'private-App.Models.User.'.$owner->id, 'socket_id' => '1234.5678'];

    $this->actingAs($owner)->post('/broadcasting/auth', $payload)->assertOk();

    $payload['channel_name'] = 'private-App.Models.User.'.($owner->id + 1);

    $this->actingAs($owner)->post('/broadcasting/auth', $payload)->assertForbidden();
});
