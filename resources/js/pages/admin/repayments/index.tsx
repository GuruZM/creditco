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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    FileText,
    Receipt,
    Search,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

type StatusFilter = 'pending_verification' | 'verified' | 'rejected';

type RepaymentItem = {
    id: number;
    amount: number;
    currency: string;
    status: string;
    installment_number: number;
    paid_at: string | null;
    reference: string | null;
    note: string | null;
    rejection_reason: string | null;
    has_proof: boolean;
    proof_original_name: string | null;
    created_at: string | null;
    verified_at: string | null;
    verifier_name: string | null;
    submitter: { id: number; name: string; email: string } | null;
    interest: {
        id: number;
        installments_count: number;
        installments_paid: number;
        installment_amount: number;
        funded_amount: number;
        next_payment_due_at: string | null;
    } | null;
    coin: {
        id: number;
        request: string | null;
        borrower_company: string | null;
    } | null;
    investor_name: string | null;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

type PageProps = {
    repayments: Paginated<RepaymentItem>;
    filters: { status: StatusFilter; search: string };
    counts: {
        pending_verification: number;
        verified: number;
        rejected: number;
    };
    flash?: { success?: string; error?: string };
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Repayments', href: '/admin/repayments' },
];

function formatMoney(amount: number, currency: string) {
    return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function AdminRepaymentsIndex() {
    const { repayments, filters, counts, flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search || '');

    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [selected, setSelected] = useState<RepaymentItem | null>(null);
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState<string | null>(null);

    const switchTab = (status: StatusFilter) => {
        router.get(
            '/admin/repayments',
            { status, search },
            { preserveState: true, replace: true },
        );
    };

    const applySearch = () => {
        router.get(
            '/admin/repayments',
            { status: filters.status, search },
            { preserveState: true, replace: true },
        );
    };

    const openApprove = (item: RepaymentItem) => {
        setSelected(item);
        setApproveOpen(true);
    };

    const openReject = (item: RepaymentItem) => {
        setSelected(item);
        setReason('');
        setReasonError(null);
        setRejectOpen(true);
    };

    const submitApprove = () => {
        if (!selected) return;
        router.post(
            `/admin/repayments/${selected.id}/approve`,
            {},
            {
                onFinish: () => {
                    setApproveOpen(false);
                    setSelected(null);
                },
            },
        );
    };

    const submitReject = () => {
        if (!selected) return;
        if (reason.trim().length < 3) {
            setReasonError('Please give a reason (min 3 characters).');
            return;
        }

        router.post(
            `/admin/repayments/${selected.id}/reject`,
            { reason },
            {
                onError: (errors) => {
                    if (errors.reason) setReasonError(errors.reason);
                },
                onSuccess: () => {
                    setRejectOpen(false);
                    setSelected(null);
                    setReason('');
                    setReasonError(null);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Repayments | CreditCo" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
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

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <StatTile
                        label="Pending verification"
                        value={counts.pending_verification}
                        icon={<Clock className="h-4 w-4 text-amber-500" />}
                        valueClass="text-amber-600 dark:text-amber-400"
                        hint="Borrower repayment proofs awaiting admin approval."
                    />
                    <StatTile
                        label="Verified"
                        value={counts.verified}
                        icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        valueClass="text-emerald-600 dark:text-emerald-400"
                        hint="Repayments confirmed and applied to schedules."
                    />
                    <StatTile
                        label="Rejected"
                        value={counts.rejected}
                        icon={<XCircle className="h-4 w-4 text-red-500" />}
                        valueClass="text-red-600 dark:text-red-400"
                        hint="Proofs that needed correction or were invalid."
                    />
                </div>

                <div className="relative min-h-[60vh] flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <TabButton
                                active={filters.status === 'pending_verification'}
                                onClick={() => switchTab('pending_verification')}
                            >
                                Pending ({counts.pending_verification})
                            </TabButton>
                            <TabButton
                                active={filters.status === 'verified'}
                                onClick={() => switchTab('verified')}
                            >
                                Verified ({counts.verified})
                            </TabButton>
                            <TabButton
                                active={filters.status === 'rejected'}
                                onClick={() => switchTab('rejected')}
                            >
                                Rejected ({counts.rejected})
                            </TabButton>

                            <div className="ml-auto flex items-center gap-2">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        placeholder="Search by borrower name or email"
                                        className="w-64 pl-8 text-xs"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') applySearch();
                                        }}
                                    />
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-slate-900 text-xs text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                    onClick={applySearch}
                                >
                                    Search
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <Th>Borrower</Th>
                                        <Th>Coin / Investor</Th>
                                        <Th>Installment</Th>
                                        <Th>Amount</Th>
                                        <Th>Paid on</Th>
                                        <Th>Proof</Th>
                                        <Th className="text-right">Actions</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {repayments.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-8 text-center text-xs text-slate-500"
                                            >
                                                No repayments in this bucket.
                                            </td>
                                        </tr>
                                    ) : (
                                        repayments.data.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                            >
                                                <Td>
                                                    <div className="font-medium">
                                                        {item.coin?.borrower_company ??
                                                            item.submitter?.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {item.submitter?.email}
                                                    </div>
                                                </Td>
                                                <Td>
                                                    <div className="text-xs">
                                                        {item.coin?.request ?? '—'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Investor:{' '}
                                                        {item.investor_name ?? '—'}
                                                    </div>
                                                </Td>
                                                <Td>
                                                    <span className="text-xs">
                                                        #
                                                        {item.installment_number} /{' '}
                                                        {item.interest
                                                            ?.installments_count ??
                                                            '—'}
                                                    </span>
                                                </Td>
                                                <Td className="font-medium">
                                                    {formatMoney(
                                                        item.amount,
                                                        item.currency,
                                                    )}
                                                </Td>
                                                <Td className="text-xs text-slate-500">
                                                    {item.paid_at ?? '—'}
                                                    {item.reference ? (
                                                        <div className="text-[11px]">
                                                            Ref {item.reference}
                                                        </div>
                                                    ) : null}
                                                </Td>
                                                <Td>
                                                    {item.has_proof ? (
                                                        <Link
                                                            href={`/admin/repayments/${item.id}/file`}
                                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                        >
                                                            <FileText className="size-3" />
                                                            {item.proof_original_name ??
                                                                'View file'}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">
                                                            —
                                                        </span>
                                                    )}
                                                </Td>
                                                <Td className="text-right">
                                                    {filters.status ===
                                                    'pending_verification' ? (
                                                        <div className="inline-flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    openApprove(
                                                                        item,
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle2 className="mr-1 size-4" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    openReject(
                                                                        item,
                                                                    )
                                                                }
                                                            >
                                                                <XCircle className="mr-1 size-4" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : item.status ===
                                                      'rejected' ? (
                                                        <div className="text-xs text-red-600 dark:text-red-400">
                                                            {item.rejection_reason ??
                                                                'Rejected'}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-500">
                                                            Verified by{' '}
                                                            {item.verifier_name ??
                                                                'admin'}
                                                            <br />
                                                            {item.verified_at}
                                                        </div>
                                                    )}
                                                </Td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination links={repayments.links} />
                    </div>
                </div>
            </div>

            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve repayment</DialogTitle>
                        <DialogDescription>
                            This will mark the installment as paid, advance the
                            schedule by{' '}
                            {selected?.interest?.next_payment_due_at
                                ? 'the configured interval'
                                : 'one cycle'}
                            , and notify both the borrower and investor.
                        </DialogDescription>
                    </DialogHeader>
                    {selected ? (
                        <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
                            <RowKV
                                k="Borrower"
                                v={
                                    selected.coin?.borrower_company ??
                                    selected.submitter?.name ??
                                    '—'
                                }
                            />
                            <RowKV
                                k="Investor"
                                v={selected.investor_name ?? '—'}
                            />
                            <RowKV
                                k="Installment"
                                v={`#${selected.installment_number} of ${selected.interest?.installments_count ?? '—'}`}
                            />
                            <RowKV
                                k="Amount"
                                v={formatMoney(
                                    selected.amount,
                                    selected.currency,
                                )}
                            />
                            <RowKV k="Paid on" v={selected.paid_at ?? '—'} />
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setApproveOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={submitApprove}>Approve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject repayment</DialogTitle>
                        <DialogDescription>
                            Tell the borrower why this proof is not acceptable.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Proof is unreadable; please re-upload a clearer image."
                    />
                    {reasonError ? (
                        <p className="text-xs text-red-600">{reasonError}</p>
                    ) : null}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={submitReject}>
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function StatTile({
    label,
    value,
    icon,
    valueClass,
    hint,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    valueClass?: string;
    hint?: string;
}) {
    return (
        <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                    {label}
                </span>
                {icon}
            </div>
            <span className={cn('text-2xl font-semibold', valueClass)}>
                {value}
            </span>
            {hint ? (
                <span className="text-[11px] text-slate-500">{hint}</span>
            ) : null}
        </div>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-full border px-3 py-1 text-xs',
                active
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
        >
            {children}
        </button>
    );
}

function Th({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <th
            className={cn(
                'px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500',
                className,
            )}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <td className={cn('px-4 py-2 align-top', className)}>{children}</td>;
}

function RowKV({ k, v }: { k: string; v: string }) {
    return (
        <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium">{v}</span>
        </div>
    );
}

function Pagination({
    links,
}: {
    links: { url: string | null; label: string; active: boolean }[];
}) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-1 pt-2">
            {links.map((l) => (
                <Link
                    key={l.label + l.url}
                    href={l.url ?? '#'}
                    preserveScroll
                    preserveState
                    className={cn(
                        'rounded-md border px-2 py-1 text-xs',
                        l.active
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                            : l.url
                              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                              : 'pointer-events-none border-slate-100 text-slate-300 dark:border-slate-800 dark:text-slate-700',
                    )}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </div>
    );
}
