import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    Mail,
    Palmtree,
    Pencil,
    Phone,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { AttendanceLegend, AttendanceMonthGrid } from '@/components/attendance-month-grid';
import { EmptyState } from '@/components/empty-state';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { PersonIdentity } from '@/components/person-identity';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { DataTable } from '@/components/data-table';
import { cn } from '@/lib/utils';
import { parseISODate, toISODate } from '@/lib/datetime';
import { clockToMinutes, formatClock } from '@/lib/timezone';

type Employee = {
    id: number;
    employee_code: string;
    full_name: string;
    avatar?: string | null;
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

type TabKey = 'overview' | 'attendance' | 'leave' | 'late';

function monthHref(employeeId: number, month: number, year: number): string {
    return `/employees/${employeeId}?month=${month}&year=${year}`;
}

function goToMonth(employeeId: number, month: number, year: number) {
    router.get(monthHref(employeeId, month, year), {}, { preserveState: true });
}

function averageCheckIn(days: Day[]): string | null {
    const withTime = days.filter(
        (day) => day.check_in_at && day.status !== 'leave' && day.status !== 'absent',
    );

    if (withTime.length === 0) {
        return null;
    }

    let total = 0;
    let counted = 0;

    for (const day of withTime) {
        const minutes = clockToMinutes(day.check_in_at);

        if (minutes === null) {
            continue;
        }

        total += minutes;
        counted += 1;
    }

    if (counted === 0) {
        return null;
    }

    const avg = Math.round(total / counted);
    const hours = Math.floor(avg / 60);
    const minutes = avg % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return `${hours}h ${String(rest).padStart(2, '0')}m`;
}

function formatDayTime(value: string | null): string {
    return formatClock(value);
}

const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'leave', label: 'Leave' },
    { key: 'late', label: 'Late history' },
];

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
    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    const avgCheckIn = averageCheckIn(days);
    const lateDays = days
        .filter((day) => day.status === 'late' && day.late_minutes)
        .sort((a, b) => b.date.localeCompare(a.date));

    return (
        <>
            <Head title={employee.full_name} />
            <PageShell>
                <PageHeader
                    title={employee.full_name}
                    description={`${employee.employee_code}${employee.designation?.name ? ` · ${employee.designation.name}` : ''}`}
                    leading={
                        <PersonIdentity
                            name={employee.full_name}
                            avatar={employee.avatar}
                            size="lg"
                            hideText
                        />
                    }
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
                    <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-0">
                        <div>
                            <p className="text-muted-foreground text-xs font-medium">Status</p>
                            <div className="mt-1">
                                <StatusBadge status={employee.status} />
                            </div>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs font-medium">Department</p>
                            <p className="mt-1 text-sm font-medium">
                                {employee.department?.name ?? '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs font-medium">Office</p>
                            <p className="mt-1 text-sm font-medium">
                                {employee.office?.name ?? '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs font-medium">Shift</p>
                            <p className="mt-1 text-sm font-medium">
                                {employee.shift?.name ?? '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs font-medium">Joined</p>
                            <p className="mt-1 text-sm font-medium tabular-nums">
                                {employee.joining_date ?? '—'}
                            </p>
                        </div>
                        <div className="ml-auto hidden items-center gap-2 sm:flex">
                            {employee.email ? (
                                <Badge variant="outline" className="gap-1.5 font-normal">
                                    <Mail className="size-3" />
                                    {employee.email}
                                </Badge>
                            ) : null}
                            {employee.phone ? (
                                <Badge variant="outline" className="gap-1.5 font-normal">
                                    <Phone className="size-3" />
                                    {employee.phone}
                                </Badge>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <div
                    className="flex gap-1 overflow-x-auto border-b"
                    role="tablist"
                    aria-label="Employee profile sections"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                '-mb-px border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                                activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'text-muted-foreground border-transparent hover:text-foreground',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' ? (
                    <div className="space-y-4">
                        <Card className="border-primary/15 bg-primary/5">
                            <CardHeader>
                                <CardTitle>Monthly report · {month_label}</CardTitle>
                                <CardDescription>
                                    A short summary HR can scan without opening the full report.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-6">{report}</p>
                            </CardContent>
                        </Card>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                            <CardHeader>
                                <CardTitle>Attendance summary</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <p className="text-muted-foreground text-xs">Working hours · {month_label}</p>
                                    <p className="mt-1 text-xl font-semibold tabular-nums">
                                        {formatHours(summary.work_minutes)}
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <p className="text-muted-foreground text-xs">Average check-in</p>
                                    <p className="mt-1 text-xl font-semibold tabular-nums">
                                        {avgCheckIn ?? '—'}
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <p className="text-muted-foreground text-xs">Late minutes · {month_label}</p>
                                    <p className="mt-1 text-xl font-semibold tabular-nums">
                                        {summary.late_minutes}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                {activeTab === 'attendance' ? (
                    <Card>
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Attendance · {month_label}</CardTitle>
                                <CardDescription>
                                    {month_label} breakdown with check-in times.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="w-44">
                                    <DatePicker
                                        value={toISODate(new Date(year, month - 1, 1))}
                                        onChange={(iso) => {
                                            const date = parseISODate(iso);

                                            if (!date) {
                                                return;
                                            }

                                            goToMonth(
                                                employee.id,
                                                date.getMonth() + 1,
                                                date.getFullYear(),
                                            );
                                        }}
                                        placeholder="Jump to month"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => goToMonth(employee.id, previousMonth, previousYear)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => goToMonth(employee.id, nextMonth, nextYear)}
                                >
                                    Next
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <AttendanceMonthGrid month={month} year={year} days={days} />
                            <AttendanceLegend items={legend} />
                        </CardContent>
                    </Card>
                ) : null}

                {activeTab === 'leave' ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Leave balance</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                {leaveBalances.map((balance) => (
                                    <div
                                        key={balance.name}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span>{balance.name}</span>
                                        <span className="font-medium tabular-nums">
                                            {balance.remaining} / {balance.allocated}
                                        </span>
                                    </div>
                                ))}
                                {leaveBalances.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        No leave balances yet.
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent leave</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                {recentLeaves.map((leave) => (
                                    <div
                                        key={leave.id}
                                        className="flex items-center justify-between gap-3 text-sm"
                                    >
                                        <div>
                                            <Link
                                                href={`/leave/${leave.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {leave.type}
                                            </Link>
                                            <div className="text-muted-foreground text-xs tabular-nums">
                                                {leave.start_date} – {leave.end_date}
                                            </div>
                                        </div>
                                        <StatusBadge
                                            status={leave.status}
                                            label={leave.status_label}
                                        />
                                    </div>
                                ))}
                                {recentLeaves.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        No leave requests yet.
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                {activeTab === 'late' ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Late arrivals · {month_label}</CardTitle>
                            <CardDescription>
                                Days this month where {employee.full_name} arrived after the grace
                                period.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {lateDays.length === 0 ? (
                                <EmptyState
                                    icon={CheckCircle2}
                                    title="No late arrivals"
                                    description="This employee was on time every recorded day this month."
                                    className="py-10"
                                />
                            ) : (
                                <DataTable>
                                    <thead>
                                        <tr>
                                            <th scope="col">Date</th>
                                            <th scope="col">Check in</th>
                                            <th scope="col">Minutes late</th>
                                            <th scope="col">Worked</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lateDays.map((day) => (
                                            <tr key={day.date}>
                                                <td className="tabular-nums">{day.date}</td>
                                                <td className="tabular-nums">
                                                    {formatDayTime(day.check_in_at)}
                                                </td>
                                                <td>
                                                    <StatusBadge
                                                        status="late"
                                                        label={`${day.late_minutes} min`}
                                                    />
                                                </td>
                                                <td className="text-muted-foreground tabular-nums">
                                                    {day.work_minutes
                                                        ? formatHours(day.work_minutes)
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </DataTable>
                            )}
                        </CardContent>
                    </Card>
                ) : null}
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
