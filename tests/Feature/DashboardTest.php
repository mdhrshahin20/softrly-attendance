<?php

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
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

test('tenant admins see who is late and who is on leave', function () {
    $workspace = createWorkspace(['owner_email' => 'hr@example.com']);
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    // Attendance rows are dated in the workspace timezone, which is how the
    // dashboard looks them up. Using the app default here would disagree with
    // the request whenever the workspace has already rolled over to the next day.
    $today = now($workspace['tenant']->timezone)->toDateString();

    $lateUser = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $leaveUser = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $workspace['tenant']->users()->attach([$lateUser->id, $leaveUser->id]);
    $lateUser->assignRole('employee');
    $leaveUser->assignRole('employee');

    $lateEmployee = Employee::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'user_id' => $lateUser->id,
        'employee_code' => 'EMP110',
        'first_name' => 'Karim',
        'last_name' => 'Hassan',
        'email' => $lateUser->email,
        'office_id' => $workspace['employee']->office_id,
        'shift_id' => $workspace['employee']->shift_id,
        'joining_date' => now()->toDateString(),
        'employment_type' => EmploymentType::Permanent,
        'status' => EmployeeStatus::Active,
    ]);

    $leaveEmployee = Employee::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'user_id' => $leaveUser->id,
        'employee_code' => 'EMP111',
        'first_name' => 'Nadia',
        'last_name' => 'Islam',
        'email' => $leaveUser->email,
        'office_id' => $workspace['employee']->office_id,
        'shift_id' => $workspace['employee']->shift_id,
        'joining_date' => now()->toDateString(),
        'employment_type' => EmploymentType::Permanent,
        'status' => EmployeeStatus::Active,
    ]);

    Attendance::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'employee_id' => $lateEmployee->id,
        'office_id' => $lateEmployee->office_id,
        'attendance_date' => $today,
        'status' => AttendanceStatus::Late,
        'check_in_at' => now($workspace['tenant']->timezone)->setTime(10, 15),
        'late_minutes' => 25,
    ]);

    Attendance::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'employee_id' => $leaveEmployee->id,
        'office_id' => $leaveEmployee->office_id,
        'attendance_date' => $today,
        'status' => AttendanceStatus::Leave,
    ]);

    actingAsOwner($workspace)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('teamToday.late', 1)
            ->where('teamToday.on_leave', 1)
            ->has('lateToday', 1)
            ->where('lateToday.0.full_name', 'Karim Hassan')
            ->where('lateToday.0.late_minutes', 25)
            ->has('onLeaveToday', 1)
            ->where('onLeaveToday.0.full_name', 'Nadia Islam'));
});

test('employees without people access do not receive team exception lists', function () {
    $workspace = createWorkspace(['owner_email' => 'hr-lists@example.com']);
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    $reportUser = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $workspace['tenant']->users()->attach($reportUser->id);
    $reportUser->assignRole('employee');

    Employee::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'user_id' => $reportUser->id,
        'employee_code' => 'EMP112',
        'first_name' => 'Amina',
        'last_name' => 'Rahman',
        'email' => $reportUser->email,
        'office_id' => $workspace['employee']->office_id,
        'shift_id' => $workspace['employee']->shift_id,
        'joining_date' => now()->toDateString(),
        'employment_type' => EmploymentType::Permanent,
        'status' => EmployeeStatus::Active,
    ]);

    $this->actingAs($reportUser)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('teamToday', null)
            ->where('lateToday', [])
            ->where('onLeaveToday', []));
});
