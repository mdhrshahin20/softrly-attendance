import { Form, Head, Link, router } from '@inertiajs/react';
import { Banknote } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoney } from '@/lib/money';

type Salary = {
    id: number;
    basic_salary: number;
    house_rent: number;
    medical: number;
    other_allowance: number;
    tax_percent: number;
    gross: number;
    effective_from: string;
};

type PayslipSummary = {
    id: number;
    period: string | null;
    net: number;
    status: string | null;
    status_label: string | null;
    can_pay: boolean;
};

type Row = {
    id: number;
    full_name: string;
    avatar?: string | null;
    employee_code: string;
    department: string | null;
    designation: string | null;
    salary: Salary | null;
    latest_payslip: PayslipSummary | null;
};

function numberValue(value: string): number {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

function AssignSalaryDialog({
    employee,
    currency,
    open,
    onOpenChange,
}: {
    employee: Row | null;
    currency: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [basic, setBasic] = useState(String(employee?.salary?.basic_salary ?? ''));
    const [house, setHouse] = useState(String(employee?.salary?.house_rent ?? 0));
    const [medical, setMedical] = useState(String(employee?.salary?.medical ?? 0));
    const [other, setOther] = useState(String(employee?.salary?.other_allowance ?? 0));
    const [tax, setTax] = useState(String(employee?.salary?.tax_percent ?? 0));

    const gross = useMemo(
        () => numberValue(basic) + numberValue(house) + numberValue(medical) + numberValue(other),
        [basic, house, medical, other],
    );
    const estimatedTax = useMemo(() => roundMoney(gross * (numberValue(tax) / 100)), [gross, tax]);

    if (!employee) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{employee.salary ? 'Update salary' : 'Assign salary'}</DialogTitle>
                    <DialogDescription>
                        Set earnings and tax. Payroll uses this structure with attendance for the month.
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-lg border p-3">
                    <PersonIdentity
                        name={employee.full_name}
                        avatar={employee.avatar}
                        detail={`${employee.employee_code} · ${employee.designation ?? employee.department ?? '—'}`}
                    />
                </div>
                <Form
                    action="/payroll/salaries"
                    method="post"
                    className="grid gap-5"
                    options={{ onSuccess: () => onOpenChange(false) }}
                >
                    <input type="hidden" name="employee_id" value={employee.id} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Basic salary" htmlFor="basic_salary">
                            <Input
                                id="basic_salary"
                                name="basic_salary"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={basic}
                                onChange={(event) => setBasic(event.target.value)}
                            />
                        </Field>
                        <Field label="House rent" htmlFor="house_rent">
                            <Input
                                id="house_rent"
                                name="house_rent"
                                type="number"
                                step="0.01"
                                min="0"
                                value={house}
                                onChange={(event) => setHouse(event.target.value)}
                            />
                        </Field>
                        <Field label="Medical allowance" htmlFor="medical">
                            <Input
                                id="medical"
                                name="medical"
                                type="number"
                                step="0.01"
                                min="0"
                                value={medical}
                                onChange={(event) => setMedical(event.target.value)}
                            />
                        </Field>
                        <Field label="Other allowance" htmlFor="other_allowance">
                            <Input
                                id="other_allowance"
                                name="other_allowance"
                                type="number"
                                step="0.01"
                                min="0"
                                value={other}
                                onChange={(event) => setOther(event.target.value)}
                            />
                        </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Tax percent" htmlFor="tax_percent">
                            <Input
                                id="tax_percent"
                                name="tax_percent"
                                type="number"
                                step="0.01"
                                min="0"
                                max="50"
                                value={tax}
                                onChange={(event) => setTax(event.target.value)}
                            />
                        </Field>
                        <Field label="Effective from" htmlFor="effective_from">
                            <DatePicker
                                id="effective_from"
                                name="effective_from"
                                defaultValue={employee.salary?.effective_from ?? new Date().toISOString().slice(0, 10)}
                                required
                                placeholder="Effective from"
                            />
                        </Field>
                    </div>
                    <div className="bg-muted/40 grid gap-2 rounded-lg border p-4 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Gross earnings</span>
                            <span className="font-medium">{formatMoney(gross, currency)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Estimated tax</span>
                            <span>{formatMoney(estimatedTax, currency)}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">{employee.salary ? 'Save salary' : 'Assign salary'}</Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
        </div>
    );
}

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

export default function PayrollSalaries({
    employees,
    filters,
    currency,
}: {
    employees: Paginated<Row>;
    filters: { search: string };
    currency: string;
}) {
    const [editing, setEditing] = useState<Row | null>(null);

    return (
        <>
            <Head title="Salaries" />
            <PageShell>
                <PageHeader
                    title="Salary management"
                    description="Assign a salary structure, then mark each person’s payslip as paid after payroll is generated."
                    actions={
                        <Button variant="outline" asChild>
                            <Link href="/reports/salary">Salary report</Link>
                        </Button>
                    }
                />

                <form
                    className="flex max-w-md gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        router.get('/payroll/salaries', {
                            search: String(data.get('search') ?? ''),
                        });
                    }}
                >
                    <Input name="search" defaultValue={filters.search} placeholder="Search name, email, or ID" />
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                </form>

                {employees.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Banknote}
                            title={filters.search ? 'No matching employees' : 'No active employees'}
                            description="Add people first, then assign a salary structure."
                        />
                    </div>
                ) : (
                    <>
                        <DataTable>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Salary</th>
                                    <th>Latest payroll</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {employees.data.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <PersonIdentity
                                                name={row.full_name}
                                                avatar={row.avatar}
                                                detail={`${row.employee_code} · ${row.designation ?? row.department ?? '—'}`}
                                            />
                                        </td>
                                        <td>
                                            {row.salary ? (
                                                <div>
                                                    <div className="font-medium">{formatMoney(row.salary.gross, currency)}</div>
                                                    <div className="text-muted-foreground text-xs">
                                                        From {row.salary.effective_from}
                                                    </div>
                                                </div>
                                            ) : (
                                                <StatusBadge status="unpaid" label="Not set" withIcon={false} />
                                            )}
                                        </td>
                                        <td>
                                            {row.latest_payslip ? (
                                                <div className="space-y-1">
                                                    <StatusBadge
                                                        status={row.latest_payslip.status ?? 'unpaid'}
                                                        label={row.latest_payslip.status_label ?? 'Unpaid'}
                                                        withIcon={false}
                                                    />
                                                    <div className="text-muted-foreground text-xs">
                                                        {row.latest_payslip.period} · {formatMoney(row.latest_payslip.net, currency)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No payroll yet</span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex flex-wrap justify-end gap-1">
                                                <Button variant="outline" size="sm" onClick={() => setEditing(row)}>
                                                    {row.salary ? 'Edit salary' : 'Assign salary'}
                                                </Button>
                                                {row.latest_payslip?.can_pay ? (
                                                    <Form action={`/payroll/payslips/${row.latest_payslip.id}/pay`} method="post">
                                                        <Button size="sm" type="submit">
                                                            Mark as paid
                                                        </Button>
                                                    </Form>
                                                ) : null}
                                                {row.latest_payslip ? (
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/payroll/payslips/${row.latest_payslip.id}`}>Payslip</Link>
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </DataTable>
                        <Pagination paginator={employees} />
                    </>
                )}
            </PageShell>
            <AssignSalaryDialog
                key={editing?.id ?? 'none'}
                employee={editing}
                currency={currency}
                open={editing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditing(null);
                    }
                }}
            />
        </>
    );
}

PayrollSalaries.layout = {
    breadcrumbs: [{ title: 'Salaries', href: '/payroll/salaries' }],
};
