import { Form, Head, Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    CheckCircle2,
    Clock3,
    Palmtree,
    Users,
    XCircle,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { MetricCard } from '@/components/metric-card';
import { NetworkStatus } from '@/components/network-status';
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
import { Spinner } from '@/components/ui/spinner';
import { useDeviceId } from '@/hooks/use-device-id';
import { useGeolocation } from '@/hooks/use-geolocation';
import { dashboard } from '@/routes';

type TodayAttendance = {
    status: string;
    status_label: string;
    check_in_at: string | null;
    check_out_at: string | null;
    late_minutes: number;
    work_minutes: number;
    office: { id: number; name: string } | null;
};

type TeamMember = {
    id: number;
    full_name: string;
    avatar?: string | null;
    employee_code: string | null;
    department: string | null;
    office: string | null;
    check_in_at: string | null;
    late_minutes: number;
    leave_type: string | null;
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
    lateToday: TeamMember[];
    onLeaveToday: TeamMember[];
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
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return `${hours}h ${rest.toString().padStart(2, '0')}m`;
}

function TeamMemberRow({
    person,
    detail,
    badge,
}: {
    person: TeamMember;
    detail: string;
    badge?: ReactNode;
}) {
    return (
        <div className="flex items-center gap-3 py-3">
            <PersonIdentity
                name={person.full_name}
                avatar={person.avatar}
                detail={detail}
                href={`/employees/${person.id}`}
                className="min-w-0 flex-1"
            />
            {badge}
        </div>
    );
}

export default function Dashboard({
    employee,
    today,
    network,
    month,
    teamToday,
    lateToday = [],
    onLeaveToday = [],
    leaveBalances,
    upcomingHolidays,
    recentLeaves,
    pendingLeaveCount,
    attendancePolicy,
}: Props) {
    const { auth, can } = usePage().props;
    const deviceId = useDeviceId();
    const geo = useGeolocation(Boolean(attendancePolicy?.requires_location));
    const checkedIn = Boolean(today?.check_in_at && !today.check_out_at);
    const completed = Boolean(today?.check_in_at && today.check_out_at);
    const networkOk = attendancePolicy?.requires_network ? Boolean(network?.allowed) : true;
    const locationOk = attendancePolicy?.requires_location ? Boolean(geo.latitude && geo.longitude) : true;
    const canSubmit = Boolean(employee) && networkOk && locationOk;
    const firstName = employee?.full_name?.split(' ')[0] ?? 'there';

    return (
        <>
            <Head title="Dashboard" />
            <PageShell>
                <PageHeader
                    title={`${greeting()}, ${firstName}`}
                    description={
                        teamToday
                            ? "Here's what's happening across your organization today."
                            : employee?.shift
                              ? `${employee.office?.name ?? 'No office'} · ${employee.shift.start_time} – ${employee.shift.end_time}`
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
                />

                {teamToday ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            label="Employees"
                            value={teamToday.total_employees}
                            hint="Active people in this workspace"
                            icon={Users}
                        />
                        <MetricCard
                            label="On time today"
                            value={teamToday.present}
                            hint={`${teamToday.late} arrived late`}
                            icon={CheckCircle2}
                            tone="success"
                        />
                        <MetricCard
                            label="On leave"
                            value={teamToday.on_leave}
                            hint={`${pendingLeaveCount} pending request${pendingLeaveCount === 1 ? '' : 's'}`}
                            icon={Palmtree}
                            tone="info"
                        />
                        <MetricCard
                            label="Absent"
                            value={teamToday.absent}
                            hint="Not present and not on leave"
                            icon={XCircle}
                            tone="danger"
                        />
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            label="On time"
                            value={month.present}
                            hint="This month"
                            icon={CheckCircle2}
                            tone="success"
                        />
                        <MetricCard
                            label="Late"
                            value={month.late}
                            hint="This month"
                            icon={Clock3}
                            tone="warning"
                        />
                        <MetricCard
                            label="Absent"
                            value={month.absent}
                            hint="This month"
                            icon={XCircle}
                            tone="danger"
                        />
                        <MetricCard
                            label="Leave"
                            value={month.leave}
                            hint="This month"
                            icon={Palmtree}
                            tone="info"
                        />
                    </div>
                )}

                {teamToday ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Late today</CardTitle>
                                <CardDescription>
                                    {lateToday.length === 0
                                        ? 'Nobody is late so far.'
                                        : `${lateToday.length} ${lateToday.length === 1 ? 'person arrived' : 'people arrived'} after grace.`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {lateToday.length === 0 ? (
                                    <EmptyState
                                        icon={Clock3}
                                        title="No late arrivals"
                                        description="Everyone who checked in is on time."
                                        className="py-8"
                                    />
                                ) : (
                                    <div className="divide-border divide-y">
                                        {lateToday.map((person) => (
                                            <TeamMemberRow
                                                key={person.id}
                                                person={person}
                                                detail={[
                                                    person.department || person.office || person.employee_code,
                                                    person.check_in_at
                                                        ? `in at ${formatTime(person.check_in_at)}`
                                                        : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                                badge={
                                                    <StatusBadge
                                                        status="late"
                                                        label={`${person.late_minutes} min`}
                                                    />
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>On leave today</CardTitle>
                                <CardDescription>
                                    {onLeaveToday.length === 0
                                        ? 'Nobody is on leave today.'
                                        : `${onLeaveToday.length} ${onLeaveToday.length === 1 ? 'person is' : 'people are'} out of office.`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {onLeaveToday.length === 0 ? (
                                    <EmptyState
                                        icon={Palmtree}
                                        title="No one on leave"
                                        description="All active employees are expected in today."
                                        className="py-8"
                                    />
                                ) : (
                                    <div className="divide-border divide-y">
                                        {onLeaveToday.map((person) => (
                                            <TeamMemberRow
                                                key={person.id}
                                                person={person}
                                                detail={[
                                                    person.leave_type,
                                                    person.department || person.office || person.employee_code,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                                badge={<StatusBadge status="leave" label="On leave" />}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Today’s attendance</CardTitle>
                            <CardDescription>
                                {attendancePolicy?.description ??
                                    'Check-in is available when your attendance policy allows it.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6">
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
                                    <div className="text-muted-foreground">Check in</div>
                                    <div className="mt-1 font-medium">{formatTime(today?.check_in_at ?? null)}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Check out</div>
                                    <div className="mt-1 font-medium">{formatTime(today?.check_out_at ?? null)}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Working</div>
                                    <div className="mt-1 font-medium">
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
                                    showTechnical={Boolean(can?.manageOffices)}
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

                            <div className="flex flex-wrap gap-3">
                                {!checkedIn && !completed && (
                                    <Form action="/attendance/check-in" method="post" className="inline">
                                        {({ processing, errors }) => (
                                            <>
                                                <input type="hidden" name="device_id" value={deviceId} />
                                                {geo.latitude && (
                                                    <>
                                                        <input type="hidden" name="latitude" value={geo.latitude} />
                                                        <input type="hidden" name="longitude" value={geo.longitude} />
                                                    </>
                                                )}
                                                <Button type="submit" disabled={processing || !canSubmit}>
                                                    {processing && <Spinner />}
                                                    Check in
                                                </Button>
                                                {errors.attendance && (
                                                    <p className="text-destructive mt-2 text-sm">
                                                        {errors.attendance}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </Form>
                                )}

                                {checkedIn && (
                                    <Form action="/attendance/check-out" method="post" className="inline">
                                        {({ processing, errors }) => (
                                            <>
                                                <input type="hidden" name="device_id" value={deviceId} />
                                                {geo.latitude && (
                                                    <>
                                                        <input type="hidden" name="latitude" value={geo.latitude} />
                                                        <input type="hidden" name="longitude" value={geo.longitude} />
                                                    </>
                                                )}
                                                <Button
                                                    type="submit"
                                                    variant="secondary"
                                                    disabled={processing || !canSubmit}
                                                >
                                                    {processing && <Spinner />}
                                                    Check out
                                                </Button>
                                                {errors.attendance && (
                                                    <p className="text-destructive mt-2 text-sm">
                                                        {errors.attendance}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </Form>
                                )}

                                <Button variant="outline" asChild>
                                    <Link href="/attendance/calendar">View calendar</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>This month</CardTitle>
                            <CardDescription>Your own attendance counts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: 'Present', value: month.present, className: 'bg-success' },
                                { label: 'Late', value: month.late, className: 'bg-warning' },
                                { label: 'Absent', value: month.absent, className: 'bg-destructive' },
                                { label: 'Leave', value: month.leave, className: 'bg-info' },
                            ].map((row) => {
                                const total =
                                    month.present + month.late + month.absent + month.leave || 1;

                                return (
                                    <div key={row.label} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{row.label}</span>
                                            <span className="font-medium">{row.value}</span>
                                        </div>
                                        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                                            <div
                                                className={`h-full rounded-full ${row.className}`}
                                                style={{ width: `${(row.value / total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leave balance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {leaveBalances.map((balance) => {
                                const allocated = balance.allocated || 1;

                                return (
                                    <div key={balance.name} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>{balance.name}</span>
                                            <span className="font-medium">
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
                            {leaveBalances.length === 0 && (
                                <p className="text-muted-foreground text-sm">No leave balances yet.</p>
                            )}
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/leave">Apply leave</Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming holidays</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {upcomingHolidays.map((holiday) => (
                                <div
                                    key={`${holiday.name}-${holiday.date}`}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span>{holiday.name}</span>
                                    <span className="text-muted-foreground">{holiday.date}</span>
                                </div>
                            ))}
                            {upcomingHolidays.length === 0 && (
                                <p className="text-muted-foreground text-sm">No upcoming holidays.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent leave</CardTitle>
                            {pendingLeaveCount > 0 && (
                                <CardDescription>
                                    {pendingLeaveCount} pending approval
                                    {pendingLeaveCount === 1 ? '' : 's'}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentLeaves.map((leave) => (
                                <div key={leave.id} className="text-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <span>{leave.type}</span>
                                        <StatusBadge status={leave.status} label={leave.status_label} />
                                    </div>
                                    <div className="text-muted-foreground mt-1 text-xs">
                                        {leave.start_date} – {leave.end_date}
                                    </div>
                                </div>
                            ))}
                            {recentLeaves.length === 0 && (
                                <p className="text-muted-foreground text-sm">No recent requests.</p>
                            )}
                            {pendingLeaveCount > 0 && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/leave/approvals">Review approvals</Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
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
