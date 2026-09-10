<?php

namespace App\Domain\Platform\Services;

use App\Domain\Platform\Models\MessageLog;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class SmsService
{
    public function __construct(
        private readonly PlatformSettingsService $settings,
    ) {}

    public function send(string $to, string $message, ?Tenant $tenant = null, mixed $related = null): bool
    {
        $driver = (string) $this->settings->get('sms.driver', 'log');
        $sender = (string) $this->settings->get('sms.sender_id', 'ATTENDRLY');

        try {
            match ($driver) {
                'bulksmsbd' => $this->sendBulkSmsBd($to, $message, $sender),
                'sslwireless' => $this->sendSslWireless($to, $message, $sender),
                'http' => $this->sendGenericHttp($to, $message, $sender),
                default => Log::info('SMS (log driver)', ['to' => $to, 'message' => $message]),
            };

            $this->log($driver, $to, $message, 'sent', tenant: $tenant, related: $related);

            return true;
        } catch (Throwable $exception) {
            report($exception);
            $this->log($driver, $to, $message, 'failed', $exception->getMessage(), $tenant, $related);

            return false;
        }
    }

    public function isConfigured(): bool
    {
        $driver = (string) $this->settings->get('sms.driver', 'log');

        if ($driver === 'log') {
            return true;
        }

        return filled($this->settings->get('sms.api_key'));
    }

    private function sendBulkSmsBd(string $to, string $message, string $sender): void
    {
        $response = Http::timeout(15)->get('https://bulksmsbd.net/api/smsapi', [
            'api_key' => $this->settings->get('sms.api_key'),
            'senderid' => $sender,
            'number' => $to,
            'message' => $message,
        ]);

        $response->throw();
    }

    private function sendSslWireless(string $to, string $message, string $sender): void
    {
        $url = (string) ($this->settings->get('sms.api_url') ?: 'https://smsplus.sslwireless.com/api/v3/send-sms');

        $response = Http::timeout(15)->asForm()->post($url, [
            'api_token' => $this->settings->get('sms.api_key'),
            'sid' => $sender,
            'msisdn' => $to,
            'sms' => $message,
            'csms_id' => uniqid('sms_', true),
        ]);

        $response->throw();
    }

    private function sendGenericHttp(string $to, string $message, string $sender): void
    {
        $url = (string) $this->settings->get('sms.api_url');

        if ($url === '') {
            throw new \RuntimeException('SMS API URL is not configured.');
        }

        $response = Http::timeout(15)->asForm()->post($url, [
            'api_key' => $this->settings->get('sms.api_key'),
            'api_secret' => $this->settings->get('sms.api_secret'),
            'sender' => $sender,
            'to' => $to,
            'message' => $message,
        ]);

        $response->throw();
    }

    private function log(
        string $driver,
        string $to,
        string $body,
        string $status,
        ?string $error = null,
        ?Tenant $tenant = null,
        mixed $related = null,
    ): void {
        MessageLog::query()->create([
            'tenant_id' => $tenant?->id,
            'channel' => 'sms',
            'driver' => $driver,
            'to' => $to,
            'subject' => null,
            'body' => $body,
            'status' => $status,
            'error' => $error,
            'related_type' => is_object($related) ? $related::class : null,
            'related_id' => is_object($related) && isset($related->id) ? $related->id : null,
        ]);
    }
}
