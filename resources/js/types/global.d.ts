import type { Auth } from '@/types/auth';
import type { AppNotification } from '@/types/notifications';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            tenant?: {
                id: number;
                name: string;
                slug: string;
                status: string;
                timezone: string;
            } | null;
            employee?: {
                id: number;
                full_name: string;
                employee_code: string;
                avatar?: string | null;
            } | null;
            can?: Record<string, boolean>;
            face?: {
                required: boolean;
                enrolled: boolean;
                threshold: number;
            };
            unreadNotifications?: number;
            recentNotifications?: AppNotification[];
            [key: string]: unknown;
        };
    }
}
