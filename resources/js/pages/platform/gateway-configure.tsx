import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    CheckCircle2,
    CircleAlert,
    CreditCard,
    FlaskConical,
    LockKeyhole,
    Rocket,
    ShieldCheck,
    Star,
    Wallet,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type Gateway = {
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
    gateway: Gateway;
    config: Record<string, unknown>;
};

function str(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
}

function bool(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
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
        <div className="space-y-2">
            <Label htmlFor={htmlFor} className="text-sm font-medium">
                {label}
            </Label>
            {children}
            {hint ? <p className="text-muted-foreground text-xs leading-5">{hint}</p> : null}
        </div>
    );
}

function gatewayMeta(name: string) {
    switch (name) {
        case 'sslcommerz':
            return {
                icon: CreditCard,
                accent: 'bg-primary/10 text-primary',
                tip: 'Use sandbox credentials first. Switch to Live only after merchant verification.',
            };
        case 'bkash':
            return {
                icon: Wallet,
                accent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                tip: 'Sandbox and Live use different bKash merchant credentials. Keep them separate.',
            };
        default:
            return {
                icon: Banknote,
                accent: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
                tip: 'No merchant API keys required. Ideal for demos, invoices, and bank transfers.',
            };
    }
}

export default function PlatformGatewayConfigure({ gateway, config }: Props) {
    const [mode, setMode] = useState(str(config.mode) || 'sandbox');
    const [enabled, setEnabled] = useState(bool(config.enabled));
    const [preferred, setPreferred] = useState(gateway.default);
    const meta = gatewayMeta(gateway.name);
    const Icon = meta.icon;
    const ready = enabled && (gateway.name === 'manual' || gateway.configured);

    return (
        <>
            <Head title={`Configure ${gateway.label}`} />
            <PageShell className="max-w-6xl">
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-3">
                            <Link
                                href="/platform/gateways"
                                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
                            >
                                <ArrowLeft className="size-3.5" />
                                Back to gateways
                            </Link>
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        'flex size-12 shrink-0 items-center justify-center rounded-2xl',
                                        meta.accent,
                                    )}
                                >
                                    <Icon className="size-5" />
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <h1 className="text-2xl font-semibold tracking-tight">
                                        {gateway.label}
                                    </h1>
                                    <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                                        {gateway.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            {
                                label: 'Availability',
                                value: enabled ? 'Enabled' : 'Disabled',
                                ok: enabled,
                            },
                            {
                                label: 'Environment',
                                value: gateway.supports_mode ? mode : 'Not required',
                                ok: true,
                            },
                            {
                                label: 'Credentials',
                                value:
                                    gateway.name === 'manual'
                                        ? 'Built-in'
                                        : gateway.configured
                                          ? 'Saved'
                                          : 'Missing',
                                ok: gateway.name === 'manual' || gateway.configured,
                            },
                            {
                                label: 'Checkout',
                                value: preferred ? 'Preferred' : ready ? 'Available' : 'Not ready',
                                ok: ready,
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="bg-card rounded-2xl border px-4 py-3"
                            >
                                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                    {item.label}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    {item.ok ? (
                                        <CheckCircle2 className="text-success size-4" />
                                    ) : (
                                        <CircleAlert className="text-warning size-4" />
                                    )}
                                    <span className="text-sm font-semibold capitalize">
                                        {item.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Form
                    action={`/platform/gateways/payments/${gateway.name}`}
                    method="put"
                    className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
                >
                    {({ processing }) => (
                        <>
                            <div className="space-y-6">
                                <section className="bg-card overflow-hidden rounded-2xl border">
                                    <div className="border-b px-5 py-4">
                                        <h2 className="text-base font-semibold">Availability</h2>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            Control whether tenants can use this payment method.
                                        </p>
                                    </div>
                                    <div className="p-5">
                                        <label className="hover:bg-muted/40 flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-4 transition-colors">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium">
                                                    Enable {gateway.label}
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-sm leading-6">
                                                    When enabled, this gateway appears in tenant
                                                    billing checkout.
                                                </p>
                                            </div>
                                            <input type="hidden" name="enabled" value="0" />
                                            <span
                                                className={cn(
                                                    'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                                                    enabled ? 'bg-primary' : 'bg-muted',
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    name="enabled"
                                                    value="1"
                                                    checked={enabled}
                                                    onChange={(event) =>
                                                        setEnabled(event.target.checked)
                                                    }
                                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                    aria-label={`Enable ${gateway.label}`}
                                                />
                                                <span
                                                    className={cn(
                                                        'bg-background absolute top-0.5 left-0.5 size-5 rounded-full shadow-sm transition-transform',
                                                        enabled && 'translate-x-5',
                                                    )}
                                                />
                                            </span>
                                        </label>
                                    </div>
                                </section>

                                {gateway.supports_mode ? (
                                    <section className="bg-card overflow-hidden rounded-2xl border">
                                        <div className="border-b px-5 py-4">
                                            <h2 className="text-base font-semibold">Environment</h2>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                Choose Sandbox or Live for {gateway.label} only.
                                                Other gateways keep their own mode.
                                            </p>
                                        </div>
                                        <div className="grid gap-3 p-5 sm:grid-cols-2">
                                            {(
                                                [
                                                    {
                                                        value: 'sandbox' as const,
                                                        title: 'Sandbox',
                                                        body: 'Safe testing with provider sandbox credentials.',
                                                        icon: FlaskConical,
                                                    },
                                                    {
                                                        value: 'live' as const,
                                                        title: 'Live',
                                                        body: 'Production payments with live merchant credentials.',
                                                        icon: Rocket,
                                                    },
                                                ] as const
                                            ).map((option) => {
                                                const OptionIcon = option.icon;
                                                const active = mode === option.value;

                                                return (
                                                    <label
                                                        key={option.value}
                                                        className={cn(
                                                            'relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-all',
                                                            active
                                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                                : 'hover:bg-muted/30',
                                                        )}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="mode"
                                                            value={option.value}
                                                            className="sr-only"
                                                            checked={active}
                                                            onChange={() => setMode(option.value)}
                                                        />
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div
                                                                className={cn(
                                                                    'flex size-10 items-center justify-center rounded-xl',
                                                                    active
                                                                        ? 'bg-primary text-primary-foreground'
                                                                        : 'bg-muted text-muted-foreground',
                                                                )}
                                                            >
                                                                <OptionIcon className="size-4" />
                                                            </div>
                                                            {active ? (
                                                                <span className="text-primary text-xs font-medium">
                                                                    Selected
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold">
                                                                {option.title}
                                                            </div>
                                                            <p className="text-muted-foreground mt-1 text-sm leading-6">
                                                                {option.body}
                                                            </p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ) : null}

                                <section className="bg-card overflow-hidden rounded-2xl border">
                                    <div className="border-b px-5 py-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                                                <LockKeyhole className="size-4" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-semibold">
                                                    Credentials
                                                </h2>
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    {meta.tip}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-5 p-5">
                                        {gateway.name === 'manual' ? (
                                            <div className="bg-muted/40 rounded-2xl border border-dashed px-4 py-6 text-center">
                                                <ShieldCheck className="text-muted-foreground mx-auto size-8" />
                                                <p className="mt-3 text-sm font-medium">
                                                    No API credentials required
                                                </p>
                                                <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm leading-6">
                                                    Manual payments are confirmed offline. Use this
                                                    for bank transfers, demos, and invoice follow-up.
                                                </p>
                                            </div>
                                        ) : null}

                                        {gateway.name === 'sslcommerz' ? (
                                            <div className="grid gap-5">
                                                <Field label="Store ID" htmlFor="store_id">
                                                    <Input
                                                        id="store_id"
                                                        name="store_id"
                                                        defaultValue={str(config.store_id)}
                                                        placeholder="Your SSLCommerz store ID"
                                                        autoComplete="off"
                                                        className="h-11"
                                                    />
                                                </Field>
                                                <Field
                                                    label="Store password"
                                                    hint="Leave blank to keep the currently saved secret."
                                                >
                                                    <Input
                                                        name="store_password"
                                                        type="password"
                                                        placeholder={
                                                            str(config.store_password)
                                                                ? '•••••••• (saved)'
                                                                : 'Store password'
                                                        }
                                                        autoComplete="new-password"
                                                        className="h-11"
                                                    />
                                                </Field>
                                            </div>
                                        ) : null}

                                        {gateway.name === 'bkash' ? (
                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <Field label="App key" htmlFor="app_key">
                                                    <Input
                                                        id="app_key"
                                                        name="app_key"
                                                        defaultValue={str(config.app_key)}
                                                        placeholder="bKash app key"
                                                        autoComplete="off"
                                                        className="h-11"
                                                    />
                                                </Field>
                                                <Field
                                                    label="App secret"
                                                    hint="Leave blank to keep the saved secret."
                                                >
                                                    <Input
                                                        name="app_secret"
                                                        type="password"
                                                        placeholder={
                                                            str(config.app_secret)
                                                                ? '•••••••• (saved)'
                                                                : 'App secret'
                                                        }
                                                        autoComplete="new-password"
                                                        className="h-11"
                                                    />
                                                </Field>
                                                <Field label="Username" htmlFor="username">
                                                    <Input
                                                        id="username"
                                                        name="username"
                                                        defaultValue={str(config.username)}
                                                        placeholder="API username"
                                                        autoComplete="off"
                                                        className="h-11"
                                                    />
                                                </Field>
                                                <Field
                                                    label="Password"
                                                    hint="Leave blank to keep the saved secret."
                                                >
                                                    <Input
                                                        name="password"
                                                        type="password"
                                                        placeholder={
                                                            str(config.password)
                                                                ? '•••••••• (saved)'
                                                                : 'API password'
                                                        }
                                                        autoComplete="new-password"
                                                        className="h-11"
                                                    />
                                                </Field>
                                            </div>
                                        ) : null}
                                    </div>
                                </section>

                                <section className="bg-card overflow-hidden rounded-2xl border">
                                    <div className="border-b px-5 py-4">
                                        <h2 className="text-base font-semibold">Checkout preference</h2>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            Preferred gateway is used when a tenant does not pick a
                                            method.
                                        </p>
                                    </div>
                                    <div className="p-5">
                                        <label
                                            className={cn(
                                                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all',
                                                preferred
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                    : 'hover:bg-muted/30',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                name="is_preferred"
                                                value="1"
                                                checked={preferred}
                                                onChange={(event) =>
                                                    setPreferred(event.target.checked)
                                                }
                                                className="mt-1 size-4"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Star className="size-4" />
                                                    Set as preferred default
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-sm leading-6">
                                                    {gateway.label} will be selected first during
                                                    subscription checkout.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </section>

                                <div className="bg-background/90 sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur">
                                    <p className="text-muted-foreground text-sm">
                                        Changes apply immediately after saving.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="outline" asChild>
                                            <Link href="/platform/gateways">Cancel</Link>
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? <Spinner /> : null}
                                            Save configuration
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                                <div className="bg-card rounded-2xl border p-5">
                                    <h3 className="text-sm font-semibold">Setup checklist</h3>
                                    <ul className="mt-4 space-y-3 text-sm">
                                        {[
                                            {
                                                done: enabled,
                                                label: 'Gateway enabled',
                                            },
                                            {
                                                done:
                                                    !gateway.supports_mode ||
                                                    mode === 'sandbox' ||
                                                    mode === 'live',
                                                label: gateway.supports_mode
                                                    ? `Mode set to ${mode}`
                                                    : 'Environment not required',
                                            },
                                            {
                                                done:
                                                    gateway.name === 'manual' || gateway.configured,
                                                label:
                                                    gateway.name === 'manual'
                                                        ? 'No credentials needed'
                                                        : 'Credentials saved',
                                            },
                                            {
                                                done: preferred || !preferred,
                                                label: preferred
                                                    ? 'Marked as preferred'
                                                    : 'Optional preferred default',
                                            },
                                        ].map((item) => (
                                            <li key={item.label} className="flex items-start gap-2.5">
                                                <CheckCircle2
                                                    className={cn(
                                                        'mt-0.5 size-4 shrink-0',
                                                        item.done
                                                            ? 'text-success'
                                                            : 'text-muted-foreground/40',
                                                    )}
                                                />
                                                <span
                                                    className={cn(
                                                        item.done
                                                            ? 'text-foreground'
                                                            : 'text-muted-foreground',
                                                    )}
                                                >
                                                    {item.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="rounded-2xl border border-dashed px-5 py-4">
                                    <p className="text-sm font-medium">Need help?</p>
                                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                                        Enable the gateway, choose Sandbox while testing, then switch
                                        to Live with production credentials.
                                    </p>
                                </div>
                            </aside>
                        </>
                    )}
                </Form>
            </PageShell>
        </>
    );
}

PlatformGatewayConfigure.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Gateways', href: '/platform/gateways' },
        { title: 'Configure', href: '#' },
    ],
};
