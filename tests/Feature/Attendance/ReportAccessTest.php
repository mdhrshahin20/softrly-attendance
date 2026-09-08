<?php

use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('employees cannot open team attendance or advanced reports', function () {
    $workspace = createWorkspace(['owner_email' => 'reports-deny@example.com']);
    grantPlan($workspace, 'professional');
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    $reportUser = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $workspace['tenant']->users()->attach($reportUser->id);
    $reportUser->assignRole('employee');

    Employee::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'user_id' => $reportUser->id,
        'employee_code' => 'EMP330',
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
        ->get('/reports/attendance')
        ->assertForbidden();

    $this->actingAs($reportUser)
        ->get('/reports/advanced')
        ->assertForbidden();

    $this->actingAs($reportUser)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('can.viewReports', false)
            ->where('can.advancedReports', false));
});

test('tenant admins can open advanced reports on professional', function () {
    $workspace = createWorkspace(['owner_email' => 'reports-allow@example.com']);
    grantPlan($workspace, 'professional');

    actingAsOwner($workspace)
        ->get('/reports/advanced')
        ->assertOk();
});
