import { Form, Head } from '@inertiajs/react';
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
            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-semibold">Departments</h1>
                <Form action="/departments" method="post" className="flex max-w-3xl flex-wrap gap-2">
                    <Input name="name" placeholder="Engineering" required />
                    <Input name="code" placeholder="ENG" required />
                    <input type="hidden" name="status" value="active" />
                    <Button type="submit">Add</Button>
                </Form>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Code</th>
                                <th className="px-4 py-3">Employees</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((department) => (
                                <tr key={department.id} className="border-t">
                                    <td className="px-4 py-3">{department.name}</td>
                                    <td className="px-4 py-3">{department.code}</td>
                                    <td className="px-4 py-3">{department.employees_count}</td>
                                    <td className="px-4 py-3">{department.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

DepartmentsIndex.layout = {
    breadcrumbs: [{ title: 'Departments', href: '/departments' }],
};
