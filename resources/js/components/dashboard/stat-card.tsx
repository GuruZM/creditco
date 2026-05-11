import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<Tone, string> = {
    default: 'text-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-sky-600 dark:text-sky-400',
};

const iconBgClasses: Record<Tone, string> = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
};

type Props = {
    label: string;
    value: string;
    sublabel?: string;
    icon?: LucideIcon;
    tone?: Tone;
};

export function StatCard({ label, value, sublabel, icon: Icon, tone = 'default' }: Props) {
    return (
        <Card className="gap-2 py-4">
            <CardContent className="flex items-center gap-3">
                {Icon ? (
                    <div
                        className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-lg',
                            iconBgClasses[tone],
                        )}
                    >
                        <Icon className="size-5" />
                    </div>
                ) : null}
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                    </p>
                    <p className={cn('truncate text-2xl font-semibold', toneClasses[tone])}>
                        {value}
                    </p>
                    {sublabel ? (
                        <p className="truncate text-xs text-muted-foreground">{sublabel}</p>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
