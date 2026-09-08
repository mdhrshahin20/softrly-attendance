<?php

namespace App\Domain\Billing\Services;

use App\Domain\Billing\Contracts\PaymentGateway;
use App\Domain\Billing\Gateways\BkashGateway;
use App\Domain\Billing\Gateways\ManualPaymentGateway;
use App\Domain\Billing\Gateways\SslCommerzGateway;
use App\Domain\Platform\Services\PlatformSettingsService;
use InvalidArgumentException;

class PaymentGatewayManager
{
    /**
     * @var array<string, PaymentGateway>
     */
    private array $drivers;

    public function __construct(
        private readonly PlatformSettingsService $settings,
        ManualPaymentGateway $manual,
        SslCommerzGateway $sslcommerz,
        BkashGateway $bkash,
    ) {
        $this->drivers = [
            $manual->name() => $manual,
            $sslcommerz->name() => $sslcommerz,
            $bkash->name() => $bkash,
        ];
    }

    public function driver(?string $name = null): PaymentGateway
    {
        $name ??= $this->defaultDriver();

        if (! isset($this->drivers[$name])) {
            throw new InvalidArgumentException('Unknown payment gateway ['.$name.'].');
        }

        return $this->drivers[$name];
    }

    public function defaultDriver(): string
    {
        $configured = (string) $this->settings->get('payments.default_gateway', 'manual');

        return isset($this->drivers[$configured]) ? $configured : 'manual';
    }

    /**
     * @return list<array{name: string, label: string, enabled: bool, configured: bool, requires_redirect: bool, default: bool}>
     */
    public function catalog(): array
    {
        $default = $this->defaultDriver();
        $catalog = [];

        foreach ($this->drivers as $gateway) {
            $catalog[] = [
                'name' => $gateway->name(),
                'label' => $gateway->label(),
                'enabled' => $gateway->isEnabled(),
                'configured' => $gateway->isConfigured(),
                'requires_redirect' => $gateway->requiresRedirect(),
                'default' => $gateway->name() === $default,
            ];
        }

        return $catalog;
    }
}
