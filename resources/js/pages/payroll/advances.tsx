import { Form, Head } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/money';
import { Wallet } from 'lucide-react';

type Advance = {
    id: number;
    employee: string | null;
    avatar?: string | null;
    employee_code: string | null;
    department: string | null;
    amount: number;
    reason: string;
    status: string;
    status_label: string;
    created_at: string | null;
    can_decide: boolean;
};

export default function PayrollAdvances({
    advances,
    employees,
    currency,
    canManage,
}: {
    advances: Paginated<Advance>;
    employees: { id: number; first_name: string; last_name: string | null; employee_code: string }[];
    currency: string;
    canManage: boolean;
}) {
    return (
        <>
            <Head title="Salary advances" />
            <PageShell>
                <PageHeader
                    title="Salary advances"
                    description="Approved advances are deducted automatically from the next payroll run."
                />

                {canManage ? (
                    <Form action="/payroll/advances" method="post" className="grid max-w-4xl gap-2 md:grid-cols-4">
                        <select name="employee_id" className="border-input h-9 rounded-md border px-3 text-sm" required>
                            <option value="">Employee</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.first_name} {employee.last_name} ({employee.employee_code})
                                </option>
                            ))}
                        </select>
                        <Input name="amount" type="number" min="1" step="0.01" placeholder="Amount" required />
                        <Input name="reason" placeholder="Reason" required />
                        <Button type="submit">Record advance</Button>
                    </Form>
                ) : null}

                {advances.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Wallet}
                            title="No advances"
                            description="Employees can request an advance from My payslips. HR can also record one here."
                        />
                    </div>
                ) : (
                    <>
                        <DataTable>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Amount</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {advances.data.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <PersonIdentity
                                            name={row.employee ?? 'Employee'}
                                            avatar={row.avatar}
                                            detail={row.employee_code}
                                        />
                                    </td>
                                    <td>{formatMoney(row.amount, currency)}</td>
                                    <td className="max-w-xs">{row.reason}</td>
                                    <td>
                                        <StatusBadge status={row.status} label={row.status_label} withIcon={false} />
                                    </td>
                                    <td className="text-right">
                                        {canManage && row.can_decide ? (
                                            <div className="flex justify-end gap-2">
                                                <Form action={`/payroll/advances/${row.id}/approve`} method="post">
                                                    <Button size="sm" type="submit">
                                                        Approve
                                                    </Button>
                                                </Form>
                                                <Form action={`/payroll/advances/${row.id}/reject`} method="post">
                                                    <Button size="sm" variant="destructive" type="submit">
                                                        Reject
                                                    </Button>
                                                </Form>
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </DataTable>
                    <Pagination paginator={advances} />
                    </>
                )}
            </PageShell>
        </>
    );
}

PayrollAdvances.layout = {
    breadcrumbs: [{ title: 'Advances', href: '/payroll/advances' }],
};
