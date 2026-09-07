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
    completed: 'success',
    late: 'warning',
    pending: 'warning',
    trial: 'warning',
    absent: 'destructive',
    rejected: 'destructive',
    expired: 'destructive',
    suspended: 'destructive',
    leave: 'info',
    cancelled: 'outline',
    inactive: 'secondary',
};

const attendanceLabels: Record<string, string> = {
    present: 'On time',
    on_time: 'On time',
    late: 'Late',
    leave: 'Leave',
    absent: 'Absent',
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
    const showIcon = withIcon && key in attendanceLabels;

    return (
        <Badge variant={variant} className={cn('capitalize', className)}>
            {showIcon ? <Icon className="size-3" /> : null}
            {label ?? attendanceLabels[key] ?? status.replaceAll('_', ' ')}
        </Badge>
    );
}
