import { Head, router } from '@inertiajs/react';
import { Pagination, type Paginated } from '@/components/pagination';
import { PersonIdentity } from '@/components/person-identity';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Log = {
    id: number;
    action: string;
    entity_type: string | null;
    entity_id: number | null;
    user_id: number | null;
    user?: { id: number; name: string; avatar?: string | null } | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string | null;
};

type PaginatedLogs = Paginated<Log>;

export default function AuditLogsIndex({
    logs,
    filters,
}: {
    logs: PaginatedLogs;
    filters: { action: string | null };
}) {
    return (
        <>
            <Head title="Audit log" />
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-lg font-semibold">Audit log</h2>
                    <p className="text-muted-foreground text-sm">Sensitive actions are recorded with actor, IP, and payload.</p>
                </div>
                <form
                    className="flex max-w-md gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        router.get('/settings/audit-logs', { action: String(data.get('action') ?? '') });
                    }}
                >
                    <Input name="action" defaultValue={filters.action ?? ''} placeholder="Filter action" />
                    <Button type="submit" variant="outline">
                        Filter
                    </Button>
                </form>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3">When</th>
                                <th className="px-4 py-3">Actor</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">Entity</th>
                                <th className="px-4 py-3">IP</th>
                                <th className="px-4 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.data.map((log) => (
                                <tr key={log.id} className="border-t align-top">
                                    <td className="px-4 py-3 whitespace-nowrap">{log.created_at}</td>
                                    <td className="px-4 py-3">
                                        {log.user ? (
                                            <PersonIdentity name={log.user.name} avatar={log.user.avatar} />
                                        ) : (
                                            <span className="text-muted-foreground">System</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium">{log.action}</td>
                                    <td className="px-4 py-3">
                                        {log.entity_type ?? '—'}
                                        {log.entity_id ? ` #${log.entity_id}` : ''}
                                    </td>
                                    <td className="px-4 py-3">{log.ip_address ?? '—'}</td>
                                    <td className="px-4 py-3 text-xs">
                                        {log.new_values ? JSON.stringify(log.new_values) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination paginator={logs} />
            </div>
        </>
    );
}

AuditLogsIndex.layout = {
    breadcrumbs: [
        { title: 'Settings', href: '/settings' },
        { title: 'Audit log', href: '/settings/audit-logs' },
    ],
};
