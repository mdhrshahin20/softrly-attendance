<?php

namespace App\Http\Controllers\Tenant;

use App\Domain\Attendance\Models\Shift;
use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Services\SubscriptionService;
use App\Domain\Employee\Models\Department;
use App\Domain\Employee\Models\Designation;
use App\Domain\Employee\Models\Employee;
use App\Domain\Leave\Services\LeaveBalanceService;
use App\Domain\Office\Models\Office;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreEmployeeRequest;
use App\Http\Requests\Tenant\UpdateEmployeeRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Employee::class);

        $employees = Employee::query()
            ->with(['department', 'designation', 'office', 'shift'])
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%");
                });
            })
            ->when($request->integer('department_id'), fn ($query, int $id) => $query->where('department_id', $id))
            ->when($request->integer('office_id'), fn ($query, int $id) => $query->where('office_id', $id))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('employees/index', [
            'employees' => $employees->through(fn (Employee $employee): array => $this->payload($employee)),
            'filters' => $request->only(['search', 'department_id', 'office_id']),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'offices' => Office::query()->orderBy('name')->get(['id', 'name']),
            'canExport' => app(SubscriptionService::class)
                ->hasFeature(PlanFeature::Exports),
            'canImport' => $request->user()?->can('employee.create') ?? false,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Employee::class);

        return Inertia::render('employees/form', [
            'employee' => null,
            ...$this->formOptions(),
        ]);
    }

    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        app(SubscriptionService::class)->assertCanCreateEmployee();

        $data = $request->validated();
        $password = $data['password'] ?? Str::password(12);

        $user = User::query()->create([
            'name' => trim($data['first_name'].' '.$data['last_name']),
            'email' => $data['email'],
            'password' => Hash::make($password),
            'email_verified_at' => now(),
            'current_tenant_id' => $request->user()?->current_tenant_id,
        ]);

        $request->user()?->currentTenant?->users()->syncWithoutDetaching([$user->id]);
        $this->assignRole($user, $data['role'] ?? 'employee');

        $employee = Employee::query()->create([
            ...collect($data)->except(['password', 'role'])->all(),
            'user_id' => $user->id,
        ]);

        app(LeaveBalanceService::class)->ensureForEmployee($employee);
        app(AuditLogger::class)->record('employee.created', $employee, newValues: [
            'email' => $employee->email,
            'employee_code' => $employee->employee_code,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Employee created.']);

        return to_route('employees.index');
    }

    public function edit(Employee $employee): Response
    {
        $this->authorize('update', $employee);
        $employee->loadMissing('user.roles');

        return Inertia::render('employees/form', [
            'employee' => $this->payload($employee),
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $employee->update(collect($request->validated())->except(['role'])->all());

        if ($employee->user) {
            $employee->user->update([
                'name' => $employee->full_name,
                'email' => $employee->email,
            ]);

            if ($request->filled('role')) {
                $this->assignRole($employee->user, (string) $request->input('role'));
            }
        }

        app(AuditLogger::class)->record('employee.updated', $employee);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Employee updated.']);

        return to_route('employees.index');
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        $this->authorize('delete', $employee);

        $employee->update(['status' => EmployeeStatus::Inactive]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Employee deactivated.']);

        return back();
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->can('employee.view'), 403);
        app(SubscriptionService::class)->assertFeature(PlanFeature::Exports);

        $employees = Employee::query()->with(['department', 'designation', 'office'])->orderBy('employee_code')->get();

        return response()->streamDownload(function () use ($employees): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['employee_code', 'first_name', 'last_name', 'email', 'phone', 'department', 'designation', 'office', 'joining_date', 'employment_type', 'status']);

            foreach ($employees as $employee) {
                fputcsv($handle, [
                    $employee->employee_code,
                    $employee->first_name,
                    $employee->last_name,
                    $employee->email,
                    $employee->phone,
                    $employee->department?->name,
                    $employee->designation?->name,
                    $employee->office?->name,
                    $employee->joining_date?->toDateString(),
                    $employee->employment_type->value,
                    $employee->status->value,
                ]);
            }

            fclose($handle);
        }, 'employees.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Employee $employee): array
    {
        return [
            'id' => $employee->id,
            'employee_code' => $employee->employee_code,
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'full_name' => $employee->full_name,
            'email' => $employee->email,
            'phone' => $employee->phone,
            'department_id' => $employee->department_id,
            'designation_id' => $employee->designation_id,
            'office_id' => $employee->office_id,
            'shift_id' => $employee->shift_id,
            'manager_id' => $employee->manager_id,
            'joining_date' => $employee->joining_date?->toDateString(),
            'employment_type' => $employee->employment_type->value,
            'status' => $employee->status->value,
            'department' => $employee->department?->only(['id', 'name']),
            'designation' => $employee->designation?->only(['id', 'name']),
            'office' => $employee->office?->only(['id', 'name']),
            'shift' => $employee->shift?->only(['id', 'name']),
            'role' => $employee->user?->roles->pluck('name')->first(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'designations' => Designation::query()->orderBy('name')->get(['id', 'name', 'department_id']),
            'offices' => Office::query()->orderBy('name')->get(['id', 'name']),
            'shifts' => Shift::query()->orderBy('name')->get(['id', 'name']),
            'managers' => Employee::query()->active()->orderBy('first_name')->get(['id', 'first_name', 'last_name']),
            'employmentTypes' => collect(EmploymentType::cases())->map(fn (EmploymentType $type): array => [
                'value' => $type->value,
                'label' => str_replace('_', ' ', ucfirst($type->value)),
            ]),
            'statuses' => collect(EmployeeStatus::cases())->map(fn (EmployeeStatus $status): array => [
                'value' => $status->value,
                'label' => ucfirst($status->value),
            ]),
            'roles' => Role::query()
                ->where('tenant_id', Tenant::current()?->id)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Role $role): array => [
                    'value' => $role->name,
                    'label' => str_replace('-', ' ', $role->name),
                ]),
        ];
    }

    private function assignRole(User $user, string $roleName): void
    {
        if ($user->hasRole('tenant-owner')) {
            return;
        }

        $role = Role::query()
            ->where('tenant_id', Tenant::current()?->id)
            ->where('name', $roleName)
            ->first();

        if ($role) {
            $user->syncRoles([$role->name]);
        }
    }
}
