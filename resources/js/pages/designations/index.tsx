import { Form, Head } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Designation = {
    id: number;
    name: string;
    status: string;
    employees_count: number;
    department: { id: number; name: string } | null;
};

export default function DesignationsIndex({
    designations,
    departments,
}: {
    designations: Designation[];
    departments: { id: number; name: string }[];
}) {
    return (
        <>
            <Head title="Designations" />
            <PageShell>
                <PageHeader
                    title="Designations"
                    description="Job titles used across departments."
                />
                <Form action="/designations" method="post" className="flex max-w-3xl flex-wrap gap-2">
                    <Input name="name" placeholder="Software Engineer" required />
                    <select name="department_id" className="border-input h-9 rounded-md border px-3 text-sm">
                        <option value="">No department</option>
                        {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                                {department.name}
                            </option>
                        ))}
                    </select>
                    <input type="hidden" name="status" value="active" />
                    <Button type="submit">Add</Button>
                </Form>
                <DataTable>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Employees</th>
                        </tr>
                    </thead>
                    <tbody>
                        {designations.map((designation) => (
                            <tr key={designation.id}>
                                <td className="font-medium">{designation.name}</td>
                                <td>{designation.department?.name ?? '—'}</td>
                                <td>{designation.employees_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </DataTable>
            </PageShell>
        </>
    );
}

DesignationsIndex.layout = {
    breadcrumbs: [{ title: 'Designations', href: '/designations' }],
};
