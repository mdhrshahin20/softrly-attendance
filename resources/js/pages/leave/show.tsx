import { Form, Head, Link } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { PersonIdentity } from '@/components/person-identity';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type Attachment = {
    name: string;
    url: string;
    is_image: boolean;
};

type Leave = {
    id: number;
    employee: string | null;
    avatar?: string | null;
    employee_code: string | null;
    department: string | null;
    office: string | null;
    leave_type: string | null;
    start_date: string;
    end_date: string;
    total_days: number;
    duration_type: string;
    reason: string;
    status: string;
    status_label: string;
    submitted_at: string | null;
    attachment: Attachment | null;
};

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="mt-1 text-sm font-medium whitespace-pre-wrap">{children}</dd>
        </div>
    );
}

export default function LeaveShow({
    leave,
    canApprove,
    canCancel,
    backHref,
}: {
    leave: Leave;
    canApprove: boolean;
    canCancel: boolean;
    backHref: string;
}) {
    return (
        <>
            <Head title="Leave request" />
            <PageShell>
                <PageHeader
                    title="Leave request"
                    description={`${leave.employee ?? 'Employee'} · ${leave.leave_type ?? 'Leave'}`}
                    leading={
                        <PersonIdentity
                            name={leave.employee ?? 'Employee'}
                            avatar={leave.avatar}
                            size="lg"
                            hideText
                        />
                    }
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={backHref}>Back</Link>
                        </Button>
                    }
                />

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle>{leave.leave_type}</CardTitle>
                                <CardDescription>
                                    Submitted {leave.submitted_at ?? 'recently'}
                                </CardDescription>
                            </div>
                            <StatusBadge status={leave.status} label={leave.status_label} withIcon={false} />
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-5 sm:grid-cols-2">
                                <Detail label="Employee">
                                    <PersonIdentity
                                        name={leave.employee ?? 'Employee'}
                                        avatar={leave.avatar}
                                        detail={[leave.employee_code, leave.department, leave.office]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    />
                                </Detail>
                                <Detail label="Duration">{leave.duration_type}</Detail>
                                <Detail label="Dates">
                                    {leave.start_date} – {leave.end_date}
                                </Detail>
                                <Detail label="Days">{leave.total_days}</Detail>
                                <div className="sm:col-span-2">
                                    <Detail label="Reason">{leave.reason}</Detail>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Attachment</CardTitle>
                                <CardDescription>
                                    Files uploaded with this request.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {leave.attachment ? (
                                    <div className="space-y-3">
                                        {leave.attachment.is_image ? (
                                            <a href={leave.attachment.url} target="_blank" rel="noreferrer">
                                                <img
                                                    src={leave.attachment.url}
                                                    alt={leave.attachment.name}
                                                    className="max-h-64 w-full rounded-lg border object-contain"
                                                />
                                            </a>
                                        ) : (
                                            <div className="bg-muted/40 flex items-center gap-3 rounded-lg border p-3">
                                                <FileText className="text-muted-foreground size-5 shrink-0" />
                                                <span className="truncate text-sm">{leave.attachment.name}</span>
                                            </div>
                                        )}
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={leave.attachment.url} target="_blank" rel="noreferrer">
                                                Open file
                                            </a>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No file was attached.</p>
                                )}
                            </CardContent>
                        </Card>

                        {(canApprove || canCancel) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Decision</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {canApprove && (
                                        <>
                                            <Form
                                                action={`/leave/${leave.id}/approve`}
                                                method="post"
                                                className="space-y-3"
                                            >
                                                <div className="grid gap-2">
                                                    <Label htmlFor="comment">Comment</Label>
                                                    <textarea
                                                        id="comment"
                                                        name="comment"
                                                        rows={3}
                                                        placeholder="Optional note for the employee"
                                                        className="border-input rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button type="submit" size="sm">
                                                        Approve
                                                    </Button>
                                                </div>
                                            </Form>
                                            <Form action={`/leave/${leave.id}/reject`} method="post">
                                                <input type="hidden" name="comment" value="Rejected" />
                                                <Button type="submit" size="sm" variant="destructive">
                                                    Reject
                                                </Button>
                                            </Form>
                                        </>
                                    )}
                                    {canCancel && !canApprove && (
                                        <Form action={`/leave/${leave.id}/cancel`} method="post">
                                            <Button type="submit" size="sm" variant="outline">
                                                Cancel request
                                            </Button>
                                        </Form>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </PageShell>
        </>
    );
}

LeaveShow.layout = {
    breadcrumbs: [
        { title: 'Leave', href: '/leave' },
        { title: 'Request', href: '#' },
    ],
};
