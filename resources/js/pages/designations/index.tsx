import { Form, Head } from '@inertiajs/react';
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
            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-semibold">Designations</h1>
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
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Department</th>
                                <th className="px-4 py-3">Employees</th>
                            </tr>
                        </thead>
                        <tbody>
                            {designations.map((designation) => (
                                <tr key={designation.id} className="border-t">
                                    <td className="px-4 py-3">{designation.name}</td>
                                    <td className="px-4 py-3">{designation.department?.name ?? '—'}</td>
                                    <td className="px-4 py-3">{designation.employees_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

DesignationsIndex.layout = {
    breadcrumbs: [{ title: 'Designations', href: '/designations' }],
};
