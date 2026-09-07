<?php

namespace Database\Factories;

use App\Domain\Attendance\Models\Shift;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Shift>
 */
class ShiftFactory extends Factory
{
    protected $model = Shift::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => 'General Shift',
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'grace_minutes' => 10,
            'minimum_work_minutes' => 480,
            'status' => 'active',
        ];
    }
}
