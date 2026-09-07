import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Tenant = {
    id: number;
    name: string;
    slug: string;
    email: string;
    status: string;
    trial_ends_at: string | null;
    users_count: number;
    plan: string | null;
    plan_id: number | null;
};

type Props = {
    tenants: { data: Tenant[] };
    plans: { id: number; name: string }[];
    stats: { total: number; active: number; trial: number; suspended: number };
};

export default function PlatformTenants({ tenants, plans, stats }: Props) {
    return (
        <>
            <Head title="Platform tenants" />
            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-semibold">Platform tenants</h1>
                <div className="grid gap-4 sm:grid-cols-4">
                    <Card><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.total}</CardContent></Card>
                    <Card><CardHeader><CardTitle>Active</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.active}</CardContent></Card>
                    <Card><CardHeader><CardTitle>Trial</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.trial}</CardContent></Card>
                    <Card><CardHeader><CardTitle>Suspended</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.suspended}</CardContent></Card>
                </div>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Tenant</th>
                                <th className="px-4 py-3">Plan</th>
                                <th className="px-4 py-3">Users</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.data.map((tenant) => (
                                <tr key={tenant.id} className="border-t align-top">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{tenant.name}</div>
                                        <div className="text-muted-foreground">{tenant.email}</div>
                                        <div className="text-muted-foreground text-xs">{tenant.slug}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>{tenant.plan ?? '—'}</div>
                                        <Form action={`/platform/tenants/${tenant.id}/plan`} method="patch" className="mt-2 flex max-w-xs flex-col gap-2">
                                            <select name="plan_id" defaultValue={tenant.plan_id ?? ''} className="border-input h-8 rounded-md border px-2 text-xs" required>
                                                {plans.map((plan) => (
                                                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                                                ))}
                                            </select>
                                            <select name="billing_cycle" defaultValue="monthly" className="border-input h-8 rounded-md border px-2 text-xs">
                                                <option value="monthly">Monthly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                            <Button size="sm" variant="outline" type="submit">Assign plan</Button>
                                        </Form>
                                    </td>
                                    <td className="px-4 py-3">{tenant.users_count}</td>
                                    <td className="px-4 py-3">
                                        <Badge>{tenant.status}</Badge>
                                        {tenant.trial_ends_at && <div className="text-muted-foreground mt-1 text-xs">Trial {tenant.trial_ends_at}</div>}
                                    </td>
                                    <td className="px-4 py-3 space-y-2">
                                        <Form action={`/platform/tenants/${tenant.id}/status`} method="patch">
                                            <input type="hidden" name="status" value={tenant.status === 'suspended' ? 'active' : 'suspended'} />
                                            <Button size="sm" variant="outline" type="submit">
                                                {tenant.status === 'suspended' ? 'Activate' : 'Suspend'}
                                            </Button>
                                        </Form>
                                        <Form action={`/platform/tenants/${tenant.id}/trial`} method="patch" className="flex gap-2">
                                            <input type="hidden" name="days" value="14" />
                                            <Button size="sm" variant="ghost" type="submit">+14d trial</Button>
                                        </Form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

PlatformTenants.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Tenants', href: '/platform/tenants' },
    ],
};
