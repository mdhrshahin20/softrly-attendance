import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export type StatusDay = {
    date: string;
    label: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
};

const SERIES = [
    { key: 'present', label: 'Present', cssVar: '--chart-2' },
    { key: 'late', label: 'Late', cssVar: '--chart-3' },
    { key: 'leave', label: 'Leave', cssVar: '--chart-4' },
    { key: 'absent', label: 'Absent', cssVar: '--chart-5' },
] as const;

function cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') {
        return fallback;
    }

    return (
        getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
        fallback
    );
}

function TooltipRow({
    color,
    label,
    value,
}: {
    color: string;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                />
                {label}
            </span>
            <span className="font-medium tabular-nums">{value}</span>
        </div>
    );
}

function StatusTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ dataKey?: string | number; value?: number | string }>;
    label?: string | number;
}) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const colors = SERIES.map((series) => cssVar(series.cssVar, '#000'));
    const rows = payload
        .map((entry) => {
            const index = SERIES.findIndex(
                (series) => series.key === String(entry.dataKey),
            );

            return index >= 0
                ? {
                      color: colors[index],
                      label: SERIES[index].label,
                      value: Number(entry.value ?? 0),
                  }
                : null;
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

    return (
        <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
            <p className="text-foreground mb-1.5 font-semibold">{label}</p>
            <div className="space-y-1">
                {rows.map((row) => (
                    <TooltipRow key={row.label} {...row} />
                ))}
            </div>
        </div>
    );
}

export function StatusTrendChart({
    data,
    height = 280,
}: {
    data: StatusDay[];
    height?: number;
}) {
    const colors = SERIES.map((series) => cssVar(series.cssVar, '#000'));

    return (
        <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
                    <CartesianGrid
                        vertical={false}
                        stroke={cssVar('--border', '#e5e7eb')}
                        strokeDasharray="3 3"
                    />
                    <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={28}
                        fontSize={11}
                        tick={{ fill: cssVar('--muted-foreground', '#6b7280') }}
                        dy={6}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={44}
                        fontSize={11}
                        tick={{ fill: cssVar('--muted-foreground', '#6b7280') }}
                    />
                    <Tooltip content={<StatusTooltip />} cursor={{ fill: 'transparent' }} />
                    {SERIES.map((series, index) => (
                        <Bar
                            key={series.key}
                            dataKey={series.key}
                            stackId="status"
                            fill={colors[index]}
                            radius={index === SERIES.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                            maxBarSize={22}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function StatusLegend({ className }: { className?: string }) {
    return (
        <div className={className} aria-hidden="true">
            {SERIES.map((series) => (
                <span
                    key={series.key}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                    <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: cssVar(series.cssVar, '#000') }}
                    />
                    {series.label}
                </span>
            ))}
        </div>
    );
}
