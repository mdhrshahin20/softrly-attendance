import { Form, Head, Link } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { FileSpreadsheet } from 'lucide-react';

type Run = {
    id: number;
    year: number;
    month: number;
    label: string;
    status: string;
    status_label: string;
    employee_count: number;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    generated_at: string | null;
    unpaid_count?: number;
};

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export default function PayrollRuns({
    runs,
    defaultYear,
    defaultMonth,
    currency,
}: {
    runs: Paginated<Run>;
    defaultYear: number;
    defaultMonth: number;
    currency: string;
}) {
    return (
        <>
            <Head title="Payroll runs" />
            <PageShell>
                <PageHeader
                    title="Advanced payroll"
                    description="Generate monthly payslips from salary structures, attendance, unpaid absences, overtime, and advances."
                />

                <Form action="/payroll/runs" method="post" className="flex max-w-xl flex-wrap items-end gap-2">
                    <select name="month" defaultValue={defaultMonth} className="border-input h-9 rounded-md border px-3 text-sm">
                        {months.map((label, index) => (
                            <option key={label} value={index + 1}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <input
                        name="year"
                        type="number"
                        defaultValue={defaultYear}
                        className="border-input h-9 w-28 rounded-md border px-3 text-sm"
                        required
                    />
                    <Button type="submit">Generate payroll</Button>
                </Form>

                {runs.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={FileSpreadsheet}
                            title="No payroll yet"
                            description="Assign salaries, then generate a month. Absences reduce pay. Overtime and advances are included automatically."
                        />
                    </div>
                ) : (
                    <>
                        <DataTable>
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>People</th>
                                <th>Gross</th>
                                <th>Deductions</th>
                                <th>Net</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {runs.data.map((run) => (
                                <tr key={run.id}>
                                    <td className="font-medium">{run.label}</td>
                                    <td>{run.employee_count}</td>
                                    <td>{formatMoney(run.total_gross, currency)}</td>
                                    <td>{formatMoney(run.total_deductions, currency)}</td>
                                    <td>{formatMoney(run.total_net, currency)}</td>
                                    <td>
                                        <StatusBadge status={run.status} label={run.status_label} withIcon={false} />
                                    </td>
                                    <td className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/payroll/runs/${run.id}`}>Open</Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </DataTable>
                    <Pagination paginator={runs} />
                    </>
                )}
            </PageShell>
        </>
    );
}

PayrollRuns.layout = {
    breadcrumbs: [{ title: 'Payroll', href: '/payroll/runs' }],
};
