<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Billing\Services\PaymentGatewayManager;
use App\Domain\Platform\Models\MessageLog;
use App\Domain\Platform\Services\PlatformMailer;
use App\Domain\Platform\Services\PlatformSettingsService;
use App\Domain\Platform\Services\SmsService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GatewaySettingsController extends Controller
{
    public function __construct(
        private readonly PlatformSettingsService $settings,
        private readonly PaymentGatewayManager $gateways,
        private readonly PlatformMailer $mailer,
        private readonly SmsService $sms,
    ) {}

    public function index(): Response
    {
        return Inertia::render('platform/gateways', [
            'payments' => $this->settings->group('payments'),
            'mail' => collect($this->settings->group('mail'))
                ->except(['smtp_password', 'ses_password', 'brevo_key'])
                ->merge([
                    'smtp_password' => filled($this->settings->get('mail.smtp_password')) ? '********' : '',
                    'ses_password' => filled($this->settings->get('mail.ses_password')) ? '********' : '',
                    'brevo_key' => filled($this->settings->get('mail.brevo_key')) ? '********' : '',
                ])
                ->all(),
            'sms' => collect($this->settings->group('sms'))
                ->except(['api_key', 'api_secret'])
                ->merge([
                    'api_key' => filled($this->settings->get('sms.api_key')) ? '********' : '',
                    'api_secret' => filled($this->settings->get('sms.api_secret')) ? '********' : '',
                    'configured' => $this->sms->isConfigured(),
                ])
                ->all(),
            'catalog' => $this->gateways->catalog(),
            'recentMessages' => MessageLog::query()
                ->latest()
                ->paginate(15)
                ->withQueryString()
                ->through(fn (MessageLog $log): array => [
                    'id' => $log->id,
                    'channel' => $log->channel,
                    'driver' => $log->driver,
                    'to' => $log->to,
                    'subject' => $log->subject,
                    'status' => $log->status,
                    'created_at' => $log->created_at?->toDateTimeString(),
                ]),
        ]);
    }

    public function updatePayments(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'default_gateway' => ['required', 'in:manual,sslcommerz,bkash'],
            'mode' => ['required', 'in:sandbox,live'],
            'sslcommerz_store_id' => ['nullable', 'string', 'max:120'],
            'sslcommerz_store_password' => ['nullable', 'string', 'max:120'],
            'bkash_app_key' => ['nullable', 'string', 'max:120'],
            'bkash_app_secret' => ['nullable', 'string', 'max:120'],
            'bkash_username' => ['nullable', 'string', 'max:120'],
            'bkash_password' => ['nullable', 'string', 'max:120'],
        ]);

        $this->settings->putMany([
            'payments.default_gateway' => $data['default_gateway'],
            'payments.mode' => $data['mode'],
            'payments.sslcommerz.enabled' => $this->asBool($request->input('sslcommerz_enabled')),
            'payments.sslcommerz.store_id' => $data['sslcommerz_store_id'] ?? '',
            'payments.bkash.enabled' => $this->asBool($request->input('bkash_enabled')),
            'payments.bkash.app_key' => $data['bkash_app_key'] ?? '',
            'payments.bkash.username' => $data['bkash_username'] ?? '',
        ]);

        $this->optionalSecret('payments.sslcommerz.store_password', $data['sslcommerz_store_password'] ?? null);
        $this->optionalSecret('payments.bkash.app_secret', $data['bkash_app_secret'] ?? null);
        $this->optionalSecret('payments.bkash.password', $data['bkash_password'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment gateways saved.']);

        return back();
    }

    public function updateMail(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'driver' => ['required', 'in:log,smtp,ses,brevo'],
            'from_address' => ['required', 'email'],
            'from_name' => ['required', 'string', 'max:100'],
            'smtp_host' => ['nullable', 'string', 'max:120'],
            'smtp_port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'smtp_username' => ['nullable', 'string', 'max:120'],
            'smtp_password' => ['nullable', 'string', 'max:200'],
            'smtp_encryption' => ['nullable', 'in:tls,ssl'],
            'ses_host' => ['nullable', 'string', 'max:120'],
            'ses_username' => ['nullable', 'string', 'max:120'],
            'ses_password' => ['nullable', 'string', 'max:200'],
            'ses_region' => ['nullable', 'string', 'max:40'],
            'brevo_login' => ['nullable', 'string', 'max:120'],
            'brevo_key' => ['nullable', 'string', 'max:200'],
        ]);

        $this->settings->putMany([
            'mail.driver' => $data['driver'],
            'mail.from_address' => $data['from_address'],
            'mail.from_name' => $data['from_name'],
            'mail.smtp_host' => $data['smtp_host'] ?? '',
            'mail.smtp_port' => $data['smtp_port'] ?? 587,
            'mail.smtp_username' => $data['smtp_username'] ?? '',
            'mail.smtp_encryption' => $data['smtp_encryption'] ?? 'tls',
            'mail.ses_host' => $data['ses_host'] ?? '',
            'mail.ses_username' => $data['ses_username'] ?? '',
            'mail.ses_region' => $data['ses_region'] ?? 'ap-southeast-1',
            'mail.brevo_login' => $data['brevo_login'] ?? '',
        ]);

        $this->optionalSecret('mail.smtp_password', $data['smtp_password'] ?? null);
        $this->optionalSecret('mail.ses_password', $data['ses_password'] ?? null);
        $this->optionalSecret('mail.brevo_key', $data['brevo_key'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Email gateway saved.']);

        return back();
    }

    public function updateSms(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'driver' => ['required', 'in:log,bulksmsbd,sslwireless,http'],
            'sender_id' => ['nullable', 'string', 'max:20'],
            'api_url' => ['nullable', 'string', 'max:255'],
            'api_key' => ['nullable', 'string', 'max:200'],
            'api_secret' => ['nullable', 'string', 'max:200'],
        ]);

        $this->settings->putMany([
            'sms.driver' => $data['driver'],
            'sms.sender_id' => $data['sender_id'] ?? 'SOFTRLY',
            'sms.api_url' => $data['api_url'] ?? '',
        ]);

        $this->optionalSecret('sms.api_key', $data['api_key'] ?? null);
        $this->optionalSecret('sms.api_secret', $data['api_secret'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'SMS gateway saved.']);

        return back();
    }

    public function testMail(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'to' => ['required', 'email'],
        ]);

        $ok = $this->mailer->raw(
            $data['to'],
            'Softrly test email',
            'Your email gateway is working. This is a test message from the platform admin.',
        );

        Inertia::flash('toast', [
            'type' => $ok ? 'success' : 'error',
            'message' => $ok ? 'Test email sent.' : 'Email failed. Check the message log.',
        ]);

        return back();
    }

    public function testSms(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'to' => ['required', 'string', 'max:20'],
        ]);

        $ok = $this->sms->send($data['to'], 'Softrly SMS gateway test. Your configuration is working.');

        Inertia::flash('toast', [
            'type' => $ok ? 'success' : 'error',
            'message' => $ok ? 'Test SMS sent.' : 'SMS failed. Check the message log.',
        ]);

        return back();
    }

    private function optionalSecret(string $key, ?string $value): void
    {
        if ($value === null || $value === '' || $value === '********') {
            return;
        }

        $this->settings->set($key, $value);
    }

    private function asBool(mixed $value): bool
    {
        if (is_array($value)) {
            $value = end($value);
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
