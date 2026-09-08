import { Form, Head, Link } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { Banknote, Users, Wallet } from 'lucide-react';

type Run = {
    id: number;
    label: string;
    status: string;
    status_label: string;
    employee_count: number;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    unpaid_count?: number;
    can_pay: boolean;
};

type Row = {
    id: number;
    employee: string | null;
    avatar?: string | null;
    employee_code: string | null;
    department: string | null;
    present_days: number;
    absent_days: number;
    leave_days: number;
    gross: number;
    deductions: number;
    net: number;
    status: string;
    status_label: string;
    can_pay: boolean;
};

export default function PayrollRunShow({
    run,
    payslips,
    currency,
    canManage,
}: {
    run: Run;
    payslips: Paginated<Row>;
    currency: string;
    canManage: boolean;
}) {
    return (
        <>
            <Head title={run.label} />
            <PageShell>
                <PageHeader
                    title={run.label}
                    description="Payslips built from attendance for this month. Mark people paid one by one, or the whole run."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href="/payroll/runs">All runs</Link>
                            </Button>
                            {canManage && run.can_pay ? (
                                <Form action={`/payroll/runs/${run.id}/pay`} method="post">
                                    <Button type="submit">
                                        {run.unpaid_count && run.unpaid_count < run.employee_count
                                            ? `Mark remaining paid (${run.unpaid_count})`
                                            : 'Mark all as paid'}
                                    </Button>
                                </Form>
                            ) : null}
                        </>
                    }
                />

                <div className="flex items-center gap-3">
                    <StatusBadge status={run.status} label={run.status_label} withIcon={false} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard label="People" value={run.employee_count} icon={Users} />
                    <MetricCard label="Gross" value={formatMoney(run.total_gross, currency)} icon={Banknote} />
                    <MetricCard label="Net pay" value={formatMoney(run.total_net, currency)} icon={Wallet} tone="success" />
                </div>

                <DataTable>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Present</th>
                            <th>Leave</th>
                            <th>Absent</th>
                            <th>Gross</th>
                            <th>Deductions</th>
                            <th>Net</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {payslips.data.map((row) => (
                            <tr key={row.id}>
                                <td>
                                    <PersonIdentity
                                        name={row.employee ?? 'Employee'}
                                        avatar={row.avatar}
                                        detail={`${row.employee_code ?? ''} · ${row.department ?? '—'}`}
                                        href={`/payroll/payslips/${row.id}`}
                                    />
                                </td>
                                <td>{row.present_days}</td>
                                <td>{row.leave_days}</td>
                                <td>{row.absent_days}</td>
                                <td>{formatMoney(row.gross, currency)}</td>
                                <td>{formatMoney(row.deductions, currency)}</td>
                                <td className="font-medium">{formatMoney(row.net, currency)}</td>
                                <td>
                                    <StatusBadge status={row.status} label={row.status_label} withIcon={false} />
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {canManage && row.can_pay ? (
                                            <Form action={`/payroll/payslips/${row.id}/pay`} method="post">
                                                <Button size="sm" type="submit">
                                                    Mark as paid
                                                </Button>
                                            </Form>
                                        ) : null}
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/payroll/payslips/${row.id}`}>Payslip</Link>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </DataTable>
                <Pagination paginator={payslips} />
            </PageShell>
        </>
    );
}

PayrollRunShow.layout = {
    breadcrumbs: [
        { title: 'Payroll', href: '/payroll/runs' },
        { title: 'Run', href: '#' },
    ],
};
