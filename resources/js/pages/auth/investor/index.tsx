// resources/js/Pages/auth/investor/index.tsx

import { Link, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import React, { FormEvent, useState } from 'react';

interface InvestorOnboardingForm {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    id_document: File | null;
    industries: string[];
}

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: 'easeOut' },
    },
};

const stepVariants: Variants = {
    initial: { opacity: 0, x: 40 },
    animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.25 },
    },
    exit: {
        opacity: 0,
        x: -40,
        transition: { duration: 0.2 },
    },
};

const industryBubbleVariants: Variants = {
    initial: { opacity: 0, scale: 0.9, y: 10 },
    animate: (i: number) => ({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { delay: 0.03 * i, duration: 0.2 },
    }),
    hover: {
        scale: 1.05,
        y: -2,
        transition: { duration: 0.15 },
    },
};

const INDUSTRY_OPTIONS: { value: string; label: string }[] = [
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'construction', label: 'Construction' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'transport', label: 'Transport & Logistics' },
    { value: 'finance', label: 'Finance & Insurance' },
    { value: 'retail', label: 'Retail & Wholesale' },
    { value: 'ict', label: 'ICT & Technology' },
    { value: 'mining', label: 'Mining' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'energy', label: 'Energy' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'fmcg', label: 'FMCG' },
    { value: 'other', label: 'Other' },
];

const InvestorOnboardingPage: React.FC = () => {
    const [step, setStep] = useState<number>(0);

    const { errors: serverErrors } = usePage().props as {
        errors: Record<string, string>;
    };

    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

    const { data, setData, post, processing } = useForm<InvestorOnboardingForm>(
        {
            first_name: '',
            last_name: '',
            phone: '',
            email: '',
            id_document: null,
            industries: [],
        },
    );

    const steps = ['Personal details', 'ID document', 'Select industries'];
    const progress = ((step + 1) / steps.length) * 100;

    const getError = (field: string): string | undefined =>
        localErrors[field] || serverErrors[field];

    const clearStepErrors = (fields: string[]) => {
        setLocalErrors((prev) => {
            const copy = { ...prev };
            fields.forEach((f) => delete copy[f]);
            return copy;
        });
    };

    const validateStep = (currentStep: number): boolean => {
        const errs: Record<string, string> = {};

        if (currentStep === 0) {
            // Personal details
            if (!data.first_name.trim()) {
                errs.first_name = 'First name is required.';
            }
            if (!data.last_name.trim()) {
                errs.last_name = 'Last name is required.';
            }
            if (!data.phone.trim()) {
                errs.phone = 'Phone number is required.';
            }
            if (!data.email.trim()) {
                errs.email = 'Email is required.';
            }
        }

        if (currentStep === 1) {
            // ID document
            if (!data.id_document) {
                errs.id_document = 'Stamped ID (PDF) is required.';
            }
        }

        if (currentStep === 2) {
            // Industries
            if (!data.industries || data.industries.length === 0) {
                errs.industries = 'Please select at least one industry.';
            }
        }

        if (Object.keys(errs).length > 0) {
            setLocalErrors((prev) => ({ ...prev, ...errs }));
            return false;
        }

        if (currentStep === 0) {
            clearStepErrors(['first_name', 'last_name', 'phone', 'email']);
        } else if (currentStep === 1) {
            clearStepErrors(['id_document']);
        } else if (currentStep === 2) {
            clearStepErrors(['industries']);
        }

        return true;
    };

    const nextStep = () => {
        if (!validateStep(step)) return;
        if (step < steps.length - 1) {
            setStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        if (step > 0) {
            setStep((prev) => prev - 1);
        }
    };

    const toggleIndustry = (value: string) => {
        const current = data.industries ?? [];

        let updated = [];

        if (current.includes(value)) {
            // Remove
            updated = current.filter((v) => v !== value);
        } else {
            // Add
            updated = [...current, value];
        }

        setData('industries', updated);

        // Clear error when user interacts
        setLocalErrors((prev) => {
            const copy = { ...prev };
            delete copy.industries;
            return copy;
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!validateStep(step)) return;

        post('/signup/investor', {
            forceFormData: true,
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-slate-50">
            <motion.div
                className="mx-auto w-full max-w-4xl px-4 py-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold md:text-3xl">
                            Investor onboarding
                        </h1>
                        <p className="mt-1 text-xs text-slate-400 md:text-sm">
                            Step {step + 1} of {steps.length} · {steps[step]}
                        </p>
                    </div>
                    <Link
                        href="/signup"
                        className="text-xs text-slate-400 underline underline-offset-4 hover:text-slate-200 md:text-sm"
                    >
                        ← Back to role selection
                    </Link>
                </div>

                {/* Progress bar */}
                <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
                    <motion.div
                        className="h-2 bg-sky-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.25 }}
                    />
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    encType="multipart/form-data"
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl md:p-8"
                >
                    <AnimatePresence mode="wait">
                        {/* STEP 1: Personal details */}
                        {step === 0 && (
                            <motion.div
                                key="step-1"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <h2 className="mb-4 text-lg font-semibold">
                                    1. Personal details
                                </h2>
                                <p className="mb-4 text-xs text-slate-400">
                                    Tell us who you are so we can set up your
                                    investor profile.
                                </p>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            First name{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                                            value={data.first_name}
                                            onChange={(e) =>
                                                setData(
                                                    'first_name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {getError('first_name') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('first_name')}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Last name{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                                            value={data.last_name}
                                            onChange={(e) =>
                                                setData(
                                                    'last_name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {getError('last_name') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('last_name')}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Phone number{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                                            value={data.phone}
                                            onChange={(e) =>
                                                setData('phone', e.target.value)
                                            }
                                        />
                                        {getError('phone') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('phone')}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Email{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                        />
                                        {getError('email') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('email')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: ID document */}
                        {step === 1 && (
                            <motion.div
                                key="step-2"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <h2 className="mb-4 text-lg font-semibold">
                                    2. Stamped ID document
                                </h2>
                                <p className="mb-4 text-xs text-slate-400">
                                    Upload a stamped copy of your ID in PDF
                                    format for identity verification.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Stamped ID (PDF){' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-sky-500/80 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-950 hover:file:bg-sky-400"
                                            onChange={(e) =>
                                                setData(
                                                    'id_document',
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                        {getError('id_document') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('id_document')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: Select industries */}
                        {step === 2 && (
                            <motion.div
                                key="step-3"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <h2 className="mb-4 text-lg font-semibold">
                                    3. Select industries
                                </h2>
                                <p className="mb-4 text-xs text-slate-400">
                                    Pick the industries you&apos;re most
                                    interested in funding. You can choose more
                                    than one — just like music genres.
                                </p>

                                <div className="mb-3 flex flex-wrap gap-2">
                                    {INDUSTRY_OPTIONS.map((industry, index) => {
                                        const isSelected =
                                            data.industries.includes(
                                                industry.value,
                                            );
                                        return (
                                            <motion.button
                                                key={industry.value}
                                                type="button"
                                                className={[
                                                    'rounded-full border px-4 py-2 text-xs transition-colors md:text-sm',
                                                    'backdrop-blur-sm',
                                                    isSelected
                                                        ? 'border-sky-400 bg-sky-500 text-slate-950'
                                                        : 'border-slate-700 bg-slate-900/80 text-slate-100 hover:border-sky-500/60',
                                                ].join(' ')}
                                                onClick={() =>
                                                    toggleIndustry(
                                                        industry.value,
                                                    )
                                                }
                                                variants={
                                                    industryBubbleVariants
                                                }
                                                initial="initial"
                                                animate="animate"
                                                whileHover="hover"
                                                custom={index}
                                            >
                                                {industry.label}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {getError('industries') && (
                                    <p className="mt-1 text-xs text-red-400">
                                        {getError('industries')}
                                    </p>
                                )}

                                <p className="mt-4 text-[11px] text-slate-500">
                                    Your selections help us match you with
                                    suitable borrower opportunities and
                                    portfolios.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    <div className="mt-8 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={step === 0}
                            className={`rounded-lg border bg-slate-900/60 px-4 py-2 text-xs md:text-sm ${
                                step === 0
                                    ? 'cursor-not-allowed border-slate-700 text-slate-600'
                                    : 'border-slate-600 text-slate-200 hover:border-slate-400'
                            }`}
                        >
                            Back
                        </button>

                        {step < steps.length - 1 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="rounded-lg bg-sky-500 px-5 py-2.5 text-xs font-medium text-slate-950 hover:bg-sky-400 md:text-sm"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-sky-500 px-5 py-2.5 text-xs font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60 md:text-sm"
                            >
                                {processing
                                    ? 'Submitting...'
                                    : 'Complete onboarding'}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default InvestorOnboardingPage;
