import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type EmployeeRow = {
    id: number;
    employee_code: string;
    full_name: string;
    email: string;
    status: string;
    department: { id: number; name: string } | null;
    designation: { id: number; name: string } | null;
    office: { id: number; name: string } | null;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
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
    return (
        <>
            <Head title="Employees" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Employees</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage people, offices, and shifts for this tenant.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href="/employees/create">Add employee</Link>
                    </Button>
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
                    </div>
                </div>

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

                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3 font-medium">Code</th>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Department</th>
                                <th className="px-4 py-3 font-medium">Office</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {employees.data.map((employee) => (
                                <tr key={employee.id} className="border-t">
                                    <td className="px-4 py-3">{employee.employee_code}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{employee.full_name}</div>
                                        <div className="text-muted-foreground">{employee.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {employee.department?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {employee.office?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                                            {employee.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/employees/${employee.id}/edit`}>
                                                Edit
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

EmployeesIndex.layout = {
    breadcrumbs: [{ title: 'Employees', href: '/employees' }],
};
