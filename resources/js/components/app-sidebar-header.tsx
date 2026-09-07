import { Link, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { unreadNotifications, can } = usePage().props;
    const unread = Number(unreadNotifications ?? 0);
    const showNotifications = !can?.platform;

    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6 dark:border-border dark:bg-card">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            {showNotifications ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-9 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground"
                    asChild
                >
                    <Link href="/notifications" aria-label="Notifications">
                        <Bell className="size-4" />
                        {unread > 0 ? (
                            <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
                                {unread > 9 ? '9+' : unread}
                            </span>
                        ) : null}
                    </Link>
                </Button>
            ) : null}
        </header>
    );
}
