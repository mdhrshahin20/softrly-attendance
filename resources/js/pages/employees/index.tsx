import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, Search, Users } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { ResultsCount, TableToolbar } from '@/components/table-toolbar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/status-badge';

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

type Filters = {
    search?: string;
    department_id?: number | string;
    office_id?: number | string;
};

type Props = {
    employees: Paginated<EmployeeRow>;
    filters: Filters;
    departments: { id: number; name: string }[];
    offices: { id: number; name: string }[];
    canExport?: boolean;
    canImport?: boolean;
};

export default function EmployeesIndex({
    employees,
    filters,
    departments,
    offices,
    canExport = false,
    canImport = false,
}: Props) {
    const { can, subscription } = usePage().props;
    const usage = subscription as
        | { employees_used?: number; employee_limit?: number | null }
        | undefined;
    const atLimit =
        usage?.employee_limit !== null &&
        usage?.employee_limit !== undefined &&
        Number(usage.employees_used ?? 0) >= usage.employee_limit;

    function submit(form: HTMLFormElement) {
        const data = new FormData(form);

        router.get('/employees', {
            search: String(data.get('search') ?? ''),
            department_id: String(data.get('department_id') ?? ''),
            office_id: String(data.get('office_id') ?? ''),
        });
    }

    return (
        <>
            <Head title="Employees" />
            <PageShell>
                <PageHeader
                    title="Employees"
                    description="People, offices, and shifts for this workspace."
                    actions={
                        <>
                            {can?.createEmployees && !atLimit ? (
                                <Button asChild>
                                    <Link href="/employees/create">Add employee</Link>
                                </Button>
                            ) : null}
                            {can?.createEmployees && atLimit && can?.manageBilling ? (
                                <Button asChild>
                                    <Link href="/settings/billing">Upgrade plan</Link>
                                </Button>
                            ) : null}
                            {canImport ? (
                                <Button variant="outline" asChild>
                                    <Link href="/employees/import">Import CSV</Link>
                                </Button>
                            ) : null}
                            {canExport ? (
                                <Button variant="outline" asChild>
                                    <a href="/employees/export">Export CSV</a>
                                </Button>
                            ) : null}
                        </>
                    }
                />

                <TableToolbar>
                    <form
                        className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:max-w-none"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submit(event.currentTarget);
                        }}
                    >
                        <div className="relative min-w-0 flex-1 sm:max-w-xs">
                            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                            <Input
                                name="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Search name, email, or ID"
                                className="bg-muted/40 h-9 pl-8 text-sm"
                            />
                        </div>

                        <select
                            name="department_id"
                            defaultValue={filters.department_id ?? ''}
                            className="border-input bg-background h-9 rounded-md border px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        >
                            <option value="">All departments</option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                        </select>

                        <select
                            name="office_id"
                            defaultValue={filters.office_id ?? ''}
                            className="border-input bg-background h-9 rounded-md border px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        >
                            <option value="">All offices</option>
                            {offices.map((office) => (
                                <option key={office.id} value={office.id}>
                                    {office.name}
                                </option>
                            ))}
                        </select>

                        <Button type="submit" variant="secondary" size="sm" className="h-9">
                            Search
                        </Button>
                    </form>

                    <ResultsCount
                        total={employees.total ?? employees.data.length}
                        from={employees.from}
                        to={employees.to}
                    />
                </TableToolbar>

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
                                    <th scope="col">Employee</th>
                                    <th scope="col">ID</th>
                                    <th scope="col">Department</th>
                                    <th scope="col">Office</th>
                                    <th scope="col">Status</th>
                                    <th scope="col" className="text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
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
                                                className="min-w-0"
                                            />
                                        </td>
                                        <td className="font-mono text-xs tabular-nums">
                                            {employee.employee_code}
                                        </td>
                                        <td className="whitespace-nowrap">
                                            {employee.department?.name ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap">
                                            {employee.office?.name ?? '—'}
                                        </td>
                                        <td>
                                            <StatusBadge status={employee.status} />
                                        </td>
                                        <td className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground size-8"
                                                        aria-label={`Actions for ${employee.full_name}`}
                                                    >
                                                        <ChevronDown className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/employees/${employee.id}`}>
                                                            View profile
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/employees/${employee.id}/edit`}>
                                                            Edit employee
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
