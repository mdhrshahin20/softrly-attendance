<?php

namespace App\Domain\Billing\Listeners;

use App\Domain\Billing\Events\PaymentCompleted;
use App\Domain\Billing\Notifications\PaymentSucceededNotification;
use App\Domain\Billing\Services\InvoiceService;
use App\Domain\Platform\Notifications\PaymentReceivedNotification;
use App\Domain\Platform\Services\PlatformNotifier;
use App\Domain\Platform\Services\PlatformSettingsService;
use App\Domain\Platform\Services\SmsService;
use App\Domain\Tenant\Services\TenantNotifier;
use Throwable;

class HandlePaymentCompleted
{
    public function __construct(
        private readonly InvoiceService $invoices,
        private readonly SmsService $sms,
        private readonly PlatformNotifier $platform,
        private readonly TenantNotifier $tenants,
        private readonly PlatformSettingsService $settings,
    ) {}

    public function handle(PaymentCompleted $event): void
    {
        $payment = $event->payment->loadMissing(['tenant.users', 'subscription.plan']);

        try {
            $invoice = $this->invoices->issueForPayment($payment);

            if ($this->settings->bool('billing.send_invoice_on_issue')) {
                $this->invoices->sendToTenant($invoice);
            }
        } catch (Throwable $exception) {
            report($exception);
        }

        $tenant = $payment->tenant;
        $phone = $tenant?->phone;

        if (filled($phone)) {
            $this->sms->send(
                $phone,
                'Payment received: '.$payment->currency.' '.$payment->amount.' for '.$tenant->name.'. Thank you.',
                $tenant,
                $payment,
            );
        }

        $this->platform->notify(new PaymentReceivedNotification($payment));

        if ($tenant) {
            $this->tenants->notify($tenant, new PaymentSucceededNotification($payment));
        }
    }
}
