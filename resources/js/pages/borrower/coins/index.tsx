import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Coins,
    FileText,
    LayoutGrid,
} from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

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
    const { coins } = usePage<PageProps>().props;

    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
    const [step, setStep] = useState<1 | 2>(1);
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

    const { data, setData, post, processing, errors, reset } = useForm({
        request: '',
        date: '',
        purchase_order: '',
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
            onSuccess: () => {
                reset();
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
                                Create coin
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
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
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
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {coins.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
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
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
