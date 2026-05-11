import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    Clock,
    Copy,
    LogOut,
    ShieldCheck,
    Sparkles,
    Upload,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

type Plan = {
    id: number;
    key: string;
    name: string;
    interval: 'month' | 'quarter' | 'year';
    amount: number;
    currency: string;
    meta?: any;
};

type Subscription = {
    id: number;
    status: string;
    renews_at?: string | null;
    grace_ends_at?: string | null;
    plan?: {
        name: string;
        interval: string;
        amount: number;
        currency: string;
    } | null;
} | null;

type LatestPayment = {
    id: number;
    status: string;
    amount: number;
    currency: string;
    gateway?: string | null;
    created_at: string;
    meta?: any;
    pop?: {
        reference?: string | null;
        file_original_name?: string | null;
        uploaded_at?: string | null;
        reviewed_at?: string | null;
        rejection_reason?: string | null;
    } | null;
} | null;

type Bank = {
    account_name: string;
    bank_name: string;
    account_number: string;
    branch: string;
    swift_code: string;
    reference_hint: string;
};

type PageProps = {
    plans: Plan[];
    selectedPlanId?: number | null;
    subscription: Subscription;
    flash?: {
        billing?: {
            ok?: boolean;
            message?: string;
        } | null;
    };
    latestPayment?: LatestPayment;
    gatewayEnabled: boolean;
    bank: Bank;
    pop: {
        max_kb: number;
        mimes: string[];
    };
};

const intervalLabel = (i: Plan['interval']) =>
    i === 'month' ? 'Monthly' : i === 'quarter' ? 'Quarterly' : 'Yearly';

const intervalOrder: Record<Plan['interval'], number> = {
    month: 1,
    quarter: 2,
    year: 3,
};

export default function BillingIndex() {
    const {
        plans,
        selectedPlanId: selectedPlanIdProp,
        subscription,
        flash,
        latestPayment,
        gatewayEnabled,
        bank,
        pop,
    } = usePage<PageProps>().props;

    const sortedPlans = useMemo(
        () =>
            [...plans].sort(
                (a, b) => intervalOrder[a.interval] - intervalOrder[b.interval],
            ),
        [plans],
    );

    const defaultSelected = useMemo(() => {
        if (
            selectedPlanIdProp &&
            sortedPlans.some((plan) => plan.id === selectedPlanIdProp)
        ) {
            return selectedPlanIdProp;
        }

        const yearly = sortedPlans.find((p) => p.interval === 'year');
        return yearly?.id ?? sortedPlans[0]?.id;
    }, [selectedPlanIdProp, sortedPlans]);

    const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>(
        defaultSelected,
    );

    useEffect(() => {
        setSelectedPlanId(defaultSelected);
    }, [defaultSelected]);

    const selectedPlan = useMemo(
        () => sortedPlans.find((p) => p.id === selectedPlanId),
        [sortedPlans, selectedPlanId],
    );

    const isActive = subscription?.status === 'active';
    const modalOpen = !isActive;

    const isAwaitingReview =
        latestPayment?.gateway === 'manual' &&
        latestPayment?.status === 'pending' &&
        !!latestPayment?.pop &&
        !latestPayment?.pop?.reviewed_at;

    const wasRejected =
        latestPayment?.gateway === 'manual' &&
        latestPayment?.status === 'failed' &&
        !!latestPayment?.pop?.rejection_reason;

    const popForm = useForm<{
        plan_id: number | undefined;
        reference: string;
        note: string;
        proof: File | null;
    }>({
        plan_id: selectedPlanId,
        reference: '',
        note: '',
        proof: null,
    });

    useEffect(() => {
        popForm.setData('plan_id', selectedPlanId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPlanId]);

    const onProofChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        popForm.setData('proof', file);
    };

    const submitPop = (event: FormEvent) => {
        event.preventDefault();
        popForm.post('/billing/proof-of-payment', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                popForm.reset('reference', 'note', 'proof');
            },
        });
    };

    const logout = () => {
        router.post('/logout');
    };

    const copy = (value: string) => {
        if (!value) return;
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(value).catch(() => {});
        }
    };

    const acceptedExt = pop.mimes.map((m) => `.${m}`).join(',');
    const maxMb = (pop.max_kb / 1024).toFixed(1);

    return (
        <AppLayout breadcrumbs={[{ title: 'Billing', href: '/billing' }]}>
            <Head title="Billing" />

            <Dialog open={modalOpen}>
                <DialogContent
                    className="max-h-[90vh] max-w-3xl overflow-y-auto bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            Subscription required
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                            Choose a plan, transfer the amount to the bank
                            account below and upload your proof of payment. An
                            admin will review and activate your account.
                        </DialogDescription>
                    </DialogHeader>

                    {flash?.billing?.message && (
                        <div
                            className={cn(
                                'rounded-xl border p-3 text-sm',
                                flash.billing.ok
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                                    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
                            )}
                        >
                            {flash.billing.message}
                        </div>
                    )}

                    {isAwaitingReview && (
                        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                                <p className="font-semibold">
                                    Awaiting admin approval
                                </p>
                                <p className="mt-0.5 text-[11px]">
                                    We received your proof of payment uploaded
                                    on {latestPayment?.pop?.uploaded_at}. You'll
                                    get access as soon as an admin approves it.
                                </p>
                            </div>
                        </div>
                    )}

                    {wasRejected && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                                <p className="font-semibold">
                                    Previous submission rejected
                                </p>
                                <p className="mt-0.5 text-[11px]">
                                    {latestPayment?.pop?.rejection_reason}
                                </p>
                                <p className="mt-1 text-[11px]">
                                    Please correct the issue and resubmit your
                                    proof of payment below.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                        {sortedPlans.map((plan) => {
                            const active = plan.id === selectedPlanId;
                            const isYearly = plan.interval === 'year';

                            return (
                                <button
                                    key={plan.id}
                                    type="button"
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={cn(
                                        'rounded-2xl border p-4 text-left shadow-sm transition',
                                        'bg-white dark:bg-slate-900',
                                        active
                                            ? 'border-slate-900 ring-2 ring-slate-900 dark:border-slate-200 dark:ring-slate-200'
                                            : 'border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold">
                                                {intervalLabel(plan.interval)}
                                            </p>
                                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                {plan.name} Plan
                                            </p>
                                        </div>

                                        {isYearly && (
                                            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white dark:bg-slate-100 dark:text-slate-900">
                                                Best value
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-2xl font-semibold">
                                            {plan.currency}{' '}
                                            {plan.amount.toLocaleString()}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                            Billed{' '}
                                            {intervalLabel(
                                                plan.interval,
                                            ).toLowerCase()}
                                        </p>
                                    </div>

                                    {plan.meta?.features?.length ? (
                                        <ul className="mt-4 grid gap-2 text-[11px] text-slate-700 dark:text-slate-200">
                                            {plan.meta.features
                                                .slice(0, 4)
                                                .map(
                                                    (
                                                        f: string,
                                                        idx: number,
                                                    ) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                            <span>{f}</span>
                                                        </li>
                                                    ),
                                                )}
                                        </ul>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>

                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-start gap-3">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                            <div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                    Online payment gateway — coming soon
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                                    Card and mobile-money checkout will be
                                    enabled shortly. For now, please pay by bank
                                    transfer and upload your proof of payment.
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            disabled
                            className="mt-3 w-full cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                        >
                            Pay with card / mobile money (coming soon)
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                    1. Transfer to this account
                                </h3>
                            </div>

                            <dl className="mt-3 space-y-2 text-[11px]">
                                <BankRow
                                    label="Account name"
                                    value={bank.account_name}
                                    onCopy={copy}
                                />
                                <BankRow
                                    label="Bank"
                                    value={bank.bank_name}
                                    onCopy={copy}
                                />
                                <BankRow
                                    label="Account number"
                                    value={bank.account_number}
                                    onCopy={copy}
                                />
                                <BankRow
                                    label="Branch"
                                    value={bank.branch}
                                    onCopy={copy}
                                />
                                <BankRow
                                    label="SWIFT"
                                    value={bank.swift_code}
                                    onCopy={copy}
                                />
                                {selectedPlan && (
                                    <BankRow
                                        label="Amount"
                                        value={`${selectedPlan.currency} ${selectedPlan.amount.toLocaleString()}`}
                                        onCopy={copy}
                                    />
                                )}
                            </dl>

                            <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                                {bank.reference_hint}
                            </p>
                        </div>

                        <form
                            onSubmit={submitPop}
                            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                    2. Upload proof of payment
                                </h3>
                            </div>

                            <div className="mt-3 grid gap-3">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="reference"
                                        className="text-[11px]"
                                    >
                                        Bank transfer reference
                                    </Label>
                                    <Input
                                        id="reference"
                                        name="reference"
                                        type="text"
                                        placeholder="e.g. TRX-9281 or your email"
                                        className="text-xs"
                                        value={popForm.data.reference}
                                        onChange={(e) =>
                                            popForm.setData(
                                                'reference',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {popForm.errors.reference && (
                                        <p className="text-[11px] text-red-600 dark:text-red-400">
                                            {popForm.errors.reference}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="proof"
                                        className="text-[11px]"
                                    >
                                        Receipt or screenshot
                                    </Label>
                                    <Input
                                        id="proof"
                                        name="proof"
                                        type="file"
                                        accept={acceptedExt}
                                        className="text-xs"
                                        onChange={onProofChange}
                                    />
                                    <p className="text-[10px] text-slate-500 dark:text-slate-500">
                                        {pop.mimes
                                            .map((m) => m.toUpperCase())
                                            .join(', ')}{' '}
                                        · max {maxMb} MB
                                    </p>
                                    {popForm.errors.proof && (
                                        <p className="text-[11px] text-red-600 dark:text-red-400">
                                            {popForm.errors.proof}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="note"
                                        className="text-[11px]"
                                    >
                                        Note (optional)
                                    </Label>
                                    <Textarea
                                        id="note"
                                        name="note"
                                        rows={2}
                                        placeholder="Anything the admin should know about this payment"
                                        className="text-xs"
                                        value={popForm.data.note}
                                        onChange={(e) =>
                                            popForm.setData(
                                                'note',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                {popForm.errors.plan_id && (
                                    <p className="text-[11px] text-red-600 dark:text-red-400">
                                        {popForm.errors.plan_id}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={
                                        popForm.processing ||
                                        !selectedPlan ||
                                        !popForm.data.proof
                                    }
                                    className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                >
                                    {popForm.processing
                                        ? 'Uploading...'
                                        : 'Submit for approval'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={logout}
                            className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                <h1 className="text-lg font-semibold">Billing</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage your plan and payment status.
                </p>
                {!gatewayEnabled && (
                    <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                        Online checkout is coming soon. Subscriptions are
                        currently activated by uploading a bank-transfer proof
                        of payment for an admin to review.
                    </p>
                )}
            </div>
        </AppLayout>
    );
}

function BankRow({
    label,
    value,
    onCopy,
}: {
    label: string;
    value: string;
    onCopy: (value: string) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0 dark:border-slate-800">
            <div>
                <dt className="text-[10px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-500">
                    {label}
                </dt>
                <dd className="mt-0.5 font-mono text-xs text-slate-900 dark:text-slate-100">
                    {value}
                </dd>
            </div>
            <button
                type="button"
                onClick={() => onCopy(value)}
                className="rounded-md border border-slate-200 p-1 text-slate-500 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100"
                title={`Copy ${label}`}
            >
                <Copy className="h-3 w-3" />
            </button>
        </div>
    );
}
