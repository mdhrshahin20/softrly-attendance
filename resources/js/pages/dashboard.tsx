import { Form, Head, Link } from '@inertiajs/react';
import { dashboard } from '@/routes';
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

type TodayAttendance = {
    status: string;
    status_label: string;
    check_in_at: string | null;
    check_out_at: string | null;
    late_minutes: number;
    work_minutes: number;
    office: { id: number; name: string } | null;
};

type Props = {
    employee: {
        id: number;
        full_name: string;
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
}: Props) {
    const deviceId = useDeviceId();
    const geo = useGeolocation(Boolean(attendancePolicy?.requires_location));
    const checkedIn = Boolean(today?.check_in_at && !today.check_out_at);
    const completed = Boolean(today?.check_in_at && today.check_out_at);
    const networkOk = attendancePolicy?.requires_network ? Boolean(network?.allowed) : true;
    const locationOk = attendancePolicy?.requires_location ? Boolean(geo.latitude && geo.longitude) : true;
    const canSubmit = Boolean(employee) && networkOk && locationOk;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Hello, {employee?.full_name ?? 'there'}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {employee?.office?.name ?? 'No office assigned'} ·{' '}
                        {employee?.shift
                            ? `${employee.shift.start_time} – ${employee.shift.end_time}`
                            : 'No shift assigned'}
                    </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Today</CardTitle>
                            <CardDescription>
                                {attendancePolicy?.description ??
                                    'Check-in and check-out are only allowed from an authorized office network.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge variant={checkedIn ? 'default' : 'secondary'}>
                                    {completed
                                        ? 'Day complete'
                                        : checkedIn
                                          ? `Checked in ${formatTime(today?.check_in_at ?? null)}`
                                          : 'Not checked in'}
                                </Badge>
                                {today && today.late_minutes > 0 && (
                                    <Badge variant="destructive">
                                        Late {today.late_minutes} min
                                    </Badge>
                                )}
                            </div>

                            <div className="grid gap-3 text-sm sm:grid-cols-3">
                                <div>
                                    <div className="text-muted-foreground">
                                        Network
                                    </div>
                                    <div className="mt-1 font-medium">
                                        {network?.allowed
                                            ? 'Office network detected'
                                            : 'Unauthorized network'}
                                    </div>
                                    <div className="text-muted-foreground mt-1">
                                        {network?.ip ?? 'Unknown IP'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Office
                                    </div>
                                    <div className="mt-1 font-medium">
                                        {network?.office?.name ??
                                            employee?.office?.name ??
                                            '—'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Working
                                    </div>
                                    <div className="mt-1 font-medium">
                                        {today?.work_minutes
                                            ? formatMinutes(today.work_minutes)
                                            : checkedIn
                                              ? 'In progress'
                                              : '—'}
                                    </div>
                                </div>
                            </div>

                            {!networkOk && network?.message && (
                                <p className="text-destructive text-sm">
                                    {network.message}
                                </p>
                            )}
                            {attendancePolicy?.requires_location && geo.error && (
                                <p className="text-destructive text-sm">{geo.error}</p>
                            )}
                            {attendancePolicy?.requires_location && geo.latitude && (
                                <p className="text-muted-foreground text-sm">
                                    Location captured for this check-in.
                                </p>
                            )}

                            <div className="flex flex-wrap gap-3">
                                {!checkedIn && !completed && (
                                    <Form
                                        action="/attendance/check-in"
                                        method="post"
                                        className="inline"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <input
                                                    type="hidden"
                                                    name="device_id"
                                                    value={deviceId}
                                                />
                                                {geo.latitude && (
                                                    <>
                                                        <input type="hidden" name="latitude" value={geo.latitude} />
                                                        <input type="hidden" name="longitude" value={geo.longitude} />
                                                    </>
                                                )}
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        processing ||
                                                        !canSubmit
                                                    }
                                                >
                                                    {processing && <Spinner />}
                                                    Check In
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
                                    <Form
                                        action="/attendance/check-out"
                                        method="post"
                                        className="inline"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <input
                                                    type="hidden"
                                                    name="device_id"
                                                    value={deviceId}
                                                />
                                                {geo.latitude && (
                                                    <>
                                                        <input type="hidden" name="latitude" value={geo.latitude} />
                                                        <input type="hidden" name="longitude" value={geo.longitude} />
                                                    </>
                                                )}
                                                <Button
                                                    type="submit"
                                                    variant="secondary"
                                                    disabled={
                                                        processing ||
                                                        !canSubmit
                                                    }
                                                >
                                                    {processing && <Spinner />}
                                                    Check Out
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
                                    <Link href="/attendance/calendar">
                                        View calendar
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>This month</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-4 gap-3 text-center">
                            <div>
                                <div className="text-2xl font-semibold">
                                    {month.present}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    Present
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-semibold">
                                    {month.late}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    Late
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-semibold">
                                    {month.absent}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    Absent
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-semibold">
                                    {month.leave}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    Leave
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {teamToday && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Team today</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-5">
                            <Stat label="Employees" value={teamToday.total_employees} />
                            <Stat label="Present" value={teamToday.present} />
                            <Stat label="Late" value={teamToday.late} />
                            <Stat label="On leave" value={teamToday.on_leave} />
                            <Stat label="Absent" value={teamToday.absent} />
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leave balance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {leaveBalances.map((balance) => (
                                <div key={balance.name} className="flex items-center justify-between text-sm">
                                    <span>{balance.name}</span>
                                    <span className="font-medium">{balance.remaining} / {balance.allocated}</span>
                                </div>
                            ))}
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
                                <div key={`${holiday.name}-${holiday.date}`} className="flex items-center justify-between text-sm">
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
                                <CardDescription>{pendingLeaveCount} pending approval{pendingLeaveCount === 1 ? '' : 's'}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentLeaves.map((leave) => (
                                <div key={leave.id} className="text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>{leave.type}</span>
                                        <span className="text-muted-foreground">{leave.status_label}</span>
                                    </div>
                                    <div className="text-muted-foreground text-xs">{leave.start_date} – {leave.end_date}</div>
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
            </div>
        </>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="text-muted-foreground text-sm">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
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
