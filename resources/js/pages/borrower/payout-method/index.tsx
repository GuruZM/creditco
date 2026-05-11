import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    ClipboardCheck,
    Pencil,
    Smartphone,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

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
    payout_method: PayoutMethod | null;
    has_funding_needed: boolean;
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Coins', href: '/borrower/coins' },
    { title: 'Payout method', href: '/borrower/payout-method' },
];

const MOBILE_PROVIDERS = [
    { value: 'mtn', label: 'MTN' },
    { value: 'airtel', label: 'Airtel' },
    { value: 'zamtel', label: 'Zamtel' },
];

export default function BorrowerPayoutMethod() {
    const { payout_method, has_funding_needed } =
        usePage<PageProps>().props;

    const [editing, setEditing] = useState(payout_method === null);

    const form = useForm<{
        kind: 'bank' | 'mobile_money';
        account_name: string;
        bank_name: string;
        account_number: string;
        branch: string;
        mobile_provider: string;
        mobile_number: string;
    }>({
        kind: payout_method?.kind ?? 'bank',
        account_name: payout_method?.account_name ?? '',
        bank_name: payout_method?.bank_name ?? '',
        account_number: payout_method?.account_number ?? '',
        branch: payout_method?.branch ?? '',
        mobile_provider: payout_method?.mobile_provider ?? '',
        mobile_number: payout_method?.mobile_number ?? '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/borrower/payout-method', {
            onSuccess: () => {
                setEditing(false);
            },
        });
    };

    const confirmDetails = () => {
        router.post(
            '/borrower/payout-method/confirm',
            {},
            { preserveScroll: true },
        );
    };

    const isConfirmed = !!payout_method?.borrower_confirmed_at;
    const adminVerified = !!payout_method?.admin_verified_at;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payout method | Borrower" />

            <div className="flex flex-col gap-4 rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                <div>
                    <h1 className="text-lg font-semibold md:text-xl">
                        Payout method
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tell CreditCo where to send funds when an investor backs
                        one of your coins. We&apos;ll always keep these details
                        private.
                    </p>
                </div>

                {has_funding_needed && (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                        A prospect investor has been matched to one of your
                        coins. Submit and verify your payout details so the
                        CreditCo team can disburse funds.
                    </div>
                )}

                {!editing && payout_method && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                    {payout_method.kind === 'bank' ? (
                                        <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                    ) : (
                                        <Smartphone className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                        {payout_method.kind === 'bank'
                                            ? 'Bank account'
                                            : 'Mobile money'}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Account holder:{' '}
                                        <span className="font-medium text-slate-700 dark:text-slate-200">
                                            {payout_method.account_name}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 text-right text-[11px]">
                                {adminVerified ? (
                                    <span className="inline-flex items-center justify-end gap-1 font-medium text-emerald-700 dark:text-emerald-300">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Verified by admin
                                    </span>
                                ) : isConfirmed ? (
                                    <span className="inline-flex items-center justify-end gap-1 font-medium text-emerald-700 dark:text-emerald-300">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Verified by you · awaiting admin
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center justify-end gap-1 font-medium text-amber-700 dark:text-amber-300">
                                        <ClipboardCheck className="h-3.5 w-3.5" />
                                        Needs your verification
                                    </span>
                                )}
                            </div>
                        </div>

                        <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
                            {payout_method.kind === 'bank' ? (
                                <>
                                    <Field
                                        label="Bank name"
                                        value={payout_method.bank_name}
                                    />
                                    <Field
                                        label="Account number"
                                        value={payout_method.account_number}
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
                                        value={payout_method.mobile_number}
                                    />
                                </>
                            )}
                        </dl>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {!isConfirmed && (
                                <Button
                                    onClick={confirmDetails}
                                    size="sm"
                                    className="bg-emerald-600 text-xs text-white hover:bg-emerald-500"
                                >
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    These details are correct
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditing(true)}
                                className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                            >
                                <Pencil className="mr-1 h-3 w-3" />
                                {payout_method ? 'Edit details' : 'Add details'}
                            </Button>
                        </div>
                    </div>
                )}

                {editing && (
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="grid gap-2">
                            <Label className="text-xs text-slate-700 dark:text-slate-200">
                                Account type
                            </Label>
                            <Select
                                value={form.data.kind}
                                onValueChange={(value) =>
                                    form.setData(
                                        'kind',
                                        value as 'bank' | 'mobile_money',
                                    )
                                }
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bank">
                                        Bank account
                                    </SelectItem>
                                    <SelectItem value="mobile_money">
                                        Mobile money
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2 md:col-span-2">
                                <Label className="text-xs text-slate-700 dark:text-slate-200">
                                    Account holder name
                                </Label>
                                <Input
                                    className="h-9 text-xs"
                                    value={form.data.account_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'account_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Name as it appears on the account"
                                />
                                {form.errors.account_name && (
                                    <p className="text-[11px] text-red-500">
                                        {form.errors.account_name}
                                    </p>
                                )}
                            </div>

                            {form.data.kind === 'bank' ? (
                                <>
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-slate-700 dark:text-slate-200">
                                            Bank name
                                        </Label>
                                        <Input
                                            className="h-9 text-xs"
                                            value={form.data.bank_name}
                                            onChange={(e) =>
                                                form.setData(
                                                    'bank_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. Zanaco, Stanbic"
                                        />
                                        {form.errors.bank_name && (
                                            <p className="text-[11px] text-red-500">
                                                {form.errors.bank_name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-slate-700 dark:text-slate-200">
                                            Account number
                                        </Label>
                                        <Input
                                            className="h-9 text-xs"
                                            value={form.data.account_number}
                                            onChange={(e) =>
                                                form.setData(
                                                    'account_number',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Numeric account number"
                                        />
                                        {form.errors.account_number && (
                                            <p className="text-[11px] text-red-500">
                                                {form.errors.account_number}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-2 md:col-span-2">
                                        <Label className="text-xs text-slate-700 dark:text-slate-200">
                                            Branch (optional)
                                        </Label>
                                        <Input
                                            className="h-9 text-xs"
                                            value={form.data.branch}
                                            onChange={(e) =>
                                                form.setData(
                                                    'branch',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. Cairo Road, Lusaka"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-slate-700 dark:text-slate-200">
                                            Mobile provider
                                        </Label>
                                        <Select
                                            value={form.data.mobile_provider}
                                            onValueChange={(value) =>
                                                form.setData(
                                                    'mobile_provider',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue placeholder="Select provider" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MOBILE_PROVIDERS.map((p) => (
                                                    <SelectItem
                                                        key={p.value}
                                                        value={p.value}
                                                    >
                                                        {p.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.mobile_provider && (
                                            <p className="text-[11px] text-red-500">
                                                {form.errors.mobile_provider}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-slate-700 dark:text-slate-200">
                                            Mobile number
                                        </Label>
                                        <Input
                                            className="h-9 text-xs"
                                            value={form.data.mobile_number}
                                            onChange={(e) =>
                                                form.setData(
                                                    'mobile_number',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. +260 …"
                                        />
                                        {form.errors.mobile_number && (
                                            <p className="text-[11px] text-red-500">
                                                {form.errors.mobile_number}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2">
                            {payout_method && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                                    onClick={() => setEditing(false)}
                                    disabled={form.processing}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-slate-900 text-xs text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Saving...' : 'Save details'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
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
