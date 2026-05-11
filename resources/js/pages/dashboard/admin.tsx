import { BarChart } from '@/components/dashboard/bar-chart';
import { Calendar, type CalendarEvent } from '@/components/dashboard/calendar';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    BriefcaseBusiness,
    CalendarDays,
    Coins,
    CreditCard,
    HandCoins,
    PieChart,
    TrendingUp,
    Users,
} from 'lucide-react';

type Stats = {
    total_users: number;
    total_borrowers: number;
    total_investors: number;
    pending_coins: number;
    approved_coins: number;
    rejected_coins: number;
    capital_requested: number;
    capital_approved: number;
    capital_funded: number;
    active_subscriptions: number;
};

type CoinTrend = {
    label: string;
    approved: number;
    pending: number;
    rejected: number;
};

type IndustrySlice = { label: string; value: number };

type Due = {
    id: number;
    due_at: string | null;
    amount: number;
    borrower_company: string | null;
    investor_name: string | null;
    is_overdue: boolean;
};

type Tasks = {
    pending_coins: number;
    pending_borrower_verifications: number;
    pending_investor_verifications: number;
    pending_subscription_pops: number;
    pending_repayments: number;
};

type RecentCoin = {
    id: number;
    company: string | null;
    amount: number;
    status: string;
    created_at: string | null;
};

export type AdminDashboardData = {
    stats: Stats;
    coin_trend: CoinTrend[];
    industry_breakdown: IndustrySlice[];
    upcoming_due_dates: Due[];
    tasks: Tasks;
    recent_coins: RecentCoin[];
    currency: string;
};

const donutColors = [
    'text-sky-500',
    'text-emerald-500',
    'text-amber-500',
    'text-violet-500',
    'text-rose-500',
    'text-teal-500',
];

const statusBadge: Record<string, string> = {
    approved:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
    pending_review:
        'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300',
};

function formatCurrency(amount: number, currency: string) {
    return `${currency} ${amount.toLocaleString(undefined, {
        maximumFractionDigits: 0,
    })}`;
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
    const { stats, coin_trend, industry_breakdown, upcoming_due_dates, tasks, recent_coins, currency } = data;

    const calendarEvents: CalendarEvent[] = upcoming_due_dates
        .filter((d): d is Due & { due_at: string } => Boolean(d.due_at))
        .map((d) => ({
            id: d.id,
            date: d.due_at,
            label: `${d.borrower_company ?? 'Borrower'} → ${d.investor_name ?? 'Investor'}: ${formatCurrency(d.amount, currency)}`,
            tone: d.is_overdue ? 'danger' : 'info',
        }));

    const industryData = industry_breakdown.map((row, idx) => ({
        ...row,
        color: donutColors[idx % donutColors.length],
    }));

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                <StatCard
                    label="Users"
                    value={stats.total_users.toString()}
                    sublabel={`${stats.total_borrowers} borrowers · ${stats.total_investors} investors`}
                    icon={Users}
                />
                <StatCard
                    label="Capital requested"
                    value={formatCurrency(stats.capital_requested, currency)}
                    sublabel={`${formatCurrency(stats.capital_approved, currency)} approved`}
                    icon={Banknote}
                    tone="info"
                />
                <StatCard
                    label="Capital funded"
                    value={formatCurrency(stats.capital_funded, currency)}
                    sublabel="Disbursed to borrowers"
                    icon={HandCoins}
                    tone="success"
                />
                <StatCard
                    label="Pending review"
                    value={stats.pending_coins.toString()}
                    sublabel="Coins awaiting approval"
                    icon={Coins}
                    tone="warning"
                />
                <StatCard
                    label="Active subscriptions"
                    value={stats.active_subscriptions.toString()}
                    sublabel="Paying users"
                    icon={CreditCard}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Coin trend */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <TrendingUp className="size-4" />
                                Coin volume (last 6 months)
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Stacked by review status
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <BarChart
                            data={coin_trend.map((m) => ({
                                label: m.label,
                                approved: m.approved,
                                pending: m.pending,
                                rejected: m.rejected,
                            }))}
                            stacked
                            series={[
                                {
                                    key: 'approved',
                                    label: 'Approved',
                                    color: 'bg-emerald-500',
                                },
                                {
                                    key: 'pending',
                                    label: 'Pending',
                                    color: 'bg-amber-500',
                                },
                                {
                                    key: 'rejected',
                                    label: 'Rejected',
                                    color: 'bg-red-500',
                                },
                            ]}
                            height={220}
                        />
                    </CardContent>
                </Card>

                {/* Industry breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <PieChart className="size-4" />
                            Industries
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Top sectors borrowing capital
                        </p>
                    </CardHeader>
                    <CardContent>
                        {industryData.length > 0 ? (
                            <DonutChart
                                data={industryData}
                                centerLabel="Coins"
                                centerValue={industryData
                                    .reduce((sum, s) => sum + s.value, 0)
                                    .toString()}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No coin data yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Calendar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarDays className="size-4" />
                            Repayment calendar
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Installment due dates
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Calendar events={calendarEvents} />
                    </CardContent>
                </Card>

                {/* Upcoming list */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Upcoming installments</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Next 15 due dates
                        </p>
                    </CardHeader>
                    <CardContent>
                        {upcoming_due_dates.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No upcoming installments yet.
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
                                                → {d.investor_name ?? 'Investor'}
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

                {/* Action items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="size-4" />
                            Action items
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Things waiting on admin
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <ActionRow
                            label="Coins to review"
                            value={tasks.pending_coins}
                            href="/admin/coins"
                        />
                        <ActionRow
                            label="Borrowers to verify"
                            value={tasks.pending_borrower_verifications}
                            href="/borrowers"
                        />
                        <ActionRow
                            label="Investors to verify"
                            value={tasks.pending_investor_verifications}
                            href="/investors"
                        />
                        <ActionRow
                            label="Subscription POPs"
                            value={tasks.pending_subscription_pops}
                            href="/admin/subscriptions"
                        />
                        <ActionRow
                            label="Repayments to verify"
                            value={tasks.pending_repayments}
                            href="/admin/repayments"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Recent coins */}
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BriefcaseBusiness className="size-4" />
                        Recent coin requests
                    </CardTitle>
                    <Link
                        href="/admin/coins"
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        View all →
                    </Link>
                </CardHeader>
                <CardContent>
                    {recent_coins.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No coins yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                        <th className="py-2 font-medium">Borrower</th>
                                        <th className="py-2 font-medium">Amount</th>
                                        <th className="py-2 font-medium">Status</th>
                                        <th className="py-2 font-medium">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_coins.map((c) => (
                                        <tr key={c.id} className="border-b last:border-0">
                                            <td className="py-2">{c.company ?? '—'}</td>
                                            <td className="py-2">
                                                {formatCurrency(c.amount, currency)}
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

function ActionRow({
    label,
    value,
    href,
}: {
    label: string;
    value: number;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
        >
            <span>{label}</span>
            <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    value > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                        : 'bg-muted text-muted-foreground'
                }`}
            >
                {value}
            </span>
        </Link>
    );
}
