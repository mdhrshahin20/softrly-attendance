<?php

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
