import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Platform dashboard</h1>
                    <div className="flex gap-2 text-sm">
                        <Link href="/platform/tenants" className="rounded-md border px-3 py-1">Tenants</Link>
                        <Link href="/platform/plans" className="rounded-md border px-3 py-1">Plans</Link>
                        <Link href="/platform/payments" className="rounded-md border px-3 py-1">Payments</Link>
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Stat title="Tenants" value={stats.tenants} />
                    <Stat title="Active" value={stats.active} />
                    <Stat title="Trial" value={stats.trial} />
                    <Stat title="Users" value={stats.users} />
                    <Stat title="MRR" value={`৳${stats.mrr.toLocaleString()}`} />
                    <Stat title="ARR" value={`৳${stats.arr.toLocaleString()}`} />
                    <Stat title="New this month" value={stats.new_subscriptions} />
                    <Stat title="Paid conversion" value={`${stats.trial_conversion}%`} />
                    <Stat title="Churned / expired" value={stats.churn} />
                    <Stat title="Suspended" value={stats.suspended} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Plan distribution</CardTitle></CardHeader>
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
                        <CardHeader><CardTitle>Recent payments</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {recentPayments.length === 0 && <p className="text-muted-foreground">No payments yet.</p>}
                            {recentPayments.map((payment) => (
                                <div key={payment.id} className="flex justify-between">
                                    <span>{payment.tenant} · {payment.plan}</span>
                                    <span>৳{payment.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function Stat({ title, value }: { title: string; value: string | number }) {
    return (
        <Card>
            <CardHeader><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
        </Card>
    );
}

PlatformDashboard.layout = {
    breadcrumbs: [{ title: 'Platform', href: '/platform' }],
};
