import type { VariantProps } from 'class-variance-authority';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { attendanceVisual } from '@/lib/attendance-status';
import { cn } from '@/lib/utils';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const toneMap: Record<string, BadgeVariant> = {
    present: 'success',
    on_time: 'success',
    active: 'success',
    approved: 'success',
    paid: 'success',
    sent: 'info',
    completed: 'success',
    processed: 'success',
    deducted: 'success',
    online: 'success',
    unpaid: 'warning',
    late: 'warning',
    pending: 'warning',
    draft: 'secondary',
    trial: 'warning',
    suspicious: 'destructive',
    blocked: 'destructive',
    rejected: 'destructive',
    expired: 'destructive',
    suspended: 'destructive',
    absent: 'destructive',
    offline: 'secondary',
    inactive: 'secondary',
    not_checked_in: 'secondary',
    cancelled: 'outline',
    leave: 'info',
    half_day: 'info',
};

const knownStatuses = new Set([
    'present',
    'on_time',
    'late',
    'leave',
    'absent',
    'holiday',
    'weekend',
    'half_day',
    'work_from_home',
    'manual',
    'not_checked_in',
]);

const attendanceLabels: Record<string, string> = {
    present: 'On time',
    on_time: 'On time',
    late: 'Late',
    leave: 'Leave',
    absent: 'Absent',
    holiday: 'Holiday',
    weekend: 'Weekly off',
    half_day: 'Half day',
    work_from_home: 'Work from home',
    manual: 'Manual',
    not_checked_in: 'Not checked in',
};

export function StatusBadge({
    status,
    label,
    className,
    withIcon = true,
}: {
    status: string;
    label?: string;
    className?: string;
    withIcon?: boolean;
}) {
    const key = status.toLowerCase();
    const variant = toneMap[key] ?? 'secondary';
    const visual = attendanceVisual(key);
    const Icon = visual.icon;
    const showIcon = withIcon && knownStatuses.has(key);

    return (
        <Badge variant={variant} className={cn('capitalize', className)}>
            {showIcon ? <Icon className="size-3" /> : null}
            {label ?? attendanceLabels[key] ?? status.replaceAll('_', ' ')}
        </Badge>
    );
}
