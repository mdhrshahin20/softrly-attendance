import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Building2,
    CalendarDays,
    CalendarOff,
    ClipboardList,
    Clock3,
    CreditCard,
    FileSpreadsheet,
    Fingerprint,
    Globe,
    Inbox,
    KeyRound,
    Layers3,
    LayoutGrid,
    MapPin,
    Network,
    Palmtree,
    Receipt,
    ScrollText,
    Shield,
    UserRound,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavGroup, NavItem } from '@/types';

function navGroup(
    title: string,
    items: Array<NavItem | false | undefined>,
): NavGroup | null {
    const visible = items.filter((item): item is NavItem => Boolean(item));

    return visible.length > 0 ? { title, items: visible } : null;
}

export function AppSidebar() {
    const { can, unreadNotifications } = usePage().props;
    const isPlatform = Boolean(can?.platform);
    const unread = Number(unreadNotifications ?? 0);

    const groups = [
        navGroup('Overview', [
            {
                title: 'Dashboard',
                href: isPlatform ? '/platform' : dashboard(),
                icon: LayoutGrid,
                match: 'exact',
            },
        ]),
        !isPlatform
            ? navGroup('My work', [
                  {
                      title: 'Calendar',
                      href: '/attendance/calendar',
                      icon: CalendarDays,
                  },
                  {
                      title: 'Leave',
                      href: '/leave',
                      icon: Palmtree,
                      match: 'exact',
                  },
                  {
                      title: 'Holidays',
                      href: '/holidays',
                      icon: CalendarOff,
                  },
                  {
                      title: 'Devices',
                      href: '/devices',
                      icon: Fingerprint,
                  },
                  {
                      title: 'Notifications',
                      href: '/notifications',
                      icon: Bell,
                      badge: unread > 0 ? unread : undefined,
                  },
              ])
            : null,
        !isPlatform
            ? navGroup('People', [
                  can?.manageEmployees && {
                      title: 'Employees',
                      href: '/employees',
                      icon: Users,
                  },
                  can?.manageDepartments && {
                      title: 'Departments',
                      href: '/departments',
                      icon: Layers3,
                  },
                  can?.manageDesignations && {
                      title: 'Designations',
                      href: '/designations',
                      icon: ClipboardList,
                  },
                  can?.manageRoles && {
                      title: 'Roles',
                      href: '/roles',
                      icon: Shield,
                  },
              ])
            : null,
        !isPlatform
            ? navGroup('Attendance', [
                  can?.manageOffices && {
                      title: 'Offices & networks',
                      href: '/offices',
                      icon: Building2,
                  },
                  can?.manageShifts && {
                      title: 'Shifts',
                      href: '/shifts',
                      icon: Clock3,
                  },
                  can?.manageSettings && {
                      title: 'Working days',
                      href: '/working-days',
                      icon: CalendarDays,
                  },
                  can?.manageSettings && {
                      title: 'Attendance mode',
                      href: '/settings/attendance',
                      icon: MapPin,
                  },
              ])
            : null,
        !isPlatform
            ? navGroup('Leave management', [
                  can?.approveLeave && {
                      title: 'Approvals',
                      href: '/leave/approvals',
                      icon: Inbox,
                  },
                  can?.manageLeave && {
                      title: 'Leave types',
                      href: '/leave/types',
                      icon: ClipboardList,
                  },
              ])
            : null,
        !isPlatform
            ? navGroup('Reports', [
                  can?.viewReports && {
                      title: 'Attendance',
                      href: '/reports/attendance',
                      icon: Network,
                  },
                  can?.advancedReports && {
                      title: 'Advanced',
                      href: '/reports/advanced',
                      icon: FileSpreadsheet,
                  },
              ])
            : null,
        !isPlatform
            ? navGroup('Workspace', [
                  can?.manageBilling && {
                      title: 'Billing',
                      href: '/billing',
                      icon: CreditCard,
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
                  can?.viewAudit && {
                      title: 'Audit log',
                      href: '/audit-logs',
                      icon: ScrollText,
                  },
              ])
            : null,
        isPlatform
            ? navGroup('Platform', [
                  {
                      title: 'Tenants',
                      href: '/platform/tenants',
                      icon: Shield,
                  },
                  {
                      title: 'Plans',
                      href: '/platform/plans',
                      icon: ClipboardList,
                  },
                  {
                      title: 'Payments',
                      href: '/platform/payments',
                      icon: Receipt,
                  },
                  {
                      title: 'Leads',
                      href: '/platform/leads',
                      icon: Inbox,
                  },
              ])
            : null,
    ].filter((group): group is NavGroup => group !== null);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={isPlatform ? '/platform' : dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={groups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter
                    items={[
                        {
                            title: 'Profile',
                            href: '/settings/profile',
                            icon: UserRound,
                        },
                    ]}
                    className="mt-auto"
                />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
