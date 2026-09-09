import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Standard row above data tables holding search inputs, filter selects
 * and a result count. Layout-only; filtering stays server round-trips.
 */
export function TableToolbar({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-2.5 rounded-xl border bg-card p-3',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function ResultsCount({
    from,
    to,
    total,
    className,
}: {
    from?: number | null;
    to?: number | null;
    total: number;
    className?: string;
}) {
    if (total === 0) {
        return (
            <p className={cn('text-muted-foreground ml-auto text-xs', className)}>
                No records
            </p>
        );
    }

    return (
        <p className={cn('text-muted-foreground ml-auto text-xs tabular-nums', className)}>
            {from && to ? `${from}–${to} of ` : ''}
            {total}
        </p>
    );
}
