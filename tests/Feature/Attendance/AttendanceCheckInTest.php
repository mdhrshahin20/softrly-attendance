<?php

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Office\Models\OfficeNetwork;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('check-in is allowed from an authorized office ip', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(9, 5));

    $workspace = createWorkspace();

    $this->actingAs($workspace['user'])
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in')
        ->assertRedirect();

    $attendance = Attendance::query()->first();

    expect($attendance)->not->toBeNull()
        ->and($attendance?->check_in_ip)->toBe('127.0.0.1')
        ->and(in_array($attendance?->status, [AttendanceStatus::Present, AttendanceStatus::Late], true))->toBeTrue();
});

test('check-in is blocked from an unauthorized network', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(9, 5));
    $workspace = createWorkspace();

    $this->actingAs($workspace['user'])
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
        ->from('/dashboard')
        ->post('/attendance/check-in')
        ->assertRedirect('/dashboard')
        ->assertSessionHasErrors('attendance');

    expect(Attendance::query()->count())->toBe(0);
});

test('tenants cannot see another tenant employee directory', function () {
    $alpha = createWorkspace(['slug' => 'alpha-co', 'owner_email' => 'owner-a@example.com']);
    $beta = createWorkspace(['slug' => 'beta-co', 'owner_email' => 'owner-b@example.com']);

    $this->actingAs($alpha['user']);
    setPermissionsTeamId($alpha['tenant']->id);
    $alpha['user']->unsetRelation('roles')->unsetRelation('permissions');

    expect($alpha['user']->can('employee.view'))->toBeTrue();

    $this->get('/employees')
        ->assertOk()
        ->assertSee($alpha['employee']->email)
        ->assertDontSee($beta['employee']->email);
});

test('cidr office ranges allow matching client ips', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(9, 5));
    $workspace = createWorkspace();

    OfficeNetwork::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'office_id' => $workspace['employee']->office_id,
        'name' => 'Branch CIDR',
        'ip_range' => '203.0.113.0/24',
        'network_type' => 'cidr',
        'status' => 'active',
    ]);

    $this->actingAs($workspace['user'])
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.44'])
        ->post('/attendance/check-in')
        ->assertRedirect();

    expect(Attendance::query()->count())->toBe(1);
});
