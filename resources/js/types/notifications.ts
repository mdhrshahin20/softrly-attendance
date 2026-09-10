export type NotificationLevel = 'info' | 'success' | 'warning' | 'danger';

export type AppNotification = {
    id: string;
    title: string;
    message: string;
    url: string | null;
    level: NotificationLevel;
    read_at: string | null;
    created_at: string | null;
};
