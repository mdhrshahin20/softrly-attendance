import { Link } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Sparkline } from '@/components/charts/sparkline';
import { Card } from '@/components/ui/card';
import { metricTones, type MetricTone } from '@/lib/attendance-status';
import { cn } from '@/lib/utils';

export type TrendDirection = 'up' | 'down' | 'flat';
export type TrendTone = 'good' | 'bad' | 'neutral';

const trendPill: Record<TrendTone, string> = {
    good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
    bad: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200',
    neutral: 'bg-muted text-muted-foreground',
};

function TrendIcon({ direction }: { direction: TrendDirection }) {
    if (direction === 'up') {
        return <ArrowUpRight className="size-3" />;
    }

    if (direction === 'down') {
        return <ArrowDownRight className="size-3" />;
    }

    return <Minus className="size-3" />;
}

const sparkToneClass: Record<MetricTone, string> = {
    default: 'text-primary',
    success: 'text-emerald-600 dark:text-emerald-300',
    warning: 'text-amber-600 dark:text-amber-300',
    info: 'text-blue-600 dark:text-blue-300',
    danger: 'text-rose-600 dark:text-rose-300',
};

export function MetricCard({
    label,
    value,
    hint,
    icon: Icon,
    tone = 'default',
    trend,
    trendTone = 'neutral',
    sparkline,
    href,
    className,
}: {
    label: string;
    value: ReactNode;
    hint?: string;
    icon?: LucideIcon;
    tone?: MetricTone;
    trend?: { delta: string; direction: TrendDirection; label: string };
    trendTone?: TrendTone;
    sparkline?: number[];
    href?: string;
    className?: string;
}) {
    const body = (
        <>
            <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground text-sm font-medium">{label}</p>
                {Icon ? (
                    <div
                        className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-lg',
                            metricTones[tone],
                        )}
                    >
                        <Icon className="size-4" />
                    </div>
                ) : null}
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    {value}
                </span>
                {trend ? (
                    <span
                        className={cn(
                            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums',
                            trendPill[trendTone],
                        )}
                        title={trend.label}
                    >
                        <TrendIcon direction={trend.direction} />
                        {trend.delta}
                    </span>
                ) : null}
            </div>

            {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}

            {sparkline && sparkline.length > 1 ? (
                <div className="mt-3">
                    <Sparkline
                        data={sparkline}
                        strokeClassName={sparkToneClass[tone]}
                        className={sparkToneClass[tone]}
                    />
                </div>
            ) : null}

            {href ? (
                <ChevronRight className="text-muted-foreground/60 absolute top-5 right-4 size-4 transition-transform group-hover:translate-x-0.5" />
            ) : null}
        </>
    );

    const cardClass = cn(
        'relative overflow-hidden p-5 transition-[border-color,box-shadow,background-color] duration-200',
        href && 'group hover:border-primary/30',
        className,
    );

    if (href) {
        return (
            <Link
                href={href}
                className={cn(
                    'rounded-xl border bg-card text-card-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                    cardClass,
                )}
                aria-label={`${label}: ${value}. Open.`}
            >
                {body}
            </Link>
        );
    }

    return <Card className={cardClass}>{body}</Card>;
}
