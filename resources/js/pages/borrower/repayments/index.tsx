import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    CalendarDays,
    CheckCircle2,
    Clock,
    FileText,
    Receipt,
    Upload,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type RepaymentHistory = {
    id: number;
    installment_number: number;
    amount: number;
    paid_at: string | null;
    reference: string | null;
    note: string | null;
    status: 'pending_verification' | 'verified' | 'rejected' | string;
    rejection_reason: string | null;
    verified_at: string | null;
    verifier_name: string | null;
    has_proof: boolean;
    proof_original_name: string | null;
    created_at: string | null;
};

type Loan = {
    id: number;
    coin_id: number;
    coin_request: string | null;
    industry: string | null;
    funded_amount: number;
    installments_count: number;
    installments_paid: number;
    installments_remaining: number;
    installment_amount: number;
    installment_interval_days: number;
    next_payment_due_at: string | null;
    is_fully_repaid: boolean;
    has_pending: boolean;
    history: RepaymentHistory[];
};

type Pop = { max_kb: number; mimes: string[] };

type PageProps = {
    loans: Loan[];
    pop: Pop;
    flash?: { success?: string; error?: string };
};

const statusBadge: Record<string, string> = {
    pending_verification:
        'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
    verified:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300',
};

const statusLabel: Record<string, string> = {
    pending_verification: 'Pending verification',
    verified: 'Verified',
    rejected: 'Rejected',
};

function formatMoney(amount: number) {
    return `ZMW ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function isOverdue(dateStr: string | null) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(new Date().toDateString());
}

export default function BorrowerRepaymentsIndex() {
    const { loans, pop, flash } = usePage<PageProps>().props;

    const [openLoan, setOpenLoan] = useState<Loan | null>(null);

    const today = new Date().toISOString().slice(0, 10);

    const { data, setData, post, processing, errors, reset } = useForm<{
        coin_interest_id: number | string;
        amount: string;
        paid_at: string;
        reference: string;
        note: string;
        proof: File | null;
    }>({
        coin_interest_id: '',
        amount: '',
        paid_at: today,
        reference: '',
        note: '',
        proof: null,
    });

    const totals = {
        active: loans.filter((l) => !l.is_fully_repaid).length,
        repaid: loans.filter((l) => l.is_fully_repaid).length,
        upcoming: loans
            .filter((l) => !l.is_fully_repaid && l.next_payment_due_at)
            .reduce((sum, l) => sum + l.installment_amount, 0),
        overdue: loans.filter(
            (l) => !l.is_fully_repaid && isOverdue(l.next_payment_due_at),
        ).length,
    };

    const openForm = (loan: Loan) => {
        if (loan.has_pending) return;
        setOpenLoan(loan);
        setData({
            coin_interest_id: loan.id,
            amount: loan.installment_amount.toFixed(2),
            paid_at: today,
            reference: '',
            note: '',
            proof: null,
        });
    };

    const closeForm = () => {
        setOpenLoan(null);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/borrower/repayments', {
            forceFormData: true,
            onSuccess: () => {
                closeForm();
            },
        });
    };

    const formErrors = errors as Record<string, string>;
    const acceptAttribute = pop.mimes.map((m) => `.${m}`).join(',');

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Repayments', href: '/borrower/repayments' },
            ]}
        >
            <Head title="Repayments" />

            <div className="flex flex-col gap-4 p-4">
                {flash?.success ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {flash.success}
                    </div>
                ) : null}
                {flash?.error ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        {flash.error}
                    </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <SummaryStat
                        icon={Receipt}
                        label="Active loans"
                        value={totals.active.toString()}
                    />
                    <SummaryStat
                        icon={Banknote}
                        label="Next installment"
                        value={formatMoney(totals.upcoming)}
                    />
                    <SummaryStat
                        icon={AlertTriangle}
                        label="Overdue loans"
                        value={totals.overdue.toString()}
                        tone={totals.overdue > 0 ? 'danger' : 'default'}
                    />
                    <SummaryStat
                        icon={CheckCircle2}
                        label="Fully repaid"
                        value={totals.repaid.toString()}
                        tone="success"
                    />
                </div>

                {loans.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                            <Receipt className="size-8 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                No funded coins yet
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Once an investor funds one of your coins, the
                                repayment schedule will appear here.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {loans.map((loan) => (
                            <LoanCard
                                key={loan.id}
                                loan={loan}
                                onRecord={() => openForm(loan)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Dialog
                open={openLoan !== null}
                onOpenChange={(open) => (open ? null : closeForm())}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record a repayment</DialogTitle>
                        <DialogDescription>
                            Submit proof that you paid this installment. CreditCo
                            will verify and confirm receipt.
                        </DialogDescription>
                    </DialogHeader>

                    {openLoan ? (
                        <form
                            onSubmit={submit}
                            className="space-y-4"
                            encType="multipart/form-data"
                        >
                            <div className="rounded-md border bg-muted/30 p-3 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Coin
                                    </span>
                                    <span className="font-medium">
                                        #{openLoan.coin_id}
                                    </span>
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className="text-muted-foreground">
                                        Installment
                                    </span>
                                    <span className="font-medium">
                                        #{openLoan.installments_paid + 1} of{' '}
                                        {openLoan.installments_count}
                                    </span>
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className="text-muted-foreground">
                                        Scheduled amount
                                    </span>
                                    <span className="font-medium">
                                        {formatMoney(openLoan.installment_amount)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Amount paid (ZMW)
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    value={data.amount}
                                    onChange={(e) =>
                                        setData('amount', e.target.value)
                                    }
                                    required
                                />
                                {formErrors.amount ? (
                                    <p className="mt-1 text-xs text-red-600">
                                        {formErrors.amount}
                                    </p>
                                ) : null}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-medium">
                                        Date paid
                                    </label>
                                    <Input
                                        type="date"
                                        value={data.paid_at}
                                        max={today}
                                        onChange={(e) =>
                                            setData('paid_at', e.target.value)
                                        }
                                        required
                                    />
                                    {formErrors.paid_at ? (
                                        <p className="mt-1 text-xs text-red-600">
                                            {formErrors.paid_at}
                                        </p>
                                    ) : null}
                                </div>
                                <div>
                                    <label className="text-xs font-medium">
                                        Reference (optional)
                                    </label>
                                    <Input
                                        value={data.reference}
                                        onChange={(e) =>
                                            setData('reference', e.target.value)
                                        }
                                        placeholder="Bank ref / mobile money txn"
                                    />
                                    {formErrors.reference ? (
                                        <p className="mt-1 text-xs text-red-600">
                                            {formErrors.reference}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Note (optional)
                                </label>
                                <Textarea
                                    rows={2}
                                    value={data.note}
                                    onChange={(e) =>
                                        setData('note', e.target.value)
                                    }
                                    placeholder="Anything we should know about this payment"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Proof of payment
                                </label>
                                <div className="rounded-md border border-dashed p-3">
                                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                                        <Upload className="size-4 text-muted-foreground" />
                                        <span className="truncate">
                                            {data.proof
                                                ? data.proof.name
                                                : `Upload ${pop.mimes.join(', ')} (max ${Math.round(pop.max_kb / 1024)} MB)`}
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept={acceptAttribute}
                                            onChange={(e) =>
                                                setData(
                                                    'proof',
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                                {formErrors.proof ? (
                                    <p className="mt-1 text-xs text-red-600">
                                        {formErrors.proof}
                                    </p>
                                ) : null}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeForm}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Submitting…' : 'Submit repayment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function SummaryStat({
    icon: Icon,
    label,
    value,
    tone = 'default',
}: {
    icon: typeof Receipt;
    label: string;
    value: string;
    tone?: 'default' | 'success' | 'danger';
}) {
    const toneClass =
        tone === 'success'
            ? 'text-emerald-600 dark:text-emerald-400'
            : tone === 'danger'
              ? 'text-red-600 dark:text-red-400'
              : 'text-foreground';

    return (
        <Card className="gap-2 py-4">
            <CardContent className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {label}
                    </p>
                    <p className={`truncate text-xl font-semibold ${toneClass}`}>
                        {value}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function LoanCard({
    loan,
    onRecord,
}: {
    loan: Loan;
    onRecord: () => void;
}) {
    const overdue = !loan.is_fully_repaid && isOverdue(loan.next_payment_due_at);
    const progressPct = loan.installments_count
        ? Math.round((loan.installments_paid / loan.installments_count) * 100)
        : 0;

    return (
        <Card>
            <CardHeader className="gap-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                            {loan.coin_request ?? 'Coin'}
                        </CardTitle>
                        <p className="truncate text-xs text-muted-foreground">
                            Coin #{loan.coin_id}
                            {loan.industry ? ` · ${loan.industry}` : ''}
                        </p>
                    </div>
                    {loan.is_fully_repaid ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <CheckCircle2 className="size-3" />
                            Repaid
                        </span>
                    ) : overdue ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-500/10 dark:text-red-300">
                            <AlertTriangle className="size-3" />
                            Overdue
                        </span>
                    ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800 dark:bg-sky-500/10 dark:text-sky-300">
                            <Clock className="size-3" />
                            Active
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <Detail label="Funded" value={formatMoney(loan.funded_amount)} />
                    <Detail
                        label="Installment"
                        value={formatMoney(loan.installment_amount)}
                    />
                    <Detail
                        label="Progress"
                        value={`${loan.installments_paid}/${loan.installments_count}`}
                    />
                    <Detail
                        label="Next due"
                        value={
                            loan.is_fully_repaid
                                ? '—'
                                : (loan.next_payment_due_at ?? '—')
                        }
                        tone={overdue ? 'danger' : undefined}
                    />
                </div>

                <div className="space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        {progressPct}% repaid
                    </p>
                </div>

                {!loan.is_fully_repaid ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={onRecord}
                            disabled={loan.has_pending}
                        >
                            <Receipt className="mr-1 size-4" />
                            Record payment
                        </Button>
                        {loan.has_pending ? (
                            <span className="text-xs text-muted-foreground">
                                Awaiting verification of last submission
                            </span>
                        ) : null}
                    </div>
                ) : null}

                {loan.history.length > 0 ? (
                    <div className="space-y-2">
                        <h4 className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <CalendarDays className="size-3" />
                            History
                        </h4>
                        <ul className="space-y-1.5">
                            {loan.history.slice(0, 5).map((h) => (
                                <li
                                    key={h.id}
                                    className="flex items-start justify-between gap-2 rounded-md border px-2 py-1.5 text-xs"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium">
                                            #{h.installment_number} ·{' '}
                                            {formatMoney(h.amount)}
                                        </p>
                                        <p className="truncate text-[10px] text-muted-foreground">
                                            Paid {h.paid_at ?? '—'}
                                            {h.reference
                                                ? ` · Ref ${h.reference}`
                                                : ''}
                                        </p>
                                        {h.status === 'rejected' &&
                                        h.rejection_reason ? (
                                            <p className="mt-0.5 flex items-start gap-1 text-[10px] text-red-600 dark:text-red-400">
                                                <XCircle className="size-3 shrink-0" />
                                                {h.rejection_reason}
                                            </p>
                                        ) : null}
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                                            statusBadge[h.status] ??
                                            'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {statusLabel[h.status] ?? h.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

function Detail({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone?: 'danger';
}) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p
                className={`text-sm font-medium ${
                    tone === 'danger' ? 'text-red-600 dark:text-red-400' : ''
                }`}
            >
                {value}
            </p>
        </div>
    );
}
