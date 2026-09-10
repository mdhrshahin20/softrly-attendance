<?php

namespace App\Http\Requests\Tenant;

use App\Domain\Employee\Models\Employee;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('employee.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Employee $employee */
        $employee = $this->route('employee');

        return [
            'employee_code' => ['required', 'string', 'max:50', Rule::unique('employees', 'employee_code')->where('tenant_id', Tenant::current()?->id)->ignore($employee->id)],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('employees', 'email')->where('tenant_id', Tenant::current()?->id)->ignore($employee->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'designation_id' => ['nullable', 'exists:designations,id'],
            'office_id' => ['nullable', 'exists:offices,id'],
            'shift_id' => ['nullable', 'exists:shifts,id'],
            'manager_id' => ['nullable', 'exists:employees,id'],
            'joining_date' => ['nullable', 'date'],
            'employment_type' => ['required', Rule::enum(EmploymentType::class)],
            'status' => ['required', Rule::enum(EmployeeStatus::class)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['nullable', 'string', 'max:80'],
        ];
    }
}
