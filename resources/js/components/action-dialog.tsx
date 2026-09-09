import { useState, type ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Controlled confirm/action dialog. Render the body through a function
 * that receives `close`, so forms can close the dialog on success.
 */
export function ActionDialog({
    trigger,
    title,
    description,
    children,
    open,
    onOpenChange,
}: {
    trigger?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    children: (close: () => void) => ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined && onOpenChange !== undefined;
    const currentOpen = isControlled ? open : internalOpen;

    function setOpen(value: boolean) {
        if (isControlled) {
            onOpenChange(value);
        } else {
            setInternalOpen(value);
        }
    }

    return (
        <Dialog open={currentOpen} onOpenChange={setOpen}>
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? <DialogDescription>{description}</DialogDescription> : null}
                </DialogHeader>
                {children(() => setOpen(false))}
            </DialogContent>
        </Dialog>
    );
}
