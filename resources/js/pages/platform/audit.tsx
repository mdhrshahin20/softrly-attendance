import { Head, router } from '@inertiajs/react';
import { ScrollText } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type LogRow = {
    id: number;
    action: string;
    tenant: string | null;
    tenant_id: number | null;
    user: string | null;
    user_email: string | null;
    entity: string | null;
    entity_id: number | null;
    ip_address: string | null;
    created_at: string | null;
};

type Props = {
    logs: Paginated<LogRow>;
    actions: string[];
    filters: { search: string | null; action: string | null };
};

export default function PlatformAudit({ logs, actions, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [action, setAction] = useState(filters.action ?? '');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/platform/audit',
            { search: search || undefined, action: action || undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Audit log" />
            <PageShell>
                <PageHeader
                    title="Audit log"
                    description="Every recorded action across tenants and the platform, newest first."
                />

                <Card>
                    <CardContent className="pt-6">
                        <form
                            onSubmit={submit}
                            className="flex flex-wrap items-end gap-3"
                        >
                            <div className="min-w-56 flex-1 space-y-1.5">
                                <label
                                    htmlFor="audit-search"
                                    className="text-sm font-medium"
                                >
                                    Search
                                </label>
                                <Input
                                    id="audit-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Action, user, or workspace"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="audit-action"
                                    className="text-sm font-medium"
                                >
                                    Action
                                </label>
                                <select
                                    id="audit-action"
                                    value={action}
                                    onChange={(event) =>
                                        setAction(event.target.value)
                                    }
                                    className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                                >
                                    <option value="">All actions</option>
                                    {actions.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button type="submit">Filter</Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="overflow-hidden rounded-xl border">
                    {logs.data.length === 0 ? (
                        <EmptyState
                            icon={ScrollText}
                            title="No audit entries"
                            description="Platform and tenant actions will appear here as they happen."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[840px] text-sm">
                                <thead className="bg-muted/40 text-left">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            When
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Action
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Actor
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Workspace
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Entity
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            IP
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.data.map((row) => (
                                        <tr key={row.id} className="border-t">
                                            <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                                                {row.created_at ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary">
                                                    {row.action}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">
                                                    {row.user ?? 'System'}
                                                </div>
                                                {row.user_email ? (
                                                    <div className="text-muted-foreground text-xs">
                                                        {row.user_email}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.tenant ?? 'Platform'}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3">
                                                {row.entity
                                                    ? `${row.entity}#${row.entity_id ?? ''}`
                                                    : '—'}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3">
                                                {row.ip_address ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <Pagination paginator={logs} />
            </PageShell>
        </>
    );
}

PlatformAudit.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Audit log', href: '/platform/audit' },
    ],
};
