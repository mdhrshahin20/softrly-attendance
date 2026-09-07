import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Shift = {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    grace_minutes: number;
    minimum_work_minutes: number;
    status: string;
};

export default function ShiftsIndex({ shifts }: { shifts: Shift[] }) {
    return (
        <>
            <Head title="Shifts" />
            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-semibold">Work shifts</h1>
                <Form action="/shifts" method="post" className="grid max-w-4xl gap-2 sm:grid-cols-5">
                    <Input name="name" placeholder="General Shift" required />
                    <Input name="start_time" type="time" required />
                    <Input name="end_time" type="time" required />
                    <Input name="grace_minutes" type="number" defaultValue={10} required />
                    <input type="hidden" name="minimum_work_minutes" value="480" />
                    <input type="hidden" name="status" value="active" />
                    <Button type="submit">Add shift</Button>
                </Form>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Hours</th>
                                <th className="px-4 py-3">Grace</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shifts.map((shift) => (
                                <tr key={shift.id} className="border-t">
                                    <td className="px-4 py-3">{shift.name}</td>
                                    <td className="px-4 py-3">
                                        {String(shift.start_time).slice(0, 5)} – {String(shift.end_time).slice(0, 5)}
                                    </td>
                                    <td className="px-4 py-3">{shift.grace_minutes} min</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

ShiftsIndex.layout = {
    breadcrumbs: [{ title: 'Shifts', href: '/shifts' }],
};
