import { Head, Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

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
    month: number;
    year: number;
    days: Day[];
    legend: { value: string; label: string; code: string }[];
};

const statusClass: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-800',
    late: 'bg-amber-100 text-amber-800',
    absent: 'bg-rose-100 text-rose-800',
    leave: 'bg-sky-100 text-sky-800',
    holiday: 'bg-violet-100 text-violet-800',
    weekend: 'bg-slate-100 text-slate-700',
};

export default function AttendanceCalendar({ month, year, days, legend }: Props) {
    const first = new Date(year, month - 1, 1);
    const pad = first.getDay();
    const previous = month === 1 ? `/attendance/calendar?month=12&year=${year - 1}` : `/attendance/calendar?month=${month - 1}&year=${year}`;
    const next = month === 12 ? `/attendance/calendar?month=1&year=${year + 1}` : `/attendance/calendar?month=${month + 1}&year=${year}`;

    return (
        <>
            <Head title="Attendance calendar" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">
                        {first.toLocaleString('default', { month: 'long' })} {year}
                    </h1>
                    <div className="flex gap-2 text-sm">
                        <Link href={previous} className="rounded-md border px-3 py-1">Previous</Link>
                        <Link href={next} className="rounded-md border px-3 py-1">Next</Link>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                        <div key={label}>{label}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: pad }).map((_, index) => (
                        <div key={`pad-${index}`} />
                    ))}
                    {days.map((day) => (
                        <div key={day.date} className="min-h-24 rounded-lg border p-2 text-left">
                            <div className="text-sm font-medium">{day.day}</div>
                            {day.code ? (
                                <div className={cn('mt-2 inline-flex rounded px-2 py-0.5 text-xs', statusClass[day.status ?? ''] ?? 'bg-muted')}>
                                    {day.code}
                                </div>
                            ) : (
                                <div className="text-muted-foreground mt-2 text-xs">—</div>
                            )}
                            {day.check_in_at && (
                                <div className="text-muted-foreground mt-2 text-[11px]">
                                    {day.check_in_at}{day.check_out_at ? ` – ${day.check_out_at}` : ''}
                                </div>
                            )}
                            {day.label && (
                                <div className="text-muted-foreground mt-1 text-[11px]">{day.label}</div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                    {legend.map((item) => (
                        <span key={item.value} className="text-muted-foreground">
                            {item.code} = {item.label}
                        </span>
                    ))}
                </div>
            </div>
        </>
    );
}

AttendanceCalendar.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Calendar', href: '/attendance/calendar' },
    ],
};
