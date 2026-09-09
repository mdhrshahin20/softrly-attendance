import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    AttendanceDay,
    AttendanceLegend,
    AttendanceMonthGrid,
} from '@/components/attendance-month-grid';
import { DetailDrawer } from '@/components/detail-drawer';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { attendanceVisual } from '@/lib/attendance-status';
import { parseISODate, toISODate } from '@/lib/datetime';

type Props = {
    month: number;
    year: number;
    days: AttendanceDay[];
    legend: { value: string; label: string; code: string }[];
};

function dayUrl(month: number, year: number): string {
    return `/attendance/calendar?month=${month}&year=${year}`;
}

function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return `${hours}h ${String(rest).padStart(2, '0')}m`;
}

function parseShortTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    const match = value.match(/^(\d{1,2}):(\d{2})/);

    if (!match) {
        return value;
    }

    const hour = Number(match[1]);
    const period = hour >= 12 ? 'PM' : 'AM';
    const display = hour % 12 || 12;

    return `${display}:${match[2]} ${period}`;
}

export default function AttendanceCalendar({ month, year, days, legend }: Props) {
    const [selected, setSelected] = useState<AttendanceDay | null>(null);
    const first = new Date(year, month - 1, 1);

    const go = (targetMonth: number, targetYear: number) =>
        router.get(dayUrl(targetMonth, targetYear));

    const goToMonth = (iso: string) => {
        const date = parseISODate(iso);

        if (date) {
            go(date.getMonth() + 1, date.getFullYear());
        }
    };

    const selectedVisual = selected ? attendanceVisual(selected.status) : null;

    return (
        <>
            <Head title="Attendance calendar" />
            <PageShell>
                <PageHeader
                    title={`${first.toLocaleString('default', { month: 'long' })} ${year}`}
                    description="Select a day to see its check-in details."
                    actions={
                        <>
                            <div className="w-44">
                                <DatePicker
                                    value={toISODate(first)}
                                    onChange={goToMonth}
                                    placeholder="Jump to month"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => go(month === 1 ? 12 : month - 1, month === 1 ? year - 1 : year)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => go(month === 12 ? 1 : month + 1, month === 12 ? year + 1 : year)}
                            >
                                Next
                            </Button>
                        </>
                    }
                />
                <AttendanceMonthGrid
                    month={month}
                    year={year}
                    days={days}
                    onDayClick={setSelected}
                />
                <AttendanceLegend items={legend} />
            </PageShell>

            <DetailDrawer
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelected(null);
                    }
                }}
                title={
                    selected
                        ? new Date(`${selected.date}T00:00:00`).toLocaleDateString(undefined, {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                          })
                        : ''
                }
                description={selected?.date}
            >
                {selected && selectedVisual ? (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium">{selectedVisual.label}</span>
                            <StatusBadge
                                status={selected.status ?? 'not_checked_in'}
                                label={selected.status ? (selected.label ?? undefined) : 'Not checked in'}
                            />
                        </div>

                        {selected.code ? (
                            <Badge variant="outline" className="font-normal">
                                {selected.code}
                            </Badge>
                        ) : null}

                        <div className="rounded-xl border bg-muted/30 p-4">
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                <div>
                                    <dt className="text-muted-foreground text-xs">Check in</dt>
                                    <dd className="mt-0.5 font-medium tabular-nums">
                                        {parseShortTime(selected.check_in_at)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">Check out</dt>
                                    <dd className="mt-0.5 font-medium tabular-nums">
                                        {parseShortTime(selected.check_out_at)}
                                    </dd>
                                </div>
                                {selected.late_minutes ? (
                                    <div>
                                        <dt className="text-muted-foreground text-xs">Late by</dt>
                                        <dd className="mt-0.5 font-medium tabular-nums">
                                            {selected.late_minutes} minutes
                                        </dd>
                                    </div>
                                ) : null}
                                {selected.work_minutes ? (
                                    <div>
                                        <dt className="text-muted-foreground text-xs">Worked</dt>
                                        <dd className="mt-0.5 font-medium tabular-nums">
                                            {formatMinutes(selected.work_minutes)}
                                        </dd>
                                    </div>
                                ) : null}
                            </dl>
                        </div>

                        {selected.label ? (
                            <p className="text-muted-foreground text-sm">{selected.label}</p>
                        ) : null}
                    </div>
                ) : null}
            </DetailDrawer>
        </>
    );
}

AttendanceCalendar.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Calendar', href: '/attendance/calendar' },
    ],
};
