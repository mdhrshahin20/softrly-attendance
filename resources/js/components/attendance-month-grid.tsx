import { cn } from '@/lib/utils';
import { attendanceVisual } from '@/lib/attendance-status';

export type AttendanceDay = {
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

export function AttendanceMonthGrid({
    month,
    year,
    days,
    compact = false,
}: {
    month: number;
    year: number;
    days: AttendanceDay[];
    compact?: boolean;
}) {
    const first = new Date(year, month - 1, 1);
    const pad = first.getDay();

    return (
        <div className="space-y-3">
            <div className="text-muted-foreground grid grid-cols-7 gap-2 text-center text-xs font-medium">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                    <div key={label}>{label}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: pad }).map((_, index) => (
                    <div key={`pad-${index}`} />
                ))}
                {days.map((day) => {
                    const visual = attendanceVisual(day.status);
                    const Icon = visual.icon;

                    return (
                        <div
                            key={day.date}
                            className={cn(
                                'rounded-lg border p-2 text-left',
                                compact ? 'min-h-20' : 'min-h-24',
                                day.status ? visual.cell : 'bg-card',
                            )}
                        >
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-sm font-semibold">{day.day}</span>
                                {day.status ? <Icon className="size-3.5 shrink-0 opacity-80" /> : null}
                            </div>
                            {day.status ? (
                                <div className="mt-1.5 text-[11px] leading-tight font-medium">
                                    {visual.label}
                                    {day.status === 'late' && day.late_minutes
                                        ? ` · ${day.late_minutes}m`
                                        : ''}
                                </div>
                            ) : (
                                <div className="text-muted-foreground mt-1.5 text-[11px]">—</div>
                            )}
                            {day.check_in_at ? (
                                <div className="mt-1 text-[11px] opacity-80">
                                    {day.check_in_at}
                                    {day.check_out_at ? ` – ${day.check_out_at}` : ''}
                                </div>
                            ) : null}
                            {day.label ? (
                                <div className="mt-1 truncate text-[11px] opacity-80">{day.label}</div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function AttendanceLegend({
    items,
}: {
    items: { value: string; label: string; code: string }[];
}) {
    const preferred = ['present', 'late', 'leave', 'absent', 'holiday', 'weekend'];
    const ordered = [
        ...preferred
            .map((value) => items.find((item) => item.value === value))
            .filter((item): item is { value: string; label: string; code: string } => Boolean(item)),
        ...items.filter((item) => !preferred.includes(item.value)),
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {ordered.map((item) => {
                const visual = attendanceVisual(item.value);
                const Icon = visual.icon;

                return (
                    <span
                        key={item.value}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                            visual.cell,
                        )}
                    >
                        <Icon className="size-3.5" />
                        {item.label}
                    </span>
                );
            })}
        </div>
    );
}
