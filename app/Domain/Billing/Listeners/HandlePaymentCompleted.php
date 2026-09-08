<?php

namespace App\Domain\Billing\Listeners;

use App\Domain\Billing\Events\PaymentCompleted;
use App\Domain\Billing\Services\InvoiceService;
use App\Domain\Platform\Services\SmsService;
use Throwable;

class HandlePaymentCompleted
{
    public function __construct(
        private readonly InvoiceService $invoices,
        private readonly SmsService $sms,
    ) {}

    public function handle(PaymentCompleted $event): void
    {
        $payment = $event->payment->loadMissing(['tenant.users', 'subscription.plan']);

        try {
            $invoice = $this->invoices->issueForPayment($payment);
            $this->invoices->sendToTenant($invoice);
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
    }
}
