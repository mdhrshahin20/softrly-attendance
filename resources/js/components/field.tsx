import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Shared form field wrapper: label + control + inline server error,
 * replacing the duplicated per-page `Field` helpers.
 */
export function Field({
    label,
    htmlFor,
    error,
    hint,
    children,
    className,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={htmlFor} className="font-medium">
                {label}
            </Label>
            {children}
            {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
            <InputError message={error} />
        </div>
    );
}
