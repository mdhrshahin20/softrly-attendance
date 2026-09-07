import { Form, Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    payments: {
        id: number;
        amount: number;
        currency: string;
        gateway: string;
        status: string;
        status_label: string;
        notes: string | null;
        paid_at: string | null;
    }[];
    cycles: { value: string; label: string }[];
};

export default function BillingIndex({ subscription, plans, payments, cycles }: Props) {
    return (
        <>
            <Head title="Billing" />
            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-semibold">Billing</h1>
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader><CardTitle>Current plan</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="text-xl font-semibold">{subscription.plan_name ?? 'No plan'}</div>
                            <div><Badge>{subscription.status_label}</Badge></div>
                            {subscription.is_on_trial && subscription.trial_ends_at && (
                                <p>Trial ends {subscription.trial_ends_at.slice(0, 10)}</p>
                            )}
                            {subscription.current_period_end && (
                                <p>Current period ends {subscription.current_period_end.slice(0, 10)}</p>
                            )}
                            <p>
                                Employees {subscription.employees_used}
                                {subscription.employee_limit !== null ? ` / ${subscription.employee_limit}` : ' / unlimited'}
                            </p>
                            <p>
                                Offices {subscription.offices_used}
                                {subscription.office_limit !== null ? ` / ${subscription.office_limit}` : ' / unlimited'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
                        <CardContent>
                            {payments.length === 0 && <p className="text-muted-foreground text-sm">No payments yet.</p>}
                            <div className="space-y-2 text-sm">
                                {payments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between border-b py-2 last:border-0">
                                        <div>
                                            <div>৳{payment.amount.toLocaleString()} · {payment.notes}</div>
                                            <div className="text-muted-foreground text-xs">{payment.paid_at ?? payment.status_label}</div>
                                        </div>
                                        <Badge>{payment.status_label}</Badge>
                                    </div>
                                ))}
                            </div>
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
                                <Form action="/billing/subscribe" method="post" className="mt-4 space-y-2">
                                    <input type="hidden" name="plan_id" value={plan.id} />
                                    <select name="billing_cycle" className="border-input h-9 w-full rounded-md border px-3 text-sm" defaultValue="monthly">
                                        {cycles.map((cycle) => (
                                            <option key={cycle.value} value={cycle.value}>{cycle.label}</option>
                                        ))}
                                    </select>
                                    <Button type="submit" className="w-full">Pay & activate</Button>
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
    breadcrumbs: [{ title: 'Billing', href: '/billing' }],
};
