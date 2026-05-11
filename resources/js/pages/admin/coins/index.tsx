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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRightCircle,
    Building2,
    Calendar,
    CheckCircle2,
    Coins,
    FileText,
    Filter,
    Info,
    LoaderCircle,
    Search,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

type CoinStatus = 'pending_review' | 'approved' | 'rejected' | string;

type Interest = {
    id: number;
    investor_id: number;
    investor_name: string | null;
    investor_email: string | null;
    note: string | null;
    funding_status: string;
    funding_started_at: string | null;
    investor_agreed_at: string | null;
    created_at: string | null;
};

type Terms = {
    interest_rate: number | null;
    service_fee_percent: number | null;
    duration_days: number | null;
    installments_count: number | null;
    installment_interval_days: number | null;
    total_repayment_amount: number | null;
    installment_amount: number | null;
    terms_text: string | null;
    set_at: string | null;
    borrower_agreed_at: string | null;
};

type Coin = {
    id: number;
    request: string;
    date: string | null;
    purchase_order: string | null;
    purchase_order_file_url: string | null;
    purchase_order_file_name: string | null;
    contract: string | null;
    request_amount: number;
    source: string | null;
    duration: string | null;
    industry: string | null;
    status: CoinStatus;
    rejection_reason: string | null;
    reviewed_at: string | null;
    reviewer_name: string | null;

    borrower_company: string | null;
    borrower_name: string | null;
    created_at: string | null;

    terms: Terms;
    interests: Interest[];
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
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [reviewing, setReviewing] = useState<'approve' | 'reject' | 'terms' | null>(
        null,
    );
    const [rejectError, setRejectError] = useState<string | null>(null);

    const [termsMode, setTermsMode] = useState<'approve' | 'edit' | null>(null);
    const [terms, setTerms] = useState({
        interest_rate: '',
        service_fee_percent: '',
        duration_days: '',
        installments_count: '',
        installment_interval_days: '',
        terms_text: '',
    });
    const [termsErrors, setTermsErrors] = useState<Record<string, string>>({});
    const [startingFundingFor, setStartingFundingFor] = useState<number | null>(
        null,
    );

    const handleStartFunding = (coinId: number, interestId: number) => {
        setStartingFundingFor(interestId);
        router.post(
            `/admin/coins/${coinId}/interests/${interestId}/start-funding`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setStartingFundingFor(null),
                onSuccess: () => setViewOpen(false),
            },
        );
    };

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
        setRejectMode(false);
        setRejectReason('');
        setRejectError(null);
        setViewOpen(true);
    };

    const openTermsForm = (mode: 'approve' | 'edit') => {
        if (!selectedCoin) return;
        const t = selectedCoin.terms;
        setTerms({
            interest_rate: t.interest_rate?.toString() ?? '',
            service_fee_percent: t.service_fee_percent?.toString() ?? '',
            duration_days: t.duration_days?.toString() ?? '',
            installments_count: t.installments_count?.toString() ?? '',
            installment_interval_days: t.installment_interval_days?.toString() ?? '',
            terms_text: t.terms_text ?? '',
        });
        setTermsErrors({});
        setTermsMode(mode);
    };

    const closeTermsForm = () => {
        setTermsMode(null);
        setTermsErrors({});
    };

    const submitTerms = () => {
        if (!selectedCoin) return;

        const errors: Record<string, string> = {};
        if (!terms.interest_rate || Number(terms.interest_rate) < 0) {
            errors.interest_rate = 'Interest rate is required (annual %).';
        }
        if (!terms.duration_days || Number(terms.duration_days) < 1) {
            errors.duration_days = 'Duration in days is required.';
        }
        if (!terms.installments_count || Number(terms.installments_count) < 1) {
            errors.installments_count = 'Installments count is required.';
        }
        if (
            !terms.installment_interval_days ||
            Number(terms.installment_interval_days) < 1
        ) {
            errors.installment_interval_days = 'Interval days is required.';
        }
        if (Object.keys(errors).length > 0) {
            setTermsErrors(errors);
            return;
        }

        const payload = {
            interest_rate: Number(terms.interest_rate),
            service_fee_percent: terms.service_fee_percent
                ? Number(terms.service_fee_percent)
                : null,
            duration_days: Number(terms.duration_days),
            installments_count: Number(terms.installments_count),
            installment_interval_days: Number(terms.installment_interval_days),
            terms_text: terms.terms_text || null,
        };

        setReviewing(termsMode === 'edit' ? 'terms' : 'approve');
        const url =
            termsMode === 'edit'
                ? `/admin/coins/${selectedCoin.id}/terms`
                : `/admin/coins/${selectedCoin.id}/approve`;

        router.post(url, payload, {
            preserveScroll: true,
            onError: (errs) => setTermsErrors(errs as Record<string, string>),
            onSuccess: () => {
                setTermsMode(null);
                setViewOpen(false);
            },
            onFinish: () => setReviewing(null),
        });
    };

    const previewRepayment = (() => {
        const principal = selectedCoin?.request_amount ?? 0;
        const rate = Number(terms.interest_rate || 0);
        const days = Number(terms.duration_days || 0);
        const installments = Number(terms.installments_count || 0);
        const fee = Number(terms.service_fee_percent || 0);
        if (principal <= 0 || rate < 0 || days <= 0 || installments <= 0) {
            return null;
        }
        const interest = (principal * rate * days) / 365 / 100;
        const feeAmount = (principal * fee) / 100;
        const total = principal + interest + feeAmount;
        const installmentAmount = total / installments;
        return { total, installmentAmount };
    })();

    const handleReject = () => {
        if (!selectedCoin) {
            return;
        }
        const reason = rejectReason.trim();
        if (reason.length < 3) {
            setRejectError(
                'Please provide a rejection reason (at least 3 characters).',
            );
            return;
        }
        setRejectError(null);
        setReviewing('reject');
        router.post(
            `/admin/coins/${selectedCoin.id}/reject`,
            { reason },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setRejectError(errors.reason ?? 'Could not reject coin.');
                },
                onFinish: () => {
                    setReviewing(null);
                },
                onSuccess: () => {
                    setViewOpen(false);
                },
            },
        );
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
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
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
                                        {selectedCoin.purchase_order_file_url ? (
                                            <a
                                                href={
                                                    selectedCoin.purchase_order_file_url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 underline underline-offset-2 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                                            >
                                                <FileText className="h-3 w-3" />
                                                View PO document
                                                {selectedCoin.purchase_order_file_name
                                                    ? ` (${selectedCoin.purchase_order_file_name})`
                                                    : ''}
                                            </a>
                                        ) : (
                                            <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-500">
                                                No PO document uploaded.
                                            </p>
                                        )}
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

                                {selectedCoin.status === 'approved' &&
                                selectedCoin.terms.set_at ? (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                                        <p className="text-[11px] font-medium text-emerald-900 dark:text-emerald-300">
                                            Commercial terms
                                        </p>
                                        <ul className="mt-2 grid gap-1 text-[11px] text-emerald-900 dark:text-emerald-200 sm:grid-cols-2">
                                            <li>
                                                Interest:{' '}
                                                <span className="font-semibold">
                                                    {selectedCoin.terms.interest_rate}
                                                    %
                                                </span>
                                            </li>
                                            <li>
                                                Fee:{' '}
                                                <span className="font-semibold">
                                                    {selectedCoin.terms.service_fee_percent ??
                                                        0}
                                                    %
                                                </span>
                                            </li>
                                            <li>
                                                Duration:{' '}
                                                <span className="font-semibold">
                                                    {
                                                        selectedCoin.terms
                                                            .duration_days
                                                    }{' '}
                                                    days
                                                </span>
                                            </li>
                                            <li>
                                                Installments:{' '}
                                                <span className="font-semibold">
                                                    {
                                                        selectedCoin.terms
                                                            .installments_count
                                                    }{' '}
                                                    ×{' '}
                                                    {
                                                        selectedCoin.terms
                                                            .installment_interval_days
                                                    }
                                                    d
                                                </span>
                                            </li>
                                            <li>
                                                Total repayment:{' '}
                                                <span className="font-semibold">
                                                    ZMW{' '}
                                                    {selectedCoin.terms.total_repayment_amount?.toLocaleString()}
                                                </span>
                                            </li>
                                            <li>
                                                Per installment:{' '}
                                                <span className="font-semibold">
                                                    ZMW{' '}
                                                    {selectedCoin.terms.installment_amount?.toLocaleString()}
                                                </span>
                                            </li>
                                        </ul>
                                        <p className="mt-2 text-[11px]">
                                            Borrower agreement:{' '}
                                            {selectedCoin.terms.borrower_agreed_at ? (
                                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                                    ✓ Agreed{' '}
                                                    {
                                                        selectedCoin.terms
                                                            .borrower_agreed_at
                                                    }
                                                </span>
                                            ) : (
                                                <span className="font-semibold text-amber-700 dark:text-amber-300">
                                                    Awaiting borrower
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                ) : null}

                                {selectedCoin.status === 'approved' &&
                                    selectedCoin.interests &&
                                    selectedCoin.interests.length > 0 && (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                            <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                                Interested investors (
                                                {selectedCoin.interests.length})
                                            </p>
                                            <ul className="mt-2 grid gap-2">
                                                {selectedCoin.interests.map(
                                                    (interest) => (
                                                        <li
                                                            key={interest.id}
                                                            className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-white p-2 text-[11px] dark:border-slate-800 dark:bg-slate-950"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                                                                    {interest.investor_name ||
                                                                        'Investor'}
                                                                </p>
                                                                {interest.investor_email && (
                                                                    <p className="truncate text-[10px] text-slate-500 dark:text-slate-500">
                                                                        {
                                                                            interest.investor_email
                                                                        }
                                                                    </p>
                                                                )}
                                                                {interest.note && (
                                                                    <p className="mt-1 line-clamp-2 text-[10px] text-slate-600 dark:text-slate-400">
                                                                        “
                                                                        {
                                                                            interest.note
                                                                        }
                                                                        ”
                                                                    </p>
                                                                )}
                                                                <p className="mt-1 text-[10px]">
                                                                    {interest.investor_agreed_at ? (
                                                                        <span className="font-medium text-emerald-700 dark:text-emerald-300">
                                                                            ✓ Agreed
                                                                            to
                                                                            terms
                                                                        </span>
                                                                    ) : (
                                                                        <span className="font-medium text-amber-700 dark:text-amber-300">
                                                                            Awaiting
                                                                            investor
                                                                            agreement
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            {interest.funding_status ===
                                                            'interested' ? (
                                                                <Button
                                                                    size="sm"
                                                                    className="shrink-0 bg-sky-600 text-[11px] text-white hover:bg-sky-500"
                                                                    onClick={() =>
                                                                        handleStartFunding(
                                                                            selectedCoin.id,
                                                                            interest.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        startingFundingFor !==
                                                                        null
                                                                    }
                                                                >
                                                                    {startingFundingFor ===
                                                                    interest.id ? (
                                                                        <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                                                    ) : null}
                                                                    Start funding
                                                                </Button>
                                                            ) : (
                                                                <Link
                                                                    href={`/admin/coins/${selectedCoin.id}/interests/${interest.id}/funding`}
                                                                    className="shrink-0 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
                                                                >
                                                                    Open wizard →
                                                                </Link>
                                                            )}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}

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
                                    {selectedCoin.reviewed_at && (
                                        <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-500">
                                            Reviewed by{' '}
                                            {selectedCoin.reviewer_name ||
                                                'admin'}{' '}
                                            on {selectedCoin.reviewed_at}
                                        </p>
                                    )}
                                    {selectedCoin.status === 'rejected' &&
                                        selectedCoin.rejection_reason && (
                                            <p className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                                                <span className="font-medium">
                                                    Reason:
                                                </span>{' '}
                                                {selectedCoin.rejection_reason}
                                            </p>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedCoin?.status === 'pending_review' &&
                        rejectMode && (
                            <div className="mt-4 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/5">
                                <label className="text-[11px] font-medium text-red-800 dark:text-red-200">
                                    Rejection reason{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    rows={3}
                                    value={rejectReason}
                                    onChange={(e) =>
                                        setRejectReason(e.target.value)
                                    }
                                    placeholder="Tell the borrower why this coin is being rejected (e.g. amount too high, weak supporting docs, duplicate request)."
                                    className="bg-white text-xs dark:bg-slate-950"
                                />
                                {rejectError && (
                                    <p className="text-[11px] text-red-600 dark:text-red-300">
                                        {rejectError}
                                    </p>
                                )}
                            </div>
                        )}

                    <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        {selectedCoin?.status === 'pending_review' ? (
                            rejectMode ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                                        onClick={() => {
                                            setRejectMode(false);
                                            setRejectReason('');
                                            setRejectError(null);
                                        }}
                                        disabled={reviewing !== null}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-red-600 text-xs text-white hover:bg-red-500"
                                        onClick={handleReject}
                                        disabled={reviewing !== null}
                                    >
                                        {reviewing === 'reject' ? (
                                            <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                        ) : (
                                            <XCircle className="mr-1 h-3 w-3" />
                                        )}
                                        Confirm rejection
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-red-300 text-xs text-red-700 hover:border-red-500 hover:text-red-800 dark:border-red-500/40 dark:text-red-300 dark:hover:border-red-400"
                                        onClick={() => setRejectMode(true)}
                                        disabled={reviewing !== null}
                                    >
                                        <XCircle className="mr-1 h-3 w-3" />
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 text-xs text-white hover:bg-emerald-500"
                                        onClick={() => openTermsForm('approve')}
                                        disabled={reviewing !== null}
                                    >
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Approve with terms
                                    </Button>
                                </>
                            )
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {selectedCoin?.status === 'approved' &&
                                !selectedCoin.terms.borrower_agreed_at &&
                                !selectedCoin.interests.some(
                                    (i) => i.funding_status !== 'interested',
                                ) ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-300 text-xs"
                                        onClick={() => openTermsForm('edit')}
                                    >
                                        Edit terms
                                    </Button>
                                ) : null}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                                    onClick={() => setViewOpen(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={termsMode !== null}
                onOpenChange={(o) => (o ? null : closeTermsForm())}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {termsMode === 'edit'
                                ? 'Edit commercial terms'
                                : 'Approve with terms'}
                        </DialogTitle>
                        <DialogDescription>
                            Set the interest rate and repayment schedule for this
                            coin. Both the borrower and any interested investors
                            will need to agree before funding can start.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                            label="Interest rate (annual %)"
                            value={terms.interest_rate}
                            onChange={(v) =>
                                setTerms((t) => ({ ...t, interest_rate: v }))
                            }
                            type="number"
                            step="0.01"
                            min="0"
                            error={termsErrors.interest_rate}
                            required
                        />
                        <Field
                            label="Service fee % (optional)"
                            value={terms.service_fee_percent}
                            onChange={(v) =>
                                setTerms((t) => ({
                                    ...t,
                                    service_fee_percent: v,
                                }))
                            }
                            type="number"
                            step="0.01"
                            min="0"
                            error={termsErrors.service_fee_percent}
                        />
                        <Field
                            label="Loan duration (days)"
                            value={terms.duration_days}
                            onChange={(v) =>
                                setTerms((t) => ({ ...t, duration_days: v }))
                            }
                            type="number"
                            min="1"
                            error={termsErrors.duration_days}
                            required
                        />
                        <Field
                            label="# of installments"
                            value={terms.installments_count}
                            onChange={(v) =>
                                setTerms((t) => ({
                                    ...t,
                                    installments_count: v,
                                }))
                            }
                            type="number"
                            min="1"
                            max="60"
                            error={termsErrors.installments_count}
                            required
                        />
                        <Field
                            label="Days between installments"
                            value={terms.installment_interval_days}
                            onChange={(v) =>
                                setTerms((t) => ({
                                    ...t,
                                    installment_interval_days: v,
                                }))
                            }
                            type="number"
                            min="1"
                            max="365"
                            error={termsErrors.installment_interval_days}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium">
                            Terms note (optional)
                        </label>
                        <Textarea
                            rows={3}
                            value={terms.terms_text}
                            onChange={(e) =>
                                setTerms((t) => ({
                                    ...t,
                                    terms_text: e.target.value,
                                }))
                            }
                            placeholder="Any conditions or context the borrower / investor should see."
                        />
                        {termsErrors.terms_text ? (
                            <p className="text-xs text-red-600">
                                {termsErrors.terms_text}
                            </p>
                        ) : null}
                    </div>

                    <div className="rounded-md border bg-muted/30 p-3 text-xs">
                        <p className="font-medium">Live preview</p>
                        {previewRepayment ? (
                            <ul className="mt-1 space-y-1">
                                <li className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Total repayment
                                    </span>
                                    <span className="font-medium">
                                        ZMW{' '}
                                        {previewRepayment.total.toLocaleString(
                                            undefined,
                                            { maximumFractionDigits: 2 },
                                        )}
                                    </span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Per installment
                                    </span>
                                    <span className="font-medium">
                                        ZMW{' '}
                                        {previewRepayment.installmentAmount.toLocaleString(
                                            undefined,
                                            { maximumFractionDigits: 2 },
                                        )}
                                    </span>
                                </li>
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">
                                Fill in the rate, duration and installments to see
                                a calculated total.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeTermsForm}
                            disabled={reviewing !== null}
                        >
                            Cancel
                        </Button>
                        <Button onClick={submitTerms} disabled={reviewing !== null}>
                            {reviewing === 'approve' || reviewing === 'terms' ? (
                                <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                            ) : null}
                            {termsMode === 'edit'
                                ? 'Save terms'
                                : 'Approve coin'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
    type = 'text',
    step,
    min,
    max,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    type?: string;
    step?: string;
    min?: string;
    max?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="text-xs font-medium">
                {label}
                {required ? <span className="text-red-500"> *</span> : null}
            </label>
            <Input
                type={type}
                step={step}
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
    );
}
