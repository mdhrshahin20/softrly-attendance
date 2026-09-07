import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    url: string | null;
    read_at: string | null;
    created_at: string | null;
};

export default function NotificationsIndex({ notifications }: { notifications: NotificationItem[] }) {
    return (
        <>
            <Head title="Notifications" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Notifications</h1>
                    <Form action="/notifications/read-all" method="post">
                        <Button type="submit" variant="outline" size="sm">Mark all read</Button>
                    </Form>
                </div>
                <div className="divide-y rounded-xl border">
                    {notifications.map((item) => (
                        <div key={item.id} className={`flex items-start justify-between gap-4 p-4 ${item.read_at ? '' : 'bg-muted/40'}`}>
                            <div>
                                <div className="font-medium">{item.title}</div>
                                <p className="text-muted-foreground mt-1 text-sm">{item.message}</p>
                                {item.url && (
                                    <Link href={item.url} className="mt-2 inline-block text-sm underline">
                                        Open
                                    </Link>
                                )}
                            </div>
                            {!item.read_at && (
                                <Form action={`/notifications/${item.id}/read`} method="post">
                                    <Button type="submit" variant="ghost" size="sm">Read</Button>
                                </Form>
                            )}
                        </div>
                    ))}
                    {notifications.length === 0 && (
                        <div className="text-muted-foreground p-6 text-sm">No notifications yet.</div>
                    )}
                </div>
            </div>
        </>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [{ title: 'Notifications', href: '/notifications' }],
};
