import {
    Banknote,
    BarChart3,
    Bell,
    Building2,
    CalendarDays,
    CalendarOff,
    ClipboardList,
    Clock3,
    CreditCard,
    FileSpreadsheet,
    FileText,
    Fingerprint,
    Globe,
    HardDrive,
    Inbox,
    KeyRound,
    Layers3,
    LayoutGrid,
    Mail,
    MapPin,
    Megaphone,
    Network,
    Palmtree,
    Plug,
    Receipt,
    ScanFace,
    ScrollText,
    Shield,
    Users,
    Wrench,
} from 'lucide-react';
import { dashboard } from '@/routes';
import type { NavGroup, NavItem } from '@/types';

export type NavContext = {
    can?: Record<string, boolean>;
    unreadNotifications?: number;
    isPlatform: boolean;
};

function navGroup(
    title: string,
    items: Array<NavItem | false | undefined>,
): NavGroup | null {
    const visible = items.filter((item): item is NavItem => Boolean(item));

    return visible.length > 0 ? { title, items: visible } : null;
}

export function buildNavGroups({
    can,
    unreadNotifications,
    isPlatform,
}: NavContext) {
    const unread = Number(unreadNotifications ?? 0);

    return [
        navGroup('Overview', [
            {
                title: 'Dashboard',
                href: isPlatform ? '/platform' : dashboard(),
                icon: LayoutGrid,
                match: 'exact',
            },
            {
                title: 'Notifications',
                href: '/notifications',
                icon: Bell,
                badge: unread > 0 ? unread : undefined,
            },
        ]),
        !isPlatform
            ? navGroup('My attendance', [
                  {
                      title: 'Calendar',
                      href: '/attendance/calendar',
                      icon: CalendarDays,
                  },
                  {
                      title: 'My leave',
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
                      title: 'Face verification',
                      href: '/face',
                      icon: ScanFace,
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
              ])
            : null,
        !isPlatform
            ? navGroup('Leave', [
                  can?.viewLeaveApplications && {
                      title: 'Applications',
                      href: '/leave/applications',
                      icon: ClipboardList,
                  },
                  can?.approveLeave && {
                      title: 'Approvals',
                      href: '/leave/approvals',
                      icon: Inbox,
                  },
                  can?.manageLeave && {
                      title: 'Leave types',
                      href: '/leave/types',
                      icon: Palmtree,
                  },
              ])
            : null,
        !isPlatform
            ? navGroup('Locations & shifts', [
                  can?.manageOffices && {
                      title: 'Offices & Wi-Fi',
                      href: '/offices',
                      icon: Building2,
                  },
                  can?.manageShifts && {
                      title: 'Shifts',
                      href: '/shifts',
                      icon: Clock3,
                  },
              ])
            : null,
        !isPlatform
            ? navGroup('Payroll', [
                  can?.managePayroll && {
                      title: 'Salaries',
                      href: '/payroll/salaries',
                      icon: Banknote,
                  },
                  can?.viewPayroll && {
                      title: 'Payroll runs',
                      href: '/payroll/runs',
                      icon: FileSpreadsheet,
                  },
                  can?.viewPayroll && {
                      title: 'Advances',
                      href: '/payroll/advances',
                      icon: Receipt,
                  },
                  can?.viewPayroll && {
                      title: 'Salary report',
                      href: '/reports/salary',
                      icon: FileSpreadsheet,
                  },
                  can?.viewPayslips && {
                      title: 'My payslips',
                      href: '/payroll/me',
                      icon: CreditCard,
                  },
              ])
            : null,
        !isPlatform
            ? navGroup('Reports', [
                  can?.viewReports && {
                      title: 'Attendance log',
                      href: '/reports/attendance',
                      icon: Network,
                  },
                  can?.advancedReports && {
                      title: 'Advanced analytics',
                      href: '/reports/advanced',
                      icon: BarChart3,
                  },
              ])
            : null,
        !isPlatform
            ? navGroup('Settings', [
                  can?.manageSettings && {
                      title: 'Attendance mode',
                      href: '/settings/attendance',
                      icon: MapPin,
                  },
                  can?.manageSettings && {
                      title: 'Working days',
                      href: '/working-days',
                      icon: CalendarDays,
                  },
                  can?.manageRoles && {
                      title: 'Roles',
                      href: '/roles',
                      icon: Shield,
                  },
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
            ? navGroup('Customers', [
                  {
                      title: 'Tenants',
                      href: '/platform/tenants',
                      icon: Building2,
                  },
              ])
            : null,
        isPlatform
            ? navGroup('Billing', [
                  {
                      title: 'Plans',
                      href: '/platform/plans',
                      icon: ClipboardList,
                  },
                  {
                      title: 'Invoices',
                      href: '/platform/invoices',
                      icon: Receipt,
                  },
                  {
                      title: 'Payments',
                      href: '/platform/payments',
                      icon: CreditCard,
                  },
                  {
                      title: 'Billing emails',
                      href: '/platform/settings/billing',
                      icon: Mail,
                  },
              ])
            : null,
        isPlatform
            ? navGroup('Growth', [
                  {
                      title: 'Reports',
                      href: '/platform/reports',
                      icon: BarChart3,
                  },
                  {
                      title: 'Leads',
                      href: '/platform/leads',
                      icon: Inbox,
                  },
                  {
                      title: 'Marketing',
                      href: '/platform/marketing',
                      icon: Megaphone,
                  },
              ])
            : null,
        isPlatform
            ? navGroup('Integrations', [
                  {
                      title: 'Gateways',
                      href: '/platform/gateways',
                      icon: Plug,
                  },
              ])
            : null,
        isPlatform
            ? navGroup('Operations', [
                  {
                      title: 'Audit log',
                      href: '/platform/audit',
                      icon: ScrollText,
                  },
                  {
                      title: 'System logs',
                      href: '/platform/logs',
                      icon: FileText,
                  },
                  {
                      title: 'Maintenance',
                      href: '/platform/maintenance',
                      icon: Wrench,
                  },
                  {
                      title: 'Backups',
                      href: '/platform/backups',
                      icon: HardDrive,
                  },
              ])
            : null,
    ].filter((group): group is NavGroup => group !== null);
}
