import { Form, Head, Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { DeleteConfirm } from '@/components/delete-confirm';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FeatureOption = { value: string; label: string };

type Plan = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    employee_limit: number | null;
    office_limit: number | null;
    employee_limit_label: string;
    office_limit_label: string;
    monthly_price: number;
    yearly_price: number;
    currency: string;
    trial_days: number;
    features: string[];
    feature_labels: string[];
    is_public: boolean;
    is_active: boolean;
    sort_order: number;
    subscriptions_count: number;
    created_at?: string | null;
    updated_at?: string | null;
};

type Subscriber = {
    id: number;
    tenant_id: number;
    tenant: string | null;
    tenant_email: string | null;
    status: string;
    billing_cycle: string;
    started_at: string | null;
    current_period_end: string | null;
};

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'edit', label: 'Edit plan' },
    { id: 'subscribers', label: 'Subscribers' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function FeatureChecks({
    options,
    selected,
}: {
    options: FeatureOption[];
    selected?: string[];
}) {
    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {options.map((feature) => (
                <label key={feature.value} className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        name="features[]"
                        value={feature.value}
                        defaultChecked={selected?.includes(feature.value)}
                    />
                    {feature.label}
                </label>
            ))}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="grid gap-1 border-b py-3 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="text-sm font-medium break-words">{value || '—'}</dd>
        </div>
    );
}

export default function PlatformPlanShow({
    plan,
    subscribers,
    featureOptions,
}: {
    plan: Plan;
    subscribers: Subscriber[];
    featureOptions: FeatureOption[];
}) {
    const [tab, setTab] = useState<TabId>('overview');

    return (
        <>
            <Head title={plan.name} />
            <PageShell>
                <PageHeader
                    title={plan.name}
                    description={plan.description || `${plan.slug} commercial plan`}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            {plan.is_public ? <Badge>Public</Badge> : <Badge variant="secondary">Private</Badge>}
                            {plan.is_active ? (
                                <Badge variant="outline">Active</Badge>
                            ) : (
                                <Badge variant="secondary">Inactive</Badge>
                            )}
                            <Button variant="outline" asChild>
                                <Link href="/platform/plans">Back to list</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/platform/plans/create">Create new</Link>
                            </Button>
                        </div>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: 'Monthly',
                            value: `৳${plan.monthly_price.toLocaleString()}`,
                        },
                        {
                            label: 'Yearly',
                            value: `৳${plan.yearly_price.toLocaleString()}`,
                        },
                        { label: 'Subscribers', value: plan.subscriptions_count },
                        { label: 'Trial days', value: plan.trial_days },
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
                                <CardTitle>Plan details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl>
                                    <DetailRow label="Name" value={plan.name} />
                                    <DetailRow label="Slug" value={plan.slug} />
                                    <DetailRow label="Description" value={plan.description} />
                                    <DetailRow label="Employees" value={plan.employee_limit_label} />
                                    <DetailRow label="Offices" value={plan.office_limit_label} />
                                    <DetailRow label="Currency" value={plan.currency} />
                                    <DetailRow label="Sort order" value={plan.sort_order} />
                                    <DetailRow label="Created" value={plan.created_at} />
                                    <DetailRow label="Updated" value={plan.updated_at} />
                                </dl>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Included features</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {plan.feature_labels.length === 0 ? (
                                    <EmptyState title="No features selected" />
                                ) : (
                                    plan.feature_labels.map((feature) => (
                                        <div key={feature} className="border-b py-2 text-sm last:border-0">
                                            {feature}
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                {tab === 'edit' ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit plan</CardTitle>
                            <CardDescription>
                                Updates apply immediately to pricing and tenant entitlements.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Form
                                action={`/platform/plans/${plan.id}`}
                                method="put"
                                className="space-y-4"
                            >
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-name">Plan name</Label>
                                        <Input
                                            id="edit-name"
                                            name="name"
                                            defaultValue={plan.name}
                                            required
                                            placeholder="Growth"
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="edit-description">Description</Label>
                                        <Input
                                            id="edit-description"
                                            name="description"
                                            defaultValue={plan.description ?? ''}
                                            placeholder="Who this plan is for"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-employee-limit">Employee limit</Label>
                                        <Input
                                            id="edit-employee-limit"
                                            name="employee_limit"
                                            type="number"
                                            min={1}
                                            defaultValue={plan.employee_limit ?? ''}
                                            placeholder="Blank = unlimited"
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            Leave blank for unlimited employees.
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-office-limit">Office limit</Label>
                                        <Input
                                            id="edit-office-limit"
                                            name="office_limit"
                                            type="number"
                                            min={1}
                                            defaultValue={plan.office_limit ?? ''}
                                            placeholder="Blank = unlimited"
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            Leave blank for unlimited offices.
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-monthly-price">Monthly price (৳)</Label>
                                        <Input
                                            id="edit-monthly-price"
                                            name="monthly_price"
                                            type="number"
                                            min={0}
                                            defaultValue={plan.monthly_price}
                                            required
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-yearly-price">Yearly price (৳)</Label>
                                        <Input
                                            id="edit-yearly-price"
                                            name="yearly_price"
                                            type="number"
                                            min={0}
                                            defaultValue={plan.yearly_price}
                                            required
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-trial-days">Trial days</Label>
                                        <Input
                                            id="edit-trial-days"
                                            name="trial_days"
                                            type="number"
                                            min={0}
                                            defaultValue={plan.trial_days}
                                            placeholder="14"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-sort-order">Sort order</Label>
                                        <Input
                                            id="edit-sort-order"
                                            name="sort_order"
                                            type="number"
                                            min={0}
                                            defaultValue={plan.sort_order}
                                            placeholder="0"
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            Lower numbers appear first on the pricing page.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Features</Label>
                                    <p className="text-muted-foreground text-xs">
                                        Select what this plan unlocks for tenants.
                                    </p>
                                    <FeatureChecks options={featureOptions} selected={plan.features} />
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <label className="flex items-center gap-2">
                                        <input type="hidden" name="is_public" value="0" />
                                        <input
                                            type="checkbox"
                                            name="is_public"
                                            value="1"
                                            defaultChecked={plan.is_public}
                                        />
                                        Public on pricing page
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="hidden" name="is_active" value="0" />
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            value="1"
                                            defaultChecked={plan.is_active}
                                        />
                                        Active
                                    </label>
                                </div>
                                <Button type="submit">Save changes</Button>
                            </Form>
                            <DeleteConfirm
                                action={`/platform/plans/${plan.id}`}
                                title="Delete this plan?"
                                description={
                                    plan.subscriptions_count > 0
                                        ? 'This plan has subscriptions, so deletion will be blocked. Deactivate it instead.'
                                        : `Delete ${plan.name}? This cannot be undone.`
                                }
                                disabled={plan.subscriptions_count > 0}
                                disabledTitle="Plans with subscriptions cannot be deleted."
                            />
                        </CardContent>
                    </Card>
                ) : null}

                {tab === 'subscribers' ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscribers</CardTitle>
                            <CardDescription>
                                Tenants currently or historically linked to this plan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {subscribers.length === 0 ? (
                                <EmptyState
                                    title="No subscribers yet"
                                    description="Assign this plan from a customer detail page."
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[640px] text-sm">
                                        <thead className="text-muted-foreground text-left">
                                            <tr>
                                                <th className="py-2 pr-3">Customer</th>
                                                <th className="py-2 pr-3">Status</th>
                                                <th className="py-2 pr-3">Cycle</th>
                                                <th className="py-2 pr-3">Started</th>
                                                <th className="py-2">Period end</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subscribers.map((item) => (
                                                <tr key={item.id} className="border-t">
                                                    <td className="py-2 pr-3">
                                                        <Link
                                                            href={`/platform/tenants/${item.tenant_id}`}
                                                            className="font-medium hover:underline"
                                                        >
                                                            {item.tenant ?? `Tenant #${item.tenant_id}`}
                                                        </Link>
                                                        <div className="text-muted-foreground text-xs">
                                                            {item.tenant_email}
                                                        </div>
                                                    </td>
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
                ) : null}
            </PageShell>
        </>
    );
}

PlatformPlanShow.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Plans', href: '/platform/plans' },
        { title: 'Plan', href: '#' },
    ],
};
