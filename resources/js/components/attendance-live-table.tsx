import { ArrowUpDown, ChevronDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DetailDrawer } from '@/components/detail-drawer';
import { EmptyState } from '@/components/empty-state';
import { PersonIdentity } from '@/components/person-identity';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export type LiveRow = {
    id: number;
    full_name: string;
    avatar?: string | null;
    employee_code?: string | null;
    department?: string | null;
    office?: string | null;
    check_in_at?: string | null;
    check_out_at?: string | null;
    late_minutes?: number;
    status?: string | null;
};

function formatTime(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
}

type SortKey = 'name' | 'check_in';

export function AttendanceLiveTable({ rows }: { rows: LiveRow[] }) {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<string>('all');
    const [department, setDepartment] = useState<string>('all');
    const [sortKey, setSortKey] = useState<SortKey>('check_in');
    const [selected, setSelected] = useState<LiveRow | null>(null);

    const departments = useMemo(
        () =>
            Array.from(
                new Set(rows.map((row) => row.department).filter(Boolean) as string[]),
            ).sort(),
        [rows],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return rows
            .filter((row) => {
                if (status !== 'all' && row.status !== status) {
                    return false;
                }

                if (department !== 'all' && row.department !== department) {
                    return false;
                }

                if (!q) {
                    return true;
                }

                return [row.full_name, row.employee_code, row.department, row.office]
                    .filter(Boolean)
                    .some((value) => value!.toLowerCase().includes(q));
            })
            .sort((a, b) => {
                if (sortKey === 'name') {
                    return a.full_name.localeCompare(b.full_name);
                }

                return (b.check_in_at ?? '').localeCompare(a.check_in_at ?? '');
            });
    }, [rows, query, status, department, sortKey]);

    const statuses = useMemo(
        () =>
            Array.from(
                new Set(rows.map((row) => row.status).filter(Boolean) as string[]),
            ),
        [rows],
    );

    const hasActiveFilters = query !== '' || status !== 'all' || department !== 'all';

    return (
        <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                <div className="relative min-w-0 flex-1 sm:max-w-xs">
                    <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by name or ID…"
                        className="bg-muted/40 h-9 pl-8 text-sm"
                        aria-label="Search today's attendance"
                    />
                </div>

                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="border-input bg-background h-9 rounded-md border px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                    aria-label="Filter by status"
                >
                    <option value="all">All statuses</option>
                    {statuses.map((value) => (
                        <option key={value} value={value}>
                            {value === 'late' ? 'Late' : 'Present'}
                        </option>
                    ))}
                </select>

                {departments.length > 0 ? (
                    <select
                        value={department}
                        onChange={(event) => setDepartment(event.target.value)}
                        className="border-input bg-background h-9 rounded-md border px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        aria-label="Filter by department"
                    >
                        <option value="all">All departments</option>
                        {departments.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                ) : null}

                {hasActiveFilters ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-9"
                        onClick={() => {
                            setQuery('');
                            setStatus('all');
                            setDepartment('all');
                        }}
                    >
                        <X className="size-3.5" />
                        Clear
                    </Button>
                ) : null}

                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                    {filtered.length} shown
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="app-table min-w-[720px]">
                    <thead>
                        <tr>
                            <th scope="col">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSortKey((key) => (key === 'name' ? 'check_in' : 'name'))
                                    }
                                    className="text-muted-foreground inline-flex items-center gap-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
                                >
                                    Employee
                                    <ArrowUpDown
                                        className={cn(
                                            'size-3',
                                            sortKey === 'name' && 'text-primary',
                                        )}
                                    />
                                </button>
                            </th>
                            <th scope="col">Department</th>
                            <th scope="col">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSortKey((key) => (key === 'check_in' ? 'name' : 'check_in'))
                                    }
                                    className="text-muted-foreground inline-flex items-center gap-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
                                >
                                    Check in
                                    <ArrowUpDown
                                        className={cn(
                                            'size-3',
                                            sortKey === 'check_in' && 'text-primary',
                                        )}
                                    />
                                </button>
                            </th>
                            <th scope="col">Check out</th>
                            <th scope="col">Status</th>
                            <th scope="col" className="text-right">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.slice(0, 50).map((row) => (
                            <tr key={row.id}>
                                <td>
                                    <PersonIdentity
                                        name={row.full_name}
                                        avatar={row.avatar}
                                        detail={row.employee_code ?? undefined}
                                        href={`/employees/${row.id}`}
                                        className="min-w-0"
                                    />
                                </td>
                                <td className="text-muted-foreground whitespace-nowrap">
                                    {row.department ?? '—'}
                                </td>
                                <td className="tabular-nums whitespace-nowrap">
                                    {formatTime(row.check_in_at)}
                                </td>
                                <td className="tabular-nums whitespace-nowrap">
                                    {formatTime(row.check_out_at)}
                                </td>
                                <td>
                                    <StatusBadge
                                        status={row.status ?? 'present'}
                                        label={
                                            row.status === 'late'
                                                ? `Late · ${row.late_minutes ?? 0} min`
                                                : 'Present'
                                        }
                                    />
                                </td>
                                <td className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground size-8"
                                                aria-label={`Actions for ${row.full_name}`}
                                            >
                                                <ChevronDown className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => setSelected(row)}>
                                                View details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/employees/${row.id}`}>
                                                    Open profile
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-b-xl border-t bg-card">
                    <EmptyState
                        icon={Search}
                        title="No matching attendance"
                        description={
                            hasActiveFilters
                                ? 'Try changing your search or filters.'
                                : 'Nobody has checked in yet today.'
                        }
                        className="py-10"
                    />
                </div>
            ) : null}

            {filtered.length > 50 ? (
                <p className="text-muted-foreground border-t px-4 py-2.5 text-xs">
                    Showing the first 50 of {filtered.length} — view the full register in{' '}
                    <Link
                        href="/reports/attendance"
                        className="text-primary font-medium hover:underline"
                    >
                        Attendance reports
                    </Link>
                    .
                </p>
            ) : null}

            <DetailDrawer
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelected(null);
                    }
                }}
                title={selected?.full_name ?? 'Attendance details'}
                description={
                    selected?.employee_code
                        ? `Employee ID ${selected.employee_code}`
                        : undefined
                }
                footer={
                    selected ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                onClick={() => setSelected(null)}
                            >
                                <Link href={`/employees/${selected.id}`}>View profile</Link>
                            </Button>
                            <Button size="sm" asChild onClick={() => setSelected(null)}>
                                <Link href="/reports/attendance">Open report</Link>
                            </Button>
                        </>
                    ) : null
                }
            >
                {selected ? (
                    <div className="space-y-5">
                        <div className="flex items-start justify-between gap-3">
                            <PersonIdentity
                                name={selected.full_name}
                                avatar={selected.avatar}
                                detail={[selected.department, selected.office]
                                    .filter(Boolean)
                                    .join(' · ')}
                            />
                            <StatusBadge
                                status={selected.status ?? 'present'}
                                label={
                                    selected.status === 'late'
                                        ? `Late · ${selected.late_minutes ?? 0} min`
                                        : 'Present'
                                }
                            />
                        </div>

                        <div className="rounded-xl border bg-muted/30 p-4">
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                <div>
                                    <dt className="text-muted-foreground text-xs">Check in</dt>
                                    <dd className="mt-0.5 font-medium tabular-nums">
                                        {formatTime(selected.check_in_at)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">Check out</dt>
                                    <dd className="mt-0.5 font-medium tabular-nums">
                                        {formatTime(selected.check_out_at)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                ) : null}
            </DetailDrawer>
        </div>
    );
}
