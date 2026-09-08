<?php

namespace App\Domain\Platform\Services;

use App\Domain\Platform\Models\MessageLog;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Throwable;

class PlatformMailer
{
    public function __construct(
        private readonly PlatformSettingsService $settings,
    ) {}

    public function send(string $to, Mailable $mailable, ?Tenant $tenant = null, mixed $related = null): bool
    {
        $this->applyTransport();

        try {
            Mail::to($to)->send($mailable);
            $this->log('mail', $to, $mailable->subject, 'sent', tenant: $tenant, related: $related);

            return true;
        } catch (Throwable $exception) {
            report($exception);
            $this->log('mail', $to, $mailable->subject, 'failed', $exception->getMessage(), $tenant, $related);

            return false;
        }
    }

    public function raw(string $to, string $subject, string $body, ?Tenant $tenant = null): bool
    {
        $this->applyTransport();

        try {
            Mail::raw($body, function ($message) use ($to, $subject): void {
                $message->to($to)->subject($subject);
            });
            $this->log('mail', $to, $subject, 'sent', tenant: $tenant, related: null, body: $body);

            return true;
        } catch (Throwable $exception) {
            report($exception);
            $this->log('mail', $to, $subject, 'failed', $exception->getMessage(), $tenant, null, $body);

            return false;
        }
    }

    public function applyTransport(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $fromAddress = (string) $this->settings->get('mail.from_address', config('mail.from.address'));
        $fromName = (string) $this->settings->get('mail.from_name', config('mail.from.name'));

        Config::set('mail.from.address', $fromAddress ?: config('mail.from.address'));
        Config::set('mail.from.name', $fromName ?: config('mail.from.name'));

        $driver = (string) $this->settings->get('mail.driver', 'log');

        match ($driver) {
            'smtp' => $this->useSmtp(
                (string) $this->settings->get('mail.smtp_host'),
                (int) $this->settings->get('mail.smtp_port', 587),
                (string) $this->settings->get('mail.smtp_username'),
                (string) $this->settings->get('mail.smtp_password'),
                (string) $this->settings->get('mail.smtp_encryption', 'tls'),
            ),
            'ses' => $this->useSmtp(
                (string) ($this->settings->get('mail.ses_host') ?: 'email-smtp.'.$this->settings->get('mail.ses_region', 'ap-southeast-1').'.amazonaws.com'),
                587,
                (string) $this->settings->get('mail.ses_username'),
                (string) $this->settings->get('mail.ses_password'),
                'tls',
            ),
            'brevo' => $this->useSmtp(
                'smtp-relay.brevo.com',
                587,
                (string) $this->settings->get('mail.brevo_login'),
                (string) $this->settings->get('mail.brevo_key'),
                'tls',
            ),
            default => Config::set('mail.default', 'log'),
        };

        $this->forgetMailers();
    }

    public function currentDriver(): string
    {
        return (string) $this->settings->get('mail.driver', 'log');
    }

    private function useSmtp(string $host, int $port, string $username, string $password, string $encryption): void
    {
        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp.transport', 'smtp');
        Config::set('mail.mailers.smtp.host', $host);
        Config::set('mail.mailers.smtp.port', $port);
        Config::set('mail.mailers.smtp.username', $username !== '' ? $username : null);
        Config::set('mail.mailers.smtp.password', $password !== '' ? $password : null);
        Config::set('mail.mailers.smtp.scheme', $encryption === 'ssl' ? 'smtps' : null);
        Config::set('mail.mailers.smtp.encryption', $encryption !== '' ? $encryption : null);
    }

    private function forgetMailers(): void
    {
        Mail::purge();
        app()->forgetInstance('mail.manager');
        app()->forgetInstance('mailer');
    }

    private function log(
        string $channel,
        string $to,
        ?string $subject,
        string $status,
        ?string $error = null,
        ?Tenant $tenant = null,
        mixed $related = null,
        ?string $body = null,
    ): void {
        MessageLog::query()->create([
            'tenant_id' => $tenant?->id,
            'channel' => $channel,
            'driver' => $this->currentDriver(),
            'to' => $to,
            'subject' => $subject,
            'body' => $body,
            'status' => $status,
            'error' => $error,
            'related_type' => is_object($related) ? $related::class : null,
            'related_id' => is_object($related) && isset($related->id) ? $related->id : null,
        ]);
    }
}
