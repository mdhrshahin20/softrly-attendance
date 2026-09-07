<?php

namespace Database\Seeders;

use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Services\LeaveBalanceService;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\TenantProvisioner;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->create([
            'name' => 'Platform Admin',
            'email' => 'admin@softrly.test',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'is_platform_admin' => true,
        ]);

        $workspace = app(TenantProvisioner::class)->provision([
            'company_name' => 'Softrly Ltd',
            'slug' => 'softrly',
            'owner_name' => 'Hasan Shahin',
            'owner_email' => 'hasan@softrly.test',
            'password' => 'password',
        ]);

        $tenant = $workspace['tenant'];
        $office = $workspace['employee']->office;
        $shift = $workspace['employee']->shift;
        $department = $workspace['employee']->department;

        $employeeUser = User::query()->create([
            'name' => 'Amina Rahman',
            'email' => 'amina@softrly.test',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'current_tenant_id' => $tenant->id,
        ]);

        $tenant->makeCurrent();
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);

        $tenant->users()->attach($employeeUser->id);
        $employeeUser->assignRole('employee');

        $amina = Employee::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $employeeUser->id,
            'employee_code' => 'EMP002',
            'first_name' => 'Amina',
            'last_name' => 'Rahman',
            'email' => 'amina@softrly.test',
            'department_id' => $department?->id,
            'office_id' => $office?->id,
            'shift_id' => $shift?->id,
            'manager_id' => $workspace['employee']->id,
            'joining_date' => now()->toDateString(),
            'employment_type' => EmploymentType::Permanent,
            'status' => EmployeeStatus::Active,
        ]);

        app(LeaveBalanceService::class)->ensureForEmployee($amina);
        Tenant::forgetCurrent();
    }
}
