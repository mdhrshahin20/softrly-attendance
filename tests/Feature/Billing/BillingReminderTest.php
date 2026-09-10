<?php

use App\Domain\Billing\Enums\InvoiceStatus;
use App\Domain\Billing\Models\Invoice;
use App\Domain\Platform\Notifications\InvoiceOverdueNotification;
use App\Domain\Platform\Services\PlatformSettingsService;
use App\Mail\TrialEndingMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

test('a trial ending soon is emailed once and marked as reminded', function () {
    Mail::fake();
    Notification::fake();

    $workspace = createWorkspace(['owner_email' => 'trial-reminder@example.com']);

    $workspace['tenant']->currentSubscription?->update([
        'trial_ends_at' => now()->addDays(2),
        'current_period_end' => now()->addDays(2),
    ]);

    $this->artisan('billing:send-reminders')->assertSuccessful();

    Mail::assertSent(TrialEndingMail::class, fn (TrialEndingMail $mail): bool => $mail->hasTo('trial-reminder@example.com'));

    expect($workspace['tenant']->currentSubscription?->refresh()->trial_reminder_sent_at)->not->toBeNull();

    $this->artisan('billing:send-reminders')->assertSuccessful();

    Mail::assertSent(TrialEndingMail::class, 1);
});

test('billing reminders are skipped when disabled', function () {
    Mail::fake();

    app(PlatformSettingsService::class)->set('billing.reminders_enabled', false);

    $workspace = createWorkspace(['owner_email' => 'disabled-reminder@example.com']);
    $workspace['tenant']->currentSubscription?->update(['trial_ends_at' => now()->addDay()]);

    $this->artisan('billing:send-reminders')->assertSuccessful();

    Mail::assertNotSent(TrialEndingMail::class);
    expect($workspace['tenant']->currentSubscription?->refresh()->trial_reminder_sent_at)->toBeNull();
});

test('an overdue invoice is emailed and alerts the platform admin', function () {
    Mail::fake();
    Notification::fake();

    $admin = User::factory()->create([
        'email' => 'reminder-ops@platform.test',
        'is_platform_admin' => true,
        'email_verified_at' => now(),
    ]);

    $workspace = createWorkspace(['owner_email' => 'overdue@example.com']);

    $invoice = Invoice::query()->create([
        'tenant_id' => $workspace['tenant']->id,
        'number' => 'INV-202609-0001',
        'status' => InvoiceStatus::Sent,
        'amount' => 4500,
        'currency' => 'BDT',
        'billed_to_email' => 'overdue@example.com',
        'billed_to_company' => $workspace['tenant']->name,
        'issued_at' => now()->subWeek(),
        'due_at' => now()->subDay(),
    ]);

    $this->artisan('billing:send-reminders')->assertSuccessful();

    Mail::assertSent(TrialEndingMail::class, 0);
    Notification::assertSentTo($admin, InvoiceOverdueNotification::class);

    expect($invoice->refresh()->overdue_reminder_sent_at)->not->toBeNull();
});

test('a platform admin can update the billing email settings', function () {
    $admin = User::factory()->create([
        'email' => 'settings-ops@platform.test',
        'is_platform_admin' => true,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/platform/settings/billing')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/billing-settings')
            ->has('settings'));

    $this->actingAs($admin)
        ->put('/platform/settings/billing', [
            'reminders_enabled' => '0',
            'trial_reminder_days' => 5,
            'renewal_reminder_days' => 4,
            'invoice_due_reminder_days' => 2,
            'send_invoice_on_issue' => '1',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $settings = app(PlatformSettingsService::class);

    expect($settings->bool('billing.reminders_enabled'))->toBeFalse()
        ->and($settings->bool('billing.send_invoice_on_issue'))->toBeTrue()
        ->and((int) $settings->get('billing.trial_reminder_days'))->toBe(5)
        ->and((int) $settings->get('billing.invoice_due_reminder_days'))->toBe(2);
});
