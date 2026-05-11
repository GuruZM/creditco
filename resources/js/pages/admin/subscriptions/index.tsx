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
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    Search,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

type StatusFilter = 'pending' | 'approved' | 'rejected';

type PaymentItem = {
    id: number;
    amount: number;
    currency: string;
    status: string;
    reference: string | null;
    file_original_name: string | null;
    has_file: boolean;
    uploaded_at: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    user_note: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    plan: {
        name: string;
        interval: string;
        amount: number;
        currency: string;
    } | null;
    reviewer: {
        id: number;
        name: string;
    } | null;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

type PageProps = {
    payments: Paginated<PaymentItem>;
    filters: {
        status: StatusFilter;
        search: string;
    };
    counts: {
        pending: number;
        approved: number;
        rejected: number;
    };
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Subscriptions', href: '/admin/subscriptions' },
];

export default function AdminSubscriptionsIndex() {
    const { payments, filters, counts } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search || '');

    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [selected, setSelected] = useState<PaymentItem | null>(null);
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState<string | null>(null);

    const switchTab = (status: StatusFilter) => {
        router.get(
            '/admin/subscriptions',
            { status, search },
            { preserveState: true, replace: true },
        );
    };

    const applySearch = () => {
        router.get(
            '/admin/subscriptions',
            { status: filters.status, search },
            { preserveState: true, replace: true },
        );
    };

    const openApprove = (item: PaymentItem) => {
        setSelected(item);
        setApproveOpen(true);
    };

    const openReject = (item: PaymentItem) => {
        setSelected(item);
        setReason('');
        setReasonError(null);
        setRejectOpen(true);
    };

    const submitApprove = () => {
        if (!selected) return;
        router.post(
            `/admin/subscriptions/${selected.id}/approve`,
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
            `/admin/subscriptions/${selected.id}/reject`,
            { reason },
            {
                onError: (errors) => {
                    if (errors.reason) {
                        setReasonError(errors.reason);
                    }
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
            <Head title="Subscriptions | CreditCo" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                {/* Stat tiles */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <StatTile
                        label="Pending review"
                        value={counts.pending}
                        icon={<Clock className="h-4 w-4 text-amber-500" />}
                        valueClass="text-amber-600 dark:text-amber-400"
                        hint="Proofs of payment awaiting admin approval."
                    />
                    <StatTile
                        label="Approved"
                        value={counts.approved}
                        icon={
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        }
                        valueClass="text-emerald-600 dark:text-emerald-400"
                        hint="Subscriptions activated via manual approval."
                    />
                    <StatTile
                        label="Rejected"
                        value={counts.rejected}
                        icon={<XCircle className="h-4 w-4 text-red-500" />}
                        valueClass="text-red-600 dark:text-red-400"
                        hint="Proofs that needed correction or were invalid."
                    />
                </div>

                <div className="relative min-h-[100vh] flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:min-h-min dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-4">
                        {/* Tabs */}
                        <div className="flex flex-wrap items-center gap-2">
                            <TabButton
                                active={filters.status === 'pending'}
                                onClick={() => switchTab('pending')}
                            >
                                Pending ({counts.pending})
                            </TabButton>
                            <TabButton
                                active={filters.status === 'approved'}
                                onClick={() => switchTab('approved')}
                            >
                                Approved ({counts.approved})
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
                                        placeholder="Search by user name or email"
                                        className="w-64 pl-8 text-xs"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter')
                                                applySearch();
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

                        {/* Table */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <Th>Subscriber</Th>
                                        <Th>Plan</Th>
                                        <Th>Amount</Th>
                                        <Th>Reference</Th>
                                        <Th>Submitted</Th>
                                        <Th>POP</Th>
                                        <Th>Status</Th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {payments.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                                            >
                                                No proofs of payment in this
                                                tab.
                                            </td>
                                        </tr>
                                    )}

                                    {payments.data.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                                        {p.user?.name ?? '—'}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-500">
                                                        {p.user?.email ?? '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-800 dark:text-slate-200">
                                                {p.plan
                                                    ? `${p.plan.name} (${p.plan.interval})`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-800 dark:text-slate-200">
                                                {p.currency}{' '}
                                                {p.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-800 dark:text-slate-200">
                                                {p.reference ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-800 dark:text-slate-200">
                                                {p.uploaded_at ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                {p.has_file ? (
                                                    <Link
                                                        href={`/admin/subscriptions/${p.id}/file`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline dark:text-sky-400"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        {p.file_original_name ??
                                                            'View file'}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge status={p.status} />
                                                {p.status === 'failed' &&
                                                    p.rejection_reason && (
                                                        <p className="mt-1 text-[10px] text-red-700 dark:text-red-400">
                                                            {p.rejection_reason}
                                                        </p>
                                                    )}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                {filters.status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 text-[11px] text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                                                            onClick={() =>
                                                                openApprove(p)
                                                            }
                                                        >
                                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-300 text-[11px] text-red-700 hover:border-red-500 hover:text-red-800 dark:border-red-500/60 dark:text-red-300 dark:hover:border-red-400"
                                                            onClick={() =>
                                                                openReject(p)
                                                            }
                                                        >
                                                            <XCircle className="mr-1 h-3 w-3" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-500">
                                                        {p.reviewer
                                                            ? `By ${p.reviewer.name}`
                                                            : ''}
                                                        {p.reviewed_at
                                                            ? ` · ${p.reviewed_at}`
                                                            : ''}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {payments.links && payments.links.length > 0 && (
                                <div className="flex justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                                    <div className="flex items-center gap-1 text-xs">
                                        {payments.links.map((link, index) => {
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
                </div>
            </div>

            {/* Approve dialog */}
            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent className="max-w-md border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Approve subscription
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            This will mark the payment as paid and activate
                            the subscriber's account immediately.
                        </DialogDescription>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                            <p>
                                Approve{' '}
                                <span className="font-semibold">
                                    {selected.user?.name}
                                </span>{' '}
                                ({selected.user?.email}) for the{' '}
                                <span className="font-semibold">
                                    {selected.plan?.name}
                                </span>{' '}
                                plan?
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-500">
                                Reference: {selected.reference} · Amount:{' '}
                                {selected.currency}{' '}
                                {selected.amount.toLocaleString()}
                            </p>
                        </div>
                    )}

                    <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-xs"
                            onClick={() => setApproveOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 text-xs text-white hover:bg-emerald-500"
                            onClick={submitApprove}
                        >
                            Approve & activate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject dialog */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent className="max-w-md border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            Reject proof of payment
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            The user will see the reason on their billing page
                            and can resubmit.
                        </DialogDescription>
                    </DialogHeader>

                    {selected && (
                        <div className="text-xs text-slate-700 dark:text-slate-200">
                            <p>
                                Rejecting{' '}
                                <span className="font-semibold">
                                    {selected.user?.name}
                                </span>{' '}
                                ({selected.user?.email}).
                            </p>
                        </div>
                    )}

                    <div className="mt-2 grid gap-1.5">
                        <label
                            htmlFor="reject-reason"
                            className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
                        >
                            Reason
                        </label>
                        <Textarea
                            id="reject-reason"
                            rows={3}
                            placeholder="e.g. The receipt is unreadable; please re-upload a clearer image."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (reasonError) setReasonError(null);
                            }}
                            className="text-xs"
                        />
                        {reasonError && (
                            <p className="text-[11px] text-red-600 dark:text-red-400">
                                {reasonError}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-xs"
                            onClick={() => setRejectOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="bg-red-600 text-xs text-white hover:bg-red-500"
                            onClick={submitReject}
                        >
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
            {children}
        </th>
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
                'rounded-full border px-3 py-1 text-[11px] font-medium transition',
                active
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100',
            )}
        >
            {children}
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'paid') {
        return (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                Approved
            </span>
        );
    }
    if (status === 'failed') {
        return (
            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[11px] text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                Rejected
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            Pending
        </span>
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
        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                    {label}
                </h2>
                {icon}
            </div>
            <p
                className={cn(
                    'mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50',
                    valueClass,
                )}
            >
                {value}
            </p>
            {hint && (
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {hint}
                </p>
            )}
        </div>
    );
}
