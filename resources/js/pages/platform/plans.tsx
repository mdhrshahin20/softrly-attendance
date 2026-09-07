import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Plan = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    employee_limit: number | null;
    office_limit: number | null;
    monthly_price: number;
    yearly_price: number;
    feature_labels: string[];
};

export default function PlatformPlans({ plans }: { plans: Plan[] }) {
    return (
        <>
            <Head title="Plans" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
                <h1 className="text-2xl font-semibold">Plans</h1>
                <div className="grid gap-4 lg:grid-cols-2">
                    {plans.map((plan) => (
                        <Form key={plan.id} action={`/platform/plans/${plan.id}`} method="put" className="space-y-3 rounded-xl border p-4">
                            <div className="flex items-center justify-between">
                                <div className="font-medium">{plan.slug}</div>
                                <Badge>{plan.feature_labels.length} features</Badge>
                            </div>
                            <Input name="name" defaultValue={plan.name} required />
                            <Input name="description" defaultValue={plan.description ?? ''} />
                            <div className="grid grid-cols-2 gap-2">
                                <Input name="employee_limit" type="number" defaultValue={plan.employee_limit ?? ''} placeholder="Unlimited employees" />
                                <Input name="office_limit" type="number" defaultValue={plan.office_limit ?? ''} placeholder="Unlimited offices" />
                                <Input name="monthly_price" type="number" defaultValue={plan.monthly_price} required />
                                <Input name="yearly_price" type="number" defaultValue={plan.yearly_price} required />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="hidden" name="is_public" value="0" />
                                <input type="checkbox" name="is_public" value="1" defaultChecked /> Public
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="hidden" name="is_active" value="0" />
                                <input type="checkbox" name="is_active" value="1" defaultChecked /> Active
                            </label>
                            <p className="text-muted-foreground text-xs">{plan.feature_labels.join(' · ')}</p>
                            <Button type="submit">Save plan</Button>
                        </Form>
                    ))}
                </div>
            </div>
        </>
    );
}

PlatformPlans.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Plans', href: '/platform/plans' },
    ],
};
