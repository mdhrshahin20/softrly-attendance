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
import { TimePicker } from '@/components/ui/time-picker';

type Shift = {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    grace_minutes: number;
    minimum_work_minutes: number;
    status: string;
    employees_count: number;
};

function ShiftFields({ shift }: { shift?: Shift }) {
    return (
        <>
            <Input name="name" defaultValue={shift?.name} placeholder="General Shift" required />
            <TimePicker name="start_time" defaultValue={shift?.start_time} required placeholder="Start time" />
            <TimePicker name="end_time" defaultValue={shift?.end_time} required placeholder="End time" />
            <Input
                name="grace_minutes"
                type="number"
                min={0}
                max={180}
                defaultValue={shift?.grace_minutes ?? 10}
                required
                aria-label="Grace minutes"
            />
            <Input
                name="minimum_work_minutes"
                type="number"
                min={60}
                max={1440}
                defaultValue={shift?.minimum_work_minutes ?? 480}
                required
                aria-label="Minimum work minutes"
            />
            <select
                name="status"
                defaultValue={shift?.status ?? 'active'}
                className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
                aria-label="Status"
            >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
        </>
    );
}

export default function ShiftsIndex({ shifts }: { shifts: Paginated<Shift> }) {
    const [editingId, setEditingId] = useState<number | null>(null);

    return (
        <>
            <Head title="Shifts" />
            <PageShell>
                <PageHeader
                    title="Work shifts"
                    description="Start time, end time, and late grace for each shift."
                />
                <Form
                    action="/shifts"
                    method="post"
                    className="grid max-w-5xl gap-2 sm:grid-cols-2 lg:grid-cols-7"
                >
                    <ShiftFields />
                    <Button type="submit">Add shift</Button>
                </Form>
                <DataTable>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Hours</th>
                            <th>Grace</th>
                            <th>Min. work</th>
                            <th>People</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {shifts.data.map((shift) =>
                            editingId === shift.id ? (
                                <tr key={shift.id}>
                                    <td colSpan={7}>
                                        <Form
                                            action={`/shifts/${shift.id}`}
                                            method="put"
                                            className="grid gap-2 py-1 sm:grid-cols-2 lg:grid-cols-7"
                                            options={{ onSuccess: () => setEditingId(null) }}
                                        >
                                            <ShiftFields shift={shift} />
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
                                <tr key={shift.id}>
                                    <td className="font-medium">{shift.name}</td>
                                    <td>
                                        {shift.start_time} – {shift.end_time}
                                    </td>
                                    <td>{shift.grace_minutes} min</td>
                                    <td>{shift.minimum_work_minutes} min</td>
                                    <td>{shift.employees_count}</td>
                                    <td>
                                        <StatusBadge status={shift.status} withIcon={false} />
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingId(shift.id)}
                                            >
                                                Edit
                                            </Button>
                                            <DeleteConfirm
                                                action={`/shifts/${shift.id}`}
                                                title={`Delete ${shift.name}?`}
                                                description={`This cannot be undone. ${shift.name} will be permanently deleted.`}
                                                disabled={shift.employees_count > 0}
                                                disabledTitle="Reassign employees before deleting"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ),
                        )}
                    </tbody>
                </DataTable>
                <Pagination paginator={shifts} />
            </PageShell>
        </>
    );
}

ShiftsIndex.layout = {
    breadcrumbs: [{ title: 'Shifts', href: '/shifts' }],
};
