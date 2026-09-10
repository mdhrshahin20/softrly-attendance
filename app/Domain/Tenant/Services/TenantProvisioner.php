<?php

namespace App\Domain\Tenant\Services;

use App\Domain\Attendance\Models\Shift;
use App\Domain\Attendance\Models\WorkingDay;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Department;
use App\Domain\Employee\Models\Designation;
use App\Domain\Employee\Models\Employee;
use App\Domain\Holiday\Enums\HolidayType;
use App\Domain\Holiday\Models\Holiday;
use App\Domain\Leave\Models\LeaveType;
use App\Domain\Leave\Services\LeaveBalanceService;
use App\Domain\Office\Models\Office;
use App\Domain\Office\Models\OfficeNetwork;
use App\Domain\Platform\Notifications\TenantSignedUpNotification;
use App\Domain\Platform\Services\PlatformNotifier;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Domain\Shared\Enums\TenantStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use App\Domain\Tenant\Models\TenantSetting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class TenantProvisioner
{
    /**
     * @param  array{
     *     company_name: string,
     *     slug: string,
     *     company_email?: string,
     *     owner_name: string,
     *     owner_email: string,
     *     password: string
     * }  $input
     * @return array{tenant: Tenant, user: User, employee: Employee}
     */
    public function provision(array $input): array
    {
        $result = DB::transaction(function () use ($input): array {
            $tenant = Tenant::query()->create([
                'name' => $input['company_name'],
                'slug' => Str::slug($input['slug']),
                'email' => $input['company_email'] ?? $input['owner_email'],
                'country' => 'BD',
                'timezone' => 'Asia/Dhaka',
                'currency' => 'BDT',
                'status' => TenantStatus::Trial,
                'trial_ends_at' => now()->addDays(14),
            ]);

            $tenant->makeCurrent();
            app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);

            TenantDomain::query()->create([
                'tenant_id' => $tenant->id,
                'hostname' => $tenant->slug.'.localhost',
                'type' => 'subdomain',
                'is_primary' => true,
                'status' => 'active',
            ]);

            $this->createDefaultSettings($tenant);
            $this->createWorkingDays($tenant);
            $this->ensurePermissions();
            app(PermissionRegistrar::class)->forgetCachedPermissions();
            $this->createDefaultRoles($tenant);

            $user = User::query()->create([
                'name' => $input['owner_name'],
                'email' => $input['owner_email'],
                'password' => $input['password'],
                'current_tenant_id' => $tenant->id,
            ]);

            $tenant->users()->attach($user->id, ['is_owner' => true]);
            $user->assignRole('tenant-owner');

            $office = Office::query()->create([
                'tenant_id' => $tenant->id,
                'name' => 'Head Office',
                'code' => 'HO001',
                'city' => 'Dhaka',
                'country' => 'BD',
                'timezone' => 'Asia/Dhaka',
                'status' => 'active',
            ]);

            OfficeNetwork::query()->create([
                'tenant_id' => $tenant->id,
                'office_id' => $office->id,
                'name' => 'Local Development IPv4',
                'ip_address' => '127.0.0.1',
                'network_type' => 'static_ip',
                'status' => 'active',
            ]);

            OfficeNetwork::query()->create([
                'tenant_id' => $tenant->id,
                'office_id' => $office->id,
                'name' => 'Local Development IPv6',
                'ip_address' => '::1',
                'network_type' => 'static_ip',
                'status' => 'active',
            ]);

            $shift = Shift::query()->create([
                'tenant_id' => $tenant->id,
                'name' => 'General Shift',
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'grace_minutes' => 10,
                'minimum_work_minutes' => 480,
                'status' => 'active',
            ]);

            $department = Department::query()->create([
                'tenant_id' => $tenant->id,
                'name' => 'Administration',
                'code' => 'ADMIN',
                'status' => 'active',
            ]);

            $designation = Designation::query()->create([
                'tenant_id' => $tenant->id,
                'name' => 'Tenant Owner',
                'department_id' => $department->id,
                'status' => 'active',
            ]);

            $employee = Employee::query()->create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'employee_code' => 'EMP001',
                'first_name' => Str::before($input['owner_name'], ' ') ?: $input['owner_name'],
                'last_name' => Str::contains($input['owner_name'], ' ') ? Str::after($input['owner_name'], ' ') : null,
                'email' => $input['owner_email'],
                'department_id' => $department->id,
                'designation_id' => $designation->id,
                'office_id' => $office->id,
                'shift_id' => $shift->id,
                'joining_date' => now()->toDateString(),
                'employment_type' => EmploymentType::Permanent,
                'status' => EmployeeStatus::Active,
            ]);

            $this->createDefaultLeaveTypes();
            $this->createDefaultHolidays($tenant, $office);
            app(LeaveBalanceService::class)->ensureForEmployee($employee);
            app(SubscriptionService::class)->startTrial($tenant);

            return compact('tenant', 'user', 'employee');
        });

        Tenant::forgetCurrent();

        app(PlatformNotifier::class)->notify(new TenantSignedUpNotification($result['tenant']));

        return $result;
    }

    public function ensurePermissions(): void
    {
        foreach ($this->permissions() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
    }

    /**
     * @return list<string>
     */
    public function permissions(): array
    {
        return [
            'employee.view',
            'employee.create',
            'employee.update',
            'employee.delete',
            'department.manage',
            'designation.manage',
            'office.manage',
            'office.network.manage',
            'shift.manage',
            'attendance.view',
            'attendance.create',
            'attendance.edit',
            'attendance.export',
            'leave.view',
            'leave.apply',
            'leave.approve',
            'leave.reject',
            'leave.manage',
            'holiday.view',
            'holiday.manage',
            'settings.manage',
            'role.manage',
            'audit.view',
            'payroll.view',
            'payroll.manage',
            'payroll.payslip',
        ];
    }

    private function createDefaultRoles(Tenant $tenant): void
    {
        $owner = $this->role('tenant-owner', $tenant);
        $hr = $this->role('hr-admin', $tenant);
        $manager = $this->role('manager', $tenant);
        $employee = $this->role('employee', $tenant);

        $owner->syncPermissions($this->permissions());
        $hr->syncPermissions($this->permissions());
        $manager->syncPermissions([
            'employee.view',
            'attendance.view',
            'attendance.export',
            'leave.view',
            'leave.apply',
            'leave.approve',
            'leave.reject',
            'holiday.view',
            'payroll.view',
        ]);
        $employee->syncPermissions([
            'attendance.view',
            'attendance.create',
            'leave.view',
            'leave.apply',
            'holiday.view',
            'payroll.payslip',
        ]);
    }

    private function role(string $name, Tenant $tenant): Role
    {
        return Role::query()->firstOrCreate(
            [
                'name' => $name,
                'guard_name' => 'web',
                'tenant_id' => $tenant->id,
            ],
        );
    }

    private function createDefaultSettings(Tenant $tenant): void
    {
        $defaults = [
            'timezone' => ['Asia/Dhaka', 'string'],
            'attendance_method' => ['network', 'string'],
            'week_start' => ['sunday', 'string'],
            'late_grace_minutes' => ['10', 'integer'],
            'location_required' => ['false', 'boolean'],
        ];

        foreach ($defaults as $key => [$value, $type]) {
            TenantSetting::query()->create([
                'tenant_id' => $tenant->id,
                'key' => $key,
                'value' => $value,
                'type' => $type,
            ]);
        }
    }

    private function createWorkingDays(Tenant $tenant): void
    {
        // Bangladesh default: Sunday–Thursday working, Friday–Saturday off.
        $working = [0 => true, 1 => true, 2 => true, 3 => true, 4 => true, 5 => false, 6 => false];

        foreach ($working as $day => $isWorking) {
            WorkingDay::query()->create([
                'tenant_id' => $tenant->id,
                'day_of_week' => $day,
                'is_working' => $isWorking,
            ]);
        }
    }

    private function createDefaultLeaveTypes(): void
    {
        $types = [
            ['name' => 'Casual Leave', 'code' => 'CL', 'days_per_year' => 10, 'is_paid' => true, 'minimum_notice_days' => 1, 'requires_attachment' => false],
            ['name' => 'Sick Leave', 'code' => 'SL', 'days_per_year' => 8, 'is_paid' => true, 'minimum_notice_days' => 0, 'requires_attachment' => true],
            ['name' => 'Annual Leave', 'code' => 'AL', 'days_per_year' => 14, 'is_paid' => true, 'minimum_notice_days' => 7, 'requires_attachment' => false],
            ['name' => 'Unpaid Leave', 'code' => 'UL', 'days_per_year' => 0, 'is_paid' => false, 'minimum_notice_days' => 1, 'requires_attachment' => false],
        ];

        foreach ($types as $type) {
            LeaveType::query()->firstOrCreate(
                ['code' => $type['code']],
                [...$type, 'status' => 'active', 'carry_forward' => false, 'maximum_carry_forward' => 0],
            );
        }
    }

    private function createDefaultHolidays(Tenant $tenant, Office $office): void
    {
        $year = (int) now()->year;

        $holidays = [
            ['name' => 'Language Movement Day', 'date' => $year.'-02-21'],
            ['name' => 'Independence Day', 'date' => $year.'-03-26'],
            ['name' => 'May Day', 'date' => $year.'-05-01'],
            ['name' => 'Victory Day', 'date' => $year.'-12-16'],
        ];

        foreach ($holidays as $holiday) {
            Holiday::query()->firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'date' => $holiday['date'],
                    'name' => $holiday['name'],
                ],
                [
                    'holiday_type' => HolidayType::Public,
                    'status' => 'active',
                ],
            );
        }
    }

    public function syncPermissionsForExistingTenants(): void
    {
        $this->ensurePermissions();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Tenant::query()->each(function (Tenant $tenant): void {
            $tenant->makeCurrent();
            app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);
            $this->createDefaultRoles($tenant);
            $this->createDefaultLeaveTypes();

            if (Holiday::query()->doesntExist()) {
                $office = Office::query()->first();
                if ($office) {
                    $this->createDefaultHolidays($tenant, $office);
                }
            }

            Employee::query()->each(function (Employee $employee): void {
                app(LeaveBalanceService::class)->ensureForEmployee($employee);
            });

            $billing = app(SubscriptionService::class);
            if ($billing->current($tenant) === null) {
                $billing->startTrial($tenant);
            }
        });

        Tenant::forgetCurrent();
    }
}
