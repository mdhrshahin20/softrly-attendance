<?php

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('tenant admins can view an employee monthly attendance report', function () {
    $this->travelTo(now()->setDate(2026, 9, 8)->setTime(11, 0));

    $workspace = createWorkspace(['owner_email' => 'hr-profile@example.com']);
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    $reportUser = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $workspace['tenant']->users()->attach($reportUser->id);
    $reportUser->assignRole('employee');

    $employee = Employee::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'user_id' => $reportUser->id,
        'employee_code' => 'EMP220',
        'first_name' => 'Karim',
        'last_name' => 'Hassan',
        'email' => $reportUser->email,
        'office_id' => $workspace['employee']->office_id,
        'shift_id' => $workspace['employee']->shift_id,
        'joining_date' => now()->toDateString(),
        'employment_type' => EmploymentType::Permanent,
        'status' => EmployeeStatus::Active,
    ]);

    Attendance::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'employee_id' => $employee->id,
        'office_id' => $employee->office_id,
        'attendance_date' => '2026-09-07',
        'status' => AttendanceStatus::Late,
        'check_in_at' => now()->setTime(10, 20),
        'late_minutes' => 20,
    ]);

    Attendance::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'employee_id' => $employee->id,
        'office_id' => $employee->office_id,
        'attendance_date' => '2026-09-08',
        'status' => AttendanceStatus::Present,
        'check_in_at' => now()->setTime(9, 0),
    ]);

    actingAsOwner($workspace)
        ->get("/employees/{$employee->id}?month=9&year=2026")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('employees/show')
            ->where('employee.full_name', 'Karim Hassan')
            ->where('summary.late', 1)
            ->where('summary.on_time', 1)
            ->where('month_label', 'September 2026')
            ->has('days')
            ->has('report')
            ->where('report', fn (string $report): bool => str_contains($report, 'Karim')
                && str_contains($report, 'late 1 day')
                && str_contains($report, 'on time 1 day')));
});

test('employees cannot view another employee profile', function () {
    $workspace = createWorkspace(['owner_email' => 'hr-profile-deny@example.com']);
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    $reportUser = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $workspace['tenant']->users()->attach($reportUser->id);
    $reportUser->assignRole('employee');

    $employee = Employee::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'user_id' => $reportUser->id,
        'employee_code' => 'EMP221',
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
        ->get("/employees/{$workspace['employee']->id}")
        ->assertForbidden();

    $this->actingAs($reportUser)
        ->get("/employees/{$employee->id}")
        ->assertOk();
});
