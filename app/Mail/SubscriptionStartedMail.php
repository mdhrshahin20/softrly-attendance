<?php

namespace App\Mail;

use App\Domain\Billing\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionStartedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Subscription $subscription) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your '.config('app.name').' workspace is ready',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.subscription-started',
            with: [
                'subscription' => $this->subscription,
                'appName' => config('app.name'),
            ],
        );
    }
}
