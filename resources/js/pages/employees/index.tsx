import { Head, Link, router, usePage } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type EmployeeRow = {
    id: number;
    employee_code: string;
    full_name: string;
    avatar?: string | null;
    email: string;
    status: string;
    joining_date?: string | null;
    department: { id: number; name: string } | null;
    designation: { id: number; name: string } | null;
    office: { id: number; name: string } | null;
};

type Props = {
    employees: Paginated<EmployeeRow>;
    filters: { search?: string };
    departments: { id: number; name: string }[];
    offices: { id: number; name: string }[];
    canExport?: boolean;
    canImport?: boolean;
};

export default function EmployeesIndex({ employees, filters, canExport = false, canImport = false }: Props) {
    const { can, subscription } = usePage().props;
    const usage = subscription as
        | { employees_used?: number; employee_limit?: number | null }
        | undefined;
    const atLimit =
        usage?.employee_limit !== null &&
        usage?.employee_limit !== undefined &&
        Number(usage.employees_used ?? 0) >= usage.employee_limit;

    return (
        <>
            <Head title="Employees" />
            <PageShell>
                <PageHeader
                    title="Employees"
                    description="People, offices, and shifts for this workspace."
                    actions={
                        <>
                            {can?.createEmployees && !atLimit && (
                                <Button asChild>
                                    <Link href="/employees/create">Add employee</Link>
                                </Button>
                            )}
                            {can?.createEmployees && atLimit && can?.manageBilling && (
                                <Button asChild>
                                    <Link href="/billing">Upgrade plan</Link>
                                </Button>
                            )}
                            {canImport && (
                                <Button variant="outline" asChild>
                                    <Link href="/employees/import">Import CSV</Link>
                                </Button>
                            )}
                            {canExport && (
                                <Button variant="outline" asChild>
                                    <a href="/employees/export">Export CSV</a>
                                </Button>
                            )}
                        </>
                    }
                />

                {usage?.employee_limit != null && (
                    <p className="text-muted-foreground text-sm">
                        {usage.employees_used} / {usage.employee_limit} employees on the current plan
                        {atLimit ? '. Limit reached.' : ''}
                    </p>
                )}

                <form
                    className="flex max-w-md gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        router.get('/employees', {
                            search: String(data.get('search') ?? ''),
                        });
                    }}
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Search name, email, or ID"
                    />
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                </form>

                {employees.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Users}
                            title="No employees yet"
                            description="Add your first employee to start managing attendance and leave."
                            action={
                                can?.createEmployees ? (
                                    <Button asChild>
                                        <Link href="/employees/create">Add employee</Link>
                                    </Button>
                                ) : undefined
                            }
                        />
                    </div>
                ) : (
                    <>
                        <DataTable>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>ID</th>
                                <th>Department</th>
                                <th>Office</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {employees.data.map((employee) => (
                                <tr key={employee.id}>
                                    <td>
                                        <PersonIdentity
                                            name={employee.full_name}
                                            avatar={employee.avatar}
                                            detail={employee.designation?.name ?? employee.email}
                                            href={`/employees/${employee.id}`}
                                        />
                                    </td>
                                    <td className="font-mono text-xs">{employee.employee_code}</td>
                                    <td>{employee.department?.name ?? '—'}</td>
                                    <td>{employee.office?.name ?? '—'}</td>
                                    <td>
                                        <StatusBadge status={employee.status} />
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/employees/${employee.id}`}>View</Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/employees/${employee.id}/edit`}>Edit</Link>
                                            </Button>
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
        </>
    );
}

EmployeesIndex.layout = {
    breadcrumbs: [{ title: 'Employees', href: '/employees' }],
};
