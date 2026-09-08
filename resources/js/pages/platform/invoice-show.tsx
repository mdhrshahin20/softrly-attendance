import { Form, Head, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Invoice = {
    id: number;
    number: string;
    status: string;
    status_label: string;
    amount: number;
    currency: string;
    tenant: string | null;
    plan: string | null;
    gateway: string | null;
    billed_to_name: string | null;
    billed_to_email: string | null;
    billed_to_company: string | null;
    issued_at: string | null;
    sent_at: string | null;
    notes: string | null;
    items: { id: number; description: string; quantity: number; amount: number }[];
};

export default function PlatformInvoiceShow({ invoice }: { invoice: Invoice }) {
    return (
        <>
            <Head title={invoice.number} />
            <PageShell>
                <PageHeader
                    title={invoice.number}
                    description={`${invoice.billed_to_company ?? invoice.tenant ?? 'Tenant'} · ${invoice.plan ?? 'Subscription'}`}
                    actions={
                        <>
                            <Button asChild variant="outline">
                                <a href={`/platform/invoices/${invoice.id}/download`}>Download</a>
                            </Button>
                            <Button asChild variant="outline">
                                <a href={`/platform/invoices/${invoice.id}/print`} target="_blank" rel="noreferrer">
                                    Print / PDF
                                </a>
                            </Button>
                            <Form action={`/platform/invoices/${invoice.id}/send`} method="post">
                                <Button type="submit">Email tenant admin</Button>
                            </Form>
                        </>
                    }
                />
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Line items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead className="text-muted-foreground text-left">
                                    <tr>
                                        <th className="py-2">Description</th>
                                        <th className="py-2">Qty</th>
                                        <th className="py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item) => (
                                        <tr key={item.id} className="border-t">
                                            <td className="py-2">{item.description}</td>
                                            <td className="py-2">{item.quantity}</td>
                                            <td className="py-2 text-right">৳{item.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t font-semibold">
                                        <td className="py-3" colSpan={2}>Total</td>
                                        <td className="py-3 text-right">৳{invoice.amount.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <StatusBadge status={invoice.status} label={invoice.status_label} withIcon={false} />
                            <p>{invoice.billed_to_name}</p>
                            <p>{invoice.billed_to_email}</p>
                            <p className="text-muted-foreground">Issued {invoice.issued_at?.slice(0, 10)}</p>
                            <p className="text-muted-foreground">{invoice.sent_at ? `Emailed ${invoice.sent_at.slice(0, 10)}` : 'Not emailed yet'}</p>
                            <p className="text-muted-foreground">Gateway {invoice.gateway ?? '—'}</p>
                            {invoice.notes ? <p>{invoice.notes}</p> : null}
                            <Button asChild variant="link" className="px-0">
                                <Link href="/platform/invoices">Back to invoices</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </PageShell>
        </>
    );
}

PlatformInvoiceShow.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Invoices', href: '/platform/invoices' },
        { title: 'Invoice', href: '#' },
    ],
};
