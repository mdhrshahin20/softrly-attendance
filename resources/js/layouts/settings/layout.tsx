import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Clock3,
    CreditCard,
    Globe,
    KeyRound,
    MapPin,
    Palette,
    ScrollText,
    Shield,
    ShieldCheck,
    UserRound,
    type LucideIcon,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

type SettingsItem = {
    title: string;
    href: string;
    icon: LucideIcon;
};

type SettingsSection = {
    title: string;
    items: SettingsItem[];
};

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { can } = usePage().props;
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const sections: SettingsSection[] = [
        {
            title: 'Account',
            items: [
                { title: 'Profile', href: toUrl(edit()), icon: UserRound },
                {
                    title: 'Security',
                    href: toUrl(editSecurity()),
                    icon: ShieldCheck,
                },
                {
                    title: 'Appearance',
                    href: toUrl(editAppearance()),
                    icon: Palette,
                },
            ],
        },
        {
            title: 'Workspace',
            items: [
                can?.manageSettings && {
                    title: 'Attendance mode',
                    href: '/settings/attendance',
                    icon: MapPin,
                },
                can?.manageSettings && {
                    title: 'Time zone',
                    href: '/settings/timezone',
                    icon: Clock3,
                },
                can?.manageSettings && {
                    title: 'Working days',
                    href: '/settings/working-days',
                    icon: CalendarDays,
                },
                can?.manageRoles && {
                    title: 'Roles',
                    href: '/settings/roles',
                    icon: Shield,
                },
                can?.customDomain && {
                    title: 'Custom domain',
                    href: '/settings/domains',
                    icon: Globe,
                },
                can?.apiAccess && {
                    title: 'API tokens',
                    href: '/settings/api-tokens',
                    icon: KeyRound,
                },
            ].filter((item): item is SettingsItem => Boolean(item)),
        },
        {
            title: 'Billing & audit',
            items: [
                can?.manageBilling && {
                    title: 'Plan & invoices',
                    href: '/settings/billing',
                    icon: CreditCard,
                },
                can?.viewAudit && {
                    title: 'Audit log',
                    href: '/settings/audit-logs',
                    icon: ScrollText,
                },
            ].filter((item): item is SettingsItem => Boolean(item)),
        },
    ].filter((section) => section.items.length > 0);

    return (
        <div className="px-4 py-6 lg:px-8">
            <Heading
                title="Settings"
                description="Manage your account and this company workspace"
            />

            <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:gap-12">
                <aside className="lg:w-56 lg:shrink-0">
                    <div className="flex flex-col gap-5">
                        {sections.map((section) => (
                            <div key={section.title}>
                                <p className="text-muted-foreground mb-1.5 px-3 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                                    {section.title}
                                </p>
                                <nav
                                    className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:space-y-1"
                                    aria-label={`${section.title} settings`}
                                >
                                    {section.items.map((item) => {
                                        const active = isCurrentOrParentUrl(
                                            item.href,
                                        );

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
                                                    <item.icon className="size-4" />
                                                    {item.title}
                                                </Link>
                                            </Button>
                                        );
                                    })}
                                </nav>
                            </div>
                        ))}
                    </div>
                </aside>

                <Separator className="lg:hidden" />

                <div className="min-w-0 flex-1">
                    <section className="w-full max-w-5xl space-y-8">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
