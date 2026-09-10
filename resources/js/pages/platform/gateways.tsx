import { Form, Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleAlert,
    CreditCard,
    Mail,
    MessageSquare,
    Settings2,
    Shield,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
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

type CatalogItem = {
    name: string;
    label: string;
    description: string;
    enabled: boolean;
    configured: boolean;
    ready: boolean;
    mode: string | null;
    supports_mode: boolean;
    default: boolean;
};

type Props = {
    mail: Record<string, unknown>;
    sms: Record<string, unknown>;
    catalog: CatalogItem[];
    recentMessages: Paginated<{
        id: number;
        channel: string;
        driver: string | null;
        to: string;
        subject: string | null;
        status: string;
        created_at: string | null;
    }>;
};

const sections = [
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'logs', label: 'Message log', icon: Shield },
] as const;

type SectionId = (typeof sections)[number]['id'];

function str(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
}

function bool(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                ok
                    ? 'bg-success/10 text-success-foreground'
                    : 'bg-muted text-muted-foreground',
            )}
        >
            {ok ? (
                <CheckCircle2 className="size-3.5" />
            ) : (
                <CircleAlert className="size-3.5" />
            )}
            {label}
        </span>
    );
}

function Field({
    label,
    htmlFor,
    hint,
    children,
}: {
    label: string;
    htmlFor?: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {hint ? (
                <p className="text-muted-foreground text-xs leading-5">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

export default function PlatformGateways({
    mail,
    sms,
    catalog,
    recentMessages,
}: Props) {
    const [section, setSection] = useState<SectionId>('payments');
    const [mailDriver, setMailDriver] = useState(str(mail.driver) || 'log');
    const [smsDriver, setSmsDriver] = useState(str(sms.driver) || 'log');

    const paymentSummary = useMemo(() => {
        const enabled = catalog.filter((item) => item.enabled);
        const ready = catalog.filter((item) => item.ready);
        const preferred = catalog.find((item) => item.default);
        return {
            enabledCount: enabled.length,
            readyCount: ready.length,
            preferredLabel: preferred?.label ?? 'None',
        };
    }, [catalog]);

    return (
        <>
            <Head title="Gateways" />
            <PageShell>
                <PageHeader
                    title="Gateways"
                    description="Configure payment providers, outbound email, and SMS for the Attendrly platform."
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                Preferred payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xl font-semibold tracking-tight">
                            {paymentSummary.preferredLabel}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                Payment providers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-xl font-semibold tracking-tight">
                                {paymentSummary.enabledCount} enabled ·{' '}
                                {paymentSummary.readyCount} ready
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {catalog.map((item) => (
                                    <Badge
                                        key={item.name}
                                        variant={
                                            item.enabled
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {item.label}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                Email
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-xl font-semibold tracking-tight capitalize">
                                {str(mail.driver) || 'log'}
                            </div>
                            <StatusPill
                                ok={
                                    str(mail.driver) !== '' &&
                                    str(mail.driver) !== 'log'
                                }
                                label={
                                    str(mail.driver) === 'log'
                                        ? 'Logging locally'
                                        : 'Provider connected'
                                }
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                SMS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-xl font-semibold tracking-tight capitalize">
                                {str(sms.driver) || 'log'}
                            </div>
                            <StatusPill
                                ok={bool(sms.configured)}
                                label={
                                    bool(sms.configured)
                                        ? 'Configured'
                                        : 'Needs setup'
                                }
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-card overflow-hidden rounded-xl border">
                    <div className="flex flex-wrap gap-1 border-b p-2">
                        {sections.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSection(item.id)}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                                        section === item.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <Icon className="size-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-4 md:p-6">
                        {section === 'payments' ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight">
                                        Payment gateways
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                                        Open each gateway to configure
                                        credentials and its own Live / Sandbox
                                        mode.
                                    </p>
                                </div>

                                <div className="overflow-hidden rounded-xl border">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[760px] text-sm">
                                            <thead className="bg-muted/40 text-left">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">
                                                        Gateway
                                                    </th>
                                                    <th className="px-4 py-3 font-medium">
                                                        Status
                                                    </th>
                                                    <th className="px-4 py-3 font-medium">
                                                        Mode
                                                    </th>
                                                    <th className="px-4 py-3 font-medium">
                                                        Preferred
                                                    </th>
                                                    <th className="px-4 py-3 font-medium">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {catalog.map((item) => (
                                                    <tr
                                                        key={item.name}
                                                        className="hover:bg-muted/30 border-t"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium">
                                                                {item.label}
                                                            </div>
                                                            <div className="text-muted-foreground text-xs">
                                                                {
                                                                    item.description
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-1">
                                                                <Badge
                                                                    variant={
                                                                        item.enabled
                                                                            ? 'default'
                                                                            : 'secondary'
                                                                    }
                                                                >
                                                                    {item.enabled
                                                                        ? 'Enabled'
                                                                        : 'Disabled'}
                                                                </Badge>
                                                                <Badge
                                                                    variant={
                                                                        item.configured
                                                                            ? 'outline'
                                                                            : 'secondary'
                                                                    }
                                                                >
                                                                    {item.configured
                                                                        ? 'Configured'
                                                                        : 'Setup needed'}
                                                                </Badge>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 capitalize">
                                                            {item.supports_mode
                                                                ? item.mode
                                                                : '—'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.default ? (
                                                                <Badge>
                                                                    Preferred
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Button
                                                                size="sm"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/platform/gateways/payments/${item.name}/configure`}
                                                                >
                                                                    <Settings2 className="size-3.5" />
                                                                    Configure
                                                                </Link>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {section === 'email' ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight">
                                        Email gateway
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                                        Invoices, trials, cancellations, and
                                        leave notices use this outbound mail
                                        configuration.
                                    </p>
                                </div>

                                <Form
                                    action="/platform/gateways/mail"
                                    method="put"
                                    className="space-y-4"
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field
                                            label="Driver"
                                            htmlFor="mail_driver"
                                        >
                                            <select
                                                id="mail_driver"
                                                name="driver"
                                                value={mailDriver}
                                                onChange={(event) =>
                                                    setMailDriver(
                                                        event.target.value,
                                                    )
                                                }
                                                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                            >
                                                <option value="log">
                                                    Log (local)
                                                </option>
                                                <option value="smtp">
                                                    SMTP
                                                </option>
                                                <option value="ses">
                                                    Amazon SES (SMTP)
                                                </option>
                                                <option value="brevo">
                                                    Brevo
                                                </option>
                                            </select>
                                        </Field>
                                        <Field label="From name">
                                            <Input
                                                name="from_name"
                                                defaultValue={str(
                                                    mail.from_name,
                                                )}
                                                required
                                            />
                                        </Field>
                                        <Field
                                            label="From address"
                                            htmlFor="from_address"
                                        >
                                            <Input
                                                id="from_address"
                                                name="from_address"
                                                type="email"
                                                defaultValue={str(
                                                    mail.from_address,
                                                )}
                                                required
                                            />
                                        </Field>
                                    </div>

                                    {(mailDriver === 'smtp' ||
                                        mailDriver === 'log') && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">
                                                    SMTP settings
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid gap-3 md:grid-cols-2">
                                                <Field label="Host">
                                                    <Input
                                                        name="smtp_host"
                                                        defaultValue={str(
                                                            mail.smtp_host,
                                                        )}
                                                    />
                                                </Field>
                                                <Field label="Port">
                                                    <Input
                                                        name="smtp_port"
                                                        type="number"
                                                        defaultValue={str(
                                                            mail.smtp_port,
                                                        )}
                                                    />
                                                </Field>
                                                <Field label="Encryption">
                                                    <select
                                                        name="smtp_encryption"
                                                        defaultValue={
                                                            str(
                                                                mail.smtp_encryption,
                                                            ) || 'tls'
                                                        }
                                                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                                    >
                                                        <option value="tls">
                                                            TLS
                                                        </option>
                                                        <option value="ssl">
                                                            SSL
                                                        </option>
                                                    </select>
                                                </Field>
                                                <Field label="Username">
                                                    <Input
                                                        name="smtp_username"
                                                        defaultValue={str(
                                                            mail.smtp_username,
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label="Password"
                                                    hint="Leave blank to keep the saved secret."
                                                >
                                                    <Input
                                                        name="smtp_password"
                                                        type="password"
                                                        placeholder={
                                                            str(
                                                                mail.smtp_password,
                                                            )
                                                                ? '•••••••• (saved)'
                                                                : 'SMTP password'
                                                        }
                                                    />
                                                </Field>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {mailDriver === 'ses' ? (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">
                                                    Amazon SES
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid gap-3 md:grid-cols-2">
                                                <Field label="Region">
                                                    <Input
                                                        name="ses_region"
                                                        defaultValue={str(
                                                            mail.ses_region,
                                                        )}
                                                    />
                                                </Field>
                                                <Field label="SMTP host">
                                                    <Input
                                                        name="ses_host"
                                                        defaultValue={str(
                                                            mail.ses_host,
                                                        )}
                                                    />
                                                </Field>
                                                <Field label="SMTP username">
                                                    <Input
                                                        name="ses_username"
                                                        defaultValue={str(
                                                            mail.ses_username,
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label="SMTP password"
                                                    hint="Leave blank to keep the saved secret."
                                                >
                                                    <Input
                                                        name="ses_password"
                                                        type="password"
                                                        placeholder={
                                                            str(
                                                                mail.ses_password,
                                                            )
                                                                ? '•••••••• (saved)'
                                                                : 'SES password'
                                                        }
                                                    />
                                                </Field>
                                            </CardContent>
                                        </Card>
                                    ) : null}

                                    {mailDriver === 'brevo' ? (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">
                                                    Brevo
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid gap-3 md:grid-cols-2">
                                                <Field label="SMTP login">
                                                    <Input
                                                        name="brevo_login"
                                                        defaultValue={str(
                                                            mail.brevo_login,
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label="SMTP key"
                                                    hint="Leave blank to keep the saved secret."
                                                >
                                                    <Input
                                                        name="brevo_key"
                                                        type="password"
                                                        placeholder={
                                                            str(mail.brevo_key)
                                                                ? '•••••••• (saved)'
                                                                : 'Brevo key'
                                                        }
                                                    />
                                                </Field>
                                            </CardContent>
                                        </Card>
                                    ) : null}

                                    {/* Preserve unused provider values so switching drivers does not wipe saved config */}
                                    {mailDriver !== 'smtp' &&
                                    mailDriver !== 'log' ? (
                                        <>
                                            <input
                                                type="hidden"
                                                name="smtp_host"
                                                value={str(mail.smtp_host)}
                                            />
                                            <input
                                                type="hidden"
                                                name="smtp_port"
                                                value={
                                                    str(mail.smtp_port) || '587'
                                                }
                                            />
                                            <input
                                                type="hidden"
                                                name="smtp_username"
                                                value={str(mail.smtp_username)}
                                            />
                                            <input
                                                type="hidden"
                                                name="smtp_encryption"
                                                value={
                                                    str(mail.smtp_encryption) ||
                                                    'tls'
                                                }
                                            />
                                        </>
                                    ) : null}
                                    {mailDriver !== 'ses' ? (
                                        <>
                                            <input
                                                type="hidden"
                                                name="ses_host"
                                                value={str(mail.ses_host)}
                                            />
                                            <input
                                                type="hidden"
                                                name="ses_username"
                                                value={str(mail.ses_username)}
                                            />
                                            <input
                                                type="hidden"
                                                name="ses_region"
                                                value={
                                                    str(mail.ses_region) ||
                                                    'ap-southeast-1'
                                                }
                                            />
                                        </>
                                    ) : null}
                                    {mailDriver !== 'brevo' ? (
                                        <input
                                            type="hidden"
                                            name="brevo_login"
                                            value={str(mail.brevo_login)}
                                        />
                                    ) : null}

                                    <Button type="submit">
                                        Save email gateway
                                    </Button>
                                </Form>

                                <Card className="bg-muted/20">
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Send a test email
                                        </CardTitle>
                                        <CardDescription>
                                            Verifies the currently saved email
                                            gateway.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Form
                                            action="/platform/gateways/mail/test"
                                            method="post"
                                            className="flex flex-col gap-3 sm:flex-row"
                                        >
                                            <Input
                                                name="to"
                                                type="email"
                                                required
                                                placeholder="you@company.com"
                                                className="sm:max-w-sm"
                                            />
                                            <Button
                                                type="submit"
                                                variant="outline"
                                            >
                                                Send test
                                            </Button>
                                        </Form>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : null}

                        {section === 'sms' ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight">
                                        SMS gateway
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                                        BulkSMSBD, SSL Wireless, or a generic
                                        HTTP endpoint. Log driver writes
                                        messages locally for development.
                                    </p>
                                </div>

                                <Form
                                    action="/platform/gateways/sms"
                                    method="put"
                                    className="space-y-4"
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field
                                            label="Driver"
                                            htmlFor="sms_driver"
                                        >
                                            <select
                                                id="sms_driver"
                                                name="driver"
                                                value={smsDriver}
                                                onChange={(event) =>
                                                    setSmsDriver(
                                                        event.target.value,
                                                    )
                                                }
                                                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                            >
                                                <option value="log">
                                                    Log (local)
                                                </option>
                                                <option value="bulksmsbd">
                                                    BulkSMSBD
                                                </option>
                                                <option value="sslwireless">
                                                    SSL Wireless
                                                </option>
                                                <option value="http">
                                                    Custom HTTP
                                                </option>
                                            </select>
                                        </Field>
                                        <Field label="Sender ID">
                                            <Input
                                                name="sender_id"
                                                defaultValue={str(
                                                    sms.sender_id,
                                                )}
                                                placeholder="ATTENDRLY"
                                            />
                                        </Field>
                                        {(smsDriver === 'sslwireless' ||
                                            smsDriver === 'http') && (
                                            <Field
                                                label="API URL"
                                                hint="Required for SSL Wireless and custom HTTP drivers."
                                            >
                                                <Input
                                                    name="api_url"
                                                    defaultValue={str(
                                                        sms.api_url,
                                                    )}
                                                    placeholder="https://..."
                                                />
                                            </Field>
                                        )}
                                        {smsDriver !== 'sslwireless' &&
                                        smsDriver !== 'http' ? (
                                            <input
                                                type="hidden"
                                                name="api_url"
                                                value={str(sms.api_url)}
                                            />
                                        ) : null}
                                        <Field
                                            label="API key"
                                            hint="Leave blank to keep the saved secret."
                                        >
                                            <Input
                                                name="api_key"
                                                type="password"
                                                placeholder={
                                                    str(sms.api_key)
                                                        ? '•••••••• (saved)'
                                                        : 'API key'
                                                }
                                            />
                                        </Field>
                                        <Field
                                            label="API secret"
                                            hint="Leave blank to keep the saved secret."
                                        >
                                            <Input
                                                name="api_secret"
                                                type="password"
                                                placeholder={
                                                    str(sms.api_secret)
                                                        ? '•••••••• (saved)'
                                                        : 'API secret'
                                                }
                                            />
                                        </Field>
                                    </div>
                                    <Button type="submit">
                                        Save SMS gateway
                                    </Button>
                                </Form>

                                <Card className="bg-muted/20">
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Send a test SMS
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Form
                                            action="/platform/gateways/sms/test"
                                            method="post"
                                            className="flex flex-col gap-3 sm:flex-row"
                                        >
                                            <Input
                                                name="to"
                                                required
                                                placeholder="01XXXXXXXXX"
                                                className="sm:max-w-sm"
                                            />
                                            <Button
                                                type="submit"
                                                variant="outline"
                                            >
                                                Send test SMS
                                            </Button>
                                        </Form>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : null}

                        {section === 'logs' ? (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight">
                                        Recent messages
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                                        Delivery attempts from email and SMS
                                        gateways.
                                    </p>
                                </div>
                                <div className="overflow-hidden rounded-lg border">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[640px] text-sm">
                                            <thead className="bg-muted/40 text-left">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">
                                                        Channel
                                                    </th>
                                                    <th className="px-4 py-3 font-medium">
                                                        To
                                                    </th>
                                                    <th className="px-4 py-3 font-medium">
                                                        Subject
                                                    </th>
                                                    <th className="px-4 py-3 font-medium">
                                                        Status
                                                    </th>
                                                    <th className="px-4 py-3 font-medium">
                                                        When
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentMessages.data.map(
                                                    (row) => (
                                                        <tr
                                                            key={row.id}
                                                            className="border-t"
                                                        >
                                                            <td className="px-4 py-3 capitalize">
                                                                {row.channel}
                                                                {row.driver
                                                                    ? ` · ${row.driver}`
                                                                    : ''}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {row.to}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {row.subject ??
                                                                    '—'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <StatusBadge
                                                                    status={
                                                                        row.status
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="text-muted-foreground px-4 py-3">
                                                                {row.created_at ??
                                                                    '—'}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {recentMessages.data.length === 0 ? (
                                        <EmptyState
                                            title="No messages yet"
                                            description="Send a test email or SMS to populate this log."
                                        />
                                    ) : null}
                                </div>
                                <Pagination paginator={recentMessages} />
                            </div>
                        ) : null}
                    </div>
                </div>
            </PageShell>
        </>
    );
}

PlatformGateways.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Gateways', href: '/platform/gateways' },
    ],
};
