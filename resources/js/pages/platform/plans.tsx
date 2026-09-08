import { Head, Link } from '@inertiajs/react';
import { Eye, Plus, Layers3 } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
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
    trial_days: number;
    feature_labels: string[];
    is_public: boolean;
    is_active: boolean;
    sort_order: number;
    subscriptions_count: number;
};

export default function PlatformPlans({ plans }: { plans: Paginated<Plan> }) {
    const activeCount = plans.data.filter((plan) => plan.is_active).length;
    const publicCount = plans.data.filter((plan) => plan.is_public).length;

    return (
        <>
            <Head title="Plans" />
            <PageShell>
                <PageHeader
                    title="Plans"
                    description="Browse subscription plans. Open a plan for full details, or create a new one."
                    actions={
                        <Button asChild>
                            <Link href="/platform/plans/create">
                                <Plus className="size-4" />
                                Create new plan
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                Total plans
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold tracking-tight">
                            {plans.total}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                Active on this page
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold tracking-tight">
                            {activeCount}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                Public on this page
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold tracking-tight">
                            {publicCount}
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-card overflow-hidden rounded-xl border">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead className="bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Plan</th>
                                    <th className="px-4 py-3 font-medium">Pricing</th>
                                    <th className="px-4 py-3 font-medium">Limits</th>
                                    <th className="px-4 py-3 font-medium">Subscribers</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.data.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-muted/30 border-t">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/platform/plans/${plan.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {plan.name}
                                            </Link>
                                            <div className="text-muted-foreground text-xs">
                                                {plan.slug}
                                            </div>
                                            {plan.description ? (
                                                <div className="text-muted-foreground mt-1 line-clamp-1 max-w-xs text-xs">
                                                    {plan.description}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                ৳{plan.monthly_price.toLocaleString()}
                                                <span className="text-muted-foreground font-normal">
                                                    {' '}
                                                    / mo
                                                </span>
                                            </div>
                                            <div className="text-muted-foreground text-xs">
                                                ৳{plan.yearly_price.toLocaleString()} / yr ·{' '}
                                                {plan.trial_days}d trial
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{plan.employee_limit_label}</div>
                                            <div className="text-muted-foreground text-xs">
                                                {plan.office_limit_label}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{plan.subscriptions_count}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {plan.is_active ? (
                                                    <Badge variant="outline">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                                {plan.is_public ? (
                                                    <Badge>Public</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Private</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/platform/plans/${plan.id}`}>
                                                    <Eye className="size-3.5" />
                                                    View
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {plans.data.length === 0 ? (
                        <EmptyState
                            icon={Layers3}
                            title="No plans yet"
                            description="Create your first commercial plan to start assigning subscriptions."
                            action={
                                <Button asChild>
                                    <Link href="/platform/plans/create">
                                        <Plus className="size-4" />
                                        Create new plan
                                    </Link>
                                </Button>
                            }
                        />
                    ) : null}
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
