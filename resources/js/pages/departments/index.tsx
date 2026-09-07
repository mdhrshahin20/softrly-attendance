import { Form, Head } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Department = {
    id: number;
    name: string;
    code: string;
    status: string;
    employees_count: number;
};

export default function DepartmentsIndex({ departments }: { departments: Department[] }) {
    return (
        <>
            <Head title="Departments" />
            <PageShell>
                <PageHeader
                    title="Departments"
                    description="Group employees by team for leave and reporting."
                />
                <Form action="/departments" method="post" className="flex max-w-3xl flex-wrap gap-2">
                    <Input name="name" placeholder="Engineering" required />
                    <Input name="code" placeholder="ENG" required />
                    <input type="hidden" name="status" value="active" />
                    <Button type="submit">Add department</Button>
                </Form>
                <DataTable>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Employees</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map((department) => (
                            <tr key={department.id}>
                                <td className="font-medium">{department.name}</td>
                                <td>{department.code}</td>
                                <td>{department.employees_count}</td>
                                <td>
                                    <StatusBadge status={department.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </DataTable>
            </PageShell>
        </>
    );
}

DepartmentsIndex.layout = {
    breadcrumbs: [{ title: 'Departments', href: '/departments' }],
};
