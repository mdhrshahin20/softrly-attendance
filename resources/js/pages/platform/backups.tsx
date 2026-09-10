import { Form, Head } from '@inertiajs/react';
import { Database, Download, HardDriveDownload, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type BackupRow = {
    id: number;
    type: string;
    tenant: string | null;
    tenant_id: number | null;
    status: string;
    filename: string;
    size_bytes: number;
    table_count: number;
    row_count: number;
    file_count: number;
    error: string | null;
    created_by: string | null;
    completed_at: string | null;
    created_at: string | null;
    exists: boolean;
};

type Props = {
    backups: Paginated<BackupRow>;
    tenants: { id: number; name: string }[];
};

function formatBytes(bytes: number): string {
    if (bytes <= 0) {
        return '—';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));

    return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
}

function DeleteBackup({ backup }: { backup: BackupRow }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                    <Trash2 className="size-3.5" />
                    Delete
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Delete this backup?</DialogTitle>
                <DialogDescription>
                    {backup.filename} will be permanently removed from the server. This cannot be
                    undone.
                </DialogDescription>
                <Form
                    action={`/platform/backups/${backup.id}`}
                    method="delete"
                    options={{ preserveScroll: true, onSuccess: () => setOpen(false) }}
                >
                    {({ processing }) => (
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={processing}>
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" variant="destructive" disabled={processing}>
                                {processing ? 'Deleting…' : 'Delete backup'}
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function PlatformBackups({ backups, tenants }: Props) {
    const [tenantId, setTenantId] = useState('');

    return (
        <>
            <Head title="Backups" />
            <PageShell>
                <PageHeader
                    title="Backups"
                    description="Portable SQL dumps written with PDO — no mysqldump binary required."
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HardDriveDownload className="size-4" /> Full site backup
                            </CardTitle>
                            <CardDescription>
                                Every application table (schema + data) plus files under{' '}
                                <code>storage/app/public</code>. Session, cache, queue and migration
                                tables are excluded.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form action="/platform/backups/full" method="post">
                                {({ processing }) => (
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Building archive…' : 'Create full backup'}
                                    </Button>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="size-4" /> Single workspace backup
                            </CardTitle>
                            <CardDescription>
                                Only the selected workspace's rows across all tenant tables. Uploaded
                                files are not tenant-mapped, so they are excluded here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action={
                                    tenantId ? `/platform/backups/tenant/${tenantId}` : '#'
                                }
                                method="post"
                                className="space-y-3"
                            >
                                <div className="space-y-1.5">
                                    <Label htmlFor="backup-tenant">Workspace</Label>
                                    <select
                                        id="backup-tenant"
                                        value={tenantId}
                                        onChange={(event) => setTenantId(event.target.value)}
                                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                    >
                                        <option value="">Select a workspace</option>
                                        {tenants.map((tenant) => (
                                            <option key={tenant.id} value={tenant.id}>
                                                {tenant.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button type="submit" variant="outline" disabled={!tenantId}>
                                    Create workspace backup
                                </Button>
                            </Form>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-muted/20">
                    <CardContent className="pt-6 text-sm">
                        <p className="font-medium">Restoring is a manual, server-side step.</p>
                        <p className="text-muted-foreground mt-1 leading-6">
                            This platform runs all tenants in one shared database, so restoring from
                            the browser could overwrite or clash with other tenants' rows. Download
                            the archive and import it deliberately:
                        </p>
                        <pre className="bg-background mt-2 overflow-x-auto rounded-lg border p-3 text-xs">
                            {`unzip attendrly-full-*.zip -d restore/\nmysql -u USER -p DB_NAME < restore/database.sql`}
                        </pre>
                    </CardContent>
                </Card>

                <div className="overflow-hidden rounded-xl border">
                    {backups.data.length === 0 ? (
                        <EmptyState
                            icon={HardDriveDownload}
                            title="No backups yet"
                            description="Create a full site backup or a per-workspace backup to get started."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead className="bg-muted/40 text-left">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Archive</th>
                                        <th className="px-4 py-3 font-medium">Scope</th>
                                        <th className="px-4 py-3 font-medium">Contents</th>
                                        <th className="px-4 py-3 font-medium">Size</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backups.data.map((backup) => (
                                        <tr key={backup.id} className="border-t align-top">
                                            <td className="px-4 py-3">
                                                <div className="font-mono text-xs">
                                                    {backup.filename}
                                                </div>
                                                <div className="text-muted-foreground mt-0.5 text-xs">
                                                    {backup.completed_at ??
                                                        backup.created_at ??
                                                        '—'}
                                                    {backup.created_by
                                                        ? ` · ${backup.created_by}`
                                                        : ''}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {backup.type === 'full'
                                                    ? 'Full site'
                                                    : (backup.tenant ?? 'Workspace')}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3 text-xs">
                                                {backup.table_count} tables ·{' '}
                                                {backup.row_count.toLocaleString()} rows
                                                {backup.file_count > 0
                                                    ? ` · ${backup.file_count} files`
                                                    : ''}
                                            </td>
                                            <td className="px-4 py-3">
                                                {formatBytes(backup.size_bytes)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={backup.status} />
                                                {backup.error ? (
                                                    <p className="mt-1 max-w-56 text-xs text-red-600">
                                                        {backup.error}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap items-center gap-1">
                                                    {backup.exists ? (
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a
                                                                href={`/platform/backups/${backup.id}/download`}
                                                            >
                                                                <Download className="size-3.5" />
                                                                Download
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">
                                                            File missing
                                                        </span>
                                                    )}
                                                    <DeleteBackup backup={backup} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <Pagination paginator={backups} />
            </PageShell>
        </>
    );
}

PlatformBackups.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Backups', href: '/platform/backups' },
    ],
};
