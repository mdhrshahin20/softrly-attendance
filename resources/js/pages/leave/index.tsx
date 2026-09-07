import { Form, Head } from '@inertiajs/react';
import { Palmtree } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { StatusBadge } from '@/components/status-badge';
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

const fieldClass =
    'border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none';

export default function LeaveIndex({ requests, balances, types, durationTypes }: Props) {
    return (
        <>
            <Head title="Leave" />
            <PageShell>
                <PageHeader
                    title="Leave"
                    description="Check your balance, apply for time off, and track request status."
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {balances.map((balance) => (
                        <div key={balance.id} className="bg-card rounded-xl border p-4">
                            <div className="text-muted-foreground text-sm">{balance.leave_type}</div>
                            <div className="mt-1 text-2xl font-semibold tracking-tight">
                                {balance.remaining}
                            </div>
                            <div className="text-muted-foreground mt-1 text-xs">
                                {balance.used} used · {balance.pending} pending · {balance.allocated} allocated
                            </div>
                        </div>
                    ))}
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
                                    <Input id="start_date" name="start_date" type="date" required />
                                    {errors.start_date && (
                                        <p className="text-destructive text-sm">{errors.start_date}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">To</Label>
                                    <Input id="end_date" name="end_date" type="date" required />
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

                {requests.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Palmtree}
                            title="No leave requests yet"
                            description="Submit a request above. Approved days will appear here."
                        />
                    </div>
                ) : (
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
                            {requests.map((row) => (
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
                                        {row.can_cancel && (
                                            <Form action={`/leave/${row.id}/cancel`} method="post">
                                                <Button type="submit" variant="ghost" size="sm">
                                                    Cancel
                                                </Button>
                                            </Form>
                                        )}
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

LeaveIndex.layout = {
    breadcrumbs: [{ title: 'Leave', href: '/leave' }],
};
