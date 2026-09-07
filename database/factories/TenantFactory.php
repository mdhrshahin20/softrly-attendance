<?php

namespace Database\Factories;

use App\Domain\Shared\Enums\TenantStatus;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'uuid' => (string) Str::uuid(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('###'),
            'email' => fake()->companyEmail(),
            'country' => 'BD',
            'timezone' => 'Asia/Dhaka',
            'currency' => 'BDT',
            'status' => TenantStatus::Trial,
            'trial_ends_at' => now()->addDays(14),
        ];
    }
}
