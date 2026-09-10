<?php

use App\Domain\Attendance\Models\Attendance;
use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

/** Monday, inside the default Sun–Thu working week. */
function workingMorning(string $time = '09:00', string $timezone = 'Asia/Dhaka'): Carbon
{
    return Carbon::parse('2026-09-07 '.$time, $timezone);
}

test('attendance times are recorded and emitted in the workspace timezone', function () {
    $this->travelTo(workingMorning());

    $workspace = createWorkspace(['owner_email' => 'tz-record@example.com']);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in')
        ->assertSessionHasNoErrors();

    $attendance = Attendance::query()->first();

    // The stored wall-clock time is the workspace local time, not UTC.
    expect($attendance?->check_in_at?->format('H:i'))->toBe('09:00');

    // And the API hands the frontend a timestamp that already carries +06:00, so
    // the browser does not have to guess the zone.
    $this->actingAs($workspace['user'])
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where(
            'today.check_in_at',
            fn ($value): bool => is_string($value) && str_contains($value, '+06:00'),
        ));
});

test('work minutes are computed in the workspace timezone', function () {
    $this->travelTo(workingMorning('09:00'));

    $workspace = createWorkspace(['owner_email' => 'tz-work@example.com']);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in')
        ->assertSessionHasNoErrors();

    $this->travelTo(workingMorning('17:30'));

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-out')
        ->assertSessionHasNoErrors();

    $attendance = Attendance::query()->first();

    // 8.5 hours. Before the timezone fix this was clamped to 0 because the
    // check-in was read back 6 hours in the future.
    expect($attendance?->work_minutes)->toBe(510)
        ->and($attendance?->late_minutes)->toBe(0);
});

test('late minutes are measured against the workspace clock', function () {
    // Shift starts 09:00 with a 10 minute grace, so 09:45 is 35 minutes late.
    $this->travelTo(workingMorning('09:45'));

    $workspace = createWorkspace(['owner_email' => 'tz-late@example.com']);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in')
        ->assertSessionHasNoErrors();

    expect(Attendance::query()->first()?->late_minutes)->toBe(35);
});

test('changing the workspace timezone changes the emitted offset', function () {
    $this->travelTo(workingMorning());

    $workspace = createWorkspace(['owner_email' => 'tz-offset@example.com']);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in')
        ->assertSessionHasNoErrors();

    // Same instant, a different workspace zone.
    $workspace['tenant']->update(['timezone' => 'UTC']);

    $this->actingAs($workspace['user'])
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where(
            'today.check_in_at',
            fn ($value): bool => is_string($value) && str_contains($value, '+00:00'),
        ));
});

test('the time zone settings page lists zones and the workspace clock', function () {
    $workspace = createWorkspace(['owner_email' => 'tz-page@example.com']);

    actingAsOwner($workspace)
        ->get('/settings/timezone')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/timezone')
            ->where('timezone', 'Asia/Dhaka')
            ->has('timezones')
            ->has('now'));
});

test('a manager can change the workspace time zone', function () {
    $workspace = createWorkspace(['owner_email' => 'tz-change@example.com']);

    actingAsOwner($workspace)
        ->put('/settings/timezone', ['timezone' => 'Europe/London'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($workspace['tenant']->refresh()->timezone)->toBe('Europe/London')
        ->and($workspace['tenant']->setting('timezone'))->toBe('Europe/London');

    $this->assertDatabaseHas('activity_logs', ['action' => 'settings.timezone']);
});

test('an invalid time zone is rejected', function () {
    $workspace = createWorkspace(['owner_email' => 'tz-invalid@example.com']);

    actingAsOwner($workspace)
        ->put('/settings/timezone', ['timezone' => 'Mars/Olympus_Mons'])
        ->assertSessionHasErrors('timezone');

    expect($workspace['tenant']->refresh()->timezone)->toBe('Asia/Dhaka');
});

test('employees without settings permission cannot change the time zone', function () {
    $workspace = createWorkspace(['owner_email' => 'tz-deny@example.com']);
    $tenant = $workspace['tenant'];
    $tenant->makeCurrent();
    setPermissionsTeamId($tenant->id);

    $staff = User::factory()->create([
        'current_tenant_id' => $tenant->id,
        'email_verified_at' => now(),
    ]);
    $tenant->users()->attach($staff->id);
    $staff->assignRole('employee');

    Employee::query()->create([
        'tenant_id' => $tenant->id,
        'user_id' => $staff->id,
        'employee_code' => 'EMP700',
        'first_name' => 'Nadia',
        'last_name' => 'Islam',
        'email' => $staff->email,
        'office_id' => $workspace['employee']->office_id,
        'shift_id' => $workspace['employee']->shift_id,
        'joining_date' => now()->toDateString(),
        'employment_type' => EmploymentType::Permanent,
        'status' => EmployeeStatus::Active,
    ]);

    $this->actingAs($staff)->get('/settings/timezone')->assertForbidden();
    $this->actingAs($staff)
        ->put('/settings/timezone', ['timezone' => 'UTC'])
        ->assertForbidden();

    expect($tenant->refresh()->timezone)->toBe('Asia/Dhaka');
});

test('the recompute command repairs minutes damaged by the old timezone bug', function () {
    $this->travelTo(workingMorning('09:00'));

    $workspace = createWorkspace(['owner_email' => 'tz-repair@example.com']);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in')
        ->assertSessionHasNoErrors();

    $this->travelTo(workingMorning('17:30'));

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-out')
        ->assertSessionHasNoErrors();

    // Simulate the old, broken values.
    Attendance::query()->first()?->forceFill([
        'work_minutes' => 0,
        'overtime_minutes' => 0,
        'early_leave_minutes' => 0,
    ])->save();

    $this->artisan('attendance:recompute --dry-run')->assertSuccessful();

    // Dry run must not write.
    expect(Attendance::query()->first()?->work_minutes)->toBe(0);

    $this->artisan('attendance:recompute')->assertSuccessful();

    $attendance = Attendance::query()->first();

    expect($attendance?->work_minutes)->toBe(510)
        // Shift ends 18:00, checked out 17:30 → 30 minutes early.
        ->and($attendance?->early_leave_minutes)->toBe(30);
});

test('every tenant is processed in its own timezone', function () {
    $dhaka = createWorkspace([
        'slug' => 'tz-dhaka',
        'owner_email' => 'tz-dhaka@example.com',
    ]);

    $utc = createWorkspace([
        'slug' => 'tz-utc',
        'owner_email' => 'tz-utc@example.com',
    ]);

    $utc['tenant']->update(['timezone' => 'UTC']);

    TenantSetting::query()->updateOrCreate(
        ['tenant_id' => $utc['tenant']->id, 'key' => 'timezone'],
        ['value' => 'UTC', 'type' => 'string'],
    );

    expect(Tenant::query()->find($dhaka['tenant']->id)?->timezone)->toBe('Asia/Dhaka')
        ->and(Tenant::query()->find($utc['tenant']->id)?->timezone)->toBe('UTC');
});
