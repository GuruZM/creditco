import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { HandCoins, LayoutGrid, ShieldCheck, UserCircle2 } from 'lucide-react';
import { useState } from 'react';

type InvestorVerification = {
    id: number;
    note: string | null;
    created_at: string | null;
    verified_by_name: string | null;
};

type Investor = {
    id: number;
    user_id: number;
    name: string;
    email: string;
    phone: string;
    status: 'pending_verification' | 'verified' | 'suspended' | string;
    industries: string[] | null;
    created_at: string | null;
    id_document_url: string | null;
    verification?: InvestorVerification | null;
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
    investors: Paginated<Investor>;
};

const statusLabel: Record<string, string> = {
    pending_verification: 'Pending verification',
    verified: 'Verified',
    suspended: 'Suspended',
};

const statusClasses: Record<string, string> = {
    pending_verification:
        'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    verified:
        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    suspended:
        'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Investors', href: '/investors' },
];

export default function InvestorsIndex() {
    const { investors } = usePage<PageProps>().props;

    const [viewOpen, setViewOpen] = useState(false);
    const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(
        null,
    );
    const [note, setNote] = useState('');

    const openViewDialog = (investor: Investor) => {
        setSelectedInvestor(investor);
        setNote('');
        setViewOpen(true);
    };

    const handleVerify = () => {
        if (!selectedInvestor) return;

        router.post(
            `/investors/${selectedInvestor.id}/verify`,
            { note },
            {
                onSuccess: () => {
                    setViewOpen(false);
                    setSelectedInvestor(null);
                    setNote('');
                },
            },
        );
    };

    const totalInvestors = investors.data.length;
    const totalVerified = investors.data.filter(
        (i) => i.status === 'verified',
    ).length;
    const totalPending = investors.data.filter(
        (i) => i.status === 'pending_verification',
    ).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Investors | CreditCo" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                {/* Top stat cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* Total investors */}
                    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                Total investors
                            </h2>
                            <LayoutGrid className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                            {totalInvestors}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            All investors currently onboarded on CreditCo.
                        </p>
                    </div>

                    {/* Verified */}
                    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                Verified
                            </h2>
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
                            {totalVerified}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            Investors whose IDs and details have been verified.
                        </p>
                    </div>

                    {/* Pending */}
                    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                Pending verification
                            </h2>
                            <HandCoins className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold text-amber-600 dark:text-amber-300">
                            {totalPending}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            Investors waiting for manual KYC review.
                        </p>
                    </div>
                </div>

                {/* Main table area */}
                <div className="relative min-h-[100vh] flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:min-h-min dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-full w-full flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900 md:text-xl dark:text-slate-50">
                                    <HandCoins className="h-5 w-5 text-emerald-500" />
                                    Investors
                                </h1>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    View investor profiles, their documents, and
                                    verification status.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Investor
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Contact
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Industries
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Last verification
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {investors.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                                            >
                                                No investors found yet.
                                            </td>
                                        </tr>
                                    )}

                                    {investors.data.map((investor) => (
                                        <tr
                                            key={investor.id}
                                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <UserCircle2 className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                                            {investor.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-500">
                                                            #
                                                            {investor.id
                                                                .toString()
                                                                .padStart(
                                                                    4,
                                                                    '0',
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-xs text-slate-900 dark:text-slate-100">
                                                    {investor.email}
                                                </div>
                                                <div className="text-[11px] text-slate-500 dark:text-slate-500">
                                                    {investor.phone}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(
                                                        investor.industries ||
                                                        []
                                                    ).map((industry) => (
                                                        <span
                                                            key={industry}
                                                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                                        >
                                                            {industry.replace(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </span>
                                                    ))}
                                                    {(!investor.industries ||
                                                        investor.industries
                                                            .length === 0) && (
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-500">
                                                            —
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className={[
                                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]',
                                                        statusClasses[
                                                            investor.status
                                                        ] ??
                                                            'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
                                                    ].join(' ')}
                                                >
                                                    {statusLabel[
                                                        investor.status
                                                    ] ?? investor.status}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-800 dark:text-slate-300">
                                                {investor.verification ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] text-slate-800 dark:text-slate-200">
                                                            {investor
                                                                .verification
                                                                .verified_by_name ||
                                                                'Verified'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-500">
                                                            {
                                                                investor
                                                                    .verification
                                                                    .created_at
                                                            }
                                                        </span>
                                                        {investor.verification
                                                            .note && (
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-500">
                                                                {
                                                                    investor
                                                                        .verification
                                                                        .note
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-500">
                                                        Not verified yet
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-slate-300 text-[11px] text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-400"
                                                    onClick={() =>
                                                        openViewDialog(investor)
                                                    }
                                                >
                                                    View investor
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {investors.links && investors.links.length > 0 && (
                                <div className="flex justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                                    <div className="flex items-center gap-1 text-xs">
                                        {investors.links.map((link, index) => {
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

            {/* View / Verify dialog */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="max-w-lg border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCircle2 className="h-5 w-5 text-emerald-500" />
                            Investor details
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Review the investor&apos;s details and ID document.
                            You can then mark them as verified if everything
                            checks out.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInvestor && (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                    {selectedInvestor.name}
                                </p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                    {selectedInvestor.email} ·{' '}
                                    {selectedInvestor.phone}
                                </p>
                                <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-500">
                                    Status:{' '}
                                    <span
                                        className={
                                            selectedInvestor.status ===
                                            'verified'
                                                ? 'text-emerald-600 dark:text-emerald-300'
                                                : 'text-amber-600 dark:text-amber-300'
                                        }
                                    >
                                        {statusLabel[selectedInvestor.status] ??
                                            selectedInvestor.status}
                                    </span>
                                </p>
                                {selectedInvestor.industries &&
                                    selectedInvestor.industries.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {selectedInvestor.industries.map(
                                                (industry) => (
                                                    <span
                                                        key={industry}
                                                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                                    >
                                                        {industry.replace(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    )}
                            </div>

                            {selectedInvestor.id_document_url && (
                                <div className="space-y-1">
                                    <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                        Stamped ID document
                                    </p>
                                    <Link
                                        href={selectedInvestor.id_document_url}
                                        target="_blank"
                                        className="inline-flex text-[11px] text-sky-600 underline underline-offset-2 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                                    >
                                        Open ID document (PDF)
                                    </Link>
                                </div>
                            )}

                            {selectedInvestor.verification && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                                    <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                        Last verification
                                    </p>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                        By:{' '}
                                        {selectedInvestor.verification
                                            .verified_by_name || 'Unknown'}
                                    </p>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                        At:{' '}
                                        {selectedInvestor.verification
                                            .created_at || 'Unknown date'}
                                    </p>
                                    {selectedInvestor.verification.note && (
                                        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                                            Note:{' '}
                                            {selectedInvestor.verification.note}
                                        </p>
                                    )}
                                </div>
                            )}

                            {selectedInvestor.status !== 'verified' && (
                                <div className="space-y-1">
                                    <label className="text-[11px] text-slate-800 dark:text-slate-300">
                                        Verification note (optional)
                                    </label>
                                    <Textarea
                                        rows={3}
                                        value={note}
                                        onChange={(e) =>
                                            setNote(e.target.value)
                                        }
                                        className="border-slate-300 bg-white text-xs focus:border-emerald-500 focus:ring-0 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-emerald-500"
                                        placeholder="E.g. ID verified against NRC, name and photo match."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="mt-4 flex items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                            onClick={() => setViewOpen(false)}
                        >
                            Close
                        </Button>

                        {selectedInvestor &&
                            selectedInvestor.status !== 'verified' && (
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 text-xs text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                                    onClick={handleVerify}
                                >
                                    Mark as verified
                                </Button>
                            )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
