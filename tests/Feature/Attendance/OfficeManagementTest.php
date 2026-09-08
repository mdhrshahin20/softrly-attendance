<?php

use App\Domain\Office\Models\Office;
use App\Domain\Tenant\Models\TenantSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('the offices page includes the current attendance mode flags', function () {
    $workspace = createWorkspace(['owner_email' => 'offices-mode@example.com']);

    actingAsOwner($workspace)
        ->get('/offices')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('offices/index')
            ->where('attendancePolicy.mode', 'network')
            ->where('attendancePolicy.requires_network', true)
            ->where('attendancePolicy.requires_location', false));
});

test('tenant admins cannot delete an office that still has employees', function () {
    $workspace = createWorkspace(['owner_email' => 'offices-busy@example.com']);
    $office = $workspace['employee']->office;

    actingAsOwner($workspace)
        ->delete("/offices/{$office->id}")
        ->assertRedirect();

    expect(Office::query()->find($office->id))->not->toBeNull();
});

test('tenant admins can delete an unused office', function () {
    $workspace = createWorkspace(['owner_email' => 'offices-free@example.com']);
    $workspace['tenant']->makeCurrent();

    $office = Office::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'name' => 'Uttara Branch',
        'code' => 'UTT001',
        'city' => 'Dhaka',
        'country' => 'BD',
        'timezone' => 'Asia/Dhaka',
        'status' => 'active',
    ]);

    actingAsOwner($workspace)
        ->delete("/offices/{$office->id}")
        ->assertRedirect();

    expect(Office::query()->find($office->id))->toBeNull();
});

test('the offices page reports location flags when location mode is on', function () {
    $workspace = createWorkspace(['owner_email' => 'offices-location@example.com']);
    $workspace['tenant']->makeCurrent();

    TenantSetting::query()
        ->where('tenant_id', $workspace['tenant']->id)
        ->where('key', 'attendance_method')
        ->update(['value' => 'location']);

    actingAsOwner($workspace)
        ->get('/offices')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('attendancePolicy.mode', 'location')
            ->where('attendancePolicy.requires_network', false)
            ->where('attendancePolicy.requires_location', true));
});

test('detect ip returns the public ip the server sees', function () {
    $workspace = createWorkspace(['owner_email' => 'offices-ip@example.com']);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.50'])
        ->getJson('/offices/detect-ip')
        ->assertOk()
        ->assertJson([
            'ip' => '203.0.113.50',
            'is_public' => true,
        ]);
});
