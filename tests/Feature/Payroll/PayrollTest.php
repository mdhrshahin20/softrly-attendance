<?php

use App\Domain\Attendance\Enums\AttendanceStatus;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Employee\Models\Employee;
use App\Domain\Payroll\Enums\PayrollRunStatus;
use App\Domain\Payroll\Enums\SalaryAdvanceStatus;
use App\Domain\Payroll\Models\EmployeeSalary;
use App\Domain\Payroll\Models\PayrollRun;
use App\Domain\Payroll\Models\Payslip;
use App\Domain\Payroll\Models\SalaryAdvance;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('starter tenants cannot open payroll', function () {
    $workspace = createWorkspace(['owner_email' => 'payroll-starter@example.com']);

    actingAsOwner($workspace)
        ->get('/payroll/salaries')
        ->assertForbidden();

    actingAsOwner($workspace)
        ->get('/reports/salary')
        ->assertForbidden();
});

test('hr can assign salary and generate attendance-linked payroll', function () {
    $this->travelTo(now()->setDate(2026, 9, 8)->setTime(11, 0));

    $workspace = createWorkspace(['owner_email' => 'payroll-hr@example.com']);
    grantPlan($workspace, 'professional');
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    actingAsOwner($workspace)
        ->post('/payroll/salaries', [
            'employee_id' => $workspace['employee']->id,
            'basic_salary' => 40000,
            'house_rent' => 16000,
            'medical' => 2000,
            'other_allowance' => 2000,
            'tax_percent' => 0,
            'effective_from' => '2026-09-01',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    Attendance::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'employee_id' => $workspace['employee']->id,
        'office_id' => $workspace['employee']->office_id,
        'attendance_date' => '2026-09-08',
        'status' => AttendanceStatus::Present,
        'work_minutes' => 480,
        'overtime_minutes' => 60,
    ]);

    actingAsOwner($workspace)
        ->post('/payroll/runs', [
            'year' => 2026,
            'month' => 9,
        ])
        ->assertRedirect();

    $run = PayrollRun::query()->first();
    $payslip = Payslip::query()->first();

    expect($run?->status)->toBe(PayrollRunStatus::Processed)
        ->and($payslip?->employee_id)->toBe($workspace['employee']->id)
        ->and($payslip?->gross)->toBeGreaterThanOrEqual(60000)
        ->and($payslip?->present_days)->toBeGreaterThan(0)
        ->and($payslip?->overtime_minutes)->toBe(60)
        ->and($payslip?->overtime_pay)->toBeGreaterThan(0)
        ->and($payslip?->net)->toBeGreaterThan(0);

    actingAsOwner($workspace)
        ->get("/payroll/payslips/{$payslip->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('payroll/payslip')
            ->where('payslip.employee', $workspace['employee']->full_name)
            ->where('payslip.net', $payslip->net)
            ->where('payslip.can_pay', true));

    actingAsOwner($workspace)
        ->post("/payroll/payslips/{$payslip->id}/pay")
        ->assertRedirect();

    expect($payslip->fresh()?->status)->toBe(\App\Domain\Payroll\Enums\PayslipStatus::Paid)
        ->and($run->fresh()?->status)->toBe(PayrollRunStatus::Paid);

    actingAsOwner($workspace)
        ->get('/reports/salary?year=2026&month=9')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('reports/salary')
            ->has('rows.data', 1)
            ->where('totals.employees', 1)
            ->where('totals.paid_count', 1));
});

test('employees can view their own payslip but not generate payroll', function () {
    $this->travelTo(now()->setDate(2026, 9, 8)->setTime(11, 0));

    $workspace = createWorkspace(['owner_email' => 'payroll-emp@example.com']);
    grantPlan($workspace, 'professional');
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    $reportUser = User::factory()->create(['current_tenant_id' => $workspace['tenant']->id]);
    $workspace['tenant']->users()->attach($reportUser->id);
    $reportUser->assignRole('employee');

    $teammate = Employee::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'user_id' => $reportUser->id,
        'employee_code' => 'EMP088',
        'first_name' => 'Nadia',
        'last_name' => 'Islam',
        'email' => $reportUser->email,
        'office_id' => $workspace['employee']->office_id,
        'shift_id' => $workspace['employee']->shift_id,
        'joining_date' => now()->toDateString(),
        'employment_type' => EmploymentType::Permanent,
        'status' => EmployeeStatus::Active,
    ]);

    EmployeeSalary::query()->create([
        'employee_id' => $workspace['employee']->id,
        'basic_salary' => 30000,
        'house_rent' => 0,
        'medical' => 0,
        'other_allowance' => 0,
        'tax_percent' => 0,
        'effective_from' => '2026-09-01',
        'status' => 'active',
    ]);

    actingAsOwner($workspace)->post('/payroll/runs', ['year' => 2026, 'month' => 9]);
    $payslip = Payslip::query()->first();

    $this->actingAs($reportUser)
        ->get('/payroll/runs')
        ->assertForbidden();

    $this->actingAs($reportUser)
        ->get("/payroll/payslips/{$payslip->id}")
        ->assertForbidden();

    $this->actingAs($reportUser)
        ->get('/payroll/me')
        ->assertOk();

    actingAsOwner($workspace)
        ->get("/payroll/payslips/{$payslip->id}")
        ->assertOk();
});

test('approved salary advances are deducted on the next payroll', function () {
    $this->travelTo(now()->setDate(2026, 9, 8)->setTime(11, 0));

    $workspace = createWorkspace(['owner_email' => 'payroll-adv@example.com']);
    grantPlan($workspace, 'professional');
    $workspace['tenant']->makeCurrent();
    setPermissionsTeamId($workspace['tenant']->id);

    EmployeeSalary::query()->create([
        'employee_id' => $workspace['employee']->id,
        'basic_salary' => 50000,
        'house_rent' => 0,
        'medical' => 0,
        'other_allowance' => 0,
        'tax_percent' => 0,
        'effective_from' => '2026-09-01',
        'status' => 'active',
    ]);

    actingAsOwner($workspace)
        ->post('/payroll/advances', [
            'employee_id' => $workspace['employee']->id,
            'amount' => 5000,
            'reason' => 'Emergency',
        ])
        ->assertRedirect();

    expect(SalaryAdvance::query()->first()?->status)->toBe(SalaryAdvanceStatus::Approved);

    actingAsOwner($workspace)->post('/payroll/runs', ['year' => 2026, 'month' => 9]);

    expect(Payslip::query()->first()?->advance_deduction)->toBe(5000.0)
        ->and(SalaryAdvance::query()->first()?->status)->toBe(SalaryAdvanceStatus::Deducted);
});
