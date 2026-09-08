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
        $requested = $name;
        $name ??= $this->defaultDriver();

        if (! isset($this->drivers[$name])) {
            throw new InvalidArgumentException('Unknown payment gateway ['.$name.'].');
        }

        $gateway = $this->drivers[$name];

        if ($requested !== null && ! $gateway->isEnabled()) {
            throw new InvalidArgumentException('Payment gateway ['.$name.'] is disabled.');
        }

        if (! $gateway->isEnabled()) {
            foreach ($this->drivers as $candidate) {
                if ($candidate->isEnabled()) {
                    return $candidate;
                }
            }

            return $this->drivers['manual'];
        }

        return $gateway;
    }

    public function defaultDriver(): string
    {
        $configured = (string) $this->settings->get('payments.default_gateway', 'manual');

        foreach ($this->readyDrivers() as $gateway) {
            if ($gateway->name() === $configured) {
                return $configured;
            }
        }

        $firstReady = $this->readyDrivers()[0] ?? null;

        return $firstReady?->name() ?? 'manual';
    }

    public function exists(string $name): bool
    {
        return isset($this->drivers[$name]);
    }

    /**
     * @return list<array{
     *   name: string,
     *   label: string,
     *   description: string,
     *   enabled: bool,
     *   configured: bool,
     *   ready: bool,
     *   mode: string|null,
     *   supports_mode: bool,
     *   requires_redirect: bool,
     *   default: bool
     * }>
     */
    public function catalog(): array
    {
        $preferred = (string) $this->settings->get('payments.default_gateway', 'manual');
        $readyNames = collect($this->readyDrivers())->map->name()->all();
        $resolvedDefault = in_array($preferred, $readyNames, true)
            ? $preferred
            : ($readyNames[0] ?? 'manual');

        $catalog = [];

        foreach ($this->drivers as $gateway) {
            $mode = $this->modeFor($gateway->name());
            $enabled = $gateway->isEnabled();
            $configured = $gateway->isConfigured();

            $catalog[] = [
                'name' => $gateway->name(),
                'label' => $gateway->label(),
                'description' => $this->descriptionFor($gateway->name()),
                'enabled' => $enabled,
                'configured' => $configured,
                'ready' => $enabled && $configured,
                'mode' => $mode,
                'supports_mode' => $mode !== null,
                'requires_redirect' => $gateway->requiresRedirect(),
                'default' => $gateway->name() === $resolvedDefault && $enabled,
            ];
        }

        return $catalog;
    }

    /**
     * @return array{
     *   name: string,
     *   label: string,
     *   description: string,
     *   enabled: bool,
     *   configured: bool,
     *   ready: bool,
     *   mode: string|null,
     *   supports_mode: bool,
     *   requires_redirect: bool,
     *   default: bool
     * }
     */
    public function find(string $name): array
    {
        foreach ($this->catalog() as $gateway) {
            if ($gateway['name'] === $name) {
                return $gateway;
            }
        }

        throw new InvalidArgumentException('Unknown payment gateway ['.$name.'].');
    }

    /**
     * Enabled gateways tenants can choose at checkout.
     *
     * @return list<array{
     *   name: string,
     *   label: string,
     *   description: string,
     *   enabled: bool,
     *   configured: bool,
     *   ready: bool,
     *   mode: string|null,
     *   supports_mode: bool,
     *   requires_redirect: bool,
     *   default: bool
     * }>
     */
    public function available(): array
    {
        return array_values(array_filter(
            $this->catalog(),
            fn (array $gateway): bool => $gateway['ready'],
        ));
    }

    /**
     * @return array<string, mixed>
     */
    public function configPayload(string $name): array
    {
        return match ($name) {
            'manual' => [
                'enabled' => $this->settings->bool('payments.manual.enabled'),
            ],
            'sslcommerz' => [
                'enabled' => $this->settings->bool('payments.sslcommerz.enabled'),
                'mode' => (string) $this->settings->get(
                    'payments.sslcommerz.mode',
                    $this->settings->get('payments.mode', 'sandbox'),
                ),
                'store_id' => (string) $this->settings->get('payments.sslcommerz.store_id', ''),
                'store_password' => filled($this->settings->get('payments.sslcommerz.store_password')) ? '********' : '',
            ],
            'bkash' => [
                'enabled' => $this->settings->bool('payments.bkash.enabled'),
                'mode' => (string) $this->settings->get(
                    'payments.bkash.mode',
                    $this->settings->get('payments.mode', 'sandbox'),
                ),
                'app_key' => (string) $this->settings->get('payments.bkash.app_key', ''),
                'app_secret' => filled($this->settings->get('payments.bkash.app_secret')) ? '********' : '',
                'username' => (string) $this->settings->get('payments.bkash.username', ''),
                'password' => filled($this->settings->get('payments.bkash.password')) ? '********' : '',
            ],
            default => throw new InvalidArgumentException('Unknown payment gateway ['.$name.'].'),
        };
    }

    private function modeFor(string $name): ?string
    {
        return match ($name) {
            'sslcommerz' => (string) $this->settings->get(
                'payments.sslcommerz.mode',
                $this->settings->get('payments.mode', 'sandbox'),
            ),
            'bkash' => (string) $this->settings->get(
                'payments.bkash.mode',
                $this->settings->get('payments.mode', 'sandbox'),
            ),
            default => null,
        };
    }

    private function descriptionFor(string $name): string
    {
        return match ($name) {
            'manual' => 'Bank transfer and offline payment confirmation.',
            'sslcommerz' => 'Cards and local payment methods via SSLCommerz.',
            'bkash' => 'Mobile wallet checkout for Bangladesh.',
            default => 'Payment gateway',
        };
    }

    /**
     * @return list<PaymentGateway>
     */
    private function readyDrivers(): array
    {
        $ready = [];

        foreach ($this->drivers as $gateway) {
            if ($gateway->isEnabled() && $gateway->isConfigured()) {
                $ready[] = $gateway;
            }
        }

        return $ready;
    }
}
