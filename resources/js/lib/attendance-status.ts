import {
    CalendarOff,
    CheckCircle2,
    Clock3,
    Palmtree,
    Circle,
    XCircle,
    type LucideIcon,
} from 'lucide-react';

export type AttendanceStatusKey =
    | 'present'
    | 'late'
    | 'absent'
    | 'leave'
    | 'holiday'
    | 'weekend'
    | 'half_day'
    | 'work_from_home'
    | 'manual'
    | 'on_time';

type StatusVisual = {
    label: string;
    icon: LucideIcon;
    cell: string;
    iconWrap: string;
};

export const attendanceStatusVisual: Record<string, StatusVisual> = {
    present: {
        label: 'On time',
        icon: CheckCircle2,
        cell: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
        iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200',
    },
    on_time: {
        label: 'On time',
        icon: CheckCircle2,
        cell: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
        iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200',
    },
    late: {
        label: 'Late',
        icon: Clock3,
        cell: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
        iconWrap: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    },
    leave: {
        label: 'Leave',
        icon: Palmtree,
        cell: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
        iconWrap: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200',
    },
    absent: {
        label: 'Absent',
        icon: XCircle,
        cell: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
        iconWrap: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200',
    },
    holiday: {
        label: 'Holiday',
        icon: CalendarOff,
        cell: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
        iconWrap: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200',
    },
    weekend: {
        label: 'Weekly off',
        icon: CalendarOff,
        cell: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
        iconWrap: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
    half_day: {
        label: 'Half day',
        icon: Clock3,
        cell: 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200',
        iconWrap: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200',
    },
    work_from_home: {
        label: 'Work from home',
        icon: CheckCircle2,
        cell: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
        iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200',
    },
    manual: {
        label: 'Manual',
        icon: CheckCircle2,
        cell: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
        iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200',
    },
};

export function attendanceVisual(status: string | null | undefined): StatusVisual {
    if (!status) {
        return {
            label: 'Not marked',
            icon: Circle,
            cell: 'border-transparent bg-muted text-muted-foreground',
            iconWrap: 'bg-muted text-muted-foreground',
        };
    }

    return (
        attendanceStatusVisual[status] ?? {
            label: status.replaceAll('_', ' '),
            icon: CheckCircle2,
            cell: 'border-transparent bg-muted text-muted-foreground',
            iconWrap: 'bg-muted text-muted-foreground',
        }
    );
}

export const metricTones = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200',
} as const;

export type MetricTone = keyof typeof metricTones;
