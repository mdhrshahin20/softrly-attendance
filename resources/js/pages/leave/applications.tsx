import { Head, Link, router } from '@inertiajs/react';
import { Inbox } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { ResultsCount, TableToolbar } from '@/components/table-toolbar';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';

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
    status_label: string;
    attachment: { name: string; url: string; is_image: boolean } | null;
};

type Props = {
    requests: Paginated<Row>;
    filters: {
        from: string | null;
        to: string | null;
        employee_id: number | null;
        status: string | null;
    };
    employees: { id: number; first_name: string; last_name: string | null; employee_code: string }[];
    statuses: { value: string; label: string }[];
};

export default function LeaveApplications({ requests, filters, employees, statuses }: Props) {
    return (
        <>
            <Head title="Leave applications" />
            <PageShell>
                <PageHeader
                    title="Leave applications"
                    description="Every leave request in this workspace. Filter by person, status, and dates."
                    actions={
                        <Button variant="outline" asChild>
                            <Link href="/leave/approvals">Pending approvals</Link>
                        </Button>
                    }
                />

                <TableToolbar>
                    <form
                        className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get(
                                '/leave/applications',
                                Object.fromEntries(new FormData(event.currentTarget)),
                            );
                        }}
                    >
                        <div className="w-36">
                            <DatePicker name="from" defaultValue={filters.from ?? ''} placeholder="From" />
                        </div>
                        <div className="w-36">
                            <DatePicker name="to" defaultValue={filters.to ?? ''} placeholder="To" />
                        </div>
                        <select
                            name="employee_id"
                            defaultValue={filters.employee_id ?? ''}
                            className="border-input bg-background h-9 rounded-md border px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        >
                            <option value="">All people</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.first_name} {employee.last_name} (
                                    {employee.employee_code})
                                </option>
                            ))}
                        </select>
                        <select
                            name="status"
                            defaultValue={filters.status ?? ''}
                            className="border-input bg-background h-9 rounded-md border px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        >
                            <option value="">All statuses</option>
                            {statuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                        <Button type="submit" variant="secondary" size="sm" className="h-9">
                            Filter
                        </Button>
                    </form>
                    <ResultsCount
                        total={requests.total ?? requests.data.length}
                        from={requests.from}
                        to={requests.to}
                    />
                </TableToolbar>

                {requests.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Inbox}
                            title="No leave applications"
                            description="Try a different person, status, or date range."
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
                                <th>Status</th>
                                <th>Reason</th>
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
                                    <td>
                                        <StatusBadge status={row.status} label={row.status_label} />
                                    </td>
                                    <td className="max-w-xs">{row.reason}</td>
                                    <td className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/leave/${row.id}`}>View</Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </DataTable>
                )}

                <Pagination paginator={requests} />
            </PageShell>
        </>
    );
}

LeaveApplications.layout = {
    breadcrumbs: [
        { title: 'Leave', href: '/leave' },
        { title: 'Applications', href: '/leave/applications' },
    ],
};
