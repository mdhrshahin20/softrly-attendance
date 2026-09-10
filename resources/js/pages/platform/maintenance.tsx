import { Form, Head } from '@inertiajs/react';
import {
    Activity,
    Database,
    HardDrive,
    ListChecks,
    Server,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Status = {
    app: {
        name: string;
        environment: string;
        debug: boolean;
        maintenance: boolean;
        laravel: string;
        php: string;
    };
    database: {
        connection: string;
        reachable: boolean;
        pending_migrations: number;
    };
    cache: { store: string; writable: boolean };
    queue: { connection: string; pending: number; failed: number };
    storage: {
        disk: string;
        logs_bytes: number;
        free_bytes: number;
        total_bytes: number;
    };
    schedule: {
        command: string;
        expression: string;
        next_run: string | null;
    }[];
};

type Props = {
    status: Status;
    actions: {
        name: string;
        label: string;
        description: string;
        dangerous: boolean;
    }[];
    result: {
        action: string;
        command: string;
        exit_code: number;
        output: string;
    } | null;
};

function formatBytes(bytes: number): string {
    if (bytes <= 0) {
        return '—';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(
        units.length - 1,
        Math.floor(Math.log(bytes) / Math.log(1024)),
    );

    return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}

function Ok({ value }: { value: boolean }) {
    return (
        <span className={value ? 'text-emerald-600' : 'text-red-600'}>
            {value ? 'Healthy' : 'Unavailable'}
        </span>
    );
}

function ConfirmAction({
    action,
}: {
    action: { name: string; label: string; description: string };
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    Run
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Run “{action.label}”?</DialogTitle>
                <DialogDescription>
                    {action.description} Make sure you have a recent full backup before continuing.
                </DialogDescription>
                <Form
                    action="/platform/maintenance/run"
                    method="post"
                    options={{ preserveScroll: true, onSuccess: () => setOpen(false) }}
                >
                    {({ processing }) => (
                        <>
                            <input type="hidden" name="action" value={action.name} />
                            <input type="hidden" name="confirm" value="1" />
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary" disabled={processing}>
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" variant="destructive" disabled={processing}>
                                    {processing ? 'Running…' : 'Yes, run it'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function PlatformMaintenance({
    status,
    actions,
    result,
}: Props) {
    const usedPercent =
        status.storage.total_bytes > 0
            ? Math.round(
                  ((status.storage.total_bytes - status.storage.free_bytes) /
                      status.storage.total_bytes) *
                      100,
              )
            : 0;

    return (
        <>
            <Head title="Maintenance" />
            <PageShell>
                <PageHeader
                    title="Maintenance"
                    description="System diagnostics and safe cache, queue, and storage maintenance."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                                <Server className="size-4" /> Application
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Row
                                label="Environment"
                                value={status.app.environment}
                            />
                            <Row label="Laravel" value={status.app.laravel} />
                            <Row label="PHP" value={status.app.php} />
                            <Row
                                label="Mode"
                                value={
                                    status.app.maintenance ? (
                                        <Badge variant="destructive">
                                            Maintenance
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">Live</Badge>
                                    )
                                }
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                                <Database className="size-4" /> Database
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Row
                                label="Connection"
                                value={status.database.connection}
                            />
                            <Row
                                label="Status"
                                value={<Ok value={status.database.reachable} />}
                            />
                            <Row
                                label="Pending migrations"
                                value={status.database.pending_migrations}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                                <Zap className="size-4" /> Cache & queue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Row
                                label="Cache store"
                                value={status.cache.store}
                            />
                            <Row
                                label="Cache writable"
                                value={<Ok value={status.cache.writable} />}
                            />
                            <Row
                                label="Queue"
                                value={status.queue.connection}
                            />
                            <Row
                                label="Pending jobs"
                                value={status.queue.pending}
                            />
                            <Row
                                label="Failed jobs"
                                value={
                                    <span
                                        className={
                                            status.queue.failed > 0
                                                ? 'text-red-600'
                                                : ''
                                        }
                                    >
                                        {status.queue.failed}
                                    </span>
                                }
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                                <HardDrive className="size-4" /> Storage
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Row label="Disk" value={status.storage.disk} />
                            <Row
                                label="Log files"
                                value={formatBytes(status.storage.logs_bytes)}
                            />
                            <Row
                                label="Free"
                                value={formatBytes(status.storage.free_bytes)}
                            />
                            <Row label="Used" value={`${usedPercent}%`} />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="size-4" /> Safe actions
                            </CardTitle>
                            <CardDescription>
                                These run artisan commands on the server. “Careful” actions require
                                confirmation and are not reversible from this screen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {actions.map((action) => (
                                <div
                                    key={action.name}
                                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            {action.label}
                                            {action.dangerous ? (
                                                <Badge variant="destructive">
                                                    Careful
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-xs leading-5">
                                            {action.description}
                                        </p>
                                    </div>
                                    {action.dangerous ? (
                                        <ConfirmAction action={action} />
                                    ) : (
                                        <Form
                                            action="/platform/maintenance/run"
                                            method="post"
                                        >
                                            <input
                                                type="hidden"
                                                name="action"
                                                value={action.name}
                                            />
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                size="sm"
                                            >
                                                Run
                                            </Button>
                                        </Form>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ListChecks className="size-4" /> Scheduled
                                    tasks
                                </CardTitle>
                                <CardDescription>
                                    Read from the application schedule
                                    definition.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {status.schedule.length === 0 ? (
                                    <p className="text-muted-foreground">
                                        No scheduled tasks registered.
                                    </p>
                                ) : (
                                    status.schedule.map((task) => (
                                        <div
                                            key={`${task.command}-${task.expression}`}
                                            className="flex items-start justify-between gap-3"
                                        >
                                            <span className="font-mono text-xs">
                                                {task.command}
                                            </span>
                                            <span className="text-muted-foreground shrink-0 text-xs">
                                                {task.next_run ??
                                                    task.expression}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {result ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-mono text-sm">
                                        {result.command}
                                    </CardTitle>
                                    <CardDescription>
                                        Exit code {result.exit_code}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <pre
                                        className={cn(
                                            'max-h-64 overflow-auto rounded-lg border p-3 text-xs leading-5',
                                            result.exit_code === 0
                                                ? 'bg-muted/40'
                                                : 'bg-red-50 text-red-900',
                                        )}
                                    >
                                        {result.output ||
                                            'Command produced no output.'}
                                    </pre>
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </div>
            </PageShell>
        </>
    );
}

PlatformMaintenance.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'Maintenance', href: '/platform/maintenance' },
    ],
};
