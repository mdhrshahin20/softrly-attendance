<?php

namespace App\Console\Commands;

use App\Domain\Billing\Services\BillingReminderService;
use Illuminate\Console\Command;

class SendBillingRemindersCommand extends Command
{
    protected $signature = 'billing:send-reminders';

    protected $description = 'Email tenants about trials ending, upcoming renewals, and due invoices.';

    public function handle(BillingReminderService $reminders): int
    {
        $counts = $reminders->send();

        $this->info(sprintf(
            'Sent %d trial, %d renewal, and %d invoice reminder(s).',
            $counts['trial'],
            $counts['renewal'],
            $counts['invoice'],
        ));

        return self::SUCCESS;
    }
}
