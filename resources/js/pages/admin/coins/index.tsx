import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRightCircle,
    Building2,
    Calendar,
    Coins,
    FileText,
    Filter,
    Info,
    Search,
} from 'lucide-react';
import { useState } from 'react';

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

    borrower_company: string | null;
    borrower_name: string | null;
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
        status: string;
        industry: string;
    };
    available_industries: string[];
};

const statusLabel: Record<string, string> = {
    pending_review: 'Pending admin review',
    approved: 'Approved',
    rejected: 'Rejected',
};

const statusClasses: Record<string, string> = {
    pending_review:
        'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    approved:
        'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    rejected:
        'border-red-200 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Coins', href: '/admin/coins' },
];

export default function AdminCoinsIndex() {
    const { coins, filters, available_industries } = usePage<PageProps>().props;

    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [industryFilter, setIndustryFilter] = useState(
        filters.industry || '',
    );

    const [viewOpen, setViewOpen] = useState(false);
    const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

    const applyFilters = () => {
        router.get(
            '/admin/coins',
            {
                search,
                status: statusFilter,
                industry: industryFilter,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const openViewDialog = (coin: Coin) => {
        setSelectedCoin(coin);
        setViewOpen(true);
    };

    const totalCoins = coins.data.length;
    const totalPending = coins.data.filter(
        (c) => c.status === 'pending_review',
    ).length;
    const totalApproved = coins.data.filter(
        (c) => c.status === 'approved',
    ).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Coins | CreditCo" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                <Tabs
                    value={activeTab}
                    onValueChange={(value: any) =>
                        setActiveTab(value as 'list' | 'create')
                    }
                    className="flex h-full flex-1 flex-col"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900 md:text-xl dark:text-slate-50">
                                <Coins className="h-5 w-5 text-emerald-500" />
                                Coins
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Admin view of all funding requests (coins)
                                created by borrowers.
                            </p>
                        </div>

                        <TabsList className="flex h-9 gap-1 rounded-full bg-slate-100 p-1 text-xs dark:bg-slate-900">
                            <TabsTrigger
                                value="list"
                                className="flex-1 rounded-full px-3 py-1 text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-50"
                            >
                                Coins
                            </TabsTrigger>
                            <TabsTrigger
                                value="create"
                                className="flex-1 rounded-full px-3 py-1 text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-50"
                            >
                                Create coin
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Top stats (always visible) */}
                    <div className="mt-3 grid auto-rows-min gap-4 md:grid-cols-3">
                        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Total coins
                                </h2>
                                <Coins className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                                {totalCoins}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                All funding requests currently in the system.
                            </p>
                        </div>

                        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Pending review
                                </h2>
                                <Filter className="h-4 w-4 text-amber-500" />
                            </div>
                            <p className="mt-3 text-3xl font-semibold text-amber-600 dark:text-amber-300">
                                {totalPending}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                Coins waiting for admin review.
                            </p>
                        </div>

                        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Approved
                                </h2>
                                <ArrowRightCircle className="h-4 w-4 text-emerald-500" />
                            </div>
                            <p className="mt-3 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
                                {totalApproved}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                Coins that have passed admin review.
                            </p>
                        </div>
                    </div>

                    {/* Coins list tab */}
                    <TabsContent
                        value="list"
                        className="mt-4 flex h-full flex-1 flex-col"
                    >
                        <div className="relative min-h-[100vh] flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:min-h-min dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-full w-full flex-col gap-4">
                                {/* Filters row */}
                                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                    <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
                                        <div className="flex flex-1 items-center gap-2">
                                            <div className="relative flex-1">
                                                <Search className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                                <Input
                                                    placeholder="Search by borrower, request, or PO"
                                                    className="pl-8 text-xs"
                                                    value={search}
                                                    onChange={(e) =>
                                                        setSearch(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter')
                                                            applyFilters();
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-1 flex-col gap-2 md:flex-row">
                                            {/* Status filter */}
                                            <Select
                                                value={statusFilter || 'all'}
                                                onValueChange={(value) =>
                                                    setStatusFilter(
                                                        value === 'all'
                                                            ? ''
                                                            : value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-9 text-xs">
                                                    <SelectValue placeholder="Filter by status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All statuses
                                                    </SelectItem>
                                                    <SelectItem value="pending_review">
                                                        Pending review
                                                    </SelectItem>
                                                    <SelectItem value="approved">
                                                        Approved
                                                    </SelectItem>
                                                    <SelectItem value="rejected">
                                                        Rejected
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {/* Industry filter */}
                                            <Select
                                                value={industryFilter || 'all'}
                                                onValueChange={(value) =>
                                                    setIndustryFilter(
                                                        value === 'all'
                                                            ? ''
                                                            : value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-9 text-xs">
                                                    <SelectValue placeholder="Filter by industry" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All industries
                                                    </SelectItem>
                                                    {available_industries.map(
                                                        (ind) => (
                                                            <SelectItem
                                                                key={ind}
                                                                value={ind}
                                                            >
                                                                {ind}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            className="bg-slate-900 text-xs text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                            onClick={applyFilters}
                                        >
                                            Apply filters
                                        </Button>
                                    </div>
                                </div>

                                {/* Coins table */}
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                        <thead className="bg-slate-50 dark:bg-slate-900">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                    Borrower
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                    Request
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                    Amount
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {coins.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                                                    >
                                                        No coins found.
                                                    </td>
                                                </tr>
                                            )}

                                            {coins.data.map((coin) => (
                                                <tr
                                                    key={coin.id}
                                                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                                                >
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                                <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                                                    {coin.borrower_company ||
                                                                        '—'}
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 dark:text-slate-500">
                                                                    {coin.borrower_name ||
                                                                        'Unknown borrower'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="line-clamp-2 text-xs text-slate-900 dark:text-slate-100">
                                                            {coin.request}
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-500">
                                                            {coin.purchase_order && (
                                                                <span>
                                                                    PO:{' '}
                                                                    {
                                                                        coin.purchase_order
                                                                    }
                                                                </span>
                                                            )}
                                                            {coin.contract && (
                                                                <span>
                                                                    · Contract:{' '}
                                                                    {
                                                                        coin.contract
                                                                    }
                                                                </span>
                                                            )}
                                                            {coin.source && (
                                                                <span>
                                                                    · Source:{' '}
                                                                    {
                                                                        coin.source
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-900 dark:text-slate-100">
                                                        {coin.request_amount.toLocaleString()}{' '}
                                                        ZMW
                                                    </td>

                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span
                                                            className={[
                                                                'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]',
                                                                statusClasses[
                                                                    coin.status
                                                                ] ??
                                                                    'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
                                                            ].join(' ')}
                                                        >
                                                            {statusLabel[
                                                                coin.status
                                                            ] || coin.status}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-800 dark:text-slate-200">
                                                        {coin.date || '—'}
                                                    </td>

                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-slate-300 text-[11px] text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-400"
                                                            onClick={() =>
                                                                openViewDialog(
                                                                    coin,
                                                                )
                                                            }
                                                        >
                                                            View coin
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Pagination */}
                                    {coins.links && coins.links.length > 0 && (
                                        <div className="flex justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                                            <div className="flex items-center gap-1 text-xs">
                                                {coins.links.map(
                                                    (link, index) => {
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
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Create coin tab (admin readonly message) */}
                    <TabsContent
                        value="create"
                        className="mt-4 flex h-full flex-1 flex-col"
                    >
                        <div className="relative flex-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                                <Info className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                                <h2 className="text-sm font-semibold">
                                    Coin creation is restricted to borrowers
                                </h2>
                                <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">
                                    As an admin, you can review and manage coins
                                    created by borrowers, but you cannot create
                                    new coins from this screen. Switch to a
                                    borrower account to initiate a new funding
                                    request.
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* View coin dialog */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="max-w-lg border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-emerald-500" />
                            Coin details
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Full details of this funding request. Admin can
                            review and later we&apos;ll wire actions like
                            approve/reject.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCoin && (
                        <div className="space-y-4 text-xs">
                            {/* Borrower info */}
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                <p className="flex items-center gap-2 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                    <Building2 className="h-4 w-4" />
                                    Borrower
                                </p>
                                <p className="mt-1 text-xs text-slate-900 dark:text-slate-100">
                                    {selectedCoin.borrower_company || '—'}
                                </p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                    {selectedCoin.borrower_name ||
                                        'Unknown borrower'}
                                </p>
                            </div>

                            {/* Request details */}
                            <div className="space-y-2">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                    <p className="flex items-center gap-2 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                        <FileText className="h-4 w-4" />
                                        Request
                                    </p>
                                    <p className="mt-1 text-xs whitespace-pre-wrap text-slate-900 dark:text-slate-100">
                                        {selectedCoin.request}
                                    </p>
                                </div>

                                <div className="grid gap-2 md:grid-cols-2">
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                        <p className="flex items-center gap-2 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                            <Calendar className="h-4 w-4" />
                                            Date & duration
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
                                            Date:{' '}
                                            <span className="font-medium">
                                                {selectedCoin.date || '—'}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-slate-700 dark:text-slate-300">
                                            Duration:{' '}
                                            <span className="font-medium">
                                                {selectedCoin.duration || '—'}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                        <p className="flex items-center gap-2 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                            <Coins className="h-4 w-4" />
                                            Financials
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
                                            Amount:{' '}
                                            <span className="font-medium">
                                                {selectedCoin.request_amount.toLocaleString()}{' '}
                                                ZMW
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-slate-700 dark:text-slate-300">
                                            Source:{' '}
                                            <span className="font-medium">
                                                {selectedCoin.source || '—'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-2 md:grid-cols-2">
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                        <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                            Purchase order (PO)
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
                                            {selectedCoin.purchase_order ||
                                                'Not provided'}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                        <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                            Contract
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
                                            {selectedCoin.contract ||
                                                'Not provided'}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                    <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                        Industry
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
                                        {selectedCoin.industry ||
                                            'Not specified'}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                    <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                        Status
                                    </p>
                                    <p className="mt-1">
                                        <span
                                            className={[
                                                'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]',
                                                statusClasses[
                                                    selectedCoin.status
                                                ] ??
                                                    'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
                                            ].join(' ')}
                                        >
                                            {statusLabel[selectedCoin.status] ||
                                                selectedCoin.status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                            onClick={() => setViewOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
