import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

type LogoVariant = 'full' | 'mark' | 'wordmark' | 'compact';
type LogoTone = 'default' | 'inverse' | 'muted';

type SoftrlyLogoProps = {
    variant?: LogoVariant;
    tone?: LogoTone;
    href?: string | null;
    className?: string;
    markClassName?: string;
    label?: string;
};

export function SoftrlyMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
        >
            <path
                d="M8 10.5c3.2-3.1 8.4-3.4 12.1-.7 1.8 1.3 3 3.2 3.4 5.3"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
            />
            <path
                d="M24 21.5c-3.2 3.1-8.4 3.4-12.1.7-1.8-1.3-3-3.2-3.4-5.3"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
            />
            <circle cx="10.5" cy="17.5" r="2.2" fill="currentColor" />
            <circle cx="21.5" cy="14.5" r="2.2" fill="currentColor" />
            <path
                d="M14.2 16h3.6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

const toneClass: Record<LogoTone, string> = {
    default: 'text-foreground',
    inverse: 'text-white',
    muted: 'text-muted-foreground',
};

const markToneClass: Record<LogoTone, string> = {
    default: 'bg-primary text-primary-foreground',
    inverse: 'bg-white/15 text-white ring-1 ring-white/20',
    muted: 'bg-muted text-foreground',
};

export function SoftrlyLogo({
    variant = 'full',
    tone = 'default',
    href = '/',
    className,
    markClassName,
    label = 'Softrly',
}: SoftrlyLogoProps) {
    const content = (
        <span
            className={cn(
                'inline-flex items-center gap-2.5',
                toneClass[tone],
                className,
            )}
        >
            {variant !== 'wordmark' ? (
                <span
                    className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        markToneClass[tone],
                        markClassName,
                    )}
                >
                    <SoftrlyMark className="size-4" />
                </span>
            ) : null}
            {variant !== 'mark' ? (
                <span className="text-sm font-semibold tracking-tight">
                    {label}
                    {variant === 'compact' ? null : (
                        <span className="text-muted-foreground ml-1.5 hidden font-normal sm:inline">
                            Attendance
                        </span>
                    )}
                </span>
            ) : null}
        </span>
    );

    if (href === null) {
        return content;
    }

    return (
        <Link href={href} className="inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md">
            {content}
        </Link>
    );
}
