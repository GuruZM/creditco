import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    LoaderCircle,
    Lock,
    ShieldCheck,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

type FundingStatus =
    | 'interested'
    | 'funding_initiated'
    | 'awaiting_admin_funding'
    | 'payout_verified'
    | 'funded'
    | string;

type CoinTerms = {
    interest_rate: number | null;
    service_fee_percent: number | null;
    duration_days: number | null;
    installments_count: number | null;
    installment_interval_days: number | null;
    total_repayment_amount: number | null;
    installment_amount: number | null;
    terms_text: string | null;
    borrower_agreed_at: string | null;
};

type Coin = {
    id: number;
    request: string;
    request_amount: number;
    duration: string | null;
    industry: string | null;
    borrower_company: string | null;
    terms: CoinTerms;
};

type Interest = {
    id: number;
    investor_name: string | null;
    investor_email: string | null;
    note: string | null;
    funding_status: FundingStatus;
    funding_started_at: string | null;
    investor_agreed_at: string | null;
    funded_at: string | null;
    funded_by_name: string | null;
    funded_amount: number | null;
    installments_count: number | null;
    installment_amount: number | null;
    installment_interval_days: number | null;
    next_payment_due_at: string | null;
};

type PayoutMethod = {
    id: number;
    kind: 'bank' | 'mobile_money';
    account_name: string;
    bank_name: string | null;
    account_number: string | null;
    branch: string | null;
    mobile_provider: string | null;
    mobile_number: string | null;
    borrower_confirmed_at: string | null;
    admin_verified_at: string | null;
};

type PageProps = {
    coin: Coin;
    interest: Interest;
    payout_method: PayoutMethod | null;
};

const STEP_ORDER: FundingStatus[] = [
    'funding_initiated',
    'awaiting_admin_funding',
    'payout_verified',
    'funded',
];

const stepIndex = (status: FundingStatus): number =>
    STEP_ORDER.indexOf(status);

export default function FundingWizardPage() {
    const { coin, interest, payout_method } = usePage<PageProps>().props;

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Coins', href: '/admin/coins' },
        {
            title: `Funding — coin #${coin.id}`,
            href: `/admin/coins/${coin.id}/interests/${interest.id}/funding`,
        },
    ];

    const [submitting, setSubmitting] = useState<'verify' | 'fund' | null>(
        null,
    );

    const verifyPayout = () => {
        setSubmitting('verify');
        router.post(
            `/admin/coins/${coin.id}/interests/${interest.id}/funding/verify-payout`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(null),
            },
        );
    };

    const fundForm = useForm<{ first_payment_at: string }>({
        first_payment_at: '',
    });

    const submitFund = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting('fund');
        fundForm.post(
            `/admin/coins/${coin.id}/interests/${interest.id}/funding/disburse`,
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(null),
            },
        );
    };

    const isPayoutReady =
        stepIndex(interest.funding_status) >= stepIndex('awaiting_admin_funding');
    const isPayoutVerified =
        stepIndex(interest.funding_status) >= stepIndex('payout_verified');
    const isFunded =
        stepIndex(interest.funding_status) >= stepIndex('funded');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Funding — coin #${coin.id}`} />

            <div className="flex flex-col gap-4 rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-semibold md:text-xl">
                            Funding workflow
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Coin #{coin.id} · {coin.borrower_company} · ZMW{' '}
                            {coin.request_amount.toLocaleString()} ·{' '}
                            {coin.duration}
                        </p>
                    </div>
                    <a
                        href="/admin/coins"
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Back to coins
                    </a>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">
                        Investor
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {interest.investor_name || 'Investor'}
                    </p>
                    {interest.investor_email && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-500">
                            {interest.investor_email}
                        </p>
                    )}
                    {interest.note && (
                        <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                            “{interest.note}”
                        </p>
                    )}
                </div>

                {/* Step 1: Verify banking details */}
                <Step
                    number={1}
                    title="Verify payout details"
                    icon={ShieldCheck}
                    locked={!isPayoutReady}
                    completed={isPayoutVerified}
                    completedHint={
                        payout_method?.admin_verified_at
                            ? `Verified on ${payout_method.admin_verified_at}`
                            : undefined
                    }
                    body={
                        !isPayoutReady ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Waiting for the borrower to add and confirm
                                their payout details. We&apos;ll notify you when
                                they&apos;re ready.
                            </p>
                        ) : payout_method ? (
                            <div className="space-y-3 text-xs">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Cross-check these details with the borrower
                                    before verifying. Once verified, the
                                    borrower can&apos;t edit them without
                                    re-confirming.
                                </p>

                                <dl className="grid gap-2 sm:grid-cols-2">
                                    <Field
                                        label="Account type"
                                        value={
                                            payout_method.kind === 'bank'
                                                ? 'Bank account'
                                                : 'Mobile money'
                                        }
                                    />
                                    <Field
                                        label="Account holder"
                                        value={payout_method.account_name}
                                    />
                                    {payout_method.kind === 'bank' ? (
                                        <>
                                            <Field
                                                label="Bank"
                                                value={payout_method.bank_name}
                                            />
                                            <Field
                                                label="Account number"
                                                value={
                                                    payout_method.account_number
                                                }
                                            />
                                            <Field
                                                label="Branch"
                                                value={
                                                    payout_method.branch ||
                                                    'Not provided'
                                                }
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Field
                                                label="Provider"
                                                value={payout_method.mobile_provider?.toUpperCase()}
                                            />
                                            <Field
                                                label="Mobile number"
                                                value={
                                                    payout_method.mobile_number
                                                }
                                            />
                                        </>
                                    )}
                                    <Field
                                        label="Borrower confirmed"
                                        value={
                                            payout_method.borrower_confirmed_at ||
                                            'Not yet'
                                        }
                                    />
                                </dl>

                                {!isPayoutVerified && (
                                    <div className="pt-2">
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 text-xs text-white hover:bg-emerald-500"
                                            onClick={verifyPayout}
                                            disabled={submitting !== null}
                                        >
                                            {submitting === 'verify' ? (
                                                <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                            )}
                                            Verify payout details
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                The borrower has not yet submitted any payout
                                details.
                            </p>
                        )
                    }
                />

                {/* Step 2: Agreed terms (read-only) */}
                <Step
                    number={2}
                    title="Commercial terms (already agreed)"
                    icon={ClipboardCheck}
                    locked={false}
                    completed={
                        coin.terms.borrower_agreed_at !== null &&
                        interest.investor_agreed_at !== null
                    }
                    completedHint={
                        coin.terms.borrower_agreed_at
                            ? `Borrower agreed ${coin.terms.borrower_agreed_at}; investor agreed ${interest.investor_agreed_at ?? '—'}`
                            : undefined
                    }
                    body={
                        <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                <Field
                                    label="Interest rate"
                                    value={
                                        coin.terms.interest_rate !== null
                                            ? `${coin.terms.interest_rate}% annual`
                                            : null
                                    }
                                />
                                <Field
                                    label="Service fee"
                                    value={
                                        coin.terms.service_fee_percent !== null
                                            ? `${coin.terms.service_fee_percent}%`
                                            : '0%'
                                    }
                                />
                                <Field
                                    label="Duration"
                                    value={
                                        coin.terms.duration_days
                                            ? `${coin.terms.duration_days} days`
                                            : null
                                    }
                                />
                                <Field
                                    label="Installments"
                                    value={
                                        coin.terms.installments_count
                                            ? `${coin.terms.installments_count} × ${coin.terms.installment_interval_days}d`
                                            : null
                                    }
                                />
                                <Field
                                    label="Total repayment"
                                    value={
                                        coin.terms.total_repayment_amount
                                            ? `ZMW ${coin.terms.total_repayment_amount.toLocaleString()}`
                                            : null
                                    }
                                />
                                <Field
                                    label="Per installment"
                                    value={
                                        coin.terms.installment_amount
                                            ? `ZMW ${coin.terms.installment_amount.toLocaleString()}`
                                            : null
                                    }
                                />
                            </div>
                            <ul className="grid gap-1 text-[11px]">
                                <li>
                                    Borrower agreement:{' '}
                                    {coin.terms.borrower_agreed_at ? (
                                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                            ✓ {coin.terms.borrower_agreed_at}
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                                            Awaiting borrower
                                        </span>
                                    )}
                                </li>
                                <li>
                                    Investor agreement:{' '}
                                    {interest.investor_agreed_at ? (
                                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                            ✓ {interest.investor_agreed_at}
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                                            Awaiting investor
                                        </span>
                                    )}
                                </li>
                            </ul>
                        </div>
                    }
                />

                {/* Step 3: Fund */}
                <Step
                    number={3}
                    title="Fund the borrower"
                    icon={Banknote}
                    locked={!isPayoutVerified}
                    completed={isFunded}
                    completedHint={
                        interest.funded_at
                            ? `Funded on ${interest.funded_at}${
                                  interest.funded_by_name
                                      ? ' by ' + interest.funded_by_name
                                      : ''
                              } · ZMW ${interest.funded_amount?.toLocaleString()}`
                            : undefined
                    }
                    body={
                        !isPayoutVerified ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Verify payout details first.
                            </p>
                        ) : !isFunded ? (
                            <form
                                onSubmit={submitFund}
                                className="space-y-3 text-xs"
                            >
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Send ZMW{' '}
                                    {coin.request_amount.toLocaleString()} to
                                    the borrower&apos;s payout account, then
                                    record the funding here so the repayment
                                    countdown starts.
                                </p>

                                <div className="grid gap-1.5 sm:max-w-xs">
                                    <Label className="text-xs text-slate-700 dark:text-slate-200">
                                        First payment due (optional)
                                    </Label>
                                    <Input
                                        type="date"
                                        value={fundForm.data.first_payment_at}
                                        onChange={(e) =>
                                            fundForm.setData(
                                                'first_payment_at',
                                                e.target.value,
                                            )
                                        }
                                        className="h-9 text-xs"
                                    />
                                    {fundForm.errors.first_payment_at && (
                                        <p className="text-[11px] text-red-500">
                                            {fundForm.errors.first_payment_at}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-emerald-600 text-xs text-white hover:bg-emerald-500"
                                    disabled={
                                        submitting !== null ||
                                        fundForm.processing
                                    }
                                >
                                    {submitting === 'fund' ||
                                    fundForm.processing ? (
                                        <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                        <Banknote className="mr-1 h-3 w-3" />
                                    )}
                                    Record funding & start countdown
                                </Button>
                            </form>
                        ) : null
                    }
                />

                {/* Step 4: Countdown */}
                <Step
                    number={4}
                    title="Repayment countdown"
                    icon={Clock}
                    locked={!isFunded}
                    completed={false}
                    body={
                        !isFunded ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                The countdown starts once funding is recorded.
                            </p>
                        ) : (
                            <div className="grid gap-2 text-xs sm:grid-cols-2">
                                <Field
                                    label="Funded amount"
                                    value={
                                        interest.funded_amount
                                            ? `ZMW ${interest.funded_amount.toLocaleString()}`
                                            : null
                                    }
                                />
                                <Field
                                    label="Installments"
                                    value={
                                        interest.installments_count
                                            ? `${interest.installments_count} × ZMW ${interest.installment_amount?.toLocaleString()}`
                                            : null
                                    }
                                />
                                <Field
                                    label="Interval"
                                    value={
                                        interest.installment_interval_days
                                            ? `${interest.installment_interval_days} days`
                                            : null
                                    }
                                />
                                <Field
                                    label="Next payment due"
                                    value={interest.next_payment_due_at}
                                />
                            </div>
                        )
                    }
                />
            </div>
        </AppLayout>
    );
}

function Step({
    number,
    title,
    icon: Icon,
    locked,
    completed,
    completedHint,
    body,
}: {
    number: number;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    locked: boolean;
    completed: boolean;
    completedHint?: string;
    body: React.ReactNode;
}) {
    return (
        <div
            className={[
                'rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900',
                completed
                    ? 'border-emerald-200 dark:border-emerald-500/40'
                    : locked
                      ? 'border-slate-200 opacity-60 dark:border-slate-800'
                      : 'border-slate-200 dark:border-slate-800',
            ].join(' ')}
        >
            <div className="flex items-start gap-3">
                <div
                    className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        completed
                            ? 'bg-emerald-600 text-white'
                            : locked
                              ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                              : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
                    ].join(' ')}
                >
                    {completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : locked ? (
                        <Lock className="h-3.5 w-3.5" />
                    ) : (
                        <Icon className="h-4 w-4" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            Step {number} · {title}
                        </p>
                        {completedHint && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-500">
                                {completedHint}
                            </p>
                        )}
                    </div>
                    <div className="mt-3">{body}</div>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div>
            <dt className="text-[10px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-500">
                {label}
            </dt>
            <dd className="mt-0.5 text-slate-800 dark:text-slate-100">
                {value || '—'}
            </dd>
        </div>
    );
}
