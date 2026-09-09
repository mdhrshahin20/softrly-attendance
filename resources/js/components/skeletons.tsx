import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Layout-matched skeleton loaders. Use instead of bare spinners so the
 * placeholder mirrors the content that is about to render.
 */
export function SkeletonLines({
    lines = 3,
    className,
    lastShort = true,
}: {
    lines?: number;
    className?: string;
    lastShort?: boolean;
}) {
    return (
        <div className={cn('space-y-2', className)} aria-hidden="true">
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    className={cn(
                        'bg-muted h-3.5 w-full rounded',
                        lastShort && index === lines - 1 && 'w-2/3',
                    )}
                />
            ))}
        </div>
    );
}

export function SkeletonCard({
    className,
    children,
}: {
    className?: string;
    children?: ReactNode;
}) {
    return (
        <div className={cn('rounded-xl border bg-card p-5', className)}>
            <Skeleton className="bg-muted mb-4 h-4 w-36 rounded" />
            {children ?? <SkeletonLines />}
        </div>
    );
}

export function SkeletonKpiGrid({
    cards = 5,
}: {
    cards?: number;
}) {
    return (
        <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
            aria-hidden="true"
        >
            {Array.from({ length: cards }).map((_, index) => (
                <div key={index} className="rounded-xl border bg-card p-5">
                    <Skeleton className="bg-muted h-3.5 w-24 rounded" />
                    <Skeleton className="bg-muted mt-4 h-8 w-16 rounded" />
                    <Skeleton className="bg-muted mt-3 h-3 w-28 rounded" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
    return (
        <div className="overflow-hidden rounded-xl border" aria-hidden="true">
            <div className="bg-muted/50 flex gap-8 border-b px-4 py-3">
                <Skeleton className="bg-muted h-3 w-40 rounded" />
                <Skeleton className="bg-muted hidden h-3 w-24 rounded sm:block" />
                <Skeleton className="bg-muted hidden h-3 w-24 rounded md:block" />
                <Skeleton className="bg-muted ml-auto h-3 w-16 rounded" />
            </div>
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className={cn(
                        'flex items-center gap-8 px-4 py-3.5',
                        index > 0 && 'border-border/80 border-t',
                    )}
                >
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="bg-muted size-7 rounded-full" />
                        <Skeleton className="bg-muted h-3 w-36 rounded" />
                    </div>
                    <Skeleton className="bg-muted hidden h-3 w-24 rounded sm:block" />
                    <Skeleton className="bg-muted hidden h-3 w-24 rounded md:block" />
                    <Skeleton className="bg-muted ml-auto h-5 w-16 rounded-full" />
                </div>
            ))}
        </div>
    );
}
