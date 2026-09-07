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
    LayoutDashboard,
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
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { can, unreadNotifications } = usePage().props;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'My Calendar',
            href: '/attendance/calendar',
            icon: CalendarDays,
        },
        {
            title: 'Leave',
            href: '/leave',
            icon: Palmtree,
        },
        {
            title: 'Holidays',
            href: '/holidays',
            icon: CalendarOff,
        },
        {
            title: unreadNotifications ? `Notifications (${unreadNotifications})` : 'Notifications',
            href: '/notifications',
            icon: Bell,
        },
    ];

    if (can?.manageEmployees) {
        mainNavItems.push({
            title: 'Employees',
            href: '/employees',
            icon: Users,
        });
    }

    if (can?.approveLeave) {
        mainNavItems.push({
            title: 'Leave approvals',
            href: '/leave/approvals',
            icon: Inbox,
        });
    }

    if (can?.manageLeave) {
        mainNavItems.push({
            title: 'Leave types',
            href: '/leave/types',
            icon: ClipboardList,
        });
    }

    if (can?.manageDepartments) {
        mainNavItems.push({
            title: 'Departments',
            href: '/departments',
            icon: Layers3,
        });
    }

    if (can?.manageDesignations) {
        mainNavItems.push({
            title: 'Designations',
            href: '/designations',
            icon: ClipboardList,
        });
    }

    if (can?.manageOffices) {
        mainNavItems.push({
            title: 'Offices & Networks',
            href: '/offices',
            icon: Building2,
        });
    }

    if (can?.manageShifts) {
        mainNavItems.push({
            title: 'Shifts',
            href: '/shifts',
            icon: Clock3,
        });
    }

    if (can?.manageSettings) {
        mainNavItems.push({
            title: 'Working days',
            href: '/working-days',
            icon: CalendarDays,
        });
        mainNavItems.push({
            title: 'Attendance mode',
            href: '/settings/attendance',
            icon: MapPin,
        });
    }

    mainNavItems.push({
        title: 'Devices',
        href: '/devices',
        icon: Fingerprint,
    });

    if (can?.manageRoles) {
        mainNavItems.push({
            title: 'Roles',
            href: '/roles',
            icon: Shield,
        });
    }

    if (can?.viewAudit) {
        mainNavItems.push({
            title: 'Audit log',
            href: '/audit-logs',
            icon: ScrollText,
        });
    }

    if (can?.customDomain) {
        mainNavItems.push({
            title: 'Custom domain',
            href: '/settings/domains',
            icon: Globe,
        });
    }

    if (can?.apiAccess) {
        mainNavItems.push({
            title: 'API tokens',
            href: '/settings/api-tokens',
            icon: KeyRound,
        });
    }

    if (can?.manageBilling) {
        mainNavItems.push({
            title: 'Billing',
            href: '/billing',
            icon: CreditCard,
        });
    }

    if (can?.viewReports) {
        mainNavItems.push({
            title: 'Attendance Reports',
            href: '/reports/attendance',
            icon: Network,
        });
    }

    if (can?.advancedReports) {
        mainNavItems.push({
            title: 'Advanced reports',
            href: '/reports/advanced',
            icon: FileSpreadsheet,
        });
    }

    if (can?.platform) {
        mainNavItems.push(
            {
                title: 'Platform',
                href: '/platform',
                icon: LayoutDashboard,
            },
            {
                title: 'Platform Tenants',
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
        );
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
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
