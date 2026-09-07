<?php

namespace Database\Factories;

use App\Domain\Office\Models\Office;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Office>
 */
class OfficeFactory extends Factory
{
    protected $model = Office::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => fake()->company().' Office',
            'code' => strtoupper(fake()->unique()->bothify('OFF###')),
            'city' => 'Dhaka',
            'country' => 'BD',
            'timezone' => 'Asia/Dhaka',
            'status' => 'active',
        ];
    }
}
