import { Head } from '@inertiajs/react';
import { MiniBars } from '@/components/mini-bars';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    series: { label: string; key: string; tenants: number; revenue: number; leads: number }[];
    byGateway: { gateway: string; count: number; amount: number }[];
    planDistribution: { name: string; slug: string; count: number; mrr: number }[];
    sources: { source: string; total: number; converted: number }[];
    tenantsByStatus: { status: string; label: string; count: number }[];
    invoiceSummary: { count: number; paid: number; sent: number; amount: number };
};

export default function PlatformReports({
    series,
    byGateway,
    planDistribution,
    sources,
    tenantsByStatus,
    invoiceSummary,
}: Props) {
    return (
        <>
            <Head title="Platform reports" />
            <PageShell>
                <PageHeader
                    title="Analytics & reports"
                    description="Revenue, plans, invoices, and acquisition sources across the platform."
                    actions={
                        <Button asChild>
                            <a href="/platform/reports/export">Download CSV</a>
                        </Button>
                    }
                />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader><CardTitle>Invoice volume</CardTitle></CardHeader>
                        <CardContent className="text-2xl font-semibold">{invoiceSummary.count}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Invoices paid</CardTitle></CardHeader>
                        <CardContent className="text-2xl font-semibold">{invoiceSummary.paid}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Emailed</CardTitle></CardHeader>
                        <CardContent className="text-2xl font-semibold">{invoiceSummary.sent}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Invoiced amount</CardTitle></CardHeader>
                        <CardContent className="text-2xl font-semibold">৳{invoiceSummary.amount.toLocaleString()}</CardContent>
                    </Card>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue</CardTitle>
                            <CardDescription>Last 12 months</CardDescription>
                        </CardHeader>
                        <CardContent><MiniBars data={series} valueKey="revenue" /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Leads</CardTitle>
                            <CardDescription>Last 12 months</CardDescription>
                        </CardHeader>
                        <CardContent><MiniBars data={series} valueKey="leads" /></CardContent>
                    </Card>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader><CardTitle>By payment gateway</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {byGateway.length === 0 && <p className="text-muted-foreground">No payments yet.</p>}
                            {byGateway.map((row) => (
                                <div key={row.gateway} className="flex justify-between">
                                    <span className="capitalize">{row.gateway}</span>
                                    <span>{row.count} · ৳{row.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Plan revenue mix</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {planDistribution.map((row) => (
                                <div key={row.slug} className="flex justify-between">
                                    <span>{row.name}</span>
                                    <span>{row.count} · ৳{row.mrr.toLocaleString()} MRR</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Tenants by status</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {tenantsByStatus.map((row) => (
                                <div key={row.status} className="flex justify-between">
                                    <span>{row.label}</span>
                                    <span>{row.count}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Acquisition sources</CardTitle>
                        <CardDescription>UTM source, campaign source, or direct.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="px-4 py-2">Source</th>
                                        <th className="px-4 py-2">Leads</th>
                                        <th className="px-4 py-2">Converted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sources.map((row) => (
                                        <tr key={row.source} className="border-t">
                                            <td className="px-4 py-2 capitalize">{row.source}</td>
                                            <td className="px-4 py-2">{row.total}</td>
                                            <td className="px-4 py-2">{row.converted}</td>
                                        </tr>
                                    ))}
                                    {sources.length === 0 && (
                                        <tr>
                                            <td className="text-muted-foreground px-4 py-4" colSpan={3}>No source data yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </PageShell>
        </>
    );
}

PlatformReports.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Reports', href: '/platform/reports' },
    ],
};
