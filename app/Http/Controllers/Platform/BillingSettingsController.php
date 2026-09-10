<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Platform\Services\PlatformSettingsService;
use App\Domain\Tenant\Services\AuditLogger;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingSettingsController extends Controller
{
    public function __construct(
        private readonly PlatformSettingsService $settings,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        return Inertia::render('platform/billing-settings', [
            'settings' => [
                'reminders_enabled' => $this->settings->bool('billing.reminders_enabled'),
                'trial_reminder_days' => (int) $this->settings->get('billing.trial_reminder_days', 3),
                'renewal_reminder_days' => (int) $this->settings->get('billing.renewal_reminder_days', 3),
                'invoice_due_reminder_days' => (int) $this->settings->get('billing.invoice_due_reminder_days', 3),
                'send_invoice_on_issue' => $this->settings->bool('billing.send_invoice_on_issue'),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'reminders_enabled' => ['sometimes', 'boolean'],
            'send_invoice_on_issue' => ['sometimes', 'boolean'],
            'trial_reminder_days' => ['required', 'integer', 'min:1', 'max:30'],
            'renewal_reminder_days' => ['required', 'integer', 'min:1', 'max:30'],
            'invoice_due_reminder_days' => ['required', 'integer', 'min:1', 'max:30'],
        ]);

        $this->settings->putMany([
            'billing.reminders_enabled' => $request->boolean('reminders_enabled'),
            'billing.send_invoice_on_issue' => $request->boolean('send_invoice_on_issue'),
            'billing.trial_reminder_days' => (int) $data['trial_reminder_days'],
            'billing.renewal_reminder_days' => (int) $data['renewal_reminder_days'],
            'billing.invoice_due_reminder_days' => (int) $data['invoice_due_reminder_days'],
        ]);

        $this->audit->record('settings.billing_updated', newValues: [
            'reminders_enabled' => $request->boolean('reminders_enabled'),
            'trial_reminder_days' => (int) $data['trial_reminder_days'],
            'renewal_reminder_days' => (int) $data['renewal_reminder_days'],
            'invoice_due_reminder_days' => (int) $data['invoice_due_reminder_days'],
            'send_invoice_on_issue' => $request->boolean('send_invoice_on_issue'),
        ], user: $request->user(), request: $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Billing email settings saved.']);

        return back();
    }
}
