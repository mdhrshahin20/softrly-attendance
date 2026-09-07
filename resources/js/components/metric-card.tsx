import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { metricTones, type MetricTone } from '@/lib/attendance-status';
import { cn } from '@/lib/utils';

export function MetricCard({
    label,
    value,
    hint,
    icon: Icon,
    tone = 'default',
    className,
}: {
    label: string;
    value: ReactNode;
    hint?: string;
    icon?: LucideIcon;
    tone?: MetricTone;
    className?: string;
}) {
    return (
        <Card className={cn('shadow-none', className)}>
            <CardContent className="flex items-start justify-between gap-3 pt-0">
                <div className="min-w-0">
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
                    {hint ? (
                        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
                    ) : null}
                </div>
                {Icon ? (
                    <div
                        className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-md',
                            metricTones[tone],
                        )}
                    >
                        <Icon className="size-4" />
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
