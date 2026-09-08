import { Form } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type Props = {
    action: string;
    title: string;
    description: string;
    confirmLabel?: string;
    triggerLabel?: ReactNode;
    disabled?: boolean;
    disabledTitle?: string;
};

export function DeleteConfirm({
    action,
    title,
    description,
    confirmLabel = 'Delete',
    triggerLabel = 'Delete',
    disabled = false,
    disabledTitle,
}: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={disabled}
                    title={disabled ? disabledTitle : undefined}
                >
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
                <Form
                    action={action}
                    method="delete"
                    options={{
                        preserveScroll: true,
                        onSuccess: () => setOpen(false),
                    }}
                >
                    {({ processing }) => (
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={processing}>
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" variant="destructive" disabled={processing}>
                                {processing ? `${confirmLabel}…` : confirmLabel}
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
