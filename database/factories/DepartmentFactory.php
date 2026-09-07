<?php

namespace Database\Factories;

use App\Domain\Employee\Models\Department;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Department>
 */
class DepartmentFactory extends Factory
{
    protected $model = Department::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => fake()->unique()->jobTitle().' Dept',
            'code' => strtoupper(fake()->unique()->lexify('???')),
            'status' => 'active',
        ];
    }
}
