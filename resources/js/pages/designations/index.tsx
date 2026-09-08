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

type Designation = {
    id: number;
    name: string;
    status: string;
    employees_count: number;
    department: { id: number; name: string } | null;
};

const fieldClass =
    'border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none';

function DesignationFields({
    designation,
    departments,
}: {
    designation?: Designation;
    departments: { id: number; name: string }[];
}) {
    return (
        <>
            <Input
                name="name"
                defaultValue={designation?.name}
                placeholder="Software Engineer"
                required
            />
            <select
                name="department_id"
                defaultValue={designation?.department?.id ?? ''}
                className={fieldClass}
                aria-label="Department"
            >
                <option value="">No department</option>
                {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                        {department.name}
                    </option>
                ))}
            </select>
            <select
                name="status"
                defaultValue={designation?.status ?? 'active'}
                className={fieldClass}
                aria-label="Status"
            >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
        </>
    );
}

export default function DesignationsIndex({
    designations,
    departments,
}: {
    designations: Paginated<Designation>;
    departments: { id: number; name: string }[];
}) {
    const [editingId, setEditingId] = useState<number | null>(null);

    return (
        <>
            <Head title="Designations" />
            <PageShell>
                <PageHeader
                    title="Designations"
                    description="Job titles used across departments."
                />
                <Form action="/designations" method="post" className="grid max-w-3xl gap-2 sm:grid-cols-4">
                    <DesignationFields departments={departments} />
                    <Button type="submit">Add</Button>
                </Form>
                <DataTable>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Employees</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {designations.data.map((designation) =>
                            editingId === designation.id ? (
                                <tr key={designation.id}>
                                    <td colSpan={5}>
                                        <Form
                                            action={`/designations/${designation.id}`}
                                            method="put"
                                            className="grid gap-2 py-1 sm:grid-cols-4"
                                            options={{ onSuccess: () => setEditingId(null) }}
                                        >
                                            <DesignationFields
                                                designation={designation}
                                                departments={departments}
                                            />
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
                                <tr key={designation.id}>
                                    <td className="font-medium">{designation.name}</td>
                                    <td>{designation.department?.name ?? '—'}</td>
                                    <td>{designation.employees_count}</td>
                                    <td>
                                        <StatusBadge status={designation.status} withIcon={false} />
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingId(designation.id)}
                                            >
                                                Edit
                                            </Button>
                                            <DeleteConfirm
                                                action={`/designations/${designation.id}`}
                                                title={`Delete ${designation.name}?`}
                                                description={`This cannot be undone. ${designation.name} will be permanently deleted.`}
                                                disabled={designation.employees_count > 0}
                                                disabledTitle="Reassign employees before deleting"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ),
                        )}
                    </tbody>
                </DataTable>
                <Pagination paginator={designations} />
            </PageShell>
        </>
    );
}

DesignationsIndex.layout = {
    breadcrumbs: [{ title: 'Designations', href: '/designations' }],
};
