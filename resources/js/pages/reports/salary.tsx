import { Form, Head, Link, router } from '@inertiajs/react';
import { Banknote, Users, Wallet } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';

type Row = {
    id: number;
    employee: string | null;
    avatar?: string | null;
    employee_code: string | null;
    department: string | null;
    office: string | null;
    present_days: number;
    leave_days: number;
    absent_days: number;
    overtime_minutes: number;
    gross: number;
    deductions: number;
    tax: number;
    advance_deduction: number;
    net: number;
    status: string;
    status_label: string;
    can_pay: boolean;
};

type Totals = {
    employees: number;
    present_days: number;
    absent_days: number;
    overtime_minutes: number;
    gross: number;
    deductions: number;
    net: number;
    paid_count: number;
    unpaid_count: number;
    paid_net: number;
    unpaid_net: number;
};

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const fieldClass = 'border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none';

export default function SalaryReport({
    rows,
    totals,
    filters,
    departments,
    offices,
    currency,
    canExport,
    canManage,
}: {
    rows: Paginated<Row>;
    totals: Totals;
    filters: {
        year: number;
        month: number;
        department_id: number | null;
        office_id: number | null;
        status: string | null;
    };
    departments: { id: number; name: string }[];
    offices: { id: number; name: string }[];
    currency: string;
    canExport: boolean;
    canManage: boolean;
}) {
    return (
        <>
            <Head title="Salary report" />
            <PageShell>
                <PageHeader
                    title="Salary report"
                    description="Attendance-linked payroll for the month, with paid and unpaid totals."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href="/payroll/salaries">Salaries</Link>
                            </Button>
                            {canExport ? (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        window.location.assign(
                                            `/reports/salary?${new URLSearchParams({
                                                year: String(filters.year),
                                                month: String(filters.month),
                                                department_id: filters.department_id ? String(filters.department_id) : '',
                                                office_id: filters.office_id ? String(filters.office_id) : '',
                                                status: filters.status ?? '',
                                                export: 'csv',
                                            }).toString()}`,
                                        )
                                    }
                                >
                                    Export CSV
                                </Button>
                            ) : null}
                        </>
                    }
                />

                <form
                    className="grid gap-2 md:grid-cols-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        router.get('/reports/salary', {
                            year: String(data.get('year') ?? ''),
                            month: String(data.get('month') ?? ''),
                            department_id: String(data.get('department_id') ?? ''),
                            office_id: String(data.get('office_id') ?? ''),
                            status: String(data.get('status') ?? ''),
                        });
                    }}
                >
                    <select name="month" defaultValue={filters.month} className={fieldClass} aria-label="Month">
                        {months.map((label, index) => (
                            <option key={label} value={index + 1}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <input
                        name="year"
                        type="number"
                        defaultValue={filters.year}
                        className={fieldClass}
                        required
                        aria-label="Year"
                    />
                    <select name="department_id" defaultValue={filters.department_id ?? ''} className={fieldClass} aria-label="Department">
                        <option value="">All departments</option>
                        {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                                {department.name}
                            </option>
                        ))}
                    </select>
                    <select name="office_id" defaultValue={filters.office_id ?? ''} className={fieldClass} aria-label="Office">
                        <option value="">All offices</option>
                        {offices.map((office) => (
                            <option key={office.id} value={office.id}>
                                {office.name}
                            </option>
                        ))}
                    </select>
                    <select name="status" defaultValue={filters.status ?? ''} className={fieldClass} aria-label="Payment status">
                        <option value="">Paid and unpaid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                    </select>
                    <Button type="submit">Apply</Button>
                </form>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="People" value={totals.employees} icon={Users} />
                    <MetricCard label="Gross" value={formatMoney(totals.gross, currency)} icon={Banknote} />
                    <MetricCard label="Net pay" value={formatMoney(totals.net, currency)} icon={Wallet} tone="success" />
                    <MetricCard
                        label="Unpaid"
                        value={formatMoney(totals.unpaid_net, currency)}
                        hint={`${totals.unpaid_count} unpaid · ${totals.paid_count} paid`}
                        tone="warning"
                    />
                </div>

                {rows.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Banknote}
                            title="No payroll for this period"
                            description="Generate a payroll run first, then come back to review paid and unpaid salaries."
                        />
                    </div>
                ) : (
                    <>
                        <DataTable>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Present</th>
                                    <th>Absent</th>
                                    <th>Gross</th>
                                    <th>Deductions</th>
                                    <th>Net</th>
                                    <th>Status</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.data.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <PersonIdentity
                                                name={row.employee ?? 'Employee'}
                                                avatar={row.avatar}
                                                detail={`${row.employee_code ?? ''} · ${row.department ?? row.office ?? '—'}`}
                                                href={`/payroll/payslips/${row.id}`}
                                            />
                                        </td>
                                        <td>{row.present_days}</td>
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
                        <Pagination paginator={rows} />
                    </>
                )}
            </PageShell>
        </>
    );
}

SalaryReport.layout = {
    breadcrumbs: [
        { title: 'Payroll', href: '/payroll/runs' },
        { title: 'Salary report', href: '/reports/salary' },
    ],
};
