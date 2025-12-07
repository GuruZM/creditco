import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    Clock,
    Coins,
    Filter,
    Search,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CoinStatus = 'pending_review' | 'approved' | 'rejected' | string;

type Coin = {
    id: number;
    request: string;
    date: string | null;
    purchase_order: string | null;
    contract: string | null;
    request_amount: number;
    source: string | null;
    duration: string | null;
    industry: string | null;
    status: CoinStatus;
    created_at: string | null;
};

type Paginated<T> = {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type PageProps = {
    coins: Paginated<Coin>;
    filters: {
        search: string;
        industry: string;
        min_amount: string;
        max_amount: string;
    };
    available_industries: string[];
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Coins', href: '/investor/coins' },
];

export default function InvestorCoinsIndex() {
    const { coins, filters, available_industries } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [industry, setIndustry] = useState(filters.industry || '');
    const [minAmount, setMinAmount] = useState(filters.min_amount || '');
    const [maxAmount, setMaxAmount] = useState(filters.max_amount || '');

    const totalCoins = coins.data.length;

    const applyFilters = () => {
        router.get(
            '/investor/coins',
            {
                search,
                industry,
                min_amount: minAmount,
                max_amount: maxAmount,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setIndustry('');
        setMinAmount('');
        setMaxAmount('');
        router.get(
            '/investor/coins',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Coins | Investor | CreditCo" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                <Tabs
                    defaultValue="list"
                    className="flex h-full flex-1 flex-col"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900 md:text-xl dark:text-slate-50">
                                <Coins className="h-5 w-5 text-emerald-500" />
                                Investment opportunities
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Browse approved funding requests (coins) and
                                discover deals aligned with your investment
                                preferences.
                            </p>
                        </div>

                        <TabsList className="flex h-9 gap-1 rounded-full bg-slate-100 p-1 text-xs dark:bg-slate-900">
                            <TabsTrigger
                                value="list"
                                className="flex-1 rounded-full px-3 py-1 text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-50"
                            >
                                Coins
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Top stats */}
                    <div className="mt-3 grid auto-rows-min gap-4 md:grid-cols-3">
                        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Coins on this page
                                </h2>
                                <Coins className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                                {totalCoins}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                These are approved and currently open to
                                investors.
                            </p>
                        </div>

                        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Filter by industry
                                </h2>
                                <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="mt-3 max-w-[200px] text-[11px] text-slate-500 dark:text-slate-400">
                                Tap the bubbles below to quickly focus on
                                industries you&apos;re most interested in.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {available_industries.map((ind) => {
                                    const active = industry === ind;
                                    return (
                                        <button
                                            key={ind}
                                            type="button"
                                            onClick={() =>
                                                setIndustry((prev) =>
                                                    prev === ind ? '' : ind,
                                                )
                                            }
                                            className={[
                                                'rounded-full px-3 py-1 text-[11px] transition',
                                                active
                                                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
                                            ].join(' ')}
                                        >
                                            {ind}
                                        </button>
                                    );
                                })}
                                {available_industries.length === 0 && (
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                        Industries will appear here as coins are
                                        created.
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Typical durations
                                </h2>
                                <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                                Short to medium-term deals
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                Many coins focus on 30–180 day tenors backed by
                                POs or contracts, giving you clear exit
                                expectations.
                            </p>
                        </div>
                    </div>

                    <TabsContent
                        value="list"
                        className="mt-4 flex h-full flex-1 flex-col"
                    >
                        <div className="relative min-h-[100vh] flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:min-h-min dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-full w-full flex-col gap-4">
                                {/* Filters */}
                                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                    <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
                                        <div className="relative flex-1">
                                            <Search className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                            <Input
                                                placeholder="Search by description, PO, contract"
                                                className="pl-8 text-xs"
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter')
                                                        applyFilters();
                                                }}
                                            />
                                        </div>

                                        <div className="grid flex-1 gap-2 md:grid-cols-2">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="h-9 text-xs"
                                                    placeholder="Min amount (ZMW)"
                                                    value={minAmount}
                                                    onChange={(e) =>
                                                        setMinAmount(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="h-9 text-xs"
                                                    placeholder="Max amount (ZMW)"
                                                    value={maxAmount}
                                                    onChange={(e) =>
                                                        setMaxAmount(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                                            type="button"
                                            onClick={resetFilters}
                                        >
                                            Reset
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-slate-900 text-xs text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                            type="button"
                                            onClick={applyFilters}
                                        >
                                            Apply filters
                                        </Button>
                                    </div>
                                </div>

                                {/* Cards grid */}
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {coins.data.length === 0 && (
                                        <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                                            No coins match your filters yet. Try
                                            adjusting your search, industries or
                                            amount range.
                                        </div>
                                    )}

                                    {coins.data.map((coin) => (
                                        <div
                                            key={coin.id}
                                            className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                                        >
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                                                            <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-50">
                                                                Coin #
                                                                {coin.id
                                                                    .toString()
                                                                    .padStart(
                                                                        4,
                                                                        '0',
                                                                    )}
                                                            </p>
                                                            <p className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                                                <Calendar className="h-3 w-3" />
                                                                {coin.date ||
                                                                    'No date provided'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="mt-1 line-clamp-3 text-xs text-slate-800 dark:text-slate-100">
                                                    {coin.request}
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                                                    {coin.industry && (
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900">
                                                            {coin.industry}
                                                        </span>
                                                    )}
                                                    {coin.duration && (
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900">
                                                            Tenor:{' '}
                                                            {coin.duration}
                                                        </span>
                                                    )}
                                                    {coin.purchase_order && (
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900">
                                                            PO-backed
                                                        </span>
                                                    )}
                                                    {coin.contract && (
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900">
                                                            Contract-backed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-end justify-between gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        Request amount
                                                    </p>
                                                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {coin.request_amount.toLocaleString()}{' '}
                                                        ZMW
                                                    </p>
                                                    {coin.source && (
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                            Source:{' '}
                                                            {coin.source}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* For now, this is purely visual.
                            Later we can wire "Express interest" to a POST route. */}
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 text-[11px] text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                                                    type="button"
                                                    disabled
                                                    title="We'll wire this to an interest flow next."
                                                >
                                                    Express interest
                                                    <ArrowRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {coins.links && coins.links.length > 0 && (
                                    <div className="mt-4 flex justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                                        <div className="flex items-center gap-1 text-xs">
                                            {coins.links.map((link, index) => {
                                                if (!link.url) {
                                                    return (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 text-slate-400 dark:text-slate-600"
                                                            dangerouslySetInnerHTML={{
                                                                __html: link.label,
                                                            }}
                                                        />
                                                    );
                                                }

                                                return (
                                                    <Link
                                                        key={index}
                                                        href={link.url}
                                                        className={[
                                                            'rounded-md px-2 py-1',
                                                            link.active
                                                                ? 'bg-slate-900 text-slate-50 dark:bg-slate-700'
                                                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                                                        ].join(' ')}
                                                        dangerouslySetInnerHTML={{
                                                            __html: link.label,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
