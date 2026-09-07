import { Form, Head } from '@inertiajs/react';
import { Inbox } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
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
            <PageShell>
                <PageHeader
                    title="Leave approvals"
                    description="Review pending requests. Approve or reject with a single action."
                />

                {requests.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Inbox}
                            title="No pending requests"
                            description="New leave requests from your team will show up here."
                        />
                    </div>
                ) : (
                    <DataTable>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Type</th>
                                <th>Dates</th>
                                <th>Days</th>
                                <th>Reason</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((row) => (
                                <tr key={row.id} className="align-top">
                                    <td>
                                        <div className="font-medium">{row.employee}</div>
                                        <div className="text-muted-foreground text-xs">
                                            {row.employee_code} · {row.department ?? 'No department'}
                                        </div>
                                    </td>
                                    <td>{row.leave_type}</td>
                                    <td>
                                        {row.start_date} – {row.end_date}
                                        <div className="text-muted-foreground text-xs">{row.duration_type}</div>
                                    </td>
                                    <td>{row.total_days}</td>
                                    <td className="max-w-xs">{row.reason}</td>
                                    <td>
                                        <div className="flex flex-col gap-2">
                                            <Form
                                                action={`/leave/${row.id}/approve`}
                                                method="post"
                                                className="flex gap-2"
                                            >
                                                <input type="hidden" name="comment" value="Approved" />
                                                <Button type="submit" size="sm">
                                                    Approve
                                                </Button>
                                            </Form>
                                            <Form action={`/leave/${row.id}/reject`} method="post">
                                                <input type="hidden" name="comment" value="Rejected" />
                                                <Button type="submit" size="sm" variant="destructive">
                                                    Reject
                                                </Button>
                                            </Form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </DataTable>
                )}
            </PageShell>
        </>
    );
}

LeaveApprovals.layout = {
    breadcrumbs: [
        { title: 'Leave', href: '/leave' },
        { title: 'Approvals', href: '/leave/approvals' },
    ],
};
