<?php

namespace App\Domain\Billing\Services;

use App\Domain\Billing\Enums\InvoiceStatus;
use App\Domain\Billing\Enums\SubscriptionStatus;
use App\Domain\Billing\Models\Invoice;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Billing\Notifications\TrialEndingNotification;
use App\Domain\Platform\Notifications\InvoiceOverdueNotification;
use App\Domain\Platform\Services\PlatformMailer;
use App\Domain\Platform\Services\PlatformNotifier;
use App\Domain\Platform\Services\PlatformSettingsService;
use App\Domain\Tenant\Services\TenantNotifier;
use App\Mail\InvoiceDueMail;
use App\Mail\RenewalReminderMail;
use App\Mail\TrialEndingMail;

class BillingReminderService
{
    public function __construct(
        private readonly PlatformSettingsService $settings,
        private readonly PlatformMailer $mailer,
        private readonly TenantNotifier $tenants,
        private readonly PlatformNotifier $platform,
    ) {}

    /**
     * @return array{trial: int, renewal: int, invoice: int}
     */
    public function send(): array
    {
        if (! $this->settings->bool('billing.reminders_enabled')) {
            return ['trial' => 0, 'renewal' => 0, 'invoice' => 0];
        }

        return [
            'trial' => $this->trialEnding(),
            'renewal' => $this->renewals(),
            'invoice' => $this->invoices(),
        ];
    }

    private function trialEnding(): int
    {
        $days = $this->days('billing.trial_reminder_days');
        $sent = 0;

        Subscription::query()
            ->with(['tenant', 'plan'])
            ->where('status', SubscriptionStatus::Trial)
            ->whereNull('trial_reminder_sent_at')
            ->whereNotNull('trial_ends_at')
            ->whereBetween('trial_ends_at', [now(), now()->addDays($days)])
            ->each(function (Subscription $subscription) use (&$sent): void {
                $tenant = $subscription->tenant;
                $email = $tenant->billingEmail();

                if (filled($email)) {
                    $this->mailer->send($email, new TrialEndingMail($subscription), $tenant, $subscription);
                }

                $this->tenants->notify($tenant, new TrialEndingNotification($subscription));

                $subscription->forceFill(['trial_reminder_sent_at' => now()])->save();
                $sent++;
            });

        return $sent;
    }

    private function renewals(): int
    {
        $days = $this->days('billing.renewal_reminder_days');
        $sent = 0;

        Subscription::query()
            ->with(['tenant', 'plan'])
            ->where('status', SubscriptionStatus::Active)
            ->whereNull('renewal_reminder_sent_at')
            ->whereNotNull('current_period_end')
            ->whereBetween('current_period_end', [now(), now()->addDays($days)])
            ->each(function (Subscription $subscription) use (&$sent): void {
                $tenant = $subscription->tenant;
                $email = $tenant->billingEmail();

                if (filled($email)) {
                    $this->mailer->send($email, new RenewalReminderMail($subscription), $tenant, $subscription);
                }

                $subscription->forceFill(['renewal_reminder_sent_at' => now()])->save();
                $sent++;
            });

        return $sent;
    }

    private function invoices(): int
    {
        $days = $this->days('billing.invoice_due_reminder_days');
        $sent = 0;

        Invoice::query()
            ->with(['tenant', 'subscription.plan'])
            ->whereIn('status', [InvoiceStatus::Draft->value, InvoiceStatus::Sent->value])
            ->whereNotNull('due_at')
            ->where('due_at', '<=', now()->addDays($days))
            ->each(function (Invoice $invoice) use (&$sent): void {
                $overdue = $invoice->due_at?->isPast() ?? false;

                if ($overdue && $invoice->overdue_reminder_sent_at !== null) {
                    return;
                }

                if (! $overdue && $invoice->due_reminder_sent_at !== null) {
                    return;
                }

                $tenant = $invoice->tenant;
                $email = $invoice->billed_to_email ?: $tenant?->billingEmail();

                if (filled($email)) {
                    $this->mailer->send($email, new InvoiceDueMail($invoice, $overdue), $tenant, $invoice);
                }

                if ($overdue) {
                    $this->platform->notify(new InvoiceOverdueNotification($invoice));
                    $invoice->forceFill(['overdue_reminder_sent_at' => now()])->save();
                } else {
                    $invoice->forceFill(['due_reminder_sent_at' => now()])->save();
                }

                $sent++;
            });

        return $sent;
    }

    private function days(string $key): int
    {
        return max(1, (int) $this->settings->get($key, 3));
    }
}
