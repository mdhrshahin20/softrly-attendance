<?php

namespace App\Domain\Platform\Notifications;

use App\Domain\Billing\Models\Invoice;
use App\Domain\Shared\Notifications\InAppNotification;

class InvoiceOverdueNotification extends InAppNotification
{
    public function __construct(private readonly Invoice $invoice) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Invoice overdue',
            'message' => 'Invoice '.$this->invoice->number.' for '.$this->invoice->tenant->name
                .' is overdue ('.$this->invoice->currency.' '.number_format($this->invoice->amount).').',
            'url' => '/platform/invoices/'.$this->invoice->id,
            'level' => 'danger',
        ];
    }
}
