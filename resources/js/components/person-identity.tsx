import { Link } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

const sizeClass = {
    sm: 'size-7',
    md: 'size-8',
    lg: 'size-14',
} as const;

const initialsClass = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-lg',
} as const;

export function PersonIdentity({
    name,
    avatar,
    detail,
    href,
    size = 'md',
    hideText = false,
    className,
}: {
    name: string;
    avatar?: string | null;
    detail?: string | null;
    href?: string;
    size?: keyof typeof sizeClass;
    hideText?: boolean;
    className?: string;
}) {
    const getInitials = useInitials();
    const photo = (
        <Avatar className={cn('overflow-hidden rounded-full', sizeClass[size])}>
            {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
            <AvatarFallback
                className={cn(
                    'bg-primary/10 text-primary font-medium',
                    initialsClass[size],
                )}
            >
                {getInitials(name)}
            </AvatarFallback>
        </Avatar>
    );

    if (hideText) {
        return href ? (
            <Link href={href} className={cn('shrink-0', className)} aria-label={name}>
                {photo}
            </Link>
        ) : (
            <div className={cn('shrink-0', className)}>{photo}</div>
        );
    }

    const label = <span className="truncate font-medium">{name}</span>;

    return (
        <div className={cn('flex min-w-0 items-center gap-3', className)}>
            {photo}
            <div className="min-w-0 leading-tight">
                {href ? (
                    <Link href={href} className="hover:underline">
                        {label}
                    </Link>
                ) : (
                    label
                )}
                {detail ? (
                    <div className="text-muted-foreground truncate text-xs">{detail}</div>
                ) : null}
            </div>
        </div>
    );
}
