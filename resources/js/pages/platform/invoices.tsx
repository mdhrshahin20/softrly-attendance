import { Form, Head, Link, router } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Invoice = {
    id: number;
    number: string;
    status: string;
    status_label: string;
    amount: number;
    currency: string;
    tenant: string | null;
    plan: string | null;
    billed_to_email: string | null;
    issued_at: string | null;
    sent_at: string | null;
};

type Props = {
    invoices: Paginated<Invoice>;
    filters: { search: string | null };
};

export default function PlatformInvoices({ invoices, filters }: Props) {
    return (
        <>
            <Head title="Invoices" />
            <PageShell>
                <PageHeader
                    title="Invoices"
                    description="Every paid subscription generates an invoice. Download it or email the tenant admin."
                />
                <form
                    className="flex max-w-md gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get('/platform/invoices', {
                            search: String(new FormData(event.currentTarget).get('search') ?? ''),
                        });
                    }}
                >
                    <Input name="search" defaultValue={filters.search ?? ''} placeholder="Search number, company, or email" />
                    <Button type="submit" variant="outline">Search</Button>
                </form>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Invoice</th>
                                <th className="px-4 py-3">Tenant</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.data.map((invoice) => (
                                <tr key={invoice.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <Link href={`/platform/invoices/${invoice.id}`} className="font-medium hover:underline">
                                            {invoice.number}
                                        </Link>
                                        <div className="text-muted-foreground text-xs">{invoice.issued_at?.slice(0, 10)}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>{invoice.tenant}</div>
                                        <div className="text-muted-foreground text-xs">{invoice.billed_to_email}</div>
                                    </td>
                                    <td className="px-4 py-3">৳{invoice.amount.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={invoice.status} label={invoice.status_label} withIcon={false} />
                                        {invoice.sent_at ? (
                                            <div className="text-muted-foreground mt-1 text-xs">Emailed</div>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <Button asChild size="sm" variant="outline">
                                                <a href={`/platform/invoices/${invoice.id}/download`}>Download</a>
                                            </Button>
                                            <Form action={`/platform/invoices/${invoice.id}/send`} method="post">
                                                <Button size="sm" type="submit">Email tenant</Button>
                                            </Form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {invoices.data.length === 0 && (
                                <tr>
                                    <td className="text-muted-foreground px-4 py-6" colSpan={5}>
                                        No invoices yet. They appear when a tenant payment is completed.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination paginator={invoices} />
            </PageShell>
        </>
    );
}

PlatformInvoices.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Invoices', href: '/platform/invoices' },
    ],
};
