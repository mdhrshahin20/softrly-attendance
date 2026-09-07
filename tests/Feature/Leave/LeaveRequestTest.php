<?php

use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Enums\LeaveRequestStatus;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Leave\Models\LeaveType;
use App\Domain\Leave\Services\LeaveBalanceService;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsWorkspaceUser($workspace): mixed
{
    setPermissionsTeamId($workspace['tenant']->id);

    return test()->actingAs($workspace['user']);
}

test('employees can apply leave and balances move to pending', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(10, 0));

    $workspace = createWorkspace();
    $type = LeaveType::query()->where('code', 'CL')->first();

    actingAsWorkspaceUser($workspace)
        ->post('/leave', [
            'leave_type_id' => $type->id,
            'start_date' => '2026-09-08',
            'end_date' => '2026-09-09',
            'duration_type' => 'full_day',
            'reason' => 'Family event',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $request = LeaveRequest::query()->first();
    $balance = $workspace['employee']->leaveBalances()->where('leave_type_id', $type->id)->first();

    expect($request?->status)->toBe(LeaveRequestStatus::Pending)
        ->and($request?->total_days)->toBe(2.0)
        ->and($balance?->pending)->toBe(2.0)
        ->and($balance?->remaining)->toBe(8.0);
});

test('hr can approve a teammate leave request', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(10, 0));

    $workspace = createWorkspace();
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    $reportUser = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $workspace['tenant']->users()->attach($reportUser->id);
    $reportUser->assignRole('employee');

    $report = Employee::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'user_id' => $reportUser->id,
        'employee_code' => 'EMP010',
        'first_name' => 'Nadia',
        'last_name' => 'Islam',
        'email' => $reportUser->email,
        'office_id' => $workspace['employee']->office_id,
        'shift_id' => $workspace['employee']->shift_id,
        'manager_id' => $workspace['employee']->id,
        'joining_date' => now()->toDateString(),
        'employment_type' => EmploymentType::Permanent,
        'status' => EmployeeStatus::Active,
    ]);

    app(LeaveBalanceService::class)->ensureForEmployee($report);

    $type = LeaveType::query()->where('code', 'CL')->first();

    $this->actingAs($reportUser)
        ->post('/leave', [
            'leave_type_id' => $type->id,
            'start_date' => '2026-09-08',
            'end_date' => '2026-09-08',
            'duration_type' => 'full_day',
            'reason' => 'Personal',
        ])
        ->assertRedirect();

    $leave = LeaveRequest::query()->first();

    actingAsWorkspaceUser($workspace)
        ->post("/leave/{$leave->id}/approve", ['comment' => 'OK'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($leave->fresh()->status)->toBe(LeaveRequestStatus::Approved);

    $this->actingAs($reportUser)
        ->get('/attendance/calendar?month=9&year=2026')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('attendance/calendar')
            ->where('days', fn ($days) => collect($days)->contains(
                fn ($day) => $day['date'] === '2026-09-08' && $day['status'] === 'leave'
            )));
});

test('one tenant cannot see another tenant leave types', function () {
    $alpha = createWorkspace(['slug' => 'alpha-leave', 'owner_email' => 'alpha-leave@example.com']);
    $beta = createWorkspace(['slug' => 'beta-leave', 'owner_email' => 'beta-leave@example.com']);

    actingAsWorkspaceUser($alpha)
        ->get('/leave/types')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('types', fn ($types) => collect($types)->every(
            fn ($type) => $type['id'] !== LeaveType::withoutGlobalScopes()->where('tenant_id', $beta['tenant']->id)->value('id')
        )));
});

test('check-in is blocked while on approved leave', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(10, 0));

    $workspace = createWorkspace();
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    $reportUser = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $workspace['tenant']->users()->attach($reportUser->id);
    $reportUser->assignRole('employee');

    $report = Employee::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'user_id' => $reportUser->id,
        'employee_code' => 'EMP011',
        'first_name' => 'Karim',
        'last_name' => 'Uddin',
        'email' => $reportUser->email,
        'office_id' => $workspace['employee']->office_id,
        'shift_id' => $workspace['employee']->shift_id,
        'manager_id' => $workspace['employee']->id,
        'joining_date' => now()->toDateString(),
        'employment_type' => EmploymentType::Permanent,
        'status' => EmployeeStatus::Active,
    ]);

    app(LeaveBalanceService::class)->ensureForEmployee($report);
    $type = LeaveType::query()->where('code', 'CL')->first();

    $this->actingAs($reportUser)->post('/leave', [
        'leave_type_id' => $type->id,
        'start_date' => '2026-09-08',
        'end_date' => '2026-09-08',
        'duration_type' => 'full_day',
        'reason' => 'Leave day',
    ]);

    $leave = LeaveRequest::query()->first();
    actingAsWorkspaceUser($workspace)->post("/leave/{$leave->id}/approve");

    $this->travelTo(now()->setDate(2026, 9, 8)->setTime(9, 5));

    $this->actingAs($reportUser)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->from('/dashboard')
        ->post('/attendance/check-in')
        ->assertRedirect('/dashboard')
        ->assertSessionHasErrors('attendance');
});

test('manager is notified when a report applies for leave', function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(10, 0));

    $workspace = createWorkspace();
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    $reportUser = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $workspace['tenant']->users()->attach($reportUser->id);
    $reportUser->assignRole('employee');

    $report = Employee::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'user_id' => $reportUser->id,
        'employee_code' => 'EMP009',
        'first_name' => 'Rafi',
        'last_name' => 'Khan',
        'email' => $reportUser->email,
        'office_id' => $workspace['employee']->office_id,
        'shift_id' => $workspace['employee']->shift_id,
        'manager_id' => $workspace['employee']->id,
        'joining_date' => now()->toDateString(),
        'employment_type' => EmploymentType::Permanent,
        'status' => EmployeeStatus::Active,
    ]);

    app(LeaveBalanceService::class)->ensureForEmployee($report);

    $type = LeaveType::query()->where('code', 'CL')->first();

    $this->actingAs($reportUser)
        ->post('/leave', [
            'leave_type_id' => $type->id,
            'start_date' => '2026-09-08',
            'end_date' => '2026-09-08',
            'duration_type' => 'full_day',
            'reason' => 'Need a day',
        ])
        ->assertRedirect();

    expect($workspace['user']->notifications()->count())->toBe(1);
});
