import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Palmtree } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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
    attachment: { name: string; url: string; is_image: boolean } | null;
};

type Props = {
    requests: Paginated<LeaveRequestRow>;
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

const fieldClass =
    'border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none';

export default function LeaveIndex({ requests, balances, types, durationTypes }: Props) {
    const { can } = usePage().props;

    return (
        <>
            <Head title="Leave" />
            <PageShell>
                <PageHeader
                    title="Leave"
                    description="Check your balance, apply for time off, and track request status."
                    actions={
                        can?.viewLeaveApplications ? (
                            <Button variant="outline" asChild>
                                <Link href="/leave/applications">All applications</Link>
                            </Button>
                        ) : undefined
                    }
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {balances.map((balance) => {
                        const pct = Math.min(
                            100,
                            Math.round((balance.remaining / Math.max(1, balance.allocated)) * 100),
                        );

                        return (
                            <div key={balance.id} className="bg-card rounded-xl border p-4">
                                <div className="text-muted-foreground text-sm">
                                    {balance.leave_type}
                                </div>
                                <div className="mt-1 flex items-baseline gap-1.5">
                                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                                        {balance.remaining}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        of {balance.allocated} days
                                    </span>
                                </div>
                                <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
                                    <div
                                        className="bg-primary h-full rounded-full"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="text-muted-foreground mt-1.5 text-xs tabular-nums">
                                    {balance.used} used · {balance.pending} pending
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-card rounded-xl border p-5 md:p-6">
                    <h2 className="mb-1 text-base font-semibold">Apply for leave</h2>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Requests go to your manager. Attach a document if the leave type requires it.
                    </p>
                    <Form
                        action="/leave"
                        method="post"
                        encType="multipart/form-data"
                        className="grid gap-4 md:grid-cols-2"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="leave_type_id">Leave type</Label>
                                    <select
                                        id="leave_type_id"
                                        name="leave_type_id"
                                        required
                                        className={fieldClass}
                                    >
                                        {types.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.leave_type_id && (
                                        <p className="text-destructive text-sm">{errors.leave_type_id}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="duration_type">Duration</Label>
                                    <select
                                        id="duration_type"
                                        name="duration_type"
                                        required
                                        className={fieldClass}
                                    >
                                        {durationTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">From</Label>
                                    <DatePicker id="start_date" name="start_date" required placeholder="From date" />
                                    {errors.start_date && (
                                        <p className="text-destructive text-sm">{errors.start_date}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">To</Label>
                                    <DatePicker id="end_date" name="end_date" required placeholder="To date" />
                                    {errors.end_date && (
                                        <p className="text-destructive text-sm">{errors.end_date}</p>
                                    )}
                                </div>
                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <textarea
                                        id="reason"
                                        name="reason"
                                        required
                                        rows={3}
                                        className="border-input rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
                                    />
                                    {errors.reason && (
                                        <p className="text-destructive text-sm">{errors.reason}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="attachment">Attachment</Label>
                                    <Input id="attachment" name="attachment" type="file" />
                                    {errors.attachment && (
                                        <p className="text-destructive text-sm">{errors.attachment}</p>
                                    )}
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" disabled={processing}>
                                        Submit request
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {requests.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Palmtree}
                            title="No leave requests yet"
                            description="Submit a request above. Approved days will appear here."
                        />
                    </div>
                ) : (
                    <>
                        <DataTable>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Dates</th>
                                <th>Days</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {requests.data.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.leave_type}</td>
                                    <td>
                                        {row.start_date} – {row.end_date}
                                    </td>
                                    <td>{row.total_days}</td>
                                    <td>
                                        <StatusBadge status={row.status} label={row.status_label} />
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/leave/${row.id}`}>View</Link>
                                            </Button>
                                            {row.can_cancel && (
                                                <Form action={`/leave/${row.id}/cancel`} method="post">
                                                    <Button type="submit" variant="ghost" size="sm">
                                                        Cancel
                                                    </Button>
                                                </Form>
                                            )}
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

LeaveIndex.layout = {
    breadcrumbs: [{ title: 'Leave', href: '/leave' }],
};
