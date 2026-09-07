import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Holiday = {
    id: number;
    name: string;
    date: string;
    end_date: string | null;
    holiday_type_label: string;
    office: string | null;
    department: string | null;
    status: string;
};

type Props = {
    holidays: Holiday[];
    offices: { id: number; name: string }[];
    departments: { id: number; name: string }[];
    types: { value: string; label: string }[];
    canManage: boolean;
};

export default function HolidaysIndex({ holidays, offices, departments, types, canManage }: Props) {
    return (
        <>
            <Head title="Holidays" />
            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-semibold">Holidays</h1>
                {canManage && (
                    <Form action="/holidays" method="post" className="grid max-w-5xl gap-2 md:grid-cols-7">
                        <Input name="name" placeholder="Victory Day" required />
                        <Input name="date" type="date" required />
                        <Input name="end_date" type="date" />
                        <select name="holiday_type" className="border-input h-9 rounded-md border bg-transparent px-3 text-sm" defaultValue="public">
                            {types.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        <select name="office_id" className="border-input h-9 rounded-md border bg-transparent px-3 text-sm" defaultValue="">
                            <option value="">All offices</option>
                            {offices.map((office) => (
                                <option key={office.id} value={office.id}>{office.name}</option>
                            ))}
                        </select>
                        <select name="department_id" className="border-input h-9 rounded-md border bg-transparent px-3 text-sm" defaultValue="">
                            <option value="">All departments</option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.id}>{department.name}</option>
                            ))}
                        </select>
                        <input type="hidden" name="status" value="active" />
                        <Button type="submit">Add holiday</Button>
                    </Form>
                )}
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Scope</th>
                                {canManage && <th className="px-4 py-3" />}
                            </tr>
                        </thead>
                        <tbody>
                            {holidays.map((holiday) => (
                                <tr key={holiday.id} className="border-t">
                                    <td className="px-4 py-3">{holiday.name}</td>
                                    <td className="px-4 py-3">
                                        {holiday.date}{holiday.end_date && holiday.end_date !== holiday.date ? ` – ${holiday.end_date}` : ''}
                                    </td>
                                    <td className="px-4 py-3">{holiday.holiday_type_label}</td>
                                    <td className="px-4 py-3">{holiday.office ?? holiday.department ?? 'All company'}</td>
                                    {canManage && (
                                        <td className="px-4 py-3 text-right">
                                            <Form action={`/holidays/${holiday.id}`} method="delete">
                                                <Button type="submit" variant="ghost" size="sm">Delete</Button>
                                            </Form>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

HolidaysIndex.layout = {
    breadcrumbs: [{ title: 'Holidays', href: '/holidays' }],
};
