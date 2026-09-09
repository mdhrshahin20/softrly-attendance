import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Human-readable error state for data panels. Never exposes stack traces.
 */
export function ErrorState({
    title = 'Unable to load data',
    description = 'Something went wrong on our side. Please try again.',
    action,
    className,
}: {
    title?: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center gap-2 px-6 py-12 text-center ${className ?? ''}`}
        >
            <div className="bg-destructive/10 text-destructive mb-2 flex size-10 items-center justify-center rounded-full">
                <AlertTriangle className="size-5" />
            </div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
            {action ? <div className="mt-2">{action}</div> : null}
        </div>
    );
}

export function RetryButton({ label = 'Try again' }: { label?: string }) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
        >
            {label}
        </Button>
    );
}
