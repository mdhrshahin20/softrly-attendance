import { Form, Head, Link } from '@inertiajs/react';
import { FileText, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type LogFile = {
    name: string;
    size: number;
    modified_at: string | null;
};

type Props = {
    files: LogFile[];
    selected: string | null;
    lines: number;
    content: string;
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const lineOptions = [100, 300, 1000, 2000];

export default function PlatformLogs({
    files,
    selected,
    lines,
    content,
}: Props) {
    return (
        <>
            <Head title="System logs" />
            <PageShell>
                <PageHeader
                    title="System logs"
                    description="Tail the application log files in storage/logs."
                />

                <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                    <Card className="h-fit">
                        <CardContent className="p-2">
                            {files.length === 0 ? (
                                <p className="text-muted-foreground p-3 text-sm">
                                    No log files found.
                                </p>
                            ) : (
                                <ul className="space-y-1">
                                    {files.map((file) => (
                                        <li key={file.name}>
                                            <Link
                                                href={`/platform/logs?file=${encodeURIComponent(file.name)}&lines=${lines}`}
                                                className={cn(
                                                    'flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                                                    selected === file.name
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-muted',
                                                )}
                                            >
                                                <FileText className="mt-0.5 size-4 shrink-0" />
                                                <span className="min-w-0">
                                                    <span className="block truncate font-medium">
                                                        {file.name}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'block text-xs',
                                                            selected ===
                                                                file.name
                                                                ? 'text-primary-foreground/80'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {formatBytes(file.size)}{' '}
                                                        ·{' '}
                                                        {file.modified_at ??
                                                            '—'}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardContent className="space-y-3 p-4">
                            {selected === null ? (
                                <EmptyState
                                    icon={FileText}
                                    title="No log selected"
                                    description="Pick a log file to see its most recent lines."
                                />
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-1">
                                            {lineOptions.map((option) => (
                                                <Link
                                                    key={option}
                                                    href={`/platform/logs?file=${encodeURIComponent(selected)}&lines=${option}`}
                                                    className={cn(
                                                        'rounded-md px-2.5 py-1 text-xs transition-colors',
                                                        lines === option
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'text-muted-foreground hover:bg-muted',
                                                    )}
                                                >
                                                    {option}
                                                </Link>
                                            ))}
                                        </div>
                                        <Form
                                            action={`/platform/logs/${encodeURIComponent(selected)}`}
                                            method="delete"
                                        >
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Trash2 className="size-3.5" />
                                                Delete file
                                            </Button>
                                        </Form>
                                    </div>
                                    <pre className="bg-muted/40 max-h-[60vh] overflow-auto rounded-lg border p-3 text-xs leading-5">
                                        {content || 'This log file is empty.'}
                                    </pre>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </PageShell>
        </>
    );
}

PlatformLogs.layout = {
    breadcrumbs: [
        { title: 'Platform', href: '/platform' },
        { title: 'System logs', href: '/platform/logs' },
    ],
};
