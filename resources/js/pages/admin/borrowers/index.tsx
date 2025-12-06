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
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    FileText,
    HandCoins,
    ShieldCheck,
    User2,
} from 'lucide-react';
import { useState } from 'react';

type DocumentVerificationSummary = {
    type: string;
    label: string;
    verified: boolean;
    note: string | null;
    verified_at: string | null;
    verified_by: string | null;
};

type Borrower = {
    id: number;
    user_id: number;
    company_name: string;
    registration_number: string | null;
    industry: string | null;
    status: 'pending_verification' | 'verified' | 'suspended' | string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    created_at: string | null;

    // URLs to documents
    documents: {
        registration_documents: string | null;
        bank_statement: string | null;
        company_printout: string | null;
        contact_id_document: string | null;
    };

    document_verification: DocumentVerificationSummary[];
    all_documents_verified: boolean;
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
    borrowers: Paginated<Borrower>;
    required_documents: Record<string, string>;
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
    { title: 'Borrowers', href: '/borrowers' },
];

export default function BorrowersIndex() {
    const { borrowers } = usePage<PageProps>().props;

    const [viewOpen, setViewOpen] = useState(false);
    const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(
        null,
    );
    const [note, setNote] = useState('');

    const openViewDialog = (borrower: Borrower) => {
        setSelectedBorrower(borrower);
        setNote('');
        setViewOpen(true);
    };

    const handleVerifyDocument = (documentType: string) => {
        if (!selectedBorrower) return;

        router.post(
            `/borrowers/${selectedBorrower.id}/verify-document`,
            {
                document_type: documentType,
                note,
            },
            {
                onSuccess: () => {
                    setViewOpen(false);
                    setSelectedBorrower(null);
                    setNote('');
                },
            },
        );
    };

    const handleVerifyBorrower = () => {
        if (!selectedBorrower) return;

        router.post(
            `/borrowers/${selectedBorrower.id}/verify`,
            {
                note,
            },
            {
                onSuccess: () => {
                    setViewOpen(false);
                    setSelectedBorrower(null);
                    setNote('');
                },
            },
        );
    };

    const totalBorrowers = borrowers.data.length;
    const totalVerified = borrowers.data.filter(
        (b) => b.status === 'verified',
    ).length;
    const totalWithPendingDocs = borrowers.data.filter(
        (b) => !b.all_documents_verified,
    ).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Borrowers | CreditCo" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                {/* Top stat cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* Total borrowers */}
                    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                Total borrowers
                            </h2>
                            <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                            {totalBorrowers}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            All companies seeking funding on CreditCo.
                        </p>
                    </div>

                    {/* Fully verified borrowers */}
                    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                Fully verified
                            </h2>
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
                            {totalVerified}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            Borrowers whose company and all documents are
                            verified.
                        </p>
                    </div>

                    {/* Borrowers with pending documents */}
                    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                Pending documents
                            </h2>
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold text-amber-600 dark:text-amber-300">
                            {totalWithPendingDocs}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            Borrowers with one or more documents not yet
                            verified.
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
                                    Borrowers
                                </h1>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    View borrower companies, their documents,
                                    and verification status.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Company
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Contact
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Industry
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Docs verified
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {borrowers.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                                            >
                                                No borrowers found yet.
                                            </td>
                                        </tr>
                                    )}

                                    {borrowers.data.map((borrower) => {
                                        const verifiedDocsCount =
                                            borrower.document_verification.filter(
                                                (d) => d.verified,
                                            ).length;
                                        const totalDocsCount =
                                            borrower.document_verification
                                                .length;

                                        return (
                                            <tr
                                                key={borrower.id}
                                                className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                            <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                                                {
                                                                    borrower.company_name
                                                                }
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 dark:text-slate-500">
                                                                #
                                                                {borrower.id
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
                                                        {borrower.contact_name ||
                                                            '—'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-500">
                                                        {borrower.contact_email ||
                                                            'No email'}{' '}
                                                        ·{' '}
                                                        {borrower.contact_phone ||
                                                            'No phone'}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-800 dark:text-slate-200">
                                                    {borrower.industry || '—'}
                                                </td>

                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span
                                                        className={[
                                                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]',
                                                            statusClasses[
                                                                borrower.status
                                                            ] ??
                                                                'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
                                                        ].join(' ')}
                                                    >
                                                        {statusLabel[
                                                            borrower.status
                                                        ] || borrower.status}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-800 dark:text-slate-200">
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                        <span>
                                                            {verifiedDocsCount}/
                                                            {totalDocsCount}{' '}
                                                            verified
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-slate-300 text-[11px] text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-400"
                                                        onClick={() =>
                                                            openViewDialog(
                                                                borrower,
                                                            )
                                                        }
                                                    >
                                                        View borrower
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {borrowers.links && borrowers.links.length > 0 && (
                                <div className="flex justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                                    <div className="flex items-center gap-1 text-xs">
                                        {borrowers.links.map((link, index) => {
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

            {/* View / Document-by-document Verify dialog */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="max-w-3xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-emerald-500" />
                            Borrower details
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Review the borrower company, their documents and
                            per-document verification. You can only fully verify
                            the borrower once all documents are verified.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBorrower && (
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Left: company + contact + status */}
                            <div className="space-y-4">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                        {selectedBorrower.company_name}
                                    </p>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                        Reg. No:{' '}
                                        {selectedBorrower.registration_number ||
                                            'Not provided'}
                                    </p>
                                    {selectedBorrower.industry && (
                                        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                                            Industry:{' '}
                                            {selectedBorrower.industry}
                                        </p>
                                    )}
                                    <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-500">
                                        Status:{' '}
                                        <span
                                            className={
                                                selectedBorrower.status ===
                                                'verified'
                                                    ? 'text-emerald-600 dark:text-emerald-300'
                                                    : selectedBorrower.status ===
                                                        'pending_verification'
                                                      ? 'text-amber-600 dark:text-amber-300'
                                                      : 'text-red-600 dark:text-red-300'
                                            }
                                        >
                                            {statusLabel[
                                                selectedBorrower.status
                                            ] ?? selectedBorrower.status}
                                        </span>
                                    </p>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                    <p className="flex items-center gap-1 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                        <User2 className="h-4 w-4" />
                                        Primary contact
                                    </p>
                                    <p className="mt-1 text-xs text-slate-900 dark:text-slate-100">
                                        {selectedBorrower.contact_name || '—'}
                                    </p>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                        {selectedBorrower.contact_email ||
                                            'No email'}{' '}
                                        ·{' '}
                                        {selectedBorrower.contact_phone ||
                                            'No phone'}
                                    </p>
                                </div>

                                {/* Full verification section */}
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                    <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                        Full verification
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                                        All documents must be verified before
                                        you can mark this borrower as fully
                                        verified.
                                    </p>
                                    {selectedBorrower.all_documents_verified &&
                                    selectedBorrower.status !== 'verified' ? (
                                        <Button
                                            size="sm"
                                            className="mt-3 bg-emerald-600 text-xs text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                                            onClick={handleVerifyBorrower}
                                        >
                                            Mark borrower as fully verified
                                        </Button>
                                    ) : (
                                        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-500">
                                            {selectedBorrower.status ===
                                            'verified'
                                                ? 'Borrower already fully verified.'
                                                : 'Full verification will be enabled after all documents below are verified.'}
                                        </p>
                                    )}
                                </div>

                                {/* Shared note field */}
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
                                        placeholder="E.g. Bank statement cross-checked with company details, all consistent."
                                    />
                                    <p className="text-[10px] text-slate-500 dark:text-slate-500">
                                        This note will be attached to the
                                        document verification or full
                                        verification action you take.
                                    </p>
                                </div>
                            </div>

                            {/* Right: documents & per-document verification */}
                            <div className="space-y-3">
                                <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                    Documents & verification
                                </p>

                                <div className="space-y-2">
                                    {selectedBorrower.document_verification.map(
                                        (doc) => {
                                            const docUrl =
                                                selectedBorrower.documents[
                                                    doc.type as keyof Borrower['documents']
                                                ];

                                            return (
                                                <div
                                                    key={doc.type}
                                                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/70"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                                            <div>
                                                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                                                    {doc.label}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                    {doc.verified
                                                                        ? 'Verified document'
                                                                        : 'Awaiting verification'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span
                                                            className={[
                                                                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]',
                                                                doc.verified
                                                                    ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                                    : 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
                                                            ].join(' ')}
                                                        >
                                                            {doc.verified
                                                                ? 'Verified'
                                                                : 'Pending'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex flex-col gap-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                                                            {doc.verified_at && (
                                                                <span>
                                                                    Verified at:{' '}
                                                                    {
                                                                        doc.verified_at
                                                                    }{' '}
                                                                    {doc.verified_by &&
                                                                        `by ${doc.verified_by}`}
                                                                </span>
                                                            )}
                                                            {doc.note && (
                                                                <span>
                                                                    Note:{' '}
                                                                    {doc.note}
                                                                </span>
                                                            )}
                                                            {!doc.verified_at &&
                                                                !doc.note && (
                                                                    <span className="text-slate-500 dark:text-slate-500">
                                                                        No
                                                                        verification
                                                                        history
                                                                        yet.
                                                                    </span>
                                                                )}
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {docUrl && (
                                                                <Link
                                                                    href={
                                                                        docUrl
                                                                    }
                                                                    target="_blank"
                                                                    className="text-[11px] text-sky-600 underline underline-offset-2 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                                                                >
                                                                    View
                                                                    document
                                                                </Link>
                                                            )}

                                                            {!doc.verified &&
                                                                docUrl && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-emerald-600 text-[11px] text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                                                                        onClick={() =>
                                                                            handleVerifyDocument(
                                                                                doc.type,
                                                                            )
                                                                        }
                                                                    >
                                                                        Verify
                                                                        document
                                                                    </Button>
                                                                )}

                                                            {!docUrl && (
                                                                <span className="text-[10px] text-red-500 dark:text-red-400">
                                                                    No file
                                                                    uploaded
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
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
