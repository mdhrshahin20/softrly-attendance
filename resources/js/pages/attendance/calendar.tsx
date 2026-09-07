import { Head, Link } from '@inertiajs/react';
import { AttendanceLegend, AttendanceMonthGrid } from '@/components/attendance-month-grid';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';

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

export default function AttendanceCalendar({ month, year, days, legend }: Props) {
    const first = new Date(year, month - 1, 1);
    const previous =
        month === 1
            ? `/attendance/calendar?month=12&year=${year - 1}`
            : `/attendance/calendar?month=${month - 1}&year=${year}`;
    const next =
        month === 12
            ? `/attendance/calendar?month=1&year=${year + 1}`
            : `/attendance/calendar?month=${month + 1}&year=${year}`;

    return (
        <>
            <Head title="Attendance calendar" />
            <PageShell>
                <PageHeader
                    title={`${first.toLocaleString('default', { month: 'long' })} ${year}`}
                    description="Green is on time, amber is late, blue is leave, red is absent."
                    actions={
                        <>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={previous}>Previous</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={next}>Next</Link>
                            </Button>
                        </>
                    }
                />
                <AttendanceMonthGrid month={month} year={year} days={days} />
                <AttendanceLegend items={legend} />
            </PageShell>
        </>
    );
}

AttendanceCalendar.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Calendar', href: '/attendance/calendar' },
    ],
};
