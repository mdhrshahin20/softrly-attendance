<?php

use App\Domain\Api\Models\ApiToken;
use App\Domain\Api\Services\ApiTokenService;
use App\Domain\Attendance\Enums\AttendanceMode;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Models\UserDevice;
use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Models\LeaveType;
use App\Domain\Marketing\Models\Lead;
use App\Domain\Tenant\Models\ActivityLog;
use App\Domain\Tenant\Models\TenantDomain;
use App\Domain\Tenant\Models\TenantSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('location mode allows check-in from an unauthorized ip when inside the office radius', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(9, 5));
    $workspace = createWorkspace(['owner_email' => 'geo@example.com']);
    grantPlan($workspace, 'enterprise');

    $workspace['employee']->office?->update([
        'latitude' => 23.780887,
        'longitude' => 90.419237,
        'allowed_radius' => 200,
    ]);

    TenantSetting::query()->where('key', 'attendance_method')->update([
        'value' => AttendanceMode::Location->value,
    ]);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
        ->post('/attendance/check-in', [
            'latitude' => 23.780887,
            'longitude' => 90.419237,
        ])
        ->assertRedirect();

    expect(Attendance::query()->count())->toBe(1)
        ->and(Attendance::query()->first()?->check_in_method)->toBe('location');
});

test('location mode blocks check-in outside the office radius', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(9, 5));
    $workspace = createWorkspace(['owner_email' => 'far@example.com']);
    grantPlan($workspace, 'enterprise');

    $workspace['employee']->office?->update([
        'latitude' => 23.780887,
        'longitude' => 90.419237,
        'allowed_radius' => 200,
    ]);

    TenantSetting::query()->where('key', 'attendance_method')->update([
        'value' => AttendanceMode::Location->value,
    ]);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
        ->from('/dashboard')
        ->post('/attendance/check-in', [
            'latitude' => 23.90,
            'longitude' => 90.40,
        ])
        ->assertRedirect('/dashboard')
        ->assertSessionHasErrors('attendance');

    expect(Attendance::query()->count())->toBe(0);
});

test('trusted device mode blocks a second untrusted device', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(9, 5));
    $workspace = createWorkspace(['owner_email' => 'device@example.com']);
    $workspace['tenant']->makeCurrent();

    TenantSetting::query()->where('key', 'attendance_method')->update([
        'value' => AttendanceMode::NetworkDevice->value,
    ]);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in', ['device_id' => 'device-one'])
        ->assertRedirect();

    expect(UserDevice::query()->where('device_uuid', 'device-one')->first()?->trusted)->toBeTrue();

    $this->travelTo(now()->setDate(2026, 9, 8)->setTime(9, 5));

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->from('/dashboard')
        ->post('/attendance/check-in', ['device_id' => 'device-two'])
        ->assertRedirect('/dashboard')
        ->assertSessionHasErrors('attendance');
});

test('employee csv can be previewed and imported', function () {
    $workspace = createWorkspace(['owner_email' => 'import@example.com']);
    grantPlan($workspace, 'business');

    $csv = "employee_code,first_name,last_name,email,phone,department,designation,office,joining_date,employment_type\nEMP220,Nadia,Islam,nadia.import@example.com,,,,Head Office,2026-01-15,permanent\n";
    $file = UploadedFile::fake()->createWithContent('people.csv', $csv);

    actingAsOwner($workspace)
        ->post('/employees/import/preview', ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('employee_import_preview');

    actingAsOwner($workspace)
        ->post('/employees/import')
        ->assertRedirect('/employees');

    expect(Employee::query()->where('email', 'nadia.import@example.com')->exists())->toBeTrue();
});

test('custom roles are gated and can be created on professional', function () {
    $workspace = createWorkspace(['owner_email' => 'roles@example.com']);

    actingAsOwner($workspace)
        ->get('/settings/roles')
        ->assertForbidden();

    grantPlan($workspace, 'professional');

    actingAsOwner($workspace)
        ->get('/settings/roles')
        ->assertOk();

    actingAsOwner($workspace)
        ->post('/settings/roles', [
            'name' => 'Payroll Admin',
            'permissions' => ['employee.view', 'attendance.view'],
        ])
        ->assertRedirect();

    expect(Role::query()->where('name', 'payroll-admin')->where('tenant_id', $workspace['tenant']->id)->exists())->toBeTrue();
});

test('audit log records login and is gated by plan', function () {
    $workspace = createWorkspace(['owner_email' => 'audit@example.com']);

    actingAsOwner($workspace)
        ->get('/settings/audit-logs')
        ->assertForbidden();

    $this->post(route('logout'));

    $this->post(route('login.store'), [
        'email' => $workspace['user']->email,
        'password' => 'password',
    ])->assertRedirect();

    expect(ActivityLog::query()->where('action', 'auth.login')->exists())->toBeTrue();

    grantPlan($workspace, 'professional');

    actingAsOwner($workspace)
        ->get('/settings/audit-logs')
        ->assertOk();
});

test('enterprise tenants can create api tokens and check in through the api', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(9, 5));
    $workspace = createWorkspace(['owner_email' => 'api@example.com']);
    grantPlan($workspace, 'enterprise');

    $response = actingAsOwner($workspace)
        ->post('/settings/api-tokens', ['name' => 'Mobile']);

    $plain = $response->getSession()->get('plain_api_token');
    expect($plain)->toBeString()
        ->and(ApiToken::query()->count())->toBe(1);

    $this->postJson('/api/v1/attendance/check-in', [
        'device_id' => 'api-device',
    ], [
        'Authorization' => 'Bearer '.$plain,
    ])->assertCreated();

    expect(Attendance::query()->count())->toBe(1);
});

test('custom domains can be stored for enterprise tenants', function () {
    $workspace = createWorkspace(['owner_email' => 'domain@example.com']);
    grantPlan($workspace, 'enterprise');

    actingAsOwner($workspace)
        ->post('/settings/domains', ['hostname' => 'hr.softrly.test'])
        ->assertRedirect();

    expect(TenantDomain::query()->where('hostname', 'hr.softrly.test')->where('type', 'custom')->exists())->toBeTrue();
});

test('signup with utm query creates a converted lead', function () {
    $this->get('/pricing?utm_source=google&utm_campaign=brand')->assertOk();

    $this->post(route('register.store'), [
        'company_name' => 'Lead Co',
        'name' => 'Lead Owner',
        'email' => 'lead@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'utm_source' => 'google',
        'utm_campaign' => 'brand',
    ])->assertRedirect();

    $lead = Lead::query()->where('email', 'lead@example.com')->first();

    expect($lead)->not->toBeNull()
        ->and($lead?->status)->toBe('converted')
        ->and($lead?->utm_source)->toBe('google')
        ->and($lead?->utm_campaign)->toBe('brand');
});

test('advanced reports page is available on professional', function () {
    $workspace = createWorkspace(['owner_email' => 'adv@example.com']);

    actingAsOwner($workspace)
        ->get('/reports/advanced')
        ->assertForbidden();

    grantPlan($workspace, 'professional');

    actingAsOwner($workspace)
        ->get('/reports/advanced')
        ->assertOk();
});

test('hr can save a manual attendance adjustment', function () {
    $workspace = createWorkspace(['owner_email' => 'manual@example.com']);

    actingAsOwner($workspace)
        ->post('/attendance/manual', [
            'employee_id' => $workspace['employee']->id,
            'attendance_date' => '2026-09-07',
            'check_in_at' => '09:10',
            'check_out_at' => '18:00',
            'reason' => 'Forgot to check in',
        ])
        ->assertRedirect();

    $attendance = Attendance::query()->first();

    expect($attendance?->check_in_method)->toBe('manual')
        ->and($attendance?->notes)->toBe('Forgot to check in');
});

test('api leave apply works with a token', function () {
    $workspace = createWorkspace(['owner_email' => 'apileave@example.com']);
    grantPlan($workspace, 'enterprise');
    $workspace['tenant']->makeCurrent();

    $type = LeaveType::query()->where('code', 'CL')->first();
    $plain = app(ApiTokenService::class)
        ->create($workspace['user'], $workspace['tenant'], 'Leave API')['plain'];

    $this->postJson('/api/v1/leave', [
        'leave_type_id' => $type?->id,
        'start_date' => now()->addDays(3)->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
        'duration_type' => 'full_day',
        'reason' => 'Family event',
    ], [
        'Authorization' => 'Bearer '.$plain,
    ])->assertCreated();
});
