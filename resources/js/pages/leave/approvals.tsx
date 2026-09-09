import { Form, Head, Link } from '@inertiajs/react';
import { CheckCheck, Inbox, X } from 'lucide-react';
import { ActionDialog } from '@/components/action-dialog';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, type ReactNode } from 'react';

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
                    description="Review pending requests. Approve or reject with a comment."
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
                                    <th scope="col">Employee</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">Dates</th>
                                    <th scope="col">Days</th>
                                    <th scope="col">Reason</th>
                                    <th scope="col">File</th>
                                    <th scope="col" className="text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
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
                                                className="min-w-0"
                                            />
                                        </td>
                                        <td className="whitespace-nowrap">{row.leave_type}</td>
                                        <td className="whitespace-nowrap tabular-nums">
                                            {row.start_date} – {row.end_date}
                                            <div className="text-muted-foreground text-xs">
                                                {row.duration_type}
                                            </div>
                                        </td>
                                        <td className="tabular-nums">{row.total_days}</td>
                                        <td className="text-muted-foreground max-w-xs">{row.reason}</td>
                                        <td>
                                            {row.attachment ? (
                                                <a
                                                    href={row.attachment.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary text-sm hover:underline"
                                                >
                                                    {row.attachment.name}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">
                                                    None
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/leave/${row.id}`}>Details</Link>
                                                </Button>
                                                <DecisionActions row={row} />
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

function DecisionActions({ row }: { row: Row }) {
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    return (
        <>
            <Button size="sm" className="gap-1" onClick={() => setApproveOpen(true)}>
                <CheckCheck className="size-3.5" />
                Approve
            </Button>
            <Button
                size="sm"
                variant="outline"
                className="text-destructive gap-1 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setRejectOpen(true)}
            >
                <X className="size-3.5" />
                Reject
            </Button>

            <ActionDialog
                open={approveOpen}
                onOpenChange={setApproveOpen}
                title="Approve this leave?"
                description={
                    row.employee
                        ? `${row.employee} · ${row.leave_type} · ${row.start_date} – ${row.end_date}`
                        : undefined
                }
            >
                {(close) => (
                    <CommentForm
                        action={`/leave/${row.id}/approve`}
                        submitLabel="Approve request"
                        tone="success"
                        close={close}
                        prompt="Add an optional note for the employee."
                    />
                )}
            </ActionDialog>

            <ActionDialog
                open={rejectOpen}
                onOpenChange={setRejectOpen}
                title="Reject this leave?"
                description={
                    row.employee
                        ? `${row.employee} · ${row.leave_type} · ${row.start_date} – ${row.end_date}`
                        : undefined
                }
            >
                {(close) => (
                    <CommentForm
                        action={`/leave/${row.id}/reject`}
                        submitLabel="Reject request"
                        tone="destructive"
                        close={close}
                        prompt="Add a reason so the employee understands the decision."
                        required
                    />
                )}
            </ActionDialog>
        </>
    );
}

function CommentForm({
    action,
    submitLabel,
    tone,
    close,
    prompt,
    required = false,
}: {
    action: string;
    submitLabel: string;
    tone: 'success' | 'destructive';
    close: () => void;
    prompt: string;
    required?: boolean;
}) {
    const [comment, setComment] = useState('');

    return (
        <Form
            action={action}
            method="post"
            options={{ preserveScroll: true, onSuccess: close } as never}
        >
            {({ processing, errors }) => (
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="comment">{required ? 'Reason' : 'Comment'}</Label>
                        <Textarea
                            id="comment"
                            name="comment"
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            placeholder={prompt}
                            rows={3}
                            required={required}
                        />
                    </div>
                    {errors.comment ? (
                        <p className="text-destructive text-sm">{errors.comment}</p>
                    ) : null}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={close}>
                            Cancel
                        </Button>
                        <SubmitButton tone={tone} processing={processing} label={submitLabel} />
                    </DialogFooter>
                </div>
            )}
        </Form>
    );
}

function SubmitButton({
    tone,
    processing,
    label,
}: {
    tone: 'success' | 'destructive';
    processing: boolean;
    label: string;
}) {
    return (
        <Button variant={tone === 'success' ? 'default' : 'destructive'} disabled={processing}>
            {label}
        </Button>
    );
}
