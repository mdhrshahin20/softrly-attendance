import { Form, Head, Link } from '@inertiajs/react';
import { Inbox } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { Button } from '@/components/ui/button';

type Row = {
    id: number;
    employee: string | null;
    avatar?: string | null;
    employee_code: string | null;
    department: string | null;
    leave_type: string | null;
    start_date: string;
    end_date: string;
    total_days: number;
    duration_type: string;
    reason: string;
    status: string;
    attachment: { name: string; url: string; is_image: boolean } | null;
};

export default function LeaveApprovals({ requests }: { requests: Paginated<Row> }) {
    return (
        <>
            <Head title="Leave approvals" />
            <PageShell>
                <PageHeader
                    title="Leave approvals"
                    description="Review pending requests. Approve or reject with a single action."
                    actions={
                        <Button variant="outline" asChild>
                            <Link href="/leave/applications">All applications</Link>
                        </Button>
                    }
                />

                {requests.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Inbox}
                            title="No pending requests"
                            description="New leave requests from your team will show up here."
                        />
                    </div>
                ) : (
                    <>
                        <DataTable>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Type</th>
                                <th>Dates</th>
                                <th>Days</th>
                                <th>Reason</th>
                                <th>File</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {requests.data.map((row) => (
                                <tr key={row.id} className="align-top">
                                    <td>
                                        <PersonIdentity
                                            name={row.employee ?? 'Employee'}
                                            avatar={row.avatar}
                                            detail={`${row.employee_code ?? ''} · ${row.department ?? 'No department'}`}
                                            href={`/leave/${row.id}`}
                                        />
                                    </td>
                                    <td>{row.leave_type}</td>
                                    <td>
                                        {row.start_date} – {row.end_date}
                                        <div className="text-muted-foreground text-xs">{row.duration_type}</div>
                                    </td>
                                    <td>{row.total_days}</td>
                                    <td className="max-w-xs">{row.reason}</td>
                                    <td>
                                        {row.attachment ? (
                                            <a
                                                href={row.attachment.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary text-sm"
                                            >
                                                {row.attachment.name}
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">None</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex flex-col items-stretch gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/leave/${row.id}`}>View details</Link>
                                            </Button>
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
                    <Pagination paginator={requests} />
                    </>
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
