<?php

namespace Database\Factories;

use App\Domain\Office\Models\Office;
use App\Domain\Office\Models\OfficeNetwork;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OfficeNetwork>
 */
class OfficeNetworkFactory extends Factory
{
    protected $model = OfficeNetwork::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'office_id' => Office::factory(),
            'name' => 'Main Office WiFi',
            'ip_address' => '127.0.0.1',
            'network_type' => 'static_ip',
            'status' => 'active',
        ];
    }
}
