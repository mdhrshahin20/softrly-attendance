import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { DeleteConfirm } from '@/components/delete-confirm';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
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

const fieldClass =
    'border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none';

function DepartmentFields({ department }: { department?: Department }) {
    return (
        <>
            <Input name="name" defaultValue={department?.name} placeholder="Engineering" required />
            <Input name="code" defaultValue={department?.code} placeholder="ENG" required />
            <select
                name="status"
                defaultValue={department?.status ?? 'active'}
                className={fieldClass}
                aria-label="Status"
            >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
        </>
    );
}

export default function DepartmentsIndex({ departments }: { departments: Paginated<Department> }) {
    const [editingId, setEditingId] = useState<number | null>(null);

    return (
        <>
            <Head title="Departments" />
            <PageShell>
                <PageHeader
                    title="Departments"
                    description="Group employees by team for leave and reporting."
                />
                <Form action="/departments" method="post" className="grid max-w-3xl gap-2 sm:grid-cols-4">
                    <DepartmentFields />
                    <Button type="submit">Add department</Button>
                </Form>
                <DataTable>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Employees</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {departments.data.map((department) =>
                            editingId === department.id ? (
                                <tr key={department.id}>
                                    <td colSpan={5}>
                                        <Form
                                            action={`/departments/${department.id}`}
                                            method="put"
                                            className="grid gap-2 py-1 sm:grid-cols-4"
                                            options={{ onSuccess: () => setEditingId(null) }}
                                        >
                                            <DepartmentFields department={department} />
                                            <div className="flex gap-2">
                                                <Button type="submit">Save</Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </Form>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={department.id}>
                                    <td className="font-medium">{department.name}</td>
                                    <td>{department.code}</td>
                                    <td>{department.employees_count}</td>
                                    <td>
                                        <StatusBadge status={department.status} withIcon={false} />
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingId(department.id)}
                                            >
                                                Edit
                                            </Button>
                                            <DeleteConfirm
                                                action={`/departments/${department.id}`}
                                                title={`Delete ${department.name}?`}
                                                description={`This cannot be undone. ${department.name} will be permanently deleted.`}
                                                disabled={department.employees_count > 0}
                                                disabledTitle="Reassign employees before deleting"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ),
                        )}
                    </tbody>
                </DataTable>
                <Pagination paginator={departments} />
            </PageShell>
        </>
    );
}

DepartmentsIndex.layout = {
    breadcrumbs: [{ title: 'Departments', href: '/departments' }],
};
