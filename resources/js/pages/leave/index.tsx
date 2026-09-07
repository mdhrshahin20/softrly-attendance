import { Form, Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LeaveRequestRow = {
    id: number;
    leave_type: string | null;
    start_date: string;
    end_date: string;
    total_days: number;
    duration_type: string;
    reason: string;
    status: string;
    status_label: string;
    can_cancel: boolean;
};

type Props = {
    requests: LeaveRequestRow[];
    balances: {
        id: number;
        leave_type: string | null;
        code: string | null;
        allocated: number;
        used: number;
        pending: number;
        remaining: number;
    }[];
    types: {
        id: number;
        name: string;
        requires_attachment: boolean;
        minimum_notice_days: number;
    }[];
    durationTypes: { value: string; label: string }[];
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    cancelled: 'outline',
};

export default function LeaveIndex({ requests, balances, types, durationTypes }: Props) {
    return (
        <>
            <Head title="Leave" />
            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-semibold">Leave</h1>

                <div className="grid gap-3 sm:grid-cols-4">
                    {balances.map((balance) => (
                        <div key={balance.id} className="rounded-xl border p-4">
                            <div className="text-muted-foreground text-sm">{balance.leave_type}</div>
                            <div className="mt-1 text-2xl font-semibold">{balance.remaining}</div>
                            <div className="text-muted-foreground mt-1 text-xs">
                                {balance.used} used · {balance.pending} pending · {balance.allocated} allocated
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl border p-4">
                    <h2 className="mb-4 font-medium">Apply for leave</h2>
                    <Form action="/leave" method="post" encType="multipart/form-data" className="grid gap-3 md:grid-cols-2">
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="leave_type_id">Leave type</Label>
                                    <select id="leave_type_id" name="leave_type_id" required className="border-input h-9 rounded-md border bg-transparent px-3 text-sm">
                                        {types.map((type) => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                    {errors.leave_type_id && <p className="text-destructive text-sm">{errors.leave_type_id}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="duration_type">Duration</Label>
                                    <select id="duration_type" name="duration_type" required className="border-input h-9 rounded-md border bg-transparent px-3 text-sm">
                                        {durationTypes.map((type) => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">From</Label>
                                    <Input id="start_date" name="start_date" type="date" required />
                                    {errors.start_date && <p className="text-destructive text-sm">{errors.start_date}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">To</Label>
                                    <Input id="end_date" name="end_date" type="date" required />
                                    {errors.end_date && <p className="text-destructive text-sm">{errors.end_date}</p>}
                                </div>
                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <textarea id="reason" name="reason" required rows={3} className="border-input rounded-md border bg-transparent px-3 py-2 text-sm" />
                                    {errors.reason && <p className="text-destructive text-sm">{errors.reason}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="attachment">Attachment</Label>
                                    <Input id="attachment" name="attachment" type="file" />
                                    {errors.attachment && <p className="text-destructive text-sm">{errors.attachment}</p>}
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" disabled={processing}>Submit request</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Dates</th>
                                <th className="px-4 py-3">Days</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((row) => (
                                <tr key={row.id} className="border-t">
                                    <td className="px-4 py-3">{row.leave_type}</td>
                                    <td className="px-4 py-3">{row.start_date} – {row.end_date}</td>
                                    <td className="px-4 py-3">{row.total_days}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={statusVariant[row.status] ?? 'secondary'}>{row.status_label}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {row.can_cancel && (
                                            <Form action={`/leave/${row.id}/cancel`} method="post">
                                                <Button type="submit" variant="ghost" size="sm">Cancel</Button>
                                            </Form>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td className="text-muted-foreground px-4 py-6" colSpan={5}>No leave requests yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

LeaveIndex.layout = {
    breadcrumbs: [{ title: 'Leave', href: '/leave' }],
};
