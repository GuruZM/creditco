import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { Check, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Plan = {
    id: number;
    key: string;
    name: string;
    interval: 'month' | 'quarter' | 'year';
    amount: number;
    currency: string;
    meta?: { features?: string[]; savings_note?: string | null };
};

type Billing = {
    is_subscribed: boolean;
};

type SharedProps = {
    billing?: Billing | null;
    plans?: Plan[];
    auth?: { roles?: string[] };
};

const intervalLabel = (i: Plan['interval']) =>
    i === 'month' ? 'Monthly' : i === 'quarter' ? 'Quarterly' : 'Yearly';

const intervalSort: Record<Plan['interval'], number> = {
    month: 1,
    quarter: 2,
    year: 3,
};

const monthlyEq = (plan: Plan) => {
    if (plan.interval === 'month') {
        return plan.amount;
    }

    if (plan.interval === 'quarter') {
        return Math.round((plan.amount / 3) * 100) / 100;
    }

    return Math.round((plan.amount / 12) * 100) / 100;
};

export default function PaywallModal() {
    const page = usePage<SharedProps>();
    const { billing, plans = [], auth } = page.props;
    const currentPath = page.url.split('?')[0];
    const isBorrower = (auth?.roles ?? []).includes('borrower');
    const shouldHide =
        !isBorrower ||
        !billing ||
        billing.is_subscribed ||
        currentPath.startsWith('/billing');

    const sortedPlans = useMemo(
        () =>
            [...plans].sort(
                (a, b) => intervalSort[a.interval] - intervalSort[b.interval],
            ),
        [plans],
    );

    const defaultPlanId = useMemo(() => {
        const yearly = sortedPlans.find((p) => p.interval === 'year');

        return yearly?.id ?? sortedPlans[0]?.id ?? null;
    }, [sortedPlans]);

    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
        defaultPlanId,
    );
    const [redirecting, setRedirecting] = useState(false);

    const selectedPlan = useMemo(
        () => sortedPlans.find((p) => p.id === selectedPlanId) ?? null,
        [sortedPlans, selectedPlanId],
    );

    useEffect(() => {
        setSelectedPlanId(defaultPlanId);
    }, [defaultPlanId]);

    const logout = () => router.post('/logout');

    const openBillingPage = (planId: number | null = selectedPlan?.id ?? null) => {
        const search = planId ? `?plan=${planId}` : '';

        setRedirecting(true);
        router.visit(`/billing${search}`, {
            onFinish: () => {
                setRedirecting(false);
            },
        });
    };

    if (shouldHide) {
        return null;
    }

    return (
        <Dialog open={true}>
            <DialogContent
                className="w-screen max-w-none overflow-auto bg-white text-slate-900 sm:w-[calc(100vw-2rem)] sm:max-w-6xl dark:text-slate-50"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl">Plans</DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                        Choose a plan to continue. We will take you to the
                        billing page to complete payment. Dismiss will log you
                        out.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 md:grid-cols-3">
                    {sortedPlans.map((plan) => {
                        const isSelected = plan.id === selectedPlanId;
                        const isYearly = plan.interval === 'year';

                        return (
                            <div
                                key={plan.id}
                                className={cn(
                                    'rounded-3xl border bg-white p-5 shadow-sm dark:bg-slate-950',
                                    'border-slate-200 dark:border-slate-800',
                                    isSelected &&
                                        'ring-2 ring-slate-900 dark:ring-slate-200',
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {intervalLabel(plan.interval)}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            No minimum commitment. Pause or
                                            cancel anytime.
                                        </p>
                                    </div>

                                    {plan.meta?.savings_note ? (
                                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                                            {plan.meta.savings_note}
                                        </span>
                                    ) : isYearly ? (
                                        <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-medium text-white dark:bg-slate-100 dark:text-slate-900">
                                            Best value
                                        </span>
                                    ) : null}
                                </div>

                                <div className="mt-5">
                                    <div className="flex items-end gap-2">
                                        <div className="text-4xl font-semibold">
                                            {plan.currency}{' '}
                                            {monthlyEq(plan).toLocaleString()}
                                        </div>
                                        <div className="pb-1 text-sm text-slate-500 dark:text-slate-400">
                                            /month
                                        </div>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        Billed{' '}
                                        {intervalLabel(
                                            plan.interval,
                                        ).toLowerCase()}{' '}
                                        • Total: {plan.currency}{' '}
                                        {plan.amount.toLocaleString()}
                                    </p>
                                </div>

                                <div className="my-5 h-px bg-slate-200 dark:bg-slate-800" />

                                <ul className="grid gap-2 text-sm">
                                    {(plan.meta?.features ?? [])
                                        .slice(0, 6)
                                        .map((feature, index) => (
                                            <li
                                                key={index}
                                                className="flex items-start gap-2 text-slate-700 dark:text-slate-200"
                                            >
                                                <Check className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                </ul>

                                <div className="mt-6 flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className="w-full rounded-2xl border-slate-200 dark:border-slate-800"
                                    >
                                        Select
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={() => openBillingPage(plan.id)}
                                        disabled={redirecting}
                                        className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                    >
                                        Continue on billing
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={logout}
                        className="rounded-xl border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout (dismiss)
                    </Button>

                    <Button
                        type="button"
                        onClick={() => openBillingPage()}
                        disabled={redirecting}
                        className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        {redirecting ? 'Opening...' : 'Open billing page'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
