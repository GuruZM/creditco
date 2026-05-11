import { BarChart } from '@/components/dashboard/bar-chart';
import { Calendar, type CalendarEvent } from '@/components/dashboard/calendar';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import {
    Banknote,
    BriefcaseBusiness,
    CalendarDays,
    HandCoins,
    PieChart,
    PlusCircle,
    Target,
    TrendingUp,
} from 'lucide-react';

type Stats = {
    total_interests: number;
    funded_interests: number;
    pending_interests: number;
    in_progress_interests: number;
    capital_invested: number;
    expected_repayments: number;
};

type Slice = { label: string; value: number };

type Monthly = { label: string; amount: number; count: number };

type Due = {
    id: number;
    due_at: string | null;
    amount: number;
    borrower_company: string | null;
    request: string | null;
    is_overdue: boolean;
};

type RecentInterest = {
    id: number;
    company: string | null;
    request: string | null;
    industry: string | null;
    amount: number;
    funding_status: string;
    created_at: string | null;
};

export type InvestorDashboardData = {
    stats: Stats;
    status_breakdown: Slice[];
    monthly_funded: Monthly[];
    upcoming_due_dates: Due[];
    recent_interests: RecentInterest[];
    currency: string;
};

const donutColors = [
    'text-sky-500',
    'text-emerald-500',
    'text-amber-500',
    'text-violet-500',
    'text-rose-500',
];

const fundingBadge: Record<string, string> = {
    interested:
        'bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300',
    funding_initiated:
        'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
    funded:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
};

function formatCurrency(amount: number, currency: string) {
    return `${currency} ${amount.toLocaleString(undefined, {
        maximumFractionDigits: 0,
    })}`;
}

export function InvestorDashboard({ data }: { data: InvestorDashboardData }) {
    const {
        stats,
        status_breakdown,
        monthly_funded,
        upcoming_due_dates,
        recent_interests,
        currency,
    } = data;

    const calendarEvents: CalendarEvent[] = upcoming_due_dates
        .filter((d): d is Due & { due_at: string } => Boolean(d.due_at))
        .map((d) => ({
            id: d.id,
            date: d.due_at,
            label: `${d.borrower_company ?? 'Borrower'}: ${formatCurrency(d.amount, currency)}`,
            tone: d.is_overdue ? 'danger' : 'success',
        }));

    const donutData = status_breakdown.map((row, idx) => ({
        ...row,
        color: donutColors[idx % donutColors.length],
    }));

    const expectedReturn = stats.expected_repayments - stats.capital_invested;

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                    label="Capital invested"
                    value={formatCurrency(stats.capital_invested, currency)}
                    sublabel={`${stats.funded_interests} funded coins`}
                    icon={HandCoins}
                    tone="success"
                />
                <StatCard
                    label="Expected repayments"
                    value={formatCurrency(stats.expected_repayments, currency)}
                    sublabel={
                        expectedReturn > 0
                            ? `+${formatCurrency(expectedReturn, currency)} return`
                            : 'Awaiting funded coins'
                    }
                    icon={Target}
                    tone="info"
                />
                <StatCard
                    label="Active interests"
                    value={stats.total_interests.toString()}
                    sublabel={`${stats.pending_interests} pending · ${stats.in_progress_interests} in progress`}
                    icon={BriefcaseBusiness}
                />
                <StatCard
                    label="Next installment"
                    value={
                        upcoming_due_dates[0]
                            ? formatCurrency(upcoming_due_dates[0].amount, currency)
                            : '—'
                    }
                    sublabel={
                        upcoming_due_dates[0]?.due_at
                            ? `Due ${upcoming_due_dates[0].due_at}`
                            : 'No upcoming inflows'
                    }
                    icon={Banknote}
                    tone={upcoming_due_dates[0]?.is_overdue ? 'danger' : 'warning'}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="size-4" />
                            Capital deployed (last 6 months)
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            How much you funded each month
                        </p>
                    </CardHeader>
                    <CardContent>
                        <BarChart
                            data={monthly_funded.map((m) => ({
                                label: m.label,
                                amount: m.amount,
                            }))}
                            series={[
                                {
                                    key: 'amount',
                                    label: `Funded (${currency})`,
                                    color: 'bg-emerald-500',
                                },
                            ]}
                            formatValue={(n) => formatCurrency(n, currency)}
                            height={200}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <PieChart className="size-4" />
                            Interests by status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {donutData.length > 0 ? (
                            <DonutChart
                                data={donutData}
                                centerLabel="Total"
                                centerValue={stats.total_interests.toString()}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                You haven&apos;t expressed interest in any coins yet.
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
                            When borrowers will pay you back
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Calendar events={calendarEvents} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Upcoming inflows</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Next installments due to you
                        </p>
                    </CardHeader>
                    <CardContent>
                        {upcoming_due_dates.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No upcoming inflows yet.
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
                                                {d.borrower_company ?? 'Borrower'}
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
                        <BriefcaseBusiness className="size-4" />
                        My recent interests
                    </CardTitle>
                    <Link
                        href="/investor/coins"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                        <PlusCircle className="size-4" />
                        Browse coins
                    </Link>
                </CardHeader>
                <CardContent>
                    {recent_interests.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            You haven&apos;t expressed interest in any coins yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                        <th className="py-2 font-medium">Borrower</th>
                                        <th className="py-2 font-medium">Industry</th>
                                        <th className="py-2 font-medium">Amount</th>
                                        <th className="py-2 font-medium">Status</th>
                                        <th className="py-2 font-medium">Logged</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_interests.map((i) => (
                                        <tr key={i.id} className="border-b last:border-0">
                                            <td className="py-2">{i.company ?? '—'}</td>
                                            <td className="py-2 text-muted-foreground">
                                                {i.industry ?? '—'}
                                            </td>
                                            <td className="py-2">
                                                {formatCurrency(i.amount, currency)}
                                            </td>
                                            <td className="py-2">
                                                <span
                                                    className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                                                        fundingBadge[i.funding_status] ??
                                                        'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {i.funding_status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-2 text-muted-foreground">
                                                {i.created_at ?? '—'}
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
