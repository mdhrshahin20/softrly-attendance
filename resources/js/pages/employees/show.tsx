import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    Mail,
    Palmtree,
    Pencil,
    Phone,
    XCircle,
} from 'lucide-react';
import { AttendanceLegend, AttendanceMonthGrid } from '@/components/attendance-month-grid';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { StatusBadge } from '@/components/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';

type Employee = {
    id: number;
    employee_code: string;
    full_name: string;
    email: string;
    phone: string | null;
    joining_date: string | null;
    employment_type: string;
    status: string;
    department: { id: number; name: string } | null;
    designation: { id: number; name: string } | null;
    office: { id: number; name: string } | null;
    shift: { id: number; name: string } | null;
};

type Day = {
    date: string;
    day: number;
    status: string | null;
    code: string | null;
    label: string | null;
    check_in_at: string | null;
    check_out_at: string | null;
    late_minutes: number | null;
    work_minutes: number | null;
};

type Props = {
    employee: Employee;
    month: number;
    year: number;
    month_label: string;
    days: Day[];
    legend: { value: string; label: string; code: string }[];
    summary: {
        on_time: number;
        late: number;
        leave: number;
        absent: number;
        late_minutes: number;
        work_minutes: number;
    };
    report: string;
    leaveBalances: { name: string | null; remaining: number; allocated: number }[];
    recentLeaves: {
        id: number;
        type: string | null;
        start_date: string;
        end_date: string;
        status: string;
        status_label: string;
    }[];
    canEdit: boolean;
};

function monthHref(employeeId: number, month: number, year: number): string {
    return `/employees/${employeeId}?month=${month}&year=${year}`;
}

export default function EmployeeShow({
    employee,
    month,
    year,
    month_label,
    days,
    legend,
    summary,
    report,
    leaveBalances,
    recentLeaves,
    canEdit,
}: Props) {
    const getInitials = useInitials();
    const previous =
        month === 1
            ? monthHref(employee.id, 12, year - 1)
            : monthHref(employee.id, month - 1, year);
    const next =
        month === 12
            ? monthHref(employee.id, 1, year + 1)
            : monthHref(employee.id, month + 1, year);

    return (
        <>
            <Head title={employee.full_name} />
            <PageShell>
                <PageHeader
                    title={employee.full_name}
                    description={`${employee.employee_code}${employee.designation?.name ? ` · ${employee.designation.name}` : ''}${employee.department?.name ? ` · ${employee.department.name}` : ''}`}
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href="/employees">All employees</Link>
                            </Button>
                            {canEdit ? (
                                <Button asChild>
                                    <Link href={`/employees/${employee.id}/edit`}>
                                        <Pencil className="size-4" />
                                        Edit
                                    </Link>
                                </Button>
                            ) : null}
                        </>
                    }
                />

                <Card>
                    <CardContent className="flex flex-col gap-4 pt-0 sm:flex-row sm:items-center">
                        <Avatar className="size-14">
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                {getInitials(employee.full_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 gap-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <div className="text-muted-foreground">Office</div>
                                <div className="font-medium">{employee.office?.name ?? '—'}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Shift</div>
                                <div className="font-medium">{employee.shift?.name ?? '—'}</div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mail className="text-muted-foreground mt-0.5 size-4" />
                                <span>{employee.email}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Phone className="text-muted-foreground mt-0.5 size-4" />
                                <span>{employee.phone ?? '—'}</span>
                            </div>
                        </div>
                        <StatusBadge status={employee.status} withIcon={false} />
                    </CardContent>
                </Card>

                <Card className="border-primary/15 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Monthly report · {month_label}</CardTitle>
                        <CardDescription>A short summary HR can scan without opening the full report.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-6">{report}</p>
                    </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        label="On time"
                        value={summary.on_time}
                        hint="Present, WFH, or half day"
                        icon={CheckCircle2}
                        tone="success"
                    />
                    <MetricCard
                        label="Late"
                        value={summary.late}
                        hint={
                            summary.late_minutes > 0
                                ? `${summary.late_minutes} minutes in total`
                                : 'Arrived after grace'
                        }
                        icon={Clock3}
                        tone="warning"
                    />
                    <MetricCard
                        label="Leave"
                        value={summary.leave}
                        hint="Approved leave days"
                        icon={Palmtree}
                        tone="info"
                    />
                    <MetricCard
                        label="Absent"
                        value={summary.absent}
                        hint="Working days with no record"
                        icon={XCircle}
                        tone="danger"
                    />
                </div>

                <Card>
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Attendance · {month_label}</CardTitle>
                            <CardDescription>Green is on time, amber is late, blue is leave, red is absent.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={previous} preserveScroll>
                                    Previous
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={next} preserveScroll>
                                    Next
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AttendanceMonthGrid month={month} year={year} days={days} />
                        <AttendanceLegend items={legend} />
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leave balance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {leaveBalances.map((balance) => (
                                <div key={balance.name} className="flex items-center justify-between text-sm">
                                    <span>{balance.name}</span>
                                    <span className="font-medium">
                                        {balance.remaining} / {balance.allocated}
                                    </span>
                                </div>
                            ))}
                            {leaveBalances.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No leave balances yet.</p>
                            ) : null}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent leave</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentLeaves.map((leave) => (
                                <div key={leave.id} className="flex items-center justify-between gap-3 text-sm">
                                    <div>
                                        <div>{leave.type}</div>
                                        <div className="text-muted-foreground text-xs">
                                            {leave.start_date} – {leave.end_date}
                                        </div>
                                    </div>
                                    <StatusBadge status={leave.status} label={leave.status_label} withIcon={false} />
                                </div>
                            ))}
                            {recentLeaves.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No leave requests yet.</p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </PageShell>
        </>
    );
}

EmployeeShow.layout = {
    breadcrumbs: [
        { title: 'Employees', href: '/employees' },
        { title: 'Profile', href: '#' },
    ],
};
