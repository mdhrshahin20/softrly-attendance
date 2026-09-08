import { Form, Head, Link } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/money';
import { Banknote } from 'lucide-react';

type Salary = {
    gross: number;
    basic_salary: number;
    house_rent: number;
    medical: number;
    other_allowance: number;
    tax_percent: number;
    effective_from: string;
};

type Payslip = {
    id: number;
    period: string | null;
    status: string | null;
    status_label?: string | null;
    gross: number;
    deductions: number;
    net: number;
};

type Advance = {
    id: number;
    amount: number;
    reason: string;
    status: string;
    status_label: string;
    created_at: string | null;
};

export default function MyPayroll({
    salary,
    payslips,
    advances,
    currency,
}: {
    salary: Salary | null;
    payslips: Paginated<Payslip>;
    advances: Paginated<Advance>;
    currency: string;
}) {
    return (
        <>
            <Head title="My payslips" />
            <PageShell>
                <PageHeader
                    title="My salary"
                    description="Your current structure, payslips, and advance requests."
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current structure</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {salary ? (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Basic</span>
                                        <span>{formatMoney(salary.basic_salary, currency)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>House rent</span>
                                        <span>{formatMoney(salary.house_rent, currency)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Medical</span>
                                        <span>{formatMoney(salary.medical, currency)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Other</span>
                                        <span>{formatMoney(salary.other_allowance, currency)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 font-medium">
                                        <span>Gross</span>
                                        <span>{formatMoney(salary.gross, currency)}</span>
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        Tax {salary.tax_percent}% · Effective {salary.effective_from}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">HR has not assigned a salary yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Request an advance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form action="/payroll/advances" method="post" className="grid gap-3">
                                <Input name="amount" type="number" min="1" step="0.01" placeholder="Amount" required />
                                <Input name="reason" placeholder="Reason" required />
                                <Button type="submit">Submit request</Button>
                            </Form>
                        </CardContent>
                    </Card>
                </div>

                <h2 className="text-lg font-semibold">Payslips</h2>
                {payslips.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Banknote}
                            title="No payslips yet"
                            description="Your payslip appears here after HR generates payroll for the month."
                        />
                    </div>
                ) : (
                    <>
                        <DataTable>
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Gross</th>
                                <th>Deductions</th>
                                <th>Net</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {payslips.data.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <div>{row.period}</div>
                                        {row.status ? (
                                            <StatusBadge
                                                status={row.status}
                                                label={row.status_label ?? row.status}
                                                withIcon={false}
                                            />
                                        ) : null}
                                    </td>
                                    <td>{formatMoney(row.gross, currency)}</td>
                                    <td>{formatMoney(row.deductions, currency)}</td>
                                    <td className="font-medium">{formatMoney(row.net, currency)}</td>
                                    <td className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/payroll/payslips/${row.id}`}>View</Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </DataTable>
                    <Pagination paginator={payslips} />
                    </>
                )}

                {advances.data.length > 0 ? (
                    <>
                        <h2 className="text-lg font-semibold">Advances</h2>
                        <DataTable>
                            <thead>
                                <tr>
                                    <th>Amount</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advances.data.map((row) => (
                                    <tr key={row.id}>
                                        <td>{formatMoney(row.amount, currency)}</td>
                                        <td>{row.reason}</td>
                                        <td>
                                            <StatusBadge status={row.status} label={row.status_label} withIcon={false} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </DataTable>
                        <Pagination paginator={advances} />
                    </>
                ) : null}
            </PageShell>
        </>
    );
}

MyPayroll.layout = {
    breadcrumbs: [{ title: 'My payslips', href: '/payroll/me' }],
};
