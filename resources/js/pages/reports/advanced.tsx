import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type EmployeeRow = {
    employee_id: number;
    name: string;
    code: string;
    department: string | null;
    office: string | null;
    present: number;
    late: number;
    absent: number;
    leave: number;
    work_minutes: number;
    overtime_minutes: number;
    late_minutes: number;
};

type LeaveRow = {
    employee: string | null;
    code: string | null;
    type: string | null;
    days: number;
    start_date: string;
    end_date: string;
};

type Props = {
    report: {
        from: string;
        to: string;
        totals: Record<string, number>;
        employees: EmployeeRow[];
        leave: LeaveRow[];
    };
    filters: { from: string; to: string; department_id: number | null; office_id: number | null };
    departments: { id: number; name: string }[];
    offices: { id: number; name: string }[];
    canExport: boolean;
};

export default function AdvancedReport({ report, filters, departments, offices, canExport }: Props) {
    return (
        <>
            <Head title="Advanced reports" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Advanced reports</h1>
                        <p className="text-muted-foreground text-sm">Late, absent, overtime, and leave usage by employee.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/reports/attendance">Basic report</Link>
                        </Button>
                        {canExport && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    window.location.assign(
                                        `/reports/advanced?${new URLSearchParams({
                                            from: filters.from,
                                            to: filters.to,
                                            export: 'csv',
                                        }).toString()}`,
                                    )
                                }
                            >
                                Export CSV
                            </Button>
                        )}
                    </div>
                </div>
                <form
                    className="grid gap-2 md:grid-cols-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get('/reports/advanced', Object.fromEntries(new FormData(event.currentTarget)));
                    }}
                >
                    <Input type="date" name="from" defaultValue={filters.from} />
                    <Input type="date" name="to" defaultValue={filters.to} />
                    <select name="department_id" defaultValue={filters.department_id ?? ''} className="border-input h-9 rounded-md border px-3 text-sm">
                        <option value="">All departments</option>
                        {departments.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                    <select name="office_id" defaultValue={filters.office_id ?? ''} className="border-input h-9 rounded-md border px-3 text-sm">
                        <option value="">All offices</option>
                        {offices.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                    <Button type="submit">Apply</Button>
                </form>
                <div className="grid gap-4 sm:grid-cols-4">
                    <Stat title="Present days" value={report.totals.present} />
                    <Stat title="Late days" value={report.totals.late} />
                    <Stat title="Absent days" value={report.totals.absent} />
                    <Stat title="Overtime minutes" value={report.totals.overtime_minutes} />
                </div>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Present</th>
                                <th className="px-4 py-3">Late</th>
                                <th className="px-4 py-3">Absent</th>
                                <th className="px-4 py-3">Leave</th>
                                <th className="px-4 py-3">Work min</th>
                                <th className="px-4 py-3">OT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.employees.map((row) => (
                                <tr key={row.employee_id} className="border-t">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{row.name}</div>
                                        <div className="text-muted-foreground text-xs">{row.code} · {row.department ?? '—'}</div>
                                    </td>
                                    <td className="px-4 py-3">{row.present}</td>
                                    <td className="px-4 py-3">{row.late}</td>
                                    <td className="px-4 py-3">{row.absent}</td>
                                    <td className="px-4 py-3">{row.leave}</td>
                                    <td className="px-4 py-3">{row.work_minutes}</td>
                                    <td className="px-4 py-3">{row.overtime_minutes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div>
                    <h2 className="mb-2 text-lg font-medium">Leave usage</h2>
                    <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Days</th>
                                    <th className="px-4 py-3">Dates</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.leave.map((row, index) => (
                                    <tr key={`${row.code}-${index}`} className="border-t">
                                        <td className="px-4 py-3">{row.employee}</td>
                                        <td className="px-4 py-3">{row.type}</td>
                                        <td className="px-4 py-3">{row.days}</td>
                                        <td className="px-4 py-3">{row.start_date} – {row.end_date}</td>
                                    </tr>
                                ))}
                                {report.leave.length === 0 && (
                                    <tr>
                                        <td className="text-muted-foreground px-4 py-6" colSpan={4}>No approved leave in this range.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

function Stat({ title, value }: { title: string; value: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
        </Card>
    );
}

AdvancedReport.layout = {
    breadcrumbs: [{ title: 'Advanced reports', href: '/reports/advanced' }],
};
