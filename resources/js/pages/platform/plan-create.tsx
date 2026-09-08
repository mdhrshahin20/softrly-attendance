import { Form, Head, Link, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type FeatureOption = { value: string; label: string };

export default function PlatformPlanCreate({
    featureOptions,
}: {
    featureOptions: FeatureOption[];
}) {
    const { errors } = usePage().props;

    return (
        <>
            <Head title="Create plan" />
            <PageShell>
                <PageHeader
                    title="Create new plan"
                    description="Define pricing, limits, and features for a subscription plan."
                    actions={
                        <Button variant="outline" asChild>
                            <Link href="/platform/plans">Back to list</Link>
                        </Button>
                    }
                />

                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Plan details</CardTitle>
                        <CardDescription>
                            After saving, you will open the plan detail page to review and manage it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form action="/platform/plans" method="post" className="space-y-6">
                            {({ processing }) => (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                required
                                                placeholder="Growth"
                                                autoFocus
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="slug">Slug (optional)</Label>
                                            <Input id="slug" name="slug" placeholder="growth" />
                                            <InputError message={errors.slug} />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Input
                                                id="description"
                                                name="description"
                                                placeholder="Who this plan is for"
                                            />
                                            <InputError message={errors.description} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="employee_limit">Employee limit</Label>
                                            <Input
                                                id="employee_limit"
                                                name="employee_limit"
                                                type="number"
                                                min={1}
                                                placeholder="Blank = unlimited"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="office_limit">Office limit</Label>
                                            <Input
                                                id="office_limit"
                                                name="office_limit"
                                                type="number"
                                                min={1}
                                                placeholder="Blank = unlimited"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="monthly_price">Monthly price</Label>
                                            <Input
                                                id="monthly_price"
                                                name="monthly_price"
                                                type="number"
                                                min={0}
                                                defaultValue={0}
                                                required
                                            />
                                            <InputError message={errors.monthly_price} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="yearly_price">Yearly price</Label>
                                            <Input
                                                id="yearly_price"
                                                name="yearly_price"
                                                type="number"
                                                min={0}
                                                defaultValue={0}
                                                required
                                            />
                                            <InputError message={errors.yearly_price} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="trial_days">Trial days</Label>
                                            <Input
                                                id="trial_days"
                                                name="trial_days"
                                                type="number"
                                                min={0}
                                                defaultValue={14}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="sort_order">Sort order</Label>
                                            <Input
                                                id="sort_order"
                                                name="sort_order"
                                                type="number"
                                                min={0}
                                                placeholder="Auto"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <Label>Features</Label>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Select what this plan unlocks for tenants.
                                            </p>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {featureOptions.map((feature) => (
                                                <label
                                                    key={feature.value}
                                                    className="hover:bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="features[]"
                                                        value={feature.value}
                                                    />
                                                    {feature.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <label className="flex items-center gap-2">
                                            <input type="hidden" name="is_public" value="0" />
                                            <input
                                                type="checkbox"
                                                name="is_public"
                                                value="1"
                                                defaultChecked
                                            />
                                            Public on pricing page
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="hidden" name="is_active" value="0" />
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                value="1"
                                                defaultChecked
                                            />
                                            Active
                                        </label>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button type="submit" disabled={processing}>
                                            {processing ? <Spinner /> : null}
                                            Create plan
                                        </Button>
                                        <Button type="button" variant="outline" asChild>
                                            <Link href="/platform/plans">Cancel</Link>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </PageShell>
        </>
    );
}

PlatformPlanCreate.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Plans', href: '/platform/plans' },
        { title: 'Create', href: '/platform/plans/create' },
    ],
};
