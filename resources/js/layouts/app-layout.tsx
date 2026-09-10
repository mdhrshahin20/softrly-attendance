import { usePage } from '@inertiajs/react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { setDefaultTimeZone } from '@/lib/timezone';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    // Records the workspace timezone so times render in the office's zone rather
    // than whatever zone the device happens to be in.
    const { tenant } = usePage().props;
    setDefaultTimeZone(tenant?.timezone);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}
