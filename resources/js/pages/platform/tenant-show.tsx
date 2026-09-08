import { Form, Head, Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PlanOption = { id: number; name: string };

type TenantDetail = {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    email: string;
    phone: string | null;
    country: string;
    timezone: string;
    currency: string;
    status: string;
    trial_ends_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    employees_count: number;
    offices_count: number;
    users_count: number;
    owner: { id: number; name: string; email: string } | null;
    subscription: {
        id: number;
        plan: string | null;
        plan_id: number | null;
        status: string;
        billing_cycle: string;
        started_at: string | null;
        trial_ends_at: string | null;
        current_period_start: string | null;
        current_period_end: string | null;
        cancelled_at: string | null;
        allows_access: boolean;
    } | null;
    domains: { id: number; hostname: string; type: string; status: string; is_primary: boolean }[];
    settings: Record<string, unknown>;
    users: { id: number; name: string; email: string; is_owner: boolean }[];
    subscriptions: {
        id: number;
        plan: string | null;
        status: string;
        billing_cycle: string;
        started_at: string | null;
        trial_ends_at: string | null;
        current_period_end: string | null;
        cancelled_at: string | null;
    }[];
    invoices: {
        id: number;
        number: string;
        status: string;
        status_label: string;
        amount: number;
        currency: string;
        plan: string | null;
        issued_at: string | null;
    }[];
    payments: {
        id: number;
        amount: number;
        currency: string;
        gateway: string;
        transaction_id: string | null;
        status: string;
        paid_at: string | null;
        created_at: string | null;
    }[];
};

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'billing', label: 'Billing' },
    { id: 'users', label: 'Users' },
    { id: 'activity', label: 'Invoices & payments' },
    { id: 'settings', label: 'Settings' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="grid gap-1 border-b py-3 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="text-sm font-medium break-words">{value || '—'}</dd>
        </div>
    );
}

export default function PlatformTenantShow({
    tenant,
    plans,
}: {
    tenant: TenantDetail;
    plans: PlanOption[];
}) {
    const [tab, setTab] = useState<TabId>('overview');

    return (
        <>
            <Head title={tenant.name} />
            <PageShell>
                <PageHeader
                    title={tenant.name}
                    description={`${tenant.slug} · ${tenant.email}`}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <StatusBadge status={tenant.status} />
                            <Button variant="outline" asChild>
                                <Link href="/platform/tenants">Back to list</Link>
                            </Button>
                        </div>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Employees', value: tenant.employees_count },
                        { label: 'Users', value: tenant.users_count },
                        { label: 'Offices', value: tenant.offices_count },
                        {
                            label: 'Access',
                            value: tenant.subscription?.allows_access ? 'Active' : 'Paused',
                        },
                    ].map((item) => (
                        <Card key={item.label}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-muted-foreground text-sm font-medium">
                                    {item.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-2xl font-semibold tracking-tight">
                                {item.value}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-wrap gap-1 border-b">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={cn(
                                'rounded-t-lg px-3 py-2 text-sm transition-colors',
                                tab === item.id
                                    ? 'border-b-2 border-primary text-foreground font-medium'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {tab === 'overview' ? (
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Company information</CardTitle>
                                <CardDescription>Workspace identity and localization.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <dl>
                                    <DetailRow label="Company" value={tenant.name} />
                                    <DetailRow label="Slug" value={tenant.slug} />
                                    <DetailRow label="UUID" value={tenant.uuid} />
                                    <DetailRow label="Email" value={tenant.email} />
                                    <DetailRow label="Phone" value={tenant.phone} />
                                    <DetailRow label="Country" value={tenant.country} />
                                    <DetailRow label="Timezone" value={tenant.timezone} />
                                    <DetailRow label="Currency" value={tenant.currency} />
                                    <DetailRow label="Created" value={tenant.created_at} />
                                    <DetailRow label="Updated" value={tenant.updated_at} />
                                </dl>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Owner</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    {tenant.owner ? (
                                        <>
                                            <div className="font-medium">{tenant.owner.name}</div>
                                            <div className="text-muted-foreground">{tenant.owner.email}</div>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground">No owner assigned.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Account actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Form
                                        action={`/platform/tenants/${tenant.id}/status`}
                                        method="patch"
                                    >
                                        <input
                                            type="hidden"
                                            name="status"
                                            value={
                                                tenant.status === 'suspended' ? 'active' : 'suspended'
                                            }
                                        />
                                        <Button type="submit" variant="outline" className="w-full">
                                            {tenant.status === 'suspended'
                                                ? 'Activate customer'
                                                : 'Suspend customer'}
                                        </Button>
                                    </Form>
                                    <Form
                                        action={`/platform/tenants/${tenant.id}/trial`}
                                        method="patch"
                                        className="flex gap-2"
                                    >
                                        <input type="hidden" name="days" value="14" />
                                        <Button type="submit" variant="secondary" className="w-full">
                                            Extend trial +14 days
                                        </Button>
                                    </Form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : null}

                {tab === 'billing' ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Current subscription</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tenant.subscription ? (
                                    <dl>
                                        <DetailRow label="Plan" value={tenant.subscription.plan} />
                                        <DetailRow
                                            label="Status"
                                            value={<StatusBadge status={tenant.subscription.status} />}
                                        />
                                        <DetailRow
                                            label="Billing cycle"
                                            value={tenant.subscription.billing_cycle}
                                        />
                                        <DetailRow
                                            label="Started"
                                            value={tenant.subscription.started_at}
                                        />
                                        <DetailRow
                                            label="Trial ends"
                                            value={tenant.subscription.trial_ends_at}
                                        />
                                        <DetailRow
                                            label="Period"
                                            value={
                                                tenant.subscription.current_period_start ||
                                                tenant.subscription.current_period_end
                                                    ? `${tenant.subscription.current_period_start ?? '—'} → ${tenant.subscription.current_period_end ?? '—'}`
                                                    : null
                                            }
                                        />
                                        <DetailRow
                                            label="Cancelled"
                                            value={tenant.subscription.cancelled_at}
                                        />
                                    </dl>
                                ) : (
                                    <EmptyState
                                        title="No subscription"
                                        description="Assign a plan to activate billing for this workspace."
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Assign plan</CardTitle>
                                <CardDescription>
                                    Changes take effect immediately for this tenant.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    action={`/platform/tenants/${tenant.id}/plan`}
                                    method="patch"
                                    className="space-y-3"
                                >
                                    <select
                                        name="plan_id"
                                        defaultValue={tenant.subscription?.plan_id ?? ''}
                                        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                        required
                                    >
                                        <option value="" disabled>
                                            Select a plan
                                        </option>
                                        {plans.map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        name="billing_cycle"
                                        defaultValue={
                                            tenant.subscription?.billing_cycle ?? 'monthly'
                                        }
                                        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                    <Button type="submit">Save plan</Button>
                                </Form>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Subscription history</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tenant.subscriptions.length === 0 ? (
                                    <EmptyState title="No subscription history" />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-muted-foreground text-left">
                                                <tr>
                                                    <th className="py-2 pr-3">Plan</th>
                                                    <th className="py-2 pr-3">Status</th>
                                                    <th className="py-2 pr-3">Cycle</th>
                                                    <th className="py-2 pr-3">Started</th>
                                                    <th className="py-2">Period end</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tenant.subscriptions.map((item) => (
                                                    <tr key={item.id} className="border-t">
                                                        <td className="py-2 pr-3">{item.plan ?? '—'}</td>
                                                        <td className="py-2 pr-3">
                                                            <StatusBadge status={item.status} />
                                                        </td>
                                                        <td className="py-2 pr-3 capitalize">
                                                            {item.billing_cycle}
                                                        </td>
                                                        <td className="py-2 pr-3">
                                                            {item.started_at ?? '—'}
                                                        </td>
                                                        <td className="py-2">
                                                            {item.current_period_end ?? '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                {tab === 'users' ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Users</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {tenant.users.length === 0 ? (
                                    <EmptyState title="No users yet" />
                                ) : (
                                    tenant.users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between gap-3 border-b py-2 last:border-0"
                                        >
                                            <div>
                                                <div className="text-sm font-medium">{user.name}</div>
                                                <div className="text-muted-foreground text-xs">
                                                    {user.email}
                                                </div>
                                            </div>
                                            {user.is_owner ? <StatusBadge status="active" label="Owner" /> : null}
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Domains</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {tenant.domains.length === 0 ? (
                                    <EmptyState title="No custom domains" />
                                ) : (
                                    tenant.domains.map((domain) => (
                                        <div key={domain.id} className="border-b py-2 text-sm last:border-0">
                                            <div className="font-medium">{domain.hostname}</div>
                                            <div className="text-muted-foreground text-xs">
                                                {domain.type}
                                                {domain.is_primary ? ' · primary' : ''} · {domain.status}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                {tab === 'activity' ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Invoices</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tenant.invoices.length === 0 ? (
                                    <EmptyState title="No invoices yet" />
                                ) : (
                                    <div className="space-y-3">
                                        {tenant.invoices.map((invoice) => (
                                            <div
                                                key={invoice.id}
                                                className="flex items-center justify-between gap-3 border-b py-2 last:border-0"
                                            >
                                                <div>
                                                    <Link
                                                        href={`/platform/invoices/${invoice.id}`}
                                                        className="text-sm font-medium hover:underline"
                                                    >
                                                        {invoice.number}
                                                    </Link>
                                                    <div className="text-muted-foreground text-xs">
                                                        {invoice.plan ?? 'Subscription'} ·{' '}
                                                        {invoice.issued_at ?? '—'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">
                                                        ৳{invoice.amount.toLocaleString()}
                                                    </div>
                                                    <StatusBadge status={invoice.status} label={invoice.status_label} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Payments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tenant.payments.length === 0 ? (
                                    <EmptyState title="No payments yet" />
                                ) : (
                                    <div className="space-y-3">
                                        {tenant.payments.map((payment) => (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between gap-3 border-b py-2 last:border-0"
                                            >
                                                <div>
                                                    <div className="text-sm font-medium capitalize">
                                                        {payment.gateway}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {payment.transaction_id ?? payment.created_at ?? '—'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">
                                                        ৳{payment.amount.toLocaleString()}
                                                    </div>
                                                    <StatusBadge status={payment.status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                {tab === 'settings' ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Workspace settings</CardTitle>
                            <CardDescription>
                                Key/value configuration stored for this tenant.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(tenant.settings).length === 0 ? (
                                <EmptyState title="No settings stored" />
                            ) : (
                                <dl>
                                    {Object.entries(tenant.settings).map(([key, value]) => (
                                        <DetailRow
                                            key={key}
                                            label={key}
                                            value={
                                                typeof value === 'object'
                                                    ? JSON.stringify(value)
                                                    : String(value)
                                            }
                                        />
                                    ))}
                                </dl>
                            )}
                        </CardContent>
                    </Card>
                ) : null}
            </PageShell>
        </>
    );
}

PlatformTenantShow.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Customers', href: '/platform/tenants' },
        { title: 'Customer', href: '#' },
    ],
};
