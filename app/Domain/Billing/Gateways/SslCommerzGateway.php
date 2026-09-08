<?php

namespace App\Domain\Billing\Gateways;

use App\Domain\Billing\Models\Payment;
use App\Domain\Platform\Services\PlatformSettingsService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SslCommerzGateway extends AbstractPaymentGateway
{
    public function __construct(
        private readonly PlatformSettingsService $settings,
    ) {}

    public function name(): string
    {
        return 'sslcommerz';
    }

    public function label(): string
    {
        return 'SSLCommerz';
    }

    public function isEnabled(): bool
    {
        return $this->settings->bool('payments.sslcommerz.enabled');
    }

    public function isConfigured(): bool
    {
        return $this->isEnabled()
            && filled($this->settings->get('payments.sslcommerz.store_id'))
            && filled($this->settings->get('payments.sslcommerz.store_password'));
    }

    public function requiresRedirect(): bool
    {
        return $this->isConfigured() && ! $this->isSandbox();
    }

    public function charge(Payment $payment): Payment
    {
        return $this->markPaid(
            $payment,
            $payment->transaction_id,
            $payment->notes ?: 'Collected via SSLCommerz'.($this->isSandbox() && ! $this->isConfigured() ? ' (sandbox)' : '').'.',
        );
    }

    public function checkoutUrl(Payment $payment): ?string
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $tranId = $payment->transaction_id ?: 'ssl_'.Str::lower(Str::ulid());
        $payment->update(['transaction_id' => $tranId, 'gateway' => $this->name()]);

        $endpoint = $this->isSandbox()
            ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
            : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

        $tenant = $payment->tenant;

        $response = Http::asForm()->timeout(20)->post($endpoint, [
            'store_id' => $this->settings->get('payments.sslcommerz.store_id'),
            'store_passwd' => $this->settings->get('payments.sslcommerz.store_password'),
            'total_amount' => number_format($payment->amount, 2, '.', ''),
            'currency' => $payment->currency,
            'tran_id' => $tranId,
            'success_url' => url('/billing/gateways/sslcommerz/success'),
            'fail_url' => url('/billing/gateways/sslcommerz/fail'),
            'cancel_url' => url('/billing/gateways/sslcommerz/fail'),
            'ipn_url' => url('/billing/gateways/sslcommerz/ipn'),
            'cus_name' => $tenant->name ?? 'Customer',
            'cus_email' => $tenant->email ?? 'billing@example.com',
            'cus_phone' => $tenant->phone ?? '01700000000',
            'cus_add1' => 'N/A',
            'cus_city' => 'Dhaka',
            'cus_country' => 'Bangladesh',
            'product_name' => $payment->notes ?: 'Subscription',
            'product_category' => 'SaaS',
            'product_profile' => 'non-physical-goods',
            'shipping_method' => 'NO',
        ]);

        $payload = $response->json();

        return is_array($payload) ? ($payload['GatewayPageURL'] ?? null) : null;
    }

    private function isSandbox(): bool
    {
        return (string) $this->settings->get('payments.mode', 'sandbox') !== 'live';
    }
}
