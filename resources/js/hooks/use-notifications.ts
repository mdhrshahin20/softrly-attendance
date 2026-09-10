import { router, usePage } from '@inertiajs/react';
import { useEchoNotification } from '@laravel/echo-react';
import { toast } from 'sonner';
import type { AppNotification, NotificationLevel } from '@/types/notifications';

type BroadcastPayload = {
    id: string;
    type: string;
    title?: string;
    message?: string;
    url?: string | null;
    level?: NotificationLevel;
};

export function useNotifications() {
    const { auth, recentNotifications, unreadNotifications } = usePage().props;
    const userId = auth?.user?.id;

    useEchoNotification<BroadcastPayload>(
        `App.Models.User.${userId}`,
        (payload) => {
            toast(payload.title ?? 'New notification', {
                description: payload.message,
                duration: 6000,
            });

            router.reload({
                only: ['recentNotifications', 'unreadNotifications'],
            });
        },
        [],
        [userId],
    );

    return {
        unread: Number(unreadNotifications ?? 0),
        items: (recentNotifications ?? []) as AppNotification[],
    };
}
