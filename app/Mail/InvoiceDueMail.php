<?php

namespace App\Mail;

use App\Domain\Billing\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceDueMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Invoice $invoice,
        public readonly bool $overdue = false,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->overdue
            ? 'Overdue invoice '.$this->invoice->number
            : 'Invoice '.$this->invoice->number.' is due soon';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.invoice-due',
            with: [
                'invoice' => $this->invoice,
                'overdue' => $this->overdue,
                'appName' => config('app.name'),
            ],
        );
    }
}
