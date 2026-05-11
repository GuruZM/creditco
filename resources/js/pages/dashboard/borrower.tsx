import { BarChart } from '@/components/dashboard/bar-chart';
import { Calendar, type CalendarEvent } from '@/components/dashboard/calendar';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import {
    Banknote,
    CalendarDays,
    CheckCircle2,
    Clock,
    Coins,
    HandCoins,
    PieChart,
    PlusCircle,
    TrendingUp,
} from 'lucide-react';

type Stats = {
    total_coins: number;
    approved_coins: number;
    pending_coins: number;
    rejected_coins: number;
    capital_requested: number;
    capital_funded: number;
};

type Slice = { label: string; value: number };

type Monthly = { label: string; count: number; amount: number };

type Due = {
    id: number;
    due_at: string | null;
    amount: number;
    investor_name: string | null;
    request: string | null;
    is_overdue: boolean;
};

type RecentCoin = {
    id: number;
    request: string | null;
    amount: number;
    status: string;
    duration: string | null;
    created_at: string | null;
};

export type BorrowerDashboardData = {
    stats: Stats;
    status_breakdown: Slice[];
    monthly_requests: Monthly[];
    upcoming_due_dates: Due[];
    recent_coins: RecentCoin[];
    has_borrower_profile: boolean;
    currency: string;
};

const statusBadge: Record<string, string> = {
    approved:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
    pending_review:
        'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300',
};

function formatCurrency(amount: number, currency: string) {
    return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function BorrowerDashboard({ data }: { data: BorrowerDashboardData }) {
    const {
        stats,
        status_breakdown,
        monthly_requests,
        upcoming_due_dates,
        recent_coins,
        currency,
    } = data;

    const nextDue = upcoming_due_dates.find((d) => !d.is_overdue) ?? null;
    const overdueCount = upcoming_due_dates.filter((d) => d.is_overdue).length;

    const calendarEvents: CalendarEvent[] = upcoming_due_dates
        .filter((d): d is Due & { due_at: string } => Boolean(d.due_at))
        .map((d) => ({
            id: d.id,
            date: d.due_at,
            label: `${formatCurrency(d.amount, currency)} → ${d.investor_name ?? 'Investor'}`,
            tone: d.is_overdue ? 'danger' : 'warning',
        }));

    const donutData = [
        { label: 'Approved', value: stats.approved_coins, color: 'text-emerald-500' },
        { label: 'Pending', value: stats.pending_coins, color: 'text-amber-500' },
        { label: 'Rejected', value: stats.rejected_coins, color: 'text-red-500' },
    ].filter((s) => s.value > 0);

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                    label="My coins"
                    value={stats.total_coins.toString()}
                    sublabel={`${stats.approved_coins} approved · ${stats.pending_coins} pending`}
                    icon={Coins}
                />
                <StatCard
                    label="Capital requested"
                    value={formatCurrency(stats.capital_requested, currency)}
                    icon={Banknote}
                    tone="info"
                />
                <StatCard
                    label="Capital funded"
                    value={formatCurrency(stats.capital_funded, currency)}
                    sublabel="Disbursed to you"
                    icon={HandCoins}
                    tone="success"
                />
                <StatCard
                    label="Next payment"
                    value={
                        nextDue
                            ? formatCurrency(nextDue.amount, currency)
                            : '—'
                    }
                    sublabel={
                        overdueCount > 0
                            ? `${overdueCount} overdue`
                            : nextDue?.due_at
                              ? `Due ${nextDue.due_at}`
                              : 'No upcoming installments'
                    }
                    icon={Clock}
                    tone={overdueCount > 0 ? 'danger' : nextDue ? 'warning' : 'default'}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="size-4" />
                            Requests over time
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Coin volume submitted in the last 6 months
                        </p>
                    </CardHeader>
                    <CardContent>
                        <BarChart
                            data={monthly_requests.map((m) => ({
                                label: m.label,
                                count: m.count,
                            }))}
                            series={[
                                {
                                    key: 'count',
                                    label: 'Coins',
                                    color: 'bg-primary',
                                },
                            ]}
                            height={200}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <PieChart className="size-4" />
                            Status breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {donutData.length > 0 ? (
                            <DonutChart
                                data={donutData}
                                centerLabel="Coins"
                                centerValue={stats.total_coins.toString()}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                You haven&apos;t submitted any coins yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarDays className="size-4" />
                            Repayment calendar
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Installments you owe to investors
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Calendar events={calendarEvents} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Upcoming payments</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Next due dates
                        </p>
                    </CardHeader>
                    <CardContent>
                        {upcoming_due_dates.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No upcoming installments.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {upcoming_due_dates.map((d) => (
                                    <li
                                        key={d.id}
                                        className="flex items-start justify-between gap-3 text-sm"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {d.investor_name ?? 'Investor'}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {d.request ?? 'Coin'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">
                                                {formatCurrency(d.amount, currency)}
                                            </p>
                                            <p
                                                className={
                                                    d.is_overdue
                                                        ? 'text-xs text-red-600 dark:text-red-400'
                                                        : 'text-xs text-muted-foreground'
                                                }
                                            >
                                                {d.due_at}
                                                {d.is_overdue ? ' · overdue' : ''}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle2 className="size-4" />
                        My recent coins
                    </CardTitle>
                    <Link
                        href="/borrower/coins"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                        <PlusCircle className="size-4" />
                        New coin
                    </Link>
                </CardHeader>
                <CardContent>
                    {recent_coins.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            You haven&apos;t submitted any coin requests yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                        <th className="py-2 font-medium">Request</th>
                                        <th className="py-2 font-medium">Amount</th>
                                        <th className="py-2 font-medium">Duration</th>
                                        <th className="py-2 font-medium">Status</th>
                                        <th className="py-2 font-medium">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_coins.map((c) => (
                                        <tr key={c.id} className="border-b last:border-0">
                                            <td className="py-2">{c.request ?? '—'}</td>
                                            <td className="py-2">
                                                {formatCurrency(c.amount, currency)}
                                            </td>
                                            <td className="py-2 text-muted-foreground">
                                                {c.duration ?? '—'}
                                            </td>
                                            <td className="py-2">
                                                <span
                                                    className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                                                        statusBadge[c.status] ??
                                                        'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {c.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-2 text-muted-foreground">
                                                {c.created_at ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
