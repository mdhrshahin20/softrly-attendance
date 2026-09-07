<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated tenant users can visit the dashboard', function () {
    $workspace = createWorkspace(['owner_email' => 'owner@example.com']);

    $this->actingAs($workspace['user'])
        ->get(route('dashboard'))
        ->assertOk();
});

test('platform admins are redirected away from tenant routes instead of crashing', function () {
    $admin = User::factory()->create([
        'email' => 'admin@platform.test',
        'is_platform_admin' => true,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/leave')
        ->assertRedirect(route('platform.dashboard'));

    $this->actingAs($admin)
        ->get('/devices')
        ->assertRedirect(route('platform.dashboard'));

    $this->actingAs($admin)
        ->get('/employees')
        ->assertRedirect(route('platform.dashboard'));
});

test('users without a tenant are redirected instead of crashing', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/leave')
        ->assertRedirect(route('dashboard'));
});

test('tenant owners can still open tenant routes on localhost', function () {
    $workspace = createWorkspace(['owner_email' => 'owner@example.com']);

    actingAsOwner($workspace)
        ->get('/leave')
        ->assertOk();
});
