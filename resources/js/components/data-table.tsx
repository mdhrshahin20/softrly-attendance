import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DataTable({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('overflow-hidden rounded-xl border', className)}>
            <div className="overflow-x-auto">
                <table className="app-table">{children}</table>
            </div>
        </div>
    );
}
