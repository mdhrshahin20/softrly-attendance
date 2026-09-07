import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

type Row = {
    id: number;
    employee: string | null;
    employee_code: string | null;
    department: string | null;
    leave_type: string | null;
    start_date: string;
    end_date: string;
    total_days: number;
    duration_type: string;
    reason: string;
    status: string;
};

export default function LeaveApprovals({ requests }: { requests: Row[] }) {
    return (
        <>
            <Head title="Leave approvals" />
            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-semibold">Leave approvals</h1>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Dates</th>
                                <th className="px-4 py-3">Days</th>
                                <th className="px-4 py-3">Reason</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((row) => (
                                <tr key={row.id} className="border-t align-top">
                                    <td className="px-4 py-3">
                                        <div>{row.employee}</div>
                                        <div className="text-muted-foreground text-xs">{row.employee_code} · {row.department ?? 'No department'}</div>
                                    </td>
                                    <td className="px-4 py-3">{row.leave_type}</td>
                                    <td className="px-4 py-3">{row.start_date} – {row.end_date}<div className="text-muted-foreground text-xs">{row.duration_type}</div></td>
                                    <td className="px-4 py-3">{row.total_days}</td>
                                    <td className="px-4 py-3 max-w-xs">{row.reason}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-2">
                                            <Form action={`/leave/${row.id}/approve`} method="post" className="flex gap-2">
                                                <input type="hidden" name="comment" value="Approved" />
                                                <Button type="submit" size="sm">Approve</Button>
                                            </Form>
                                            <Form action={`/leave/${row.id}/reject`} method="post">
                                                <input type="hidden" name="comment" value="Rejected" />
                                                <Button type="submit" size="sm" variant="destructive">Reject</Button>
                                            </Form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td className="text-muted-foreground px-4 py-6" colSpan={6}>No pending leave requests.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

LeaveApprovals.layout = {
    breadcrumbs: [
        { title: 'Leave', href: '/leave' },
        { title: 'Approvals', href: '/leave/approvals' },
    ],
};
