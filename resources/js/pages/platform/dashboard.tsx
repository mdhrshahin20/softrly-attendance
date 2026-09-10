import { Head, Link } from '@inertiajs/react';
import { Activity, Building2, CreditCard, FileText, HardDrive, Server, Users, Zap } from 'lucide-react';
import { MetricCard } from '@/components/metric-card';
import { MiniBars } from '@/components/mini-bars';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type SeriesPoint = { label: string; key: string; tenants: number; revenue: number; leads: number };

function formatBytes(bytes: number): string {
    if (bytes <= 0) {
        return '—';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));

    return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
}

type Props = {
    stats: {
        tenants: number;
        active: number;
        trial: number;
        suspended: number;
        users: number;
        mrr: number;
        arr: number;
        revenue_mtd: number;
        outstanding_invoices: number;
        new_subscriptions: number;
        trial_conversion: number;
        churn: number;
        leads: number;
        invoices_sent: number;
    };
    series: SeriesPoint[];
    planDistribution: { name: string; count: number }[];
    sources: { source: string; total: number; converted: number }[];
    recentPayments: {
        id: number;
        tenant: string | null;
        amount: number;
        currency: string;
        plan: string | null;
        gateway: string;
        paid_at: string | null;
    }[];
    recentInvoices: {
        id: number;
        number: string;
        tenant: string | null;
        amount: number;
        status_label: string;
        billed_to_email: string | null;
    }[];
    system: {
        environment: string;
        maintenance: boolean;
        debug: boolean;
        cache_store: string;
        queue_connection: string;
        queue_pending: number;
        queue_failed: number;
        disk_free_bytes: number;
    };
};

export default function PlatformDashboard({
    stats,
    series,
    planDistribution,
    sources,
    recentPayments,
    recentInvoices,
    system,
}: Props) {
    const planMax = Math.max(...planDistribution.map((row) => row.count), 1);

    return (
        <>
            <Head title="Platform dashboard" />
            <PageShell>
                <PageHeader
                    title="Platform overview"
                    description="Revenue, tenants, invoices, and acquisition in one place."
                    actions={
                        <>
                            <Button asChild>
                                <Link href="/platform/reports">Open reports</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/platform/invoices">Invoices</Link>
                            </Button>
                        </>
                    }
                />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Tenants" value={stats.tenants} hint={`${stats.active} active · ${stats.trial} trial`} icon={Building2} />
                    <MetricCard label="Users" value={stats.users} hint={`${stats.leads} leads captured`} icon={Users} />
                    <MetricCard
                        label="MRR"
                        value={`৳${stats.mrr.toLocaleString()}`}
                        hint={`This month ৳${stats.revenue_mtd.toLocaleString()} · ARR ৳${stats.arr.toLocaleString()}`}
                        icon={CreditCard}
                    />
                    <MetricCard
                        label="Invoices sent"
                        value={stats.invoices_sent}
                        hint={`${stats.outstanding_invoices} outstanding · ${stats.trial_conversion}% converted`}
                        icon={FileText}
                    />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        label="Environment"
                        value={system.environment}
                        hint={system.debug ? 'Debug enabled' : 'Debug disabled'}
                        icon={Server}
                    />
                    <MetricCard
                        label="Queue"
                        value={system.queue_pending}
                        hint={`${system.queue_failed} failed · ${system.queue_connection} driver`}
                        icon={Activity}
                    />
                    <MetricCard
                        label="Cache store"
                        value={system.cache_store}
                        hint={system.maintenance ? 'Maintenance mode on' : 'Application live'}
                        icon={Zap}
                    />
                    <MetricCard
                        label="Disk free"
                        value={formatBytes(system.disk_free_bytes)}
                        hint="Storage volume on the app server"
                        icon={HardDrive}
                    />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue (12 months)</CardTitle>
                            <CardDescription>Paid invoice collections by month.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MiniBars data={series} valueKey="revenue" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>New tenants</CardTitle>
                            <CardDescription>Workspace signups over the last year.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MiniBars data={series} valueKey="tenants" />
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan mix</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {planDistribution.map((row) => (
                                <div key={row.name} className="space-y-1">
                                    <div className="flex justify-between">
                                        <span>{row.name}</span>
                                        <span className="font-medium">{row.count}</span>
                                    </div>
                                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                                        <div
                                            className="bg-primary h-full rounded-full"
                                            style={{ width: `${(row.count / planMax) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Traffic sources</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {sources.length === 0 && <p className="text-muted-foreground">No attribution data yet.</p>}
                            {sources.map((row) => (
                                <div key={row.source} className="flex justify-between">
                                    <span className="capitalize">{row.source}</span>
                                    <span>
                                        {row.total} · {row.converted} converted
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Health</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>New subscriptions</span><span>{stats.new_subscriptions}</span></div>
                            <div className="flex justify-between"><span>Suspended</span><span>{stats.suspended}</span></div>
                            <div className="flex justify-between"><span>Churned / expired</span><span>{stats.churn}</span></div>
                            <div className="flex justify-between"><span>Trial conversion</span><span>{stats.trial_conversion}%</span></div>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent payments</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {recentPayments.length === 0 && <p className="text-muted-foreground">No payments yet.</p>}
                            {recentPayments.map((payment) => (
                                <div key={payment.id} className="flex justify-between gap-3">
                                    <span>
                                        {payment.tenant} · {payment.plan}
                                        <span className="text-muted-foreground block text-xs">{payment.gateway}</span>
                                    </span>
                                    <span>৳{payment.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Latest invoices</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {recentInvoices.length === 0 && <p className="text-muted-foreground">No invoices yet.</p>}
                            {recentInvoices.map((invoice) => (
                                <Link key={invoice.id} href={`/platform/invoices/${invoice.id}`} className="flex justify-between gap-3 hover:underline">
                                    <span>
                                        {invoice.number}
                                        <span className="text-muted-foreground block text-xs">{invoice.tenant} · {invoice.billed_to_email}</span>
                                    </span>
                                    <span className="text-right">
                                        ৳{invoice.amount.toLocaleString()}
                                        <StatusBadge className="mt-1" status={invoice.status_label.toLowerCase()} label={invoice.status_label} />
                                    </span>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </PageShell>
        </>
    );
}

PlatformDashboard.layout = {
    breadcrumbs: [{ title: 'Platform', href: '/platform' }],
};
