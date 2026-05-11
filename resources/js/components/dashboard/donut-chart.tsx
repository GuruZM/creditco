import { cn } from '@/lib/utils';

type Slice = {
    label: string;
    value: number;
    color: string; // tailwind text-* class for stroke-current
};

type Props = {
    data: Slice[];
    size?: number;
    thickness?: number;
    centerLabel?: string;
    centerValue?: string;
};

export function DonutChart({
    data,
    size = 160,
    thickness = 18,
    centerLabel,
    centerValue,
}: Props) {
    const total = data.reduce((sum, s) => sum + s.value, 0);
    const radius = size / 2 - thickness / 2;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={thickness}
                        fill="none"
                        className="text-muted/40"
                    />
                    {total > 0 &&
                        data.map((s) => {
                            const length = (s.value / total) * circumference;
                            const dasharray = `${length} ${circumference - length}`;
                            const dashoffset = -offset;
                            offset += length;
                            return (
                                <circle
                                    key={s.label}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth={thickness}
                                    fill="none"
                                    strokeDasharray={dasharray}
                                    strokeDashoffset={dashoffset}
                                    className={cn('transition-all', s.color)}
                                    strokeLinecap="butt"
                                />
                            );
                        })}
                </svg>
                {(centerLabel || centerValue) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {centerValue ? (
                            <span className="text-xl font-semibold">{centerValue}</span>
                        ) : null}
                        {centerLabel ? (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                {centerLabel}
                            </span>
                        ) : null}
                    </div>
                )}
            </div>
            <ul className="flex-1 space-y-1.5 text-sm">
                {data.map((s) => {
                    const pct = total > 0 ? (s.value / total) * 100 : 0;
                    return (
                        <li
                            key={s.label}
                            className="flex items-center justify-between gap-3"
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        'size-2.5 rounded-sm bg-current',
                                        s.color,
                                    )}
                                />
                                <span className="capitalize">{s.label}</span>
                            </span>
                            <span className="text-muted-foreground">
                                {s.value}
                                <span className="ml-1 text-xs">({pct.toFixed(0)}%)</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
