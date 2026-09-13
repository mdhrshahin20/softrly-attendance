import { Form, Head } from '@inertiajs/react';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Plan = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    employee_limit_label: string;
    office_limit_label: string;
    monthly_price: number;
    yearly_price: number;
    currency: string;
    feature_labels: string[];
};

type Props = {
    subscription: {
        status: string | null;
        status_label: string | null;
        plan_name: string | null;
        billing_cycle: string | null;
        trial_ends_at: string | null;
        current_period_end: string | null;
        is_access_active: boolean;
        is_on_trial: boolean;
        employees_used: number;
        employee_limit: number | null;
        offices_used: number;
        office_limit: number | null;
    };
    plans: Plan[];
    gateways: {
        name: string;
        label: string;
        enabled: boolean;
        configured: boolean;
        requires_redirect: boolean;
        default: boolean;
    }[];
    payments: Paginated<{
        id: number;
        amount: number;
        currency: string;
        gateway: string;
        status: string;
        status_label: string;
        notes: string | null;
        paid_at: string | null;
    }>;
    invoices: Paginated<{
        id: number;
        number: string;
        amount: number;
        status: string;
        status_label: string;
        issued_at: string | null;
        sent_at: string | null;
    }>;
    cycles: { value: string; label: string }[];
};

export default function BillingIndex({
    subscription,
    plans,
    gateways = [],
    payments,
    invoices,
    cycles,
}: Props) {
    const preferredGateway =
        gateways.find((gateway) => gateway.default)?.name ?? gateways[0]?.name ?? 'manual';
    return (
        <>
            <Head title="Billing" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold">Billing</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Plan, usage, and invoices for this workspace.
                    </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current plan</CardTitle>
                            <CardDescription>Usage is counted from live workspace data.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="text-xl font-semibold">{subscription.plan_name ?? 'No plan'}</div>
                            <StatusBadge
                                status={subscription.status ?? 'inactive'}
                                label={subscription.status_label ?? 'Inactive'}
                            />
                            {subscription.is_on_trial && subscription.trial_ends_at && (
                                <p className="text-muted-foreground">
                                    Trial ends {subscription.trial_ends_at.slice(0, 10)}
                                </p>
                            )}
                            {subscription.current_period_end && (
                                <p className="text-muted-foreground">
                                    Renews {subscription.current_period_end.slice(0, 10)}
                                </p>
                            )}
                            <div>
                                <div className="flex justify-between">
                                    <span>Employees</span>
                                    <span className="font-medium">
                                        {subscription.employees_used}
                                        {subscription.employee_limit !== null
                                            ? ` / ${subscription.employee_limit}`
                                            : ' / unlimited'}
                                    </span>
                                </div>
                                {subscription.employee_limit !== null && (
                                    <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
                                        <div
                                            className="bg-primary h-full rounded-full"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    (subscription.employees_used /
                                                        Math.max(subscription.employee_limit, 1)) *
                                                        100,
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            <p>
                                Offices {subscription.offices_used}
                                {subscription.office_limit !== null
                                    ? ` / ${subscription.office_limit}`
                                    : ' / unlimited'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
                        <CardContent>
                            {invoices.data.length === 0 && <p className="text-muted-foreground text-sm">No invoices yet.</p>}
                            <div className="space-y-2 text-sm">
                                {invoices.data.map((invoice) => (
                                    <div key={invoice.id} className="flex items-center justify-between border-b py-2 last:border-0">
                                        <div>
                                            <div>{invoice.number} · ৳{invoice.amount.toLocaleString()}</div>
                                            <div className="text-muted-foreground text-xs">{invoice.issued_at?.slice(0, 10)}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={invoice.status} label={invoice.status_label} withIcon={false} />
                                            <Button asChild size="sm" variant="outline">
                                                <a href={`/billing/invoices/${invoice.id}/download`}>Download</a>
                                            </Button>
                                            <Button asChild size="sm" variant="ghost">
                                                <a href={`/billing/invoices/${invoice.id}/print`} target="_blank" rel="noreferrer">Print</a>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination paginator={invoices} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
                        <CardContent>
                            {payments.data.length === 0 && <p className="text-muted-foreground text-sm">No payments yet.</p>}
                            <div className="space-y-2 text-sm">
                                {payments.data.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between border-b py-2 last:border-0">
                                        <div>
                                            <div>৳{payment.amount.toLocaleString()} · {payment.notes}</div>
                                            <div className="text-muted-foreground text-xs">{payment.paid_at ?? payment.status_label}</div>
                                        </div>
                                        <Badge>{payment.status_label}</Badge>
                                    </div>
                                ))}
                            </div>
                            <Pagination paginator={payments} />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {plans.map((plan) => (
                        <div key={plan.id} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between">
                                <h2 className="font-semibold">{plan.name}</h2>
                                {subscription.plan_name === plan.name && <Badge>Current</Badge>}
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
                            <div className="mt-4 text-2xl font-semibold">
                                {plan.monthly_price === 0 ? 'Custom' : `৳${plan.monthly_price.toLocaleString()}`}
                            </div>
                            <div className="text-muted-foreground text-xs">
                                {plan.monthly_price === 0 ? 'Assigned by platform admin' : `Yearly ৳${plan.yearly_price.toLocaleString()}`}
                            </div>
                            <ul className="mt-3 space-y-1 text-sm">
                                <li>{plan.employee_limit_label}</li>
                                <li>{plan.office_limit_label}</li>
                                {plan.feature_labels.slice(0, 6).map((feature) => (
                                    <li key={feature}>{feature}</li>
                                ))}
                            </ul>
                            {plan.monthly_price > 0 && (
                                <Form action="/billing/subscribe" method="post" className="mt-4 space-y-3">
                                    <input type="hidden" name="plan_id" value={plan.id} />
                                    <select
                                        name="billing_cycle"
                                        className="border-input h-9 w-full rounded-md border px-3 text-sm"
                                        defaultValue="monthly"
                                    >
                                        {cycles.map((cycle) => (
                                            <option key={cycle.value} value={cycle.value}>
                                                {cycle.label}
                                            </option>
                                        ))}
                                    </select>
                                    {gateways.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="text-muted-foreground text-xs font-medium">
                                                Payment method
                                            </div>
                                            <div className="grid gap-2">
                                                {gateways.map((gateway) => (
                                                    <label
                                                        key={gateway.name}
                                                        className="hover:bg-muted/40 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="gateway"
                                                            value={gateway.name}
                                                            defaultChecked={
                                                                gateway.name === preferredGateway
                                                            }
                                                        />
                                                        <span className="font-medium">{gateway.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    <Button type="submit" className="w-full">
                                        Pay & activate
                                    </Button>
                                </Form>
                            )}
                        </div>
                    ))}
                </div>

                {subscription.status !== 'cancelled' && (
                    <Form action="/billing/cancel" method="post">
                        <Button type="submit" variant="outline">Cancel subscription</Button>
                    </Form>
                )}
            </div>
        </>
    );
}

BillingIndex.layout = {
    breadcrumbs: [
        { title: 'Settings', href: '/settings' },
        { title: 'Billing', href: '/settings/billing' },
    ],
};
