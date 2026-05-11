import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

type CheckoutPayload = {
    payment_id: number;
    script_url: string;
    key: string;
    reference: string;
    amount: number;
    currency: string;
    email: string;
    label: string;
    channels: string[];
};

type PageProps = {
    checkout: CheckoutPayload;
};

type LencoCheckoutResponse = {
    reference?: string;
};

type LencoCheckoutConfig = {
    key: string;
    email: string;
    reference: string;
    amount: number;
    currency: string;
    label: string;
    channels: string[];
    onSuccess: (response: LencoCheckoutResponse) => void;
    onClose: () => void;
    onConfirmationPending: () => void;
};

type LencoPayApi = {
    getPaid: (config: LencoCheckoutConfig) => void;
};

const getLencoPay = (): LencoPayApi | undefined => {
    return (window as Window & { LencoPay?: LencoPayApi }).LencoPay;
};

const loadLencoScript = async (scriptUrl: string): Promise<void> => {
    if (getLencoPay()) {
        return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-lenco-checkout="true"]',
    );

    if (existingScript) {
        if (existingScript.dataset.loaded === 'true') {
            return;
        }

        if (existingScript.dataset.failed === 'true') {
            throw new Error('Unable to load the Lenco checkout.');
        }

        await new Promise<void>((resolve, reject) => {
            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener(
                'error',
                () => reject(new Error('Unable to load the Lenco checkout.')),
                { once: true },
            );
        });

        return;
    }

    await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');

        script.src = scriptUrl;
        script.async = true;
        script.dataset.lencoCheckout = 'true';
        script.addEventListener(
            'load',
            () => {
                script.dataset.loaded = 'true';
                resolve();
            },
            { once: true },
        );
        script.addEventListener(
            'error',
            () => {
                script.dataset.failed = 'true';
                reject(new Error('Unable to load the Lenco checkout.'));
            },
            { once: true },
        );

        document.body.appendChild(script);
    });
};

export default function BillingCheckout({ checkout }: PageProps) {
    const [status, setStatus] = useState<'loading' | 'open' | 'verifying' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const openedRef = useRef(false);

    useEffect(() => {
        if (openedRef.current) {
            return;
        }

        let cancelled = false;

        const openCheckout = async () => {
            try {
                await loadLencoScript(checkout.script_url);

                if (cancelled) {
                    return;
                }

                const lencoPay = getLencoPay();

                if (!lencoPay) {
                    throw new Error('The Lenco checkout is unavailable.');
                }

                openedRef.current = true;
                setStatus('open');

                lencoPay.getPaid({
                    key: checkout.key,
                    email: checkout.email,
                    reference: checkout.reference,
                    amount: checkout.amount,
                    currency: checkout.currency,
                    label: checkout.label,
                    channels: checkout.channels,
                    onSuccess: (response) => {
                        const reference = response.reference || checkout.reference;

                        setStatus('verifying');

                        router.post(
                            `/billing/payments/${checkout.payment_id}/verify`,
                            { reference },
                            {
                                preserveScroll: true,
                            },
                        );
                    },
                    onClose: () => {
                        router.visit('/billing');
                    },
                    onConfirmationPending: () => {
                        setStatus('error');
                        setErrorMessage(
                            'Payment confirmation is pending. We will update your access once Lenco confirms it.',
                        );

                        setTimeout(() => {
                            router.visit('/billing');
                        }, 4000);
                    },
                });
            } catch (error) {
                if (!cancelled) {
                    setStatus('error');
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : 'Unable to start the Lenco checkout.',
                    );
                }
            }
        };

        void openCheckout();

        return () => {
            cancelled = true;
        };
    }, [checkout]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Billing', href: '/billing' }, { title: 'Checkout', href: '#' }]}>
            <Head title="Checkout" />

            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    {status === 'loading' && (
                        <>
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100" />
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                Loading Lenco checkout...
                            </p>
                        </>
                    )}

                    {status === 'open' && (
                        <>
                            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-slate-900 dark:bg-slate-100" />
                            <p className="mt-4 text-sm text-slate-700 dark:text-slate-200">
                                Complete your payment in the Lenco window.
                            </p>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {checkout.currency} {checkout.amount.toLocaleString()} for {checkout.label}
                            </p>
                        </>
                    )}

                    {status === 'verifying' && (
                        <>
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600 dark:border-amber-900 dark:border-t-amber-400" />
                            <p className="mt-4 text-sm text-amber-800 dark:text-amber-100">
                                Verifying your payment...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <p className="text-sm text-rose-700 dark:text-rose-200">
                                {errorMessage}
                            </p>
                            <button
                                type="button"
                                onClick={() => router.visit('/billing')}
                                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                            >
                                Back to Billing
                            </button>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
