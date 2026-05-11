import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

export type CalendarEvent = {
    id: number | string;
    /** ISO date string (YYYY-MM-DD) */
    date: string;
    label: string;
    tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
};

type Props = {
    events: CalendarEvent[];
};

const toneDot: Record<NonNullable<CalendarEvent['tone']>, string> = {
    default: 'bg-foreground/60',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function Calendar({ events }: Props) {
    const [cursor, setCursor] = useState<Date>(() => new Date());

    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const e of events) {
            const key = e.date;
            const arr = map.get(key) ?? [];
            arr.push(e);
            map.set(key, arr);
        }
        return map;
    }, [events]);

    const monthStart = startOfMonth(cursor);
    const monthName = cursor.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
    });

    // Build 6-week grid starting on the Sunday before monthStart
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        days.push(d);
    }

    const today = new Date();

    const goPrev = () => {
        const next = new Date(cursor);
        next.setMonth(next.getMonth() - 1);
        setCursor(next);
    };
    const goNext = () => {
        const next = new Date(cursor);
        next.setMonth(next.getMonth() + 1);
        setCursor(next);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{monthName}</h4>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={goPrev}
                        className="rounded-md border p-1 hover:bg-accent hover:text-accent-foreground"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={goNext}
                        className="rounded-md border p-1 hover:bg-accent hover:text-accent-foreground"
                        aria-label="Next month"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                {WEEKDAYS.map((d) => (
                    <span key={d}>{d}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((d) => {
                    const inMonth = d.getMonth() === cursor.getMonth();
                    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const dayEvents = eventsByDate.get(iso) ?? [];
                    const isToday = isSameDay(d, today);
                    return (
                        <div
                            key={iso}
                            className={cn(
                                'group relative aspect-square rounded-md border p-1 text-left text-xs',
                                inMonth
                                    ? 'border-border bg-background'
                                    : 'border-transparent bg-muted/30 text-muted-foreground/60',
                                isToday &&
                                    'border-primary/60 ring-1 ring-primary/40',
                            )}
                            title={dayEvents.map((e) => e.label).join('\n')}
                        >
                            <span
                                className={cn(
                                    'block leading-none',
                                    isToday && 'font-semibold text-primary',
                                )}
                            >
                                {d.getDate()}
                            </span>
                            {dayEvents.length > 0 ? (
                                <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5">
                                    {dayEvents.slice(0, 3).map((e) => (
                                        <span
                                            key={e.id}
                                            className={cn(
                                                'size-1.5 rounded-full',
                                                toneDot[e.tone ?? 'default'],
                                            )}
                                        />
                                    ))}
                                    {dayEvents.length > 3 ? (
                                        <span className="text-[9px] leading-none text-muted-foreground">
                                            +{dayEvents.length - 3}
                                        </span>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
