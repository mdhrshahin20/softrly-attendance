import { Form, Head, Link } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { Button } from '@/components/ui/button';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    url: string | null;
    read_at: string | null;
    created_at: string | null;
};

export default function NotificationsIndex({ notifications }: { notifications: Paginated<NotificationItem> }) {
    return (
        <>
            <Head title="Notifications" />
            <PageShell>
                <PageHeader
                    title="Notifications"
                    description="Approvals, attendance, and workspace updates."
                    actions={
                        <Form action="/notifications/read-all" method="post">
                            <Button type="submit" variant="outline" size="sm">
                                Mark all read
                            </Button>
                        </Form>
                    }
                />
                {notifications.data.length === 0 ? (
                    <div className="rounded-xl border">
                        <EmptyState
                            icon={Bell}
                            title="You're all caught up"
                            description="New leave and attendance notices will appear here."
                        />
                    </div>
                ) : (
                    <>
                    <div className="divide-y overflow-hidden rounded-xl border">
                        {notifications.data.map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-start justify-between gap-4 p-4 ${item.read_at ? '' : 'bg-primary/4'}`}
                            >
                                <div>
                                    <div className="font-medium">{item.title}</div>
                                    <p className="text-muted-foreground mt-1 text-sm">{item.message}</p>
                                    {item.url && (
                                        <Link href={item.url} className="text-primary mt-2 inline-block text-sm">
                                            Open
                                        </Link>
                                    )}
                                </div>
                                {!item.read_at && (
                                    <Form action={`/notifications/${item.id}/read`} method="post">
                                        <Button type="submit" variant="ghost" size="sm">
                                            Read
                                        </Button>
                                    </Form>
                                )}
                            </div>
                        ))}
                    </div>
                    <Pagination paginator={notifications} />
                    </>
                )}
            </PageShell>
        </>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [{ title: 'Notifications', href: '/notifications' }],
};
