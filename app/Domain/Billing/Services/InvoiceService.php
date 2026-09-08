<?php

namespace App\Domain\Billing\Services;

use App\Domain\Billing\Enums\InvoiceStatus;
use App\Domain\Billing\Enums\PaymentStatus;
use App\Domain\Billing\Models\Invoice;
use App\Domain\Billing\Models\InvoiceItem;
use App\Domain\Billing\Models\Payment;
use App\Domain\Platform\Services\PlatformMailer;
use App\Mail\InvoiceMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    public function __construct(
        private readonly PlatformMailer $mailer,
    ) {}

    public function issueForPayment(Payment $payment): Invoice
    {
        $existing = Invoice::query()->where('payment_id', $payment->id)->first();

        if ($existing) {
            return $existing->loadMissing(['items', 'tenant', 'subscription.plan', 'payment']);
        }

        $payment->loadMissing(['tenant.users', 'subscription.plan']);
        $tenant = $payment->tenant;
        $plan = $payment->subscription?->plan;
        $owner = $tenant?->owner();

        return DB::transaction(function () use ($payment, $tenant, $plan, $owner): Invoice {
            $invoice = Invoice::query()->create([
                'tenant_id' => $payment->tenant_id,
                'payment_id' => $payment->id,
                'subscription_id' => $payment->subscription_id,
                'number' => $this->nextNumber(),
                'status' => $payment->status === PaymentStatus::Paid ? InvoiceStatus::Paid : InvoiceStatus::Draft,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'billed_to_name' => $owner?->name,
                'billed_to_email' => $tenant?->billingEmail(),
                'billed_to_company' => $tenant?->name,
                'issued_at' => now(),
                'due_at' => now(),
                'notes' => $payment->notes,
            ]);

            InvoiceItem::query()->create([
                'invoice_id' => $invoice->id,
                'description' => trim(($plan->name ?? 'Subscription').' · '.($payment->notes ?: 'Plan charge')),
                'quantity' => 1,
                'unit_amount' => $payment->amount,
                'amount' => $payment->amount,
            ]);

            return $invoice->load(['items', 'tenant', 'subscription.plan', 'payment']);
        });
    }

    public function sendToTenant(Invoice $invoice): bool
    {
        $invoice->loadMissing(['items', 'tenant.users', 'subscription.plan', 'payment']);
        $email = $invoice->billed_to_email ?: $invoice->tenant?->billingEmail();

        if (! filled($email)) {
            throw ValidationException::withMessages([
                'email' => 'This tenant has no billing email on file.',
            ]);
        }

        $sent = $this->mailer->send(
            $email,
            new InvoiceMail($invoice),
            $invoice->tenant,
            $invoice,
        );

        if ($sent) {
            $invoice->update([
                'sent_at' => now(),
                'status' => $invoice->status === InvoiceStatus::Draft ? InvoiceStatus::Sent : $invoice->status,
            ]);
        }

        return $sent;
    }

    public function printHtml(Invoice $invoice): string
    {
        $invoice->loadMissing(['items', 'tenant', 'subscription.plan', 'payment']);

        return view('invoices.print', [
            'invoice' => $invoice,
            'appName' => config('app.name'),
        ])->render();
    }

    private function nextNumber(): string
    {
        $prefix = 'INV-'.now()->format('Ym').'-';
        $latest = Invoice::query()
            ->where('number', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('number');

        $sequence = 1;

        if (is_string($latest)) {
            $sequence = ((int) substr($latest, strlen($prefix))) + 1;
        }

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
