import { Form, Head, Link, router } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { formatClock } from '@/lib/timezone';

type RecordRow = {
    id: number;
    attendance_date: string;
    status: string;
    check_in_at: string | null;
    check_out_at: string | null;
    late_minutes: number;
    work_minutes: number;
    employee: {
        id?: number;
        full_name?: string;
        first_name?: string;
        last_name?: string;
        employee_code: string;
        avatar?: string | null;
        department?: { name: string } | null;
    } | null;
    office: { name: string } | null;
};

type Props = {
    records: Paginated<RecordRow>;
    filters: {
        from: string;
        to: string;
        employee_id: number | null;
        department_id: number | null;
        office_id: number | null;
        status: string | null;
    };
    employees: { id: number; first_name: string; last_name: string | null; employee_code: string }[];
    departments: { id: number; name: string }[];
    offices: { id: number; name: string }[];
    statuses: { value: string; label: string }[];
    canExport?: boolean;
    canAdvanced?: boolean;
    canManual?: boolean;
};

export default function AttendanceReport({ records, filters, employees, departments, offices, statuses, canExport = false, canAdvanced = false, canManual = false }: Props) {
    return (
        <>
            <Head title="Attendance reports" />
            <PageShell>
                <PageHeader
                    title="Attendance report"
                    description="Filter by date, person, office, and status."
                    actions={
                        <>
                            {canAdvanced && (
                                <Button variant="outline" asChild>
                                    <Link href="/reports/advanced">Advanced reports</Link>
                                </Button>
                            )}
                            {canExport ? (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        window.location.assign(
                                            `/reports/attendance?${new URLSearchParams({
                                                from: filters.from,
                                                to: filters.to,
                                                export: 'csv',
                                            }).toString()}`,
                                        )
                                    }
                                >
                                    Export CSV
                                </Button>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    CSV export is on Business and above.
                                </p>
                            )}
                        </>
                    }
                />

                <form
                    className="grid gap-2 md:grid-cols-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        router.get('/reports/attendance', Object.fromEntries(data));
                    }}
                >
                    <DatePicker name="from" defaultValue={filters.from} placeholder="From" />
                    <DatePicker name="to" defaultValue={filters.to} placeholder="To" />
                    <select name="employee_id" defaultValue={filters.employee_id ?? ''} className="border-input h-9 rounded-md border px-3 text-sm">
                        <option value="">All employees</option>
                        {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.first_name} {employee.last_name} ({employee.employee_code})
                            </option>
                        ))}
                    </select>
                    <select name="department_id" defaultValue={filters.department_id ?? ''} className="border-input h-9 rounded-md border px-3 text-sm">
                        <option value="">All departments</option>
                        {departments.map((department) => (
                            <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                    </select>
                    <select name="office_id" defaultValue={filters.office_id ?? ''} className="border-input h-9 rounded-md border px-3 text-sm">
                        <option value="">All offices</option>
                        {offices.map((office) => (
                            <option key={office.id} value={office.id}>{office.name}</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        <select name="status" defaultValue={filters.status ?? ''} className="border-input h-9 flex-1 rounded-md border px-3 text-sm">
                            <option value="">All statuses</option>
                            {statuses.map((status) => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                        <Button type="submit">Filter</Button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Office</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">In</th>
                                <th className="px-4 py-3">Out</th>
                                <th className="px-4 py-3">Late</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.data.map((record) => (
                                <tr key={record.id} className="border-t">
                                    <td className="px-4 py-3">{String(record.attendance_date).slice(0, 10)}</td>
                                    <td className="px-4 py-3">
                                        <PersonIdentity
                                            name={record.employee?.full_name || 'Employee'}
                                            avatar={record.employee?.avatar}
                                            detail={record.employee?.employee_code}
                                            href={
                                                record.employee?.id
                                                    ? `/employees/${record.employee.id}`
                                                    : undefined
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-3">{record.office?.name ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={record.status} />
                                    </td>
                                    <td className="px-4 py-3">{formatClock(record.check_in_at)}</td>
                                    <td className="px-4 py-3">{formatClock(record.check_out_at)}</td>
                                    <td className="px-4 py-3">{record.late_minutes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination paginator={records} />

                {canManual && (
                    <Form action="/attendance/manual" method="post" className="grid max-w-4xl gap-2 rounded-xl border p-4 sm:grid-cols-6">
                        <div className="sm:col-span-6 text-sm font-medium">Manual attendance adjustment</div>
                        <select name="employee_id" className="border-input h-9 rounded-md border px-3 text-sm" required>
                            <option value="">Employee</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.first_name} {employee.last_name}
                                </option>
                            ))}
                        </select>
                        <DatePicker name="attendance_date" required placeholder="Date" />
                        <TimePicker name="check_in_at" placeholder="Check in" />
                        <TimePicker name="check_out_at" placeholder="Check out" />
                        <Input name="reason" placeholder="Reason" required className="sm:col-span-2" />
                        <Button type="submit" className="sm:col-span-6">Save adjustment</Button>
                    </Form>
                )}
            </PageShell>
        </>
    );
}

AttendanceReport.layout = {
    breadcrumbs: [{ title: 'Reports', href: '/reports/attendance' }],
};
