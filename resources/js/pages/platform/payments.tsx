import { Form, Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Payment = {
    id: number;
    tenant: string | null;
    plan: string | null;
    amount: number;
    currency: string;
    gateway: string;
    transaction_id: string | null;
    status: string;
    status_label: string;
    paid_at: string | null;
    created_at: string | null;
};

export default function PlatformPayments({ payments }: { payments: { data: Payment[] } }) {
    return (
        <>
            <Head title="Payments" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
                <h1 className="text-2xl font-semibold">Payments</h1>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Tenant</th>
                                <th className="px-4 py-3">Plan</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Gateway</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Paid</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {payments.data.map((payment) => (
                                <tr key={payment.id} className="border-t">
                                    <td className="px-4 py-3">{payment.tenant}</td>
                                    <td className="px-4 py-3">{payment.plan ?? '—'}</td>
                                    <td className="px-4 py-3">৳{payment.amount.toLocaleString()}</td>
                                    <td className="px-4 py-3">{payment.gateway}</td>
                                    <td className="px-4 py-3"><Badge>{payment.status_label}</Badge></td>
                                    <td className="px-4 py-3">{payment.paid_at ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        {payment.status === 'pending' && (
                                            <Form action={`/platform/payments/${payment.id}/complete`} method="post">
                                                <Button size="sm" type="submit">Mark paid</Button>
                                            </Form>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {payments.data.length === 0 && (
                                <tr>
                                    <td className="text-muted-foreground px-4 py-6" colSpan={7}>No payments yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

PlatformPayments.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Payments', href: '/platform/payments' },
    ],
};
