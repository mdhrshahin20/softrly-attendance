<?php

namespace Database\Factories;

use App\Domain\Attendance\Models\Shift;
use App\Domain\Employee\Models\Employee;
use App\Domain\Office\Models\Office;
use App\Domain\Shared\Enums\EmployeeStatus;
use App\Domain\Shared\Enums\EmploymentType;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'user_id' => User::factory(),
            'employee_code' => strtoupper(fake()->unique()->bothify('EMP###')),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'office_id' => Office::factory(),
            'shift_id' => Shift::factory(),
            'joining_date' => now()->toDateString(),
            'employment_type' => EmploymentType::Permanent,
            'status' => EmployeeStatus::Active,
        ];
    }
}
