import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
                className,
            )}
        >
            {Icon ? (
                <div className="bg-muted text-muted-foreground mb-2 flex size-10 items-center justify-center rounded-full">
                    <Icon className="size-5" />
                </div>
            ) : null}
            <p className="text-sm font-medium">{title}</p>
            {description ? (
                <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
            ) : null}
            {action ? <div className="mt-2">{action}</div> : null}
        </div>
    );
}
