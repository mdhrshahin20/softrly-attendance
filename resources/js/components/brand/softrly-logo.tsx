import { Link, type InertiaLinkProps } from '@inertiajs/react';
import { cn } from '@/lib/utils';

type LogoVariant = 'full' | 'mark' | 'wordmark' | 'compact';
type LogoTone = 'default' | 'inverse' | 'muted';

type SoftrlyLogoProps = {
    variant?: LogoVariant;
    tone?: LogoTone;
    href?: InertiaLinkProps['href'] | null;
    className?: string;
    markClassName?: string;
    label?: string;
};

/**
 * Softrly mark: a bold, verified check — the signature of a completed
 * attendance check-in. Stroked so it works on any surface.
 */
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
                d="M7.5 17.2 13 22.6 24.5 9.4"
                stroke="currentColor"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="24.5" cy="24.2" r="2" fill="currentColor" />
        </svg>
    );
}

const toneClass: Record<LogoTone, string> = {
    default: 'text-foreground',
    inverse: 'text-white',
    muted: 'text-muted-foreground',
};

const markToneClass: Record<LogoTone, string> = {
    default: 'bg-primary text-primary-foreground shadow-sm',
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
                        'flex size-8 shrink-0 items-center justify-center rounded-[10px]',
                        markToneClass[tone],
                        markClassName,
                    )}
                >
                    <SoftrlyMark className="size-[18px]" />
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
        <Link
            href={href}
            className="rounded-md inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            {content}
        </Link>
    );
}
