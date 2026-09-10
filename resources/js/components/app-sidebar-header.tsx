import { Link, usePage } from '@inertiajs/react';
import {
    CircleHelp,
    CreditCard,
    LogOut,
    Settings,
    UserRound,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CommandTrigger } from '@/components/command-menu';
import { NotificationBell } from '@/components/notification-bell';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { logout } from '@/routes';
import { edit as editProfile } from '@/routes/profile';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { can, auth } = usePage().props;
    const showBilling = Boolean(can?.manageBilling) && !can?.platform;

    return (
        <header className="bg-background/90 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-1.5">
                <CommandTrigger />

                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground size-9"
                    asChild
                >
                    <Link href="/contact" aria-label="Help" title="Help">
                        <CircleHelp className="size-4" />
                    </Link>
                </Button>

                {auth.user ? <NotificationBell /> : null}

                {auth.user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-9 gap-2 px-1.5 sm:px-2"
                                aria-label="Account menu"
                            >
                                <UserInfo user={auth.user} compact />
                                <span className="hidden max-w-[140px] truncate text-sm font-medium sm:inline">
                                    {auth.user.name}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">
                                        {auth.user.name}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        {auth.user.email}
                                    </span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={editProfile()}>
                                    <UserRound className="mr-2 size-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings/security">
                                    <Settings className="mr-2 size-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            {showBilling ? (
                                <DropdownMenuItem asChild>
                                    <Link href="/billing">
                                        <CreditCard className="mr-2 size-4" />
                                        Billing
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    href={logout()}
                                    method="post"
                                    as="button"
                                    className="w-full"
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Log out
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </div>
        </header>
    );
}
