import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type LeaveType = {
    id: number;
    name: string;
    code: string;
    days_per_year: number;
    is_paid: boolean;
    requires_attachment: boolean;
    minimum_notice_days: number;
    status: string;
};

export default function LeaveTypes({ types }: { types: LeaveType[] }) {
    return (
        <>
            <Head title="Leave types" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
                <h1 className="text-2xl font-semibold">Leave types</h1>
                <Form action="/leave/types" method="post" className="grid max-w-5xl gap-2 md:grid-cols-6">
                    <Input name="name" placeholder="Casual Leave" required />
                    <Input name="code" placeholder="CL" required />
                    <Input name="days_per_year" type="number" defaultValue={10} required />
                    <Input name="minimum_notice_days" type="number" defaultValue={1} required />
                    <input type="hidden" name="is_paid" value="1" />
                    <input type="hidden" name="status" value="active" />
                    <Button type="submit">Add type</Button>
                </Form>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Code</th>
                                <th className="px-4 py-3">Days / year</th>
                                <th className="px-4 py-3">Notice</th>
                                <th className="px-4 py-3">Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {types.map((type) => (
                                <tr key={type.id} className="border-t">
                                    <td className="px-4 py-3">{type.name}</td>
                                    <td className="px-4 py-3">{type.code}</td>
                                    <td className="px-4 py-3">{type.days_per_year}</td>
                                    <td className="px-4 py-3">{type.minimum_notice_days}d</td>
                                    <td className="px-4 py-3">{type.is_paid ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

LeaveTypes.layout = {
    breadcrumbs: [{ title: 'Leave types', href: '/leave/types' }],
};
