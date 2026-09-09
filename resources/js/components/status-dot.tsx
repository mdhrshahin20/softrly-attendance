import { cn } from '@/lib/utils';

const dotTone = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    muted: 'bg-muted-foreground/50',
} as const;

export type StatusDotTone = keyof typeof dotTone;

/**
 * Status indicator that never relies on color alone: always pair
 * with a visible text label via the `label` prop.
 */
export function StatusDot({
    tone = 'muted',
    label,
    pulse = false,
    className,
}: {
    tone?: StatusDotTone;
    label: string;
    pulse?: boolean;
    className?: string;
}) {
    return (
        <span className={cn('inline-flex items-center gap-1.5', className)}>
            <span className="relative flex size-2">
                {pulse ? (
                    <span
                        className={cn(
                            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                            dotTone[tone],
                        )}
                        aria-hidden="true"
                    />
                ) : null}
                <span
                    className={cn(
                        'relative inline-flex size-2 rounded-full',
                        dotTone[tone],
                    )}
                    aria-hidden="true"
                />
            </span>
            <span className="text-sm font-medium">{label}</span>
        </span>
    );
}
