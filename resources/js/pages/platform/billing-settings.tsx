import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Settings = {
    reminders_enabled: boolean;
    trial_reminder_days: number;
    renewal_reminder_days: number;
    invoice_due_reminder_days: number;
    send_invoice_on_issue: boolean;
};

function Toggle({
    name,
    label,
    hint,
    checked,
    onChange,
}: {
    name: string;
    label: string;
    hint: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4">
            <div>
                <div className="text-sm font-medium">{label}</div>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                    {hint}
                </p>
            </div>
            <input type="hidden" name={name} value="0" />
            <span
                className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                    checked ? 'bg-primary' : 'bg-muted',
                )}
            >
                <input
                    type="checkbox"
                    name={name}
                    value="1"
                    checked={checked}
                    onChange={(event) => onChange(event.target.checked)}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                    aria-label={label}
                />
                <span
                    className={cn(
                        'bg-background absolute top-0.5 left-0.5 size-5 rounded-full shadow-sm transition-transform',
                        checked && 'translate-x-5',
                    )}
                />
            </span>
        </label>
    );
}

export default function PlatformBillingSettings({
    settings,
}: {
    settings: Settings;
}) {
    const [remindersEnabled, setRemindersEnabled] = useState(
        settings.reminders_enabled,
    );
    const [sendInvoiceOnIssue, setSendInvoiceOnIssue] = useState(
        settings.send_invoice_on_issue,
    );

    return (
        <>
            <Head title="Billing emails" />
            <PageShell>
                <PageHeader
                    title="Billing emails"
                    description="Control the automatic subscription emails Attendrly sends to tenants."
                />
                <Form
                    action="/platform/settings/billing"
                    method="put"
                    className="space-y-4"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Automatic reminders</CardTitle>
                            <CardDescription>
                                Sent by the daily{' '}
                                <code>billing:send-reminders</code> job. Each
                                reminder is only sent once per subscription or
                                invoice.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Toggle
                                name="reminders_enabled"
                                label="Send automatic billing reminders"
                                hint="Trial, renewal, and invoice reminders are skipped entirely when disabled."
                                checked={remindersEnabled}
                                onChange={setRemindersEnabled}
                            />

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="trial_reminder_days">
                                        Trial reminder (days before)
                                    </Label>
                                    <Input
                                        id="trial_reminder_days"
                                        name="trial_reminder_days"
                                        type="number"
                                        min={1}
                                        max={30}
                                        required
                                        defaultValue={
                                            settings.trial_reminder_days
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="renewal_reminder_days">
                                        Renewal reminder (days before)
                                    </Label>
                                    <Input
                                        id="renewal_reminder_days"
                                        name="renewal_reminder_days"
                                        type="number"
                                        min={1}
                                        max={30}
                                        required
                                        defaultValue={
                                            settings.renewal_reminder_days
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="invoice_due_reminder_days">
                                        Invoice due reminder (days before)
                                    </Label>
                                    <Input
                                        id="invoice_due_reminder_days"
                                        name="invoice_due_reminder_days"
                                        type="number"
                                        min={1}
                                        max={30}
                                        required
                                        defaultValue={
                                            settings.invoice_due_reminder_days
                                        }
                                    />
                                </div>
                            </div>

                            <Toggle
                                name="send_invoice_on_issue"
                                label="Email the invoice as soon as payment completes"
                                hint="Turn this off to keep invoices in the dashboard without emailing the tenant."
                                checked={sendInvoiceOnIssue}
                                onChange={setSendInvoiceOnIssue}
                            />
                        </CardContent>
                    </Card>
                    <Button type="submit">Save billing emails</Button>
                </Form>
            </PageShell>
        </>
    );
}

PlatformBillingSettings.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Billing emails', href: '/platform/settings/billing' },
    ],
};
