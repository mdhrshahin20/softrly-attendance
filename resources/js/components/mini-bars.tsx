export function MiniBars({
    data,
    valueKey,
}: {
    data: Array<Record<string, string | number>>;
    valueKey: string;
}) {
    const max = Math.max(...data.map((row) => Number(row[valueKey]) || 0), 1);

    return (
        <div className="flex h-36 items-end gap-1.5">
            {data.map((row, index) => {
                const value = Number(row[valueKey]) || 0;
                const label = String(row.label ?? row.key ?? index);

                return (
                    <div key={`${label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                        <div
                            className="bg-primary/80 w-full rounded-sm"
                            style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
                            title={`${label}: ${value.toLocaleString()}`}
                        />
                        <span className="text-muted-foreground text-[10px]">{label}</span>
                    </div>
                );
            })}
        </div>
    );
}
