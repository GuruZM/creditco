import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock,
    Coins,
    FileText,
    LayoutGrid,
    Lock,
} from 'lucide-react';
import React, { useState } from 'react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type CoinStatus = 'pending_review' | 'approved' | 'rejected' | string;

type CoinTerms = {
    interest_rate: number;
    service_fee_percent: number | null;
    duration_days: number | null;
    installments_count: number | null;
    installment_interval_days: number | null;
    total_repayment_amount: number;
    installment_amount: number;
    terms_text: string | null;
    set_at: string | null;
    borrower_agreed_at: string | null;
};

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
    terms: CoinTerms | null;
};

type Paginated<T> = {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type VerificationDocument = {
    type: string;
    label: string;
    verified: boolean;
};

type Verification = {
    can_create: boolean;
    documents: VerificationDocument[];
};

type FundingSummary = {
    has_active_funding: boolean;
    payout_method_present: boolean;
    payout_method_confirmed: boolean;
};

type PageProps = {
    coins: Paginated<Coin>;
    verification: Verification;
    funding: FundingSummary;
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
    { title: 'Coins', href: '/borrower/coins' },
];

export default function BorrowerCoinsIndex() {
    const { coins, verification, funding } = usePage<PageProps>().props;
    const canCreate = verification?.can_create ?? false;
    const fundingActionNeeded =
        funding?.has_active_funding &&
        (!funding?.payout_method_present || !funding?.payout_method_confirmed);
    const fundingCtaLabel = !funding?.payout_method_present
        ? 'Add payout details'
        : 'Verify your payout details';

    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
    const [step, setStep] = useState<1 | 2>(1);
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

    const [termsCoin, setTermsCoin] = useState<Coin | null>(null);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [termsSubmitting, setTermsSubmitting] = useState(false);

    const openTerms = (coin: Coin) => {
        setTermsCoin(coin);
        setTermsAgreed(false);
    };

    const closeTerms = () => {
        setTermsCoin(null);
        setTermsAgreed(false);
    };

    const submitAgreement = () => {
        if (!termsCoin || !termsAgreed) return;
        setTermsSubmitting(true);
        router.post(
            `/borrower/coins/${termsCoin.id}/agree-terms`,
            { agreed: true },
            {
                preserveScroll: true,
                onFinish: () => {
                    setTermsSubmitting(false);
                    closeTerms();
                },
            },
        );
    };

    const today = new Date().toISOString().slice(0, 10);

    const { data, setData, post, processing, errors, reset } = useForm<{
        request: string;
        date: string;
        purchase_order: string;
        purchase_order_file: File | null;
        contract: string;
        request_amount: string;
        source: string;
        duration: string;
        industry: string;
    }>({
        request: '',
        date: today,
        purchase_order: '',
        purchase_order_file: null,
        contract: '',
        request_amount: '',
        source: '',
        duration: '',
        industry: '',
    });
    const formErrors = errors as Record<string, string>;
    const totalCoins = coins.data.length;
    const totalPending = coins.data.filter(
        (c) => c.status === 'pending_review',
    ).length;
    const totalApproved = coins.data.filter(
        (c) => c.status === 'approved',
    ).length;

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};

        if (!data.request.trim()) {
            newErrors.request = 'Request description is required.';
        }
        if (!data.date) {
            newErrors.date = 'Date is required.';
        }
        if (!data.request_amount) {
            newErrors.request_amount = 'Request amount is required.';
        }
        if (!data.duration.trim()) {
            newErrors.duration = 'Duration is required.';
        }
        if (!data.industry.trim()) {
            newErrors.industry = 'Industry is required.';
        }

        setLocalErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const goToNextStep = () => {
        if (step === 1) {
            if (!validateStep1()) return;
            setStep(2);
        }
    };

    const goToPreviousStep = () => {
        if (step === 2) setStep(1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Final check for step 1 required fields
        if (!validateStep1()) {
            setStep(1);
            return;
        }

        post('/borrower/coins', {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setData('date', today);
                setStep(1);
                setActiveTab('list');
                setLocalErrors({});
            },
        });
    };

    const getFieldError = (field: string): string | undefined => {
        return formErrors[field] || localErrors[field];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Coins | Borrower | CreditCo" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                {fundingActionNeeded && (
                    <div className="flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-900 sm:flex-row sm:items-center sm:justify-between dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                        <div>
                            <p className="font-semibold">
                                Action needed to receive funding
                            </p>
                            <p className="mt-0.5 text-[11px] text-sky-800/80 dark:text-sky-100/80">
                                A prospect investor has been matched to one of
                                your coins.{' '}
                                {!funding.payout_method_present
                                    ? 'Add your payout details so funds can be disbursed.'
                                    : 'Verify the payout details you previously entered.'}
                            </p>
                        </div>
                        <Link
                            href="/borrower/payout-method"
                            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sky-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-sky-500"
                        >
                            {fundingCtaLabel}
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                )}

                <Tabs
                    value={activeTab}
                    onValueChange={(value) =>
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
                                As a borrower, you can create coins (funding
                                requests) and track their review status.
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
                                {canCreate ? (
                                    'Create coin'
                                ) : (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Lock className="h-3 w-3" />
                                        Create coin
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Stats */}
                    <div className="mt-3 grid auto-rows-min gap-4 md:grid-cols-3">
                        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Total coins
                                </h2>
                                <LayoutGrid className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                                {totalCoins}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                All funding requests you have submitted.
                            </p>
                        </div>

                        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Pending review
                                </h2>
                                <FileText className="h-4 w-4 text-amber-500" />
                            </div>
                            <p className="mt-3 text-3xl font-semibold text-amber-600 dark:text-amber-300">
                                {totalPending}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                Coins awaiting admin review.
                            </p>
                        </div>

                        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Approved coins
                                </h2>
                                <Coins className="h-4 w-4 text-emerald-500" />
                            </div>
                            <p className="mt-3 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
                                {totalApproved}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                Coins that have passed admin review.
                            </p>
                        </div>
                    </div>

                    {/* Tab: list coins */}
                    <TabsContent
                        value="list"
                        className="mt-4 flex h-full flex-1 flex-col"
                    >
                        <div className="relative min-h-[100vh] flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:min-h-min dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-full w-full flex-col gap-4">
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                        <thead className="bg-slate-50 dark:bg-slate-900">
                                            <tr>
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
                                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                    Terms
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {coins.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                                                    >
                                                        You haven&apos;t created
                                                        any coins yet.
                                                    </td>
                                                </tr>
                                            )}

                                            {coins.data.map((coin) => (
                                                <tr
                                                    key={coin.id}
                                                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="line-clamp-2 text-xs text-slate-900 dark:text-slate-100">
                                                            {coin.request}
                                                        </div>
                                                        <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-500">
                                                            {coin.purchase_order &&
                                                                `PO: ${coin.purchase_order} · `}
                                                            {coin.contract &&
                                                                `Contract: ${coin.contract}`}
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
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {coin.terms ? (
                                                            coin.terms
                                                                .borrower_agreed_at ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                    Agreed
                                                                </span>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    type="button"
                                                                    className="bg-amber-500 text-[11px] text-white hover:bg-amber-400"
                                                                    onClick={() =>
                                                                        openTerms(
                                                                            coin,
                                                                        )
                                                                    }
                                                                >
                                                                    Review &
                                                                    agree
                                                                </Button>
                                                            )
                                                        ) : coin.status ===
                                                          'approved' ? (
                                                            <span className="text-[10px] text-slate-500">
                                                                Pending admin
                                                                terms
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400">
                                                                —
                                                            </span>
                                                        )}
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
                                                            <a
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

                    {/* Tab: create coin (multi-step form) */}
                    <TabsContent
                        value="create"
                        className="mt-4 flex h-full flex-1 flex-col"
                    >
                        {!canCreate && (
                            <div className="relative flex-1 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/5">
                                <div className="mx-auto flex max-w-xl flex-col gap-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                Documents pending verification
                                            </h2>
                                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                                You can create a coin once an
                                                admin has verified all your
                                                onboarding documents. We&apos;ll
                                                notify you as soon as you&apos;re
                                                cleared.
                                            </p>
                                        </div>
                                    </div>

                                    <ul className="grid gap-2 rounded-lg border border-amber-200/60 bg-white p-3 dark:border-amber-500/20 dark:bg-slate-900">
                                        {verification?.documents?.map((doc) => (
                                            <li
                                                key={doc.type}
                                                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5"
                                            >
                                                <span className="text-xs text-slate-700 dark:text-slate-200">
                                                    {doc.label}
                                                </span>
                                                {doc.verified ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Pending
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>

                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Need to update a document? Contact
                                        support and we&apos;ll help replace it.
                                    </p>
                                </div>
                            </div>
                        )}

                        {canCreate && (
                        <div className="relative flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <form
                                onSubmit={handleSubmit}
                                className="mx-auto flex w-full max-w-2xl flex-col gap-6"
                            >
                                {/* Step indicator */}
                                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                                                step === 1
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                            }`}
                                        >
                                            1
                                        </span>
                                        <span>Request details</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                                                step === 2
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                            }`}
                                        >
                                            2
                                        </span>
                                        <span>References & source</span>
                                    </div>
                                </div>

                                {step === 1 && (
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                Request{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <Textarea
                                                rows={4}
                                                value={data.request}
                                                onChange={(e) =>
                                                    setData(
                                                        'request',
                                                        e.target.value,
                                                    )
                                                }
                                                className="border-slate-300 bg-white text-xs focus:border-emerald-500 focus:ring-0 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-emerald-500"
                                                placeholder="Describe what this funding is for (e.g. purchase order, contract fulfilment, working capital, etc.)"
                                            />
                                            {getFieldError('request') && (
                                                <p className="text-[11px] text-red-500">
                                                    {getFieldError('request')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    Request amount (ZMW){' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={data.request_amount}
                                                    onChange={(e) =>
                                                        setData(
                                                            'request_amount',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-9 text-xs"
                                                    placeholder="e.g. 250000"
                                                />
                                                {getFieldError(
                                                    'request_amount',
                                                ) && (
                                                    <p className="text-[11px] text-red-500">
                                                        {getFieldError(
                                                            'request_amount',
                                                        )}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    Date{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={data.date}
                                                    onChange={(e) =>
                                                        setData(
                                                            'date',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-9 text-xs"
                                                />
                                                {getFieldError('date') && (
                                                    <p className="text-[11px] text-red-500">
                                                        {getFieldError('date')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    Duration{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={data.duration}
                                                    onChange={(e) =>
                                                        setData(
                                                            'duration',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-9 text-xs"
                                                    placeholder="e.g. 30 days, 90 days"
                                                />
                                                {getFieldError('duration') && (
                                                    <p className="text-[11px] text-red-500">
                                                        {getFieldError(
                                                            'duration',
                                                        )}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    Industry{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={data.industry}
                                                    onChange={(e) =>
                                                        setData(
                                                            'industry',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-9 text-xs"
                                                    placeholder="e.g. Construction, FMCG, Transport"
                                                />
                                                {getFieldError('industry') && (
                                                    <p className="text-[11px] text-red-500">
                                                        {getFieldError(
                                                            'industry',
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    Purchase order (PO)
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={data.purchase_order}
                                                    onChange={(e) =>
                                                        setData(
                                                            'purchase_order',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-9 text-xs"
                                                    placeholder="PO number or reference (if applicable)"
                                                />
                                                {errors.purchase_order && (
                                                    <p className="text-[11px] text-red-500">
                                                        {errors.purchase_order}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    Upload PO document
                                                </label>
                                                <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-[11px] text-slate-600 transition hover:border-emerald-500 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-slate-100">
                                                    <FileText className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="truncate">
                                                        {data.purchase_order_file
                                                            ? data
                                                                  .purchase_order_file
                                                                  .name
                                                            : 'Upload PO file (PDF or image)'}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept=".pdf,image/*"
                                                        className="hidden"
                                                        onChange={(e) =>
                                                            setData(
                                                                'purchase_order_file',
                                                                e.target
                                                                    .files?.[0] ??
                                                                    null,
                                                            )
                                                        }
                                                    />
                                                </label>
                                                {data.purchase_order_file && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setData(
                                                                'purchase_order_file',
                                                                null,
                                                            )
                                                        }
                                                        className="text-[10px] text-slate-500 underline underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                    >
                                                        Remove file
                                                    </button>
                                                )}
                                                {errors.purchase_order_file && (
                                                    <p className="text-[11px] text-red-500">
                                                        {
                                                            errors.purchase_order_file
                                                        }
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-slate-500 dark:text-slate-500">
                                                    Skip the PO number — upload
                                                    the document instead.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    Contract
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={data.contract}
                                                    onChange={(e) =>
                                                        setData(
                                                            'contract',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-9 text-xs"
                                                    placeholder="Contract reference (if applicable)"
                                                />
                                                {errors.contract && (
                                                    <p className="text-[11px] text-red-500">
                                                        {errors.contract}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    Source
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={data.source}
                                                    onChange={(e) =>
                                                        setData(
                                                            'source',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-9 text-xs"
                                                    placeholder="e.g. LPO from XYZ, recurrent supplier contract, etc."
                                                />
                                                {errors.source && (
                                                    <p className="text-[11px] text-red-500">
                                                        {errors.source}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                            Once you submit, this coin will be
                                            sent to the CreditCo admin team for
                                            review. You&apos;ll see the status
                                            update on your coins list.
                                        </p>
                                    </div>
                                )}

                                {/* Navigation buttons */}
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <div>
                                        {step === 2 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                                                onClick={goToPreviousStep}
                                            >
                                                <ArrowLeft className="mr-1 h-3 w-3" />
                                                Back
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {step === 1 && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="bg-slate-900 text-xs text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                                onClick={goToNextStep}
                                            >
                                                Next
                                                <ArrowRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        )}

                                        {step === 2 && (
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={processing}
                                                className="bg-emerald-600 text-xs text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                                            >
                                                {processing
                                                    ? 'Submitting...'
                                                    : 'Submit coin'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog
                open={termsCoin !== null}
                onOpenChange={(o) => (o ? null : closeTerms())}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review the commercial terms</DialogTitle>
                        <DialogDescription>
                            CreditCo has set the following terms on your coin.
                            Investors will only see the deal once you agree.
                        </DialogDescription>
                    </DialogHeader>
                    {termsCoin?.terms ? (
                        <div className="space-y-3 text-sm">
                            <div className="rounded-md border bg-muted/30 p-3">
                                <ul className="grid grid-cols-2 gap-2 text-xs">
                                    <li>
                                        <span className="text-muted-foreground">
                                            Principal
                                        </span>
                                        <p className="font-semibold">
                                            ZMW{' '}
                                            {termsCoin.request_amount.toLocaleString()}
                                        </p>
                                    </li>
                                    <li>
                                        <span className="text-muted-foreground">
                                            Interest rate
                                        </span>
                                        <p className="font-semibold">
                                            {termsCoin.terms.interest_rate}%
                                            (annual)
                                        </p>
                                    </li>
                                    <li>
                                        <span className="text-muted-foreground">
                                            Service fee
                                        </span>
                                        <p className="font-semibold">
                                            {termsCoin.terms.service_fee_percent ??
                                                0}
                                            %
                                        </p>
                                    </li>
                                    <li>
                                        <span className="text-muted-foreground">
                                            Duration
                                        </span>
                                        <p className="font-semibold">
                                            {termsCoin.terms.duration_days} days
                                        </p>
                                    </li>
                                    <li>
                                        <span className="text-muted-foreground">
                                            Installments
                                        </span>
                                        <p className="font-semibold">
                                            {
                                                termsCoin.terms
                                                    .installments_count
                                            }{' '}
                                            ×{' '}
                                            {
                                                termsCoin.terms
                                                    .installment_interval_days
                                            }
                                            d
                                        </p>
                                    </li>
                                    <li>
                                        <span className="text-muted-foreground">
                                            Per installment
                                        </span>
                                        <p className="font-semibold">
                                            ZMW{' '}
                                            {termsCoin.terms.installment_amount.toLocaleString()}
                                        </p>
                                    </li>
                                    <li className="col-span-2">
                                        <span className="text-muted-foreground">
                                            Total repayment
                                        </span>
                                        <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                                            ZMW{' '}
                                            {termsCoin.terms.total_repayment_amount.toLocaleString()}
                                        </p>
                                    </li>
                                </ul>
                            </div>

                            {termsCoin.terms.terms_text ? (
                                <div className="rounded-md border bg-muted/30 p-3 text-xs">
                                    <p className="font-medium">Notes</p>
                                    <p className="mt-1 whitespace-pre-line text-muted-foreground">
                                        {termsCoin.terms.terms_text}
                                    </p>
                                </div>
                            ) : null}

                            <label className="flex items-start gap-2 text-xs">
                                <input
                                    type="checkbox"
                                    className="mt-0.5"
                                    checked={termsAgreed}
                                    onChange={(e) =>
                                        setTermsAgreed(e.target.checked)
                                    }
                                />
                                <span>
                                    I have read and agree to these commercial
                                    terms. I understand the loan total and
                                    repayment schedule.
                                </span>
                            </label>
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeTerms}
                            disabled={termsSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitAgreement}
                            disabled={!termsAgreed || termsSubmitting}
                        >
                            {termsSubmitting ? 'Saving…' : 'I agree'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
