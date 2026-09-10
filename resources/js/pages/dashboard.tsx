import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    CalendarDays,
    CheckCircle2,
    CircleAlert,
    Clock3,
    ExternalLink,
    Palmtree,
    TriangleAlert,
    Users,
    Wifi,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
    AttendanceLiveTable,
    type LiveRow,
} from '@/components/attendance-live-table';
import { StatusLegend, StatusTrendChart } from '@/components/charts/status-trend-chart';
import { EmptyState } from '@/components/empty-state';
import { ErrorState, RetryButton } from '@/components/error-state';
import { MetricCard, type TrendTone } from '@/components/metric-card';
import { NetworkStatus } from '@/components/network-status';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { PersonIdentity } from '@/components/person-identity';
import { SkeletonCard, SkeletonKpiGrid } from '@/components/skeletons';
import { StatusBadge } from '@/components/status-badge';
import { StatusDot } from '@/components/status-dot';
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
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useDeviceId } from '@/hooks/use-device-id';
import { useGeolocation } from '@/hooks/use-geolocation';
import { dashboard } from '@/routes';
import { toISODate } from '@/lib/datetime';
import { cn } from '@/lib/utils';

type TodayAttendance = {
    status: string;
    status_label: string;
    check_in_at: string | null;
    check_out_at: string | null;
    late_minutes: number;
    work_minutes: number;
    office: { id: number; name: string } | null;
};

type Kpi = {
    key: 'employees' | 'present' | 'late' | 'absent' | 'leave';
    value: number;
    hint?: string | null;
    delta: { delta: string; direction: 'up' | 'down' | 'flat'; label: string } | null;
    sparkline?: number[];
};

type AnalyticsDay = {
    date: string;
    label: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
};

type ExceptionItem = {
    id: string;
    type: string;
    title: string;
    detail: string;
    severity: 'high' | 'medium' | 'low';
    employee: {
        id: number;
        full_name: string;
        avatar?: string | null;
        employee_code?: string | null;
        department?: string | null;
    } | null;
    action_label: string;
    action_href: string;
};

type DepartmentRow = {
    id: number;
    name: string;
    employees: number;
    present: number;
    late: number;
    absent: number;
    attendance_rate: number;
};

type OfficeStatus = {
    id: number;
    name: string;
    code: string;
    employees: number;
    connected_today: number;
    network_count: number;
    has_authorized_network: boolean;
};

type Props = {
    employee: {
        id: number;
        full_name: string;
        avatar?: string | null;
        employee_code: string;
        office: { id: number; name: string; code: string } | null;
        shift: {
            name: string;
            start_time: string;
            end_time: string;
            grace_minutes: number;
        } | null;
    } | null;
    today: TodayAttendance | null;
    network: {
        allowed: boolean;
        ip: string;
        office: { id: number; name: string } | null;
        network: { id: number; name: string; ip_address: string | null } | null;
        message: string | null;
    } | null;
    month: { present: number; late: number; absent: number; leave: number };
    teamToday: {
        total_employees: number;
        present: number;
        late: number;
        absent: number;
        on_leave: number;
    } | null;
    lateToday: LiveRow[];
    onLeaveToday: LiveRow[];
    leaveBalances: { name: string | null; remaining: number; allocated: number }[];
    upcomingHolidays: { name: string; date: string }[];
    recentLeaves: {
        id: number;
        type: string | null;
        start_date: string;
        end_date: string;
        status: string;
        status_label: string;
    }[];
    pendingLeaveCount: number;
    attendancePolicy?: {
        mode: string;
        label: string;
        description: string;
        requires_network: boolean;
        requires_location: boolean;
        requires_device: boolean;
    };
    kpis: Kpi[];
    analytics: AnalyticsDay[];
    todayAttendance: LiveRow[];
    exceptions: ExceptionItem[];
    departmentPerformance: DepartmentRow[];
    officeStatus: OfficeStatus[];
};

function greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Good morning';
    }

    if (hour < 18) {
        return 'Good afternoon';
    }

    return 'Good evening';
}

function formatTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return `${hours}h ${rest.toString().padStart(2, '0')}m`;
}

const todayLong = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
}).format(new Date());

const kpiMeta: Record<
    Kpi['key'],
    { label: string; icon: LucideIcon; tone: 'default' | 'success' | 'warning' | 'info' | 'danger'; trendTone: TrendTone; href: (today: string) => string }
> = {
    employees: {
        label: 'Total employees',
        icon: Users,
        tone: 'default',
        trendTone: 'neutral',
        href: () => '/employees',
    },
    present: {
        label: 'Present today',
        icon: CheckCircle2,
        tone: 'success',
        trendTone: 'good',
        href: (today) => `/reports/attendance?status=present&from=${today}&to=${today}`,
    },
    late: {
        label: 'Late today',
        icon: Clock3,
        tone: 'warning',
        trendTone: 'bad',
        href: (today) => `/reports/attendance?status=late&from=${today}&to=${today}`,
    },
    absent: {
        label: 'Absent today',
        icon: XCircle,
        tone: 'danger',
        trendTone: 'bad',
        href: (today) => `/reports/attendance?status=absent&from=${today}&to=${today}`,
    },
    leave: {
        label: 'On leave',
        icon: Palmtree,
        tone: 'info',
        trendTone: 'neutral',
        href: (today) => `/reports/attendance?status=leave&from=${today}&to=${today}`,
    },
};

const severityMeta: Record<ExceptionItem['severity'], { icon: LucideIcon; className: string }> = {
    high: { icon: TriangleAlert, className: 'text-rose-500' },
    medium: { icon: CircleAlert, className: 'text-amber-500' },
    low: { icon: CircleAlert, className: 'text-slate-400 dark:text-slate-500' },
};

function KpiRow({ kpis }: { kpis: Kpi[] }) {
    const today = toISODate(new Date());

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {kpis.map((kpi) => {
                const meta = kpiMeta[kpi.key];

                return (
                    <MetricCard
                        key={kpi.key}
                        label={meta.label}
                        value={kpi.value}
                        hint={kpi.hint ?? 'Today'}
                        icon={meta.icon}
                        tone={meta.tone}
                        trend={kpi.delta ?? undefined}
                        trendTone={meta.trendTone}
                        sparkline={kpi.sparkline}
                        href={meta.href(today)}
                    />
                );
            })}
        </div>
    );
}

type RangePreset = '7d' | '30d' | 'month';

function AnalyticsCard({ analytics }: { analytics: AnalyticsDay[] }) {
    const [preset, setPreset] = useState<RangePreset>('7d');
    const [custom, setCustom] = useState(false);
    const [from, setFrom] = useState<string>(() =>
        toISODate(new Date(Date.now() - 6 * 86_400_000)),
    );
    const [to, setTo] = useState<string>(() => toISODate(new Date()));
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);

    function load(data: Record<string, string>) {
        setFailed(false);
        setLoading(true);
        router.reload({
            only: ['analytics'],
            data,
            onFinish: () => setLoading(false),
            onError: () => setFailed(true),
        });
    }

    function choosePreset(value: RangePreset) {
        setPreset(value);
        setCustom(false);
        load({ range: value });
    }

    function chooseCustom() {
        if (!from || !to) {
            return;
        }

        setCustom(true);
        setPreset('7d');
        load({ range: 'custom', from, to });
    }

    const total = analytics.reduce(
        (sum, day) =>
            sum + day.present + day.late + day.absent + day.leave,
        0,
    );
    const hasData = total > 0;

    return (
        <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                    <CardTitle>Attendance trends</CardTitle>
                    <CardDescription>
                        Daily present / late / leave / absent over the selected period
                    </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={preset}
                        onValueChange={(value) => {
                            if (value) {
                                choosePreset(value as RangePreset);
                            }
                        }}
                        className="h-9"
                    >
                        <ToggleGroupItem value="7d" size="sm" aria-label="Last 7 days">
                            7D
                        </ToggleGroupItem>
                        <ToggleGroupItem value="30d" size="sm" aria-label="Last 30 days">
                            30D
                        </ToggleGroupItem>
                        <ToggleGroupItem value="month" size="sm" aria-label="This month">
                            Month
                        </ToggleGroupItem>
                        <ToggleGroupItem value="custom" size="sm" aria-label="Custom range">
                            Custom
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
                {custom ? (
                    <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
                        <div className="w-36">
                            <p className="text-muted-foreground mb-1.5 text-xs font-medium">From</p>
                            <DatePicker value={from} onChange={setFrom} placeholder="Start date" />
                        </div>
                        <div className="w-36">
                            <p className="text-muted-foreground mb-1.5 text-xs font-medium">To</p>
                            <DatePicker value={to} onChange={setTo} placeholder="End date" />
                        </div>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={chooseCustom}
                            disabled={!from || !to || loading}
                            className="h-9"
                        >
                            Apply
                        </Button>
                    </div>
                ) : null}

                <div className="relative">
                    <StatusTrendChart
                        data={analytics}
                        height={280}
                    />

                    {loading ? (
                        <div
                            className="absolute inset-0 rounded-lg bg-background/60 backdrop-blur-[1px]"
                            aria-hidden="true"
                        >
                            <SkeletonCard className="border-0 bg-transparent">
                                <div className="flex h-[240px] items-center justify-center">
                                    <Spinner className="text-muted-foreground size-5" />
                                </div>
                            </SkeletonCard>
                        </div>
                    ) : null}

                    {!hasData && !loading && !failed ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <EmptyState
                                icon={BarChart3}
                                title="No attendance data in this period"
                                description="Try another range, or check back after the team checks in."
                                className="py-10"
                            />
                        </div>
                    ) : null}

                    {failed ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                            <ErrorState
                                title="Unable to load attendance trends"
                                action={<RetryButton />}
                            />
                        </div>
                    ) : null}
                </div>

                <StatusLegend className="flex flex-wrap items-center gap-4" />
            </CardContent>
        </Card>
    );
}

function ExceptionsCard({ exceptions }: { exceptions: ExceptionItem[] }) {
    return (
        <Card className="flex min-h-0 flex-col">
            <CardHeader>
                <CardTitle>Needs attention</CardTitle>
                <CardDescription>
                    {exceptions.length === 0
                        ? 'Everything looks clear.'
                        : `${exceptions.length} item${exceptions.length === 1 ? '' : 's'} to review.`}
                </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto pt-0">
                {exceptions.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="All clear"
                        description="No unchecked employees, late arrivals or pending approvals right now."
                        className="py-10"
                    />
                ) : (
                    <ul className="-mx-1 space-y-1">
                        {exceptions.map((item) => {
                            const severity = severityMeta[item.severity];
                            const SeverityIcon = severity.icon;

                            return (
                                <li
                                    key={item.id}
                                    className="rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className={cn(
                                                'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted',
                                                severity.className,
                                            )}
                                        >
                                            <SeverityIcon className="size-3.5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-medium">
                                                    {item.title}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary h-7 shrink-0 px-2 text-xs font-medium hover:text-primary"
                                                    asChild
                                                >
                                                    <Link href={item.action_href}>
                                                        {item.action_label}
                                                    </Link>
                                                </Button>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                {item.employee ? (
                                                    <PersonIdentity
                                                        name={item.employee.full_name}
                                                        avatar={item.employee.avatar}
                                                        size="sm"
                                                        hideText
                                                        className="shrink-0"
                                                    />
                                                ) : null}
                                                <span className="text-muted-foreground truncate text-xs">
                                                    {item.employee
                                                        ? `${item.employee.full_name}${item.employee.department ? ` · ${item.employee.department}` : ''}`
                                                        : item.detail}
                                                    {item.employee ? ` — ${item.detail}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

function DepartmentPerformance({
    departments,
    canLink,
}: {
    departments: DepartmentRow[];
    canLink: boolean;
}) {
    const maxEmployees = Math.max(1, ...departments.map((row) => row.employees));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Department performance</CardTitle>
                <CardDescription>Today at a glance by department</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {departments.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No department data yet"
                        description="Departments will appear here once employees check in."
                        className="py-8"
                    />
                ) : (
                    <div className="divide-border divide-y">
                        {departments.slice(0, 6).map((row) => {
                            const attended = row.present + row.late;
                            const body = (
                                <>
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className="min-w-0 truncate text-sm font-medium">
                                            {row.name}
                                        </p>
                                        <p className="text-muted-foreground text-xs tabular-nums">
                                            {row.present + row.late} of {row.employees} ·{' '}
                                            <span className="text-foreground font-semibold">
                                                {row.attendance_rate}%
                                            </span>
                                        </p>
                                    </div>
                                    <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
                                        <span
                                            className="bg-success h-full"
                                            style={{ width: `${(row.present / maxEmployees) * 100}%` }}
                                        />
                                        <span
                                            className="bg-warning h-full"
                                            style={{ width: `${(row.late / maxEmployees) * 100}%` }}
                                        />
                                    </div>
                                    <div className="text-muted-foreground mt-1.5 flex items-center gap-3 text-[11px]">
                                        <span className="flex items-center gap-1">
                                            <span className="bg-success size-1.5 rounded-full" />
                                            {row.present} present
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="bg-warning size-1.5 rounded-full" />
                                            {row.late} late
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="bg-destructive size-1.5 rounded-full" />
                                            {row.absent} absent
                                        </span>
                                    </div>
                                </>
                            );

                            return (
                                <div key={row.id} className="py-3 first:pt-1 last:pb-1">
                                    {canLink ? (
                                        <Link
                                            href={`/employees?department_id=${row.id}`}
                                            className="block outline-none rounded focus-visible:ring-2 focus-visible:ring-ring/50"
                                        >
                                            {body}
                                        </Link>
                                    ) : (
                                        body
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function OfficeStatusPanel({
    offices,
    canLink,
    policyLabel,
}: {
    offices: OfficeStatus[];
    canLink: boolean;
    policyLabel?: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Office & Wi-Fi status</CardTitle>
                <CardDescription>
                    {policyLabel ? `${policyLabel} · ` : ''}Live connection overview
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                {offices.length === 0 ? (
                    <EmptyState
                        icon={Wifi}
                        title="No offices configured"
                        description="Add an office with an authorized Wi-Fi network to enable network attendance."
                        action={
                            canLink ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/offices">Configure offices</Link>
                                </Button>
                            ) : undefined
                        }
                        className="py-8"
                    />
                ) : (
                    offices.slice(0, 4).map((office) => {
                        const online = office.connected_today > 0 || office.has_authorized_network;
                        const body = (
                            <>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Building2 className="text-muted-foreground size-4 shrink-0" />
                                        <p className="truncate text-sm font-medium">
                                            {office.name}
                                        </p>
                                    </div>
                                    <StatusDot
                                        tone={online ? 'success' : 'muted'}
                                        label={online ? 'Online' : 'Idle'}
                                        pulse={online}
                                        className="gap-1"
                                    />
                                </div>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {office.connected_today} connected today ·{' '}
                                    {office.network_count} authorized{' '}
                                    {office.network_count === 1 ? 'network' : 'networks'}
                                </p>
                            </>
                        );

                        return (
                            <div
                                key={office.id}
                                className="rounded-lg border bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/40"
                            >
                                {canLink ? (
                                    <Link
                                        href="/offices"
                                        className="block rounded outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    >
                                        {body}
                                    </Link>
                                ) : (
                                    body
                                )}
                            </div>
                        );
                    })
                )}

                {offices.length > 4 ? (
                    <p className="text-muted-foreground px-1 pt-1 text-xs">
                        +{offices.length - 4} more offices
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
}

function CheckInPanel({
    employee,
    today,
    network,
    attendancePolicy,
    canMarkAttendance,
}: Pick<Props, 'employee' | 'today' | 'network' | 'attendancePolicy'> & {
    canMarkAttendance: boolean;
}) {
    const deviceId = useDeviceId();
    const geo = useGeolocation(Boolean(attendancePolicy?.requires_location));
    const checkedIn = Boolean(today?.check_in_at && !today.check_out_at);
    const completed = Boolean(today?.check_in_at && today.check_out_at);
    const networkOk = attendancePolicy?.requires_network ? Boolean(network?.allowed) : true;
    const locationOk = attendancePolicy?.requires_location
        ? Boolean(geo.latitude && geo.longitude)
        : true;
    const canSubmit = Boolean(employee) && networkOk && locationOk;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Today</CardTitle>
                <CardDescription>
                    {attendancePolicy?.description ?? 'Your check-in summary'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={completed ? 'success' : checkedIn ? 'info' : 'secondary'}>
                        {completed
                            ? 'Day complete'
                            : checkedIn
                              ? `Checked in ${formatTime(today?.check_in_at ?? null)}`
                              : 'Not checked in'}
                    </Badge>
                    {today && today.late_minutes > 0 ? (
                        <StatusBadge status="late" label={`Late ${today.late_minutes} min`} />
                    ) : null}
                </div>

                <div className="grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                        <div className="text-muted-foreground text-xs">Check in</div>
                        <div className="mt-1 font-medium tabular-nums">
                            {formatTime(today?.check_in_at ?? null)}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted-foreground text-xs">Check out</div>
                        <div className="mt-1 font-medium tabular-nums">
                            {formatTime(today?.check_out_at ?? null)}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted-foreground text-xs">Working</div>
                        <div className="mt-1 font-medium tabular-nums">
                            {today?.work_minutes
                                ? formatMinutes(today.work_minutes)
                                : checkedIn
                                  ? 'In progress'
                                  : '—'}
                        </div>
                    </div>
                </div>

                {attendancePolicy?.requires_network && network ? (
                    <NetworkStatus
                        allowed={network.allowed}
                        officeName={network.office?.name ?? employee?.office?.name}
                        networkName={network.network?.name}
                        message={network.message}
                        showTechnical={Boolean((usePage().props.can as Record<string, boolean>)?.manageOffices)}
                        ip={network.ip}
                    />
                ) : null}

                {attendancePolicy?.requires_location && geo.error ? (
                    <p className="text-destructive text-sm">{geo.error}</p>
                ) : null}
                {attendancePolicy?.requires_location && geo.latitude ? (
                    <p className="text-muted-foreground text-sm">
                        Location captured for this check-in.
                    </p>
                ) : null}

                <div className="flex flex-wrap gap-2.5">
                    {!checkedIn && !completed && canMarkAttendance ? (
                        <Form action="/attendance/check-in" method="post" className="inline">
                            {({ processing, errors }) => (
                                <>
                                    <input type="hidden" name="device_id" value={deviceId} />
                                    {geo.latitude ? (
                                        <>
                                            <input type="hidden" name="latitude" value={geo.latitude} />
                                            <input type="hidden" name="longitude" value={geo.longitude} />
                                        </>
                                    ) : null}
                                    <Button type="submit" disabled={processing || !canSubmit}>
                                        {processing ? <Spinner /> : null}
                                        Check in
                                    </Button>
                                    {errors.attendance ? (
                                        <p className="text-destructive mt-2 text-sm">
                                            {errors.attendance}
                                        </p>
                                    ) : null}
                                </>
                            )}
                        </Form>
                    ) : null}

                    {checkedIn && canMarkAttendance ? (
                        <Form action="/attendance/check-out" method="post" className="inline">
                            {({ processing, errors }) => (
                                <>
                                    <input type="hidden" name="device_id" value={deviceId} />
                                    {geo.latitude ? (
                                        <>
                                            <input type="hidden" name="latitude" value={geo.latitude} />
                                            <input type="hidden" name="longitude" value={geo.longitude} />
                                        </>
                                    ) : null}
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        disabled={processing || !canSubmit}
                                    >
                                        {processing ? <Spinner /> : null}
                                        Check out
                                    </Button>
                                    {errors.attendance ? (
                                        <p className="text-destructive mt-2 text-sm">
                                            {errors.attendance}
                                        </p>
                                    ) : null}
                                </>
                            )}
                        </Form>
                    ) : null}

                    {!canMarkAttendance ? (
                        <p className="text-muted-foreground self-center text-sm">
                            You do not have permission to mark your own attendance.
                        </p>
                    ) : null}

                    <Button variant="outline" size="sm" asChild>
                        <Link href="/attendance/calendar">
                            <CalendarDays className="size-4" />
                            View calendar
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function MonthSegments({ month }: { month: { present: number; late: number; absent: number; leave: number } }) {
    const segments = [
        { key: 'present', label: 'Present', value: month.present, className: 'bg-success' },
        { key: 'late', label: 'Late', value: month.late, className: 'bg-warning' },
        { key: 'absent', label: 'Absent', value: month.absent, className: 'bg-destructive' },
        { key: 'leave', label: 'Leave', value: month.leave, className: 'bg-info' },
    ] as const;
    const total = segments.reduce((sum, row) => sum + row.value, 0) || 1;

    return (
        <div className="space-y-4">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                {segments.map((row) => (
                    <span
                        key={row.key}
                        className={row.className}
                        style={{ width: `${(row.value / total) * 100}%` }}
                    />
                ))}
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
                {segments.map((row) => (
                    <div
                        key={row.key}
                        className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                    >
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-semibold tabular-nums">{row.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Dashboard({
    employee,
    today,
    network,
    month,
    teamToday,
    leaveBalances,
    upcomingHolidays,
    recentLeaves,
    pendingLeaveCount,
    attendancePolicy,
    kpis = [],
    analytics = [],
    todayAttendance = [],
    exceptions = [],
    departmentPerformance = [],
    officeStatus = [],
}: Props) {
    const { auth, can } = usePage().props;
    const isAdmin = teamToday !== null;
    const canMarkAttendance = Boolean((can as Record<string, boolean> | undefined)?.markAttendance);
    const firstName = employee?.full_name?.split(' ')[0] ?? auth.user.name.split(' ')[0];

    // Owners and HR admins are employees too, so their personal check-in panel
    // has to render alongside the team analytics.
    const personalAttendance = employee ? (
        <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
                <CheckInPanel
                    employee={employee}
                    today={today}
                    network={network}
                    attendancePolicy={attendancePolicy}
                    canMarkAttendance={canMarkAttendance}
                />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>This month</CardTitle>
                    <CardDescription>Your attendance breakdown</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <MonthSegments month={month} />
                </CardContent>
            </Card>
        </div>
    ) : null;

    return (
        <>
            <Head title="Dashboard" />
            <PageShell>
                <PageHeader
                    title={`${greeting()}, ${firstName}`}
                    description={
                        isAdmin
                            ? `${todayLong} · ${teamToday?.total_employees ?? 0} active employees`
                            : employee?.shift
                              ? `${employee.office?.name ?? 'No office'} · Shift ${employee.shift.start_time} – ${employee.shift.end_time}`
                              : 'Your attendance and leave at a glance.'
                    }
                    leading={
                        <PersonIdentity
                            name={employee?.full_name ?? auth.user.name}
                            avatar={employee?.avatar ?? auth.user.avatar}
                            size="lg"
                            hideText
                        />
                    }
                    actions={
                        isAdmin ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/reports/attendance">
                                    Attendance log
                                    <ExternalLink className="size-3.5" />
                                </Link>
                            </Button>
                        ) : undefined
                    }
                />

                {isAdmin ? (
                    <>
                        {kpis.length > 0 ? (
                            <KpiRow kpis={kpis} />
                        ) : (
                            <SkeletonKpiGrid />
                        )}

                        {personalAttendance}

                        <div className="grid gap-4 xl:grid-cols-3">
                            <AnalyticsCard analytics={analytics} />
                            <ExceptionsCard exceptions={exceptions} />
                        </div>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between gap-3">
                                <div>
                                    <CardTitle>Today’s attendance</CardTitle>
                                    <CardDescription>
                                        Live register of who has checked in
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/reports/attendance">View full report</Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {todayAttendance.length === 0 ? (
                                    <EmptyState
                                        icon={Clock3}
                                        title="No check-ins yet today"
                                        description="Once employees check in, their live record will appear here."
                                        className="py-12"
                                    />
                                ) : (
                                    <AttendanceLiveTable rows={todayAttendance} />
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <DepartmentPerformance
                                departments={departmentPerformance}
                                canLink={Boolean((can as Record<string, boolean> | undefined)?.manageEmployees)}
                            />
                            <OfficeStatusPanel
                                offices={officeStatus}
                                canLink={Boolean((can as Record<string, boolean> | undefined)?.manageOffices)}
                                policyLabel={attendancePolicy?.label}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        {personalAttendance}

                        <div className="grid gap-4 lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Leave balance</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-0">
                                    {leaveBalances.map((balance) => {
                                        const allocated = balance.allocated || 1;

                                        return (
                                            <div key={balance.name} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span>{balance.name}</span>
                                                    <span className="font-medium tabular-nums">
                                                        {balance.remaining} / {balance.allocated}
                                                    </span>
                                                </div>
                                                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                                                    <div
                                                        className="bg-primary h-full rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, (balance.remaining / allocated) * 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {leaveBalances.length === 0 ? (
                                        <p className="text-muted-foreground text-sm">
                                            No leave balances yet.
                                        </p>
                                    ) : null}
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/leave">Apply leave</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Upcoming holidays</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-0">
                                    {upcomingHolidays.map((holiday) => (
                                        <div
                                            key={`${holiday.name}-${holiday.date}`}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span>{holiday.name}</span>
                                            <span className="text-muted-foreground tabular-nums">
                                                {holiday.date}
                                            </span>
                                        </div>
                                    ))}
                                    {upcomingHolidays.length === 0 ? (
                                        <p className="text-muted-foreground text-sm">
                                            No upcoming holidays.
                                        </p>
                                    ) : null}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent leave</CardTitle>
                                    {pendingLeaveCount > 0 ? (
                                        <CardDescription>
                                            {pendingLeaveCount} pending approval
                                            {pendingLeaveCount === 1 ? '' : 's'}
                                        </CardDescription>
                                    ) : null}
                                </CardHeader>
                                <CardContent className="space-y-3 pt-0">
                                    {recentLeaves.map((leave) => (
                                        <div key={leave.id} className="text-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <span>{leave.type}</span>
                                                <StatusBadge status={leave.status} label={leave.status_label} />
                                            </div>
                                            <div className="text-muted-foreground mt-1 text-xs tabular-nums">
                                                {leave.start_date} – {leave.end_date}
                                            </div>
                                        </div>
                                    ))}
                                    {recentLeaves.length === 0 ? (
                                        <p className="text-muted-foreground text-sm">
                                            No recent requests.
                                        </p>
                                    ) : null}
                                    {pendingLeaveCount > 0 ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href="/leave/approvals">Review approvals</Link>
                                        </Button>
                                    ) : null}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </PageShell>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
