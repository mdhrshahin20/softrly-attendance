import { Form, Link } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import type { NotificationLevel } from '@/types/notifications';

const levelDot: Record<NotificationLevel, string> = {
    info: 'bg-sky-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
};

export function NotificationBell() {
    const { unread, items } = useNotifications();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground relative size-9"
                    aria-label="Notifications"
                >
                    <Bell className="size-4" />
                    {unread > 0 ? (
                        <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-medium">Notifications</span>
                    {unread > 0 ? (
                        <Form action="/notifications/read-all" method="post">
                            <button
                                type="submit"
                                className="text-muted-foreground hover:text-foreground text-xs"
                            >
                                Mark all read
                            </button>
                        </Form>
                    ) : null}
                </div>
                <DropdownMenuSeparator className="my-0" />
                <div className="max-h-80 overflow-y-auto">
                    {items.length === 0 ? (
                        <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                            You&apos;re all caught up.
                        </p>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className={`flex gap-3 border-b px-3 py-3 last:border-b-0 ${
                                    item.read_at ? '' : 'bg-primary/4'
                                }`}
                            >
                                <span
                                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                                        levelDot[item.level] ?? levelDot.info
                                    }`}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="truncate text-sm font-medium">
                                            {item.title}
                                        </span>
                                        {!item.read_at ? (
                                            <Form
                                                action={`/notifications/${item.id}/read`}
                                                method="post"
                                            >
                                                <button
                                                    type="submit"
                                                    className="text-muted-foreground hover:text-foreground shrink-0 text-xs"
                                                >
                                                    Mark read
                                                </button>
                                            </Form>
                                        ) : null}
                                    </div>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        {item.message}
                                    </p>
                                    {item.url ? (
                                        <Link
                                            href={item.url}
                                            className="text-primary mt-1 inline-block text-xs"
                                        >
                                            Open
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <DropdownMenuSeparator className="my-0" />
                <DropdownMenuItem asChild>
                    <Link
                        href="/notifications"
                        className="justify-center text-sm"
                    >
                        View all
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
