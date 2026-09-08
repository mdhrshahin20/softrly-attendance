<?php

namespace App\Mail;

use App\Domain\Billing\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Subscription $subscription,
        public readonly string $event,
    ) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->event) {
            'cancelled' => 'Your '.config('app.name').' subscription was cancelled',
            'expired' => 'Your '.config('app.name').' subscription has expired',
            default => 'Your '.config('app.name').' subscription update',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.subscription-status',
            with: [
                'subscription' => $this->subscription,
                'event' => $this->event,
                'appName' => config('app.name'),
            ],
        );
    }
}
