import { Head, Link, router } from '@inertiajs/react';
import { Building2, Eye } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Tenant = {
    id: number;
    name: string;
    slug: string;
    email: string;
    status: string;
    trial_ends_at: string | null;
    created_at: string | null;
    users_count: number;
    employees_count: number;
    offices_count: number;
    plan: string | null;
    plan_id: number | null;
    subscription_status: string | null;
};

type Props = {
    tenants: Paginated<Tenant>;
    plans: { id: number; name: string }[];
    stats: { total: number; active: number; trial: number; suspended: number };
    filters: { search: string | null; status: string };
};

export default function PlatformTenants({ tenants, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status || 'all');

    const applyFilters = (next?: { search?: string; status?: string }) => {
        router.get(
            '/platform/tenants',
            {
                search: next?.search ?? search,
                status: next?.status ?? status,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Customers" />
            <PageShell>
                <PageHeader
                    title="Customers"
                    description="Browse tenant workspaces. Open any customer for full company, billing, and usage details."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Total', value: stats.total },
                        { label: 'Active', value: stats.active },
                        { label: 'Trial', value: stats.trial },
                        { label: 'Suspended', value: stats.suspended },
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

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <form
                        className="flex flex-1 flex-col gap-3 sm:flex-row"
                        onSubmit={(event) => {
                            event.preventDefault();
                            applyFilters();
                        }}
                    >
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search company, email, or slug…"
                            className="max-w-sm"
                            aria-label="Search customers"
                        />
                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                applyFilters({ status: event.target.value });
                            }}
                            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                            aria-label="Filter by status"
                        >
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="suspended">Suspended</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="expired">Expired</option>
                        </select>
                        <Button type="submit" variant="secondary">
                            Search
                        </Button>
                    </form>
                </div>

                <div className="bg-card overflow-hidden rounded-xl border">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead className="bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Company</th>
                                    <th className="px-4 py-3 font-medium">Owner email</th>
                                    <th className="px-4 py-3 font-medium">Employees</th>
                                    <th className="px-4 py-3 font-medium">Plan</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Created</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.data.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-muted/30 border-t">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/platform/tenants/${tenant.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {tenant.name}
                                            </Link>
                                            <div className="text-muted-foreground text-xs">{tenant.slug}</div>
                                        </td>
                                        <td className="px-4 py-3">{tenant.email}</td>
                                        <td className="px-4 py-3">
                                            <div>{tenant.employees_count}</div>
                                            <div className="text-muted-foreground text-xs">
                                                {tenant.users_count} users · {tenant.offices_count} offices
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{tenant.plan ?? '—'}</div>
                                            {tenant.subscription_status ? (
                                                <div className="text-muted-foreground text-xs capitalize">
                                                    {tenant.subscription_status.replaceAll('_', ' ')}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={tenant.status} />
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3">
                                            {tenant.created_at ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/platform/tenants/${tenant.id}`}>
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
                    {tenants.data.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            title="No customers found"
                            description="Try another search, or wait for new workspace registrations."
                        />
                    ) : null}
                </div>
                <Pagination paginator={tenants} />
            </PageShell>
        </>
    );
}

PlatformTenants.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Customers', href: '/platform/tenants' },
    ],
};
