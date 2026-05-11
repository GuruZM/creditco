import { cn } from '@/lib/utils';

type Series = {
    key: string;
    label: string;
    color: string; // tailwind bg-* classes
};

type Datum = Record<string, number | string> & { label: string };

type Props = {
    data: Datum[];
    series: Series[];
    height?: number;
    /** Whether series should stack inside the same column or sit side-by-side. */
    stacked?: boolean;
    /** Format the tooltip value (e.g., for currency) */
    formatValue?: (n: number) => string;
};

export function BarChart({
    data,
    series,
    height = 200,
    stacked = false,
    formatValue,
}: Props) {
    const max = Math.max(
        1,
        ...data.map((d) =>
            stacked
                ? series.reduce((sum, s) => sum + Number(d[s.key] ?? 0), 0)
                : Math.max(...series.map((s) => Number(d[s.key] ?? 0))),
        ),
    );

    return (
        <div className="space-y-3">
            <div
                className="flex items-end gap-2"
                style={{ height: `${height}px` }}
            >
                {data.map((d) => {
                    const total = series.reduce(
                        (sum, s) => sum + Number(d[s.key] ?? 0),
                        0,
                    );
                    return (
                        <div
                            key={d.label}
                            className="flex flex-1 flex-col items-center gap-1.5"
                        >
                            <div className="relative flex w-full flex-1 items-end justify-center">
                                {stacked ? (
                                    <div
                                        className="flex w-full max-w-[36px] flex-col-reverse overflow-hidden rounded-md"
                                        style={{
                                            height: `${(total / max) * 100}%`,
                                        }}
                                        title={`${d.label}: ${
                                            formatValue ? formatValue(total) : total
                                        }`}
                                    >
                                        {series.map((s) => {
                                            const v = Number(d[s.key] ?? 0);
                                            if (!v) {
                                                return null;
                                            }
                                            return (
                                                <div
                                                    key={s.key}
                                                    className={cn('w-full', s.color)}
                                                    style={{
                                                        flex: `${(v / Math.max(total, 1)) * 100} 0 0`,
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex w-full items-end justify-center gap-1">
                                        {series.map((s) => {
                                            const v = Number(d[s.key] ?? 0);
                                            return (
                                                <div
                                                    key={s.key}
                                                    className={cn(
                                                        'w-2 rounded-t-sm transition-all',
                                                        s.color,
                                                    )}
                                                    style={{
                                                        height: `${(v / max) * 100}%`,
                                                    }}
                                                    title={`${s.label} ${d.label}: ${
                                                        formatValue ? formatValue(v) : v
                                                    }`}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                                {d.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
                {series.map((s) => (
                    <div key={s.key} className="flex items-center gap-1.5">
                        <span className={cn('size-2.5 rounded-sm', s.color)} />
                        <span className="text-muted-foreground">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
