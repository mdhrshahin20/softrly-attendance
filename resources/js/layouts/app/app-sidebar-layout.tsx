import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Link, usePage } from '@inertiajs/react';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { subscription, can } = usePage().props;
    const showBillingBanner = subscription && !subscription.is_access_active && !can?.platform;

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {showBillingBanner && (
                    <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        Your trial or subscription is not active. You can still view data, but check-in, leave, and other changes are paused.{' '}
                        {can?.manageBilling ? (
                            <Link href="/billing" className="font-medium underline">
                                Open billing
                            </Link>
                        ) : (
                            <span>Ask your company admin to renew billing.</span>
                        )}
                    </div>
                )}
                {children}
            </AppContent>
        </AppShell>
    );
}
