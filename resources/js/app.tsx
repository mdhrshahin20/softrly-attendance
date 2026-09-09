import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import MarketingLayout from '@/layouts/marketing-layout';
import SettingsLayout from '@/layouts/settings/layout';
import WorkspaceSettingsLayout from '@/layouts/settings/workspace-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Softrly';

const workspaceSettingsPages = new Set([
    'settings/attendance',
    'settings/domains',
    'settings/api-tokens',
]);

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'pricing':
            case name.startsWith('marketing/'):
                return MarketingLayout;
            case name.startsWith('auth/'):
                return AuthLayout;
            case workspaceSettingsPages.has(name):
                return [AppLayout, WorkspaceSettingsLayout];
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4540B4',
    },
});

// This will set light / dark mode on load...
initializeTheme();
