<?php

namespace App\Domain\Billing\Gateways;

use App\Domain\Billing\Models\Payment;
use App\Domain\Platform\Services\PlatformSettingsService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class BkashGateway extends AbstractPaymentGateway
{
    public function __construct(
        private readonly PlatformSettingsService $settings,
    ) {}

    public function name(): string
    {
        return 'bkash';
    }

    public function label(): string
    {
        return 'bKash';
    }

    public function isEnabled(): bool
    {
        return $this->settings->bool('payments.bkash.enabled');
    }

    public function isConfigured(): bool
    {
        return filled($this->settings->get('payments.bkash.app_key'))
            && filled($this->settings->get('payments.bkash.app_secret'))
            && filled($this->settings->get('payments.bkash.username'))
            && filled($this->settings->get('payments.bkash.password'));
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
            $payment->notes ?: 'Collected via bKash'.($this->isSandbox() && ! $this->isConfigured() ? ' (sandbox)' : '').'.',
        );
    }

    public function checkoutUrl(Payment $payment): ?string
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $base = $this->isSandbox()
            ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout'
            : 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';

        $tokenResponse = Http::timeout(20)->post($base.'/token/grant', [
            'app_key' => $this->settings->get('payments.bkash.app_key'),
            'app_secret' => $this->settings->get('payments.bkash.app_secret'),
        ])->json();

        $idToken = is_array($tokenResponse) ? ($tokenResponse['id_token'] ?? null) : null;

        if (! is_string($idToken) || $idToken === '') {
            return null;
        }

        $create = Http::withHeaders([
            'Authorization' => $idToken,
            'X-APP-Key' => (string) $this->settings->get('payments.bkash.app_key'),
        ])->timeout(20)->post($base.'/create', [
            'mode' => '0011',
            'payerReference' => 'tenant-'.$payment->tenant_id,
            'callbackURL' => url('/billing/gateways/bkash/callback'),
            'amount' => number_format($payment->amount, 2, '.', ''),
            'currency' => $payment->currency,
            'intent' => 'sale',
            'merchantInvoiceNumber' => $payment->transaction_id ?: 'bkash_'.Str::lower(Str::ulid()),
        ])->json();

        $paymentId = is_array($create) ? ($create['paymentID'] ?? null) : null;

        if (is_string($paymentId) && $paymentId !== '') {
            $payment->update([
                'gateway' => $this->name(),
                'transaction_id' => $paymentId,
            ]);
        }

        return is_array($create) ? ($create['bkashURL'] ?? null) : null;
    }

    private function isSandbox(): bool
    {
        $mode = (string) $this->settings->get(
            'payments.bkash.mode',
            $this->settings->get('payments.mode', 'sandbox'),
        );

        return $mode !== 'live';
    }
}
