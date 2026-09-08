import { Form, Head } from '@inertiajs/react';
import { DeleteConfirm } from '@/components/delete-confirm';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FeatureOption = { value: string; label: string };

type Plan = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    employee_limit: number | null;
    office_limit: number | null;
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
};

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

export default function PlatformPlans({
    plans,
    featureOptions,
}: {
    plans: Paginated<Plan>;
    featureOptions: FeatureOption[];
}) {
    return (
        <>
            <Head title="Plans" />
            <PageShell>
                <PageHeader
                    title="Plans"
                    description="Create and edit commercial plans. Changes apply immediately to pricing and tenant entitlements."
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Create a plan</CardTitle>
                        <CardDescription>Name it, set limits and prices, then pick the features this plan unlocks.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form action="/platform/plans" method="post" className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="new-name">Name</Label>
                                    <Input id="new-name" name="name" required placeholder="Growth" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="new-slug">Slug (optional)</Label>
                                    <Input id="new-slug" name="slug" placeholder="growth" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <Label htmlFor="new-description">Description</Label>
                                    <Input id="new-description" name="description" placeholder="Who this plan is for" />
                                </div>
                                <Input name="employee_limit" type="number" min={1} placeholder="Employee limit (blank = unlimited)" />
                                <Input name="office_limit" type="number" min={1} placeholder="Office limit (blank = unlimited)" />
                                <Input name="monthly_price" type="number" min={0} defaultValue={0} required placeholder="Monthly price" />
                                <Input name="yearly_price" type="number" min={0} defaultValue={0} required placeholder="Yearly price" />
                                <Input name="trial_days" type="number" min={0} defaultValue={14} placeholder="Trial days" />
                                <Input name="sort_order" type="number" min={0} placeholder="Sort order" />
                            </div>
                            <FeatureChecks options={featureOptions} />
                            <div className="flex gap-4 text-sm">
                                <label className="flex items-center gap-2">
                                    <input type="hidden" name="is_public" value="0" />
                                    <input type="checkbox" name="is_public" value="1" defaultChecked />
                                    Public on pricing page
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="hidden" name="is_active" value="0" />
                                    <input type="checkbox" name="is_active" value="1" defaultChecked />
                                    Active
                                </label>
                            </div>
                            <Button type="submit">Create plan</Button>
                        </Form>
                    </CardContent>
                </Card>
                <div className="grid gap-4 lg:grid-cols-2">
                    {plans.data.map((plan) => (
                        <Card key={plan.id}>
                            <CardHeader className="flex flex-row items-start justify-between gap-3">
                                <div>
                                    <CardTitle>{plan.name}</CardTitle>
                                    <CardDescription>
                                        {plan.slug} · {plan.subscriptions_count} subscription{plan.subscriptions_count === 1 ? '' : 's'}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    {plan.is_public ? <Badge>Public</Badge> : <Badge variant="secondary">Private</Badge>}
                                    {plan.is_active ? <Badge variant="outline">Active</Badge> : <Badge variant="secondary">Off</Badge>}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Form action={`/platform/plans/${plan.id}`} method="put" className="space-y-3">
                                    <Input name="name" defaultValue={plan.name} required />
                                    <Input name="description" defaultValue={plan.description ?? ''} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input name="employee_limit" type="number" defaultValue={plan.employee_limit ?? ''} placeholder="Unlimited employees" />
                                        <Input name="office_limit" type="number" defaultValue={plan.office_limit ?? ''} placeholder="Unlimited offices" />
                                        <Input name="monthly_price" type="number" defaultValue={plan.monthly_price} required />
                                        <Input name="yearly_price" type="number" defaultValue={plan.yearly_price} required />
                                        <Input name="trial_days" type="number" defaultValue={plan.trial_days} />
                                        <Input name="sort_order" type="number" defaultValue={plan.sort_order} />
                                    </div>
                                    <FeatureChecks options={featureOptions} selected={plan.features} />
                                    <div className="flex gap-4 text-sm">
                                        <label className="flex items-center gap-2">
                                            <input type="hidden" name="is_public" value="0" />
                                            <input type="checkbox" name="is_public" value="1" defaultChecked={plan.is_public} />
                                            Public
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="hidden" name="is_active" value="0" />
                                            <input type="checkbox" name="is_active" value="1" defaultChecked={plan.is_active} />
                                            Active
                                        </label>
                                    </div>
                                    <Button type="submit">Save plan</Button>
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
                    ))}
                </div>
                <Pagination paginator={plans} />
            </PageShell>
        </>
    );
}

PlatformPlans.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Plans', href: '/platform/plans' },
    ],
};
