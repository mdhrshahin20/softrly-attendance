<?php

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

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

test('tenant owners can set an employee login password', function () {
    $workspace = createWorkspace(['owner_email' => 'hr-password@example.com']);
    $employee = $workspace['employee'];

    actingAsOwner($workspace)
        ->put("/employees/{$employee->id}", [
            'employee_code' => $employee->employee_code,
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'email' => $employee->email,
            'employment_type' => $employee->employment_type->value,
            'status' => $employee->status->value,
            'password' => 'brand-new-employee-pass',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Hash::check('brand-new-employee-pass', $employee->user->refresh()->password))->toBeTrue();
});

test('leaving the employee password blank keeps the current password', function () {
    $workspace = createWorkspace(['owner_email' => 'hr-password-blank@example.com']);
    $employee = $workspace['employee'];
    $original = $employee->user->password;

    actingAsOwner($workspace)
        ->put("/employees/{$employee->id}", [
            'employee_code' => $employee->employee_code,
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'email' => $employee->email,
            'employment_type' => $employee->employment_type->value,
            'status' => $employee->status->value,
            'password' => '',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($employee->user->refresh()->password)->toBe($original);
});

test('employees cannot change another employee password', function () {
    $workspace = createWorkspace(['owner_email' => 'hr-password-deny@example.com']);
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    $user = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $workspace['tenant']->users()->attach($user->id);
    $user->assignRole('employee');

    $target = $workspace['employee'];

    $this->actingAs($user)
        ->put("/employees/{$target->id}", [
            'employee_code' => $target->employee_code,
            'first_name' => $target->first_name,
            'last_name' => $target->last_name,
            'email' => $target->email,
            'employment_type' => $target->employment_type->value,
            'status' => $target->status->value,
            'password' => 'hacker-pass',
        ])
        ->assertForbidden();
});

test('employee lists and profiles include the linked user photo', function () {
    Storage::fake('public');

    $workspace = createWorkspace(['owner_email' => 'hr-avatar@example.com']);
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    $path = UploadedFile::fake()->image('face.jpg', 80, 80)->store('avatars', 'public');
    $workspace['user']->update(['avatar_path' => $path]);
    $avatar = $workspace['user']->fresh()->avatar;

    actingAsOwner($workspace)
        ->get('/employees')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('employees/index')
            ->where(
                'employees.data',
                fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['id'] === $workspace['employee']->id
                        && $row['avatar'] === $avatar,
                ),
            ));

    actingAsOwner($workspace)
        ->get("/employees/{$workspace['employee']->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('employee.avatar', $avatar)
            ->where('employee.full_name', $workspace['employee']->full_name));

    actingAsOwner($workspace)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('employee.avatar', $avatar)
            ->where('auth.user.avatar', $avatar));
});
