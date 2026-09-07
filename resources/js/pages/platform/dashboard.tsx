import { Head } from '@inertiajs/react';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, CreditCard, Users } from 'lucide-react';

type Props = {
    stats: {
        tenants: number;
        active: number;
        trial: number;
        suspended: number;
        users: number;
        mrr: number;
        arr: number;
        new_subscriptions: number;
        trial_conversion: number;
        churn: number;
    };
    planDistribution: { name: string; count: number }[];
    recentPayments: {
        id: number;
        tenant: string | null;
        amount: number;
        currency: string;
        plan: string | null;
        paid_at: string | null;
    }[];
};

export default function PlatformDashboard({ stats, planDistribution, recentPayments }: Props) {
    return (
        <>
            <Head title="Platform dashboard" />
            <PageShell>
                <PageHeader
                    title="Platform overview"
                    description="Tenant health, revenue, and recent billing activity."
                />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Tenants" value={stats.tenants} hint={`${stats.active} active`} icon={Building2} />
                    <MetricCard label="Users" value={stats.users} hint={`${stats.trial} on trial`} icon={Users} />
                    <MetricCard
                        label="MRR"
                        value={`৳${stats.mrr.toLocaleString()}`}
                        hint={`ARR ৳${stats.arr.toLocaleString()}`}
                        icon={CreditCard}
                    />
                    <MetricCard
                        label="Conversion"
                        value={`${stats.trial_conversion}%`}
                        hint={`${stats.churn} churned / expired`}
                    />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {planDistribution.map((row) => (
                                <div key={row.name} className="flex justify-between">
                                    <span>{row.name}</span>
                                    <span className="font-medium">{row.count} paid</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent payments</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {recentPayments.length === 0 && (
                                <p className="text-muted-foreground">No payments yet.</p>
                            )}
                            {recentPayments.map((payment) => (
                                <div key={payment.id} className="flex justify-between">
                                    <span>
                                        {payment.tenant} · {payment.plan}
                                    </span>
                                    <span>৳{payment.amount.toLocaleString()}</span>
                                </div>
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
