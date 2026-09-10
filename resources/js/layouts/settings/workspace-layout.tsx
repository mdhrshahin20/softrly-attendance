import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, Clock3, Globe, KeyRound, MapPin, UserRound, type LucideIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editProfile } from '@/routes/profile';

type SettingsItem = { title: string; href: string; icon: LucideIcon };

export default function WorkspaceSettingsLayout({ children }: PropsWithChildren) {
    const { can } = usePage().props;
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const entries: Array<SettingsItem & { gate?: boolean }> = [
        { gate: can?.manageSettings, title: 'Attendance mode', href: '/settings/attendance', icon: MapPin },
        { gate: can?.manageSettings, title: 'Time zone', href: '/settings/timezone', icon: Clock3 },
        { gate: can?.manageSettings, title: 'Working days', href: '/working-days', icon: CalendarDays },
        { gate: can?.customDomain, title: 'Custom domain', href: '/settings/domains', icon: Globe },
        { gate: can?.apiAccess, title: 'API tokens', href: '/settings/api-tokens', icon: KeyRound },
    ];

    const items: SettingsItem[] = entries.filter((entry) => entry.gate);

    return (
        <div className="px-4 py-6 lg:px-8">
            <Heading
                title="Workspace settings"
                description="Attendance rules, working days and workspace configuration"
            />

            <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:gap-12">
                <aside className="lg:w-52 lg:shrink-0">
                    <nav
                        className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:space-y-1"
                        aria-label="Workspace settings"
                    >
                        {items.map((item) => {
                            const active = isCurrentOrParentUrl(item.href);

                            return (
                                <Button
                                    key={toUrl(item.href)}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'h-9 shrink-0 justify-start rounded-md text-sm font-medium',
                                        active
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <Link href={item.href}>
                                        {item.icon && <item.icon className="size-4" />}
                                        {item.title}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>

                    <Separator className="my-4 hidden lg:block" />

                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-muted-foreground hover:text-foreground hidden h-9 justify-start rounded-md font-medium lg:flex"
                    >
                        <Link href={editProfile()}>
                            <UserRound className="size-4" />
                            Account settings
                        </Link>
                    </Button>
                </aside>

                <Separator className="lg:hidden" />

                <div className="min-w-0 flex-1">
                    <section className="mx-auto max-w-3xl space-y-8">{children}</section>
                </div>
            </div>
        </div>
    );
}
