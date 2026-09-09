import type { ReactNode } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

/**
 * Right slide-over used for employee, attendance and leave details.
 * Full width on mobile, capped on larger screens.
 */
export function DetailDrawer({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
                <SheetHeader className="border-b pr-10">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        {title}
                    </SheetTitle>
                    {description ? (
                        <SheetDescription>{description}</SheetDescription>
                    ) : null}
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
                {footer ? (
                    <div className="flex items-center justify-end gap-2 border-t px-5 py-3.5">
                        {footer}
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
