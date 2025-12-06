// resources/js/Pages/auth/borrower/index.tsx

import { Link, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import React, { FormEvent, useState } from 'react';

interface BorrowerOnboardingForm {
    company_name: string;
    company_registration_number: string;
    company_type: string;
    years_in_operation: string;
    industry: string;

    reg_documents: File | null;
    bank_statement: File | null;
    company_printout: File | null;

    contact_name: string;
    contact_email: string;
    contact_phone: string;
    contact_id_copy: File | null;
    contact_address: string;
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

const BorrowerOnboardingPage: React.FC = () => {
    const [step, setStep] = useState<number>(0);

    const { errors: serverErrors } = usePage().props as {
        errors: Record<string, string>;
    };

    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

    const { data, setData, post, processing } = useForm<BorrowerOnboardingForm>(
        {
            company_name: '',
            company_registration_number: '',
            company_type: '',
            years_in_operation: '',
            industry: '',

            reg_documents: null,
            bank_statement: null,
            company_printout: null,

            contact_name: '',
            contact_email: '',
            contact_phone: '',
            contact_id_copy: null,
            contact_address: '',
        },
    );

    const steps = [
        'Company profile',
        'Registration documents',
        'Bank statement',
        'Company printout',
        'Contact details',
    ];

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
            // Company profile
            if (!data.company_name.trim()) {
                errs.company_name = 'Company name is required.';
            }
            if (!data.company_registration_number.trim()) {
                errs.company_registration_number =
                    'Registration / TPIN number is required.';
            }
            if (!data.company_type.trim()) {
                errs.company_type = 'Company type is required.';
            }
            if (!data.years_in_operation.trim()) {
                errs.years_in_operation = 'Years in operation is required.';
            } else if (Number(data.years_in_operation) < 0) {
                errs.years_in_operation =
                    'Years in operation must be zero or greater.';
            }
            if (!data.industry.trim()) {
                errs.industry = 'Industry is required.';
            }
        }

        if (currentStep === 1) {
            // Reg documents
            if (!data.reg_documents) {
                errs.reg_documents = 'Registration documents are required.';
            }
        }

        if (currentStep === 2) {
            // Bank statement
            if (!data.bank_statement) {
                errs.bank_statement = 'Bank statement is required.';
            }
        }

        if (currentStep === 3) {
            // Company printout
            if (!data.company_printout) {
                errs.company_printout = 'Company printout is required.';
            }
        }

        if (currentStep === 4) {
            // Contact details
            if (!data.contact_name.trim()) {
                errs.contact_name = 'Contact name is required.';
            }
            if (!data.contact_email.trim()) {
                errs.contact_email = 'Contact email is required.';
            }
            if (!data.contact_phone.trim()) {
                errs.contact_phone = 'Contact phone is required.';
            }
            if (!data.contact_id_copy) {
                errs.contact_id_copy = 'Copy of ID is required.';
            }
            // contact_address is optional
        }

        if (Object.keys(errs).length > 0) {
            setLocalErrors((prev) => ({ ...prev, ...errs }));
            return false;
        }

        // Clear errors for this step if validation passes
        if (currentStep === 0) {
            clearStepErrors([
                'company_name',
                'company_registration_number',
                'company_type',
                'years_in_operation',
                'industry',
            ]);
        } else if (currentStep === 1) {
            clearStepErrors(['reg_documents']);
        } else if (currentStep === 2) {
            clearStepErrors(['bank_statement']);
        } else if (currentStep === 3) {
            clearStepErrors(['company_printout']);
        } else if (currentStep === 4) {
            clearStepErrors([
                'contact_name',
                'contact_email',
                'contact_phone',
                'contact_id_copy',
            ]);
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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Validate final step before submitting
        if (!validateStep(step)) return;

        post('/signup/borrower', {
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
                            Borrower onboarding
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
                        className="h-2 bg-emerald-400"
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
                        {/* STEP 1: Company profile */}
                        {step === 0 && (
                            <motion.div
                                key="step-1"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <h2 className="mb-4 text-lg font-semibold">
                                    1. Company profile
                                </h2>
                                <p className="mb-4 text-xs text-slate-400">
                                    Tell us about your company so we can
                                    understand your business.
                                </p>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Company name{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                            value={data.company_name}
                                            onChange={(e) =>
                                                setData(
                                                    'company_name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {getError('company_name') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('company_name')}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Registration / TPIN number{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                            value={
                                                data.company_registration_number
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'company_registration_number',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {getError(
                                            'company_registration_number',
                                        ) && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError(
                                                    'company_registration_number',
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Company type{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                            value={data.company_type}
                                            onChange={(e) =>
                                                setData(
                                                    'company_type',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select type
                                            </option>
                                            <option value="limited">
                                                Limited company
                                            </option>
                                            <option value="sole_prop">
                                                Sole proprietor
                                            </option>
                                            <option value="partnership">
                                                Partnership
                                            </option>
                                            <option value="ngo">
                                                NGO / Non-profit
                                            </option>
                                            <option value="other">Other</option>
                                        </select>
                                        {getError('company_type') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('company_type')}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Years in operation{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                            value={data.years_in_operation}
                                            onChange={(e) =>
                                                setData(
                                                    'years_in_operation',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {getError('years_in_operation') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('years_in_operation')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Industry{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                            value={data.industry}
                                            onChange={(e) =>
                                                setData(
                                                    'industry',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select industry
                                            </option>
                                            <option value="agriculture">
                                                Agriculture
                                            </option>
                                            <option value="construction">
                                                Construction
                                            </option>
                                            <option value="manufacturing">
                                                Manufacturing
                                            </option>
                                            <option value="transport">
                                                Transport & Logistics
                                            </option>
                                            <option value="finance">
                                                Finance & Insurance
                                            </option>
                                            <option value="retail">
                                                Retail & Wholesale
                                            </option>
                                            <option value="ict">
                                                ICT & Technology
                                            </option>
                                            <option value="mining">
                                                Mining
                                            </option>
                                            <option value="hospitality">
                                                Hospitality
                                            </option>
                                            <option value="healthcare">
                                                Healthcare
                                            </option>
                                            <option value="education">
                                                Education
                                            </option>
                                            <option value="energy">
                                                Energy
                                            </option>
                                            <option value="other">Other</option>
                                        </select>
                                        {getError('industry') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('industry')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: Reg documents */}
                        {step === 1 && (
                            <motion.div
                                key="step-2"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <h2 className="mb-4 text-lg font-semibold">
                                    2. Registration documents
                                </h2>
                                <p className="mb-4 text-xs text-slate-400">
                                    Upload your company registration documents
                                    (e.g. PACRA certificate, ZRA registration,
                                    tax clearance).
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Registration documents (PDF or
                                            image){' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/80 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-950 hover:file:bg-emerald-400"
                                            onChange={(e) =>
                                                setData(
                                                    'reg_documents',
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                        {getError('reg_documents') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('reg_documents')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: Bank statement */}
                        {step === 2 && (
                            <motion.div
                                key="step-3"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <h2 className="mb-4 text-lg font-semibold">
                                    3. Bank statement
                                </h2>
                                <p className="mb-4 text-xs text-slate-400">
                                    Upload a recent bank statement to help us
                                    assess your cash flow.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Latest bank statement (PDF){' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/80 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-950 hover:file:bg-emerald-400"
                                            onChange={(e) =>
                                                setData(
                                                    'bank_statement',
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                        {getError('bank_statement') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('bank_statement')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: Company printout */}
                        {step === 3 && (
                            <motion.div
                                key="step-4"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <h2 className="mb-4 text-lg font-semibold">
                                    4. Company print out
                                </h2>
                                <p className="mb-4 text-xs text-slate-400">
                                    Upload a company profile / print-out
                                    document if available.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Company print out (PDF or image){' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/80 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-950 hover:file:bg-emerald-400"
                                            onChange={(e) =>
                                                setData(
                                                    'company_printout',
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                        {getError('company_printout') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('company_printout')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 5: Contact details */}
                        {step === 4 && (
                            <motion.div
                                key="step-5"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <h2 className="mb-4 text-lg font-semibold">
                                    5. Contact details
                                </h2>
                                <p className="mb-4 text-xs text-slate-400">
                                    Provide contact details for the primary
                                    person we will deal with.
                                </p>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Full names{' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                            value={data.contact_name}
                                            onChange={(e) =>
                                                setData(
                                                    'contact_name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {getError('contact_name') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('contact_name')}
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
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                            value={data.contact_email}
                                            onChange={(e) =>
                                                setData(
                                                    'contact_email',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {getError('contact_email') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('contact_email')}
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
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                            value={data.contact_phone}
                                            onChange={(e) =>
                                                setData(
                                                    'contact_phone',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {getError('contact_phone') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('contact_phone')}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Copy of ID (image or PDF){' '}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/80 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-950 hover:file:bg-emerald-400"
                                            onChange={(e) =>
                                                setData(
                                                    'contact_id_copy',
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                        {getError('contact_id_copy') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('contact_id_copy')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-1 block text-xs text-slate-400">
                                            Physical address (optional)
                                        </label>
                                        <textarea
                                            rows={2}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                            value={data.contact_address}
                                            onChange={(e) =>
                                                setData(
                                                    'contact_address',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {getError('contact_address') && (
                                            <p className="mt-1 text-xs text-red-400">
                                                {getError('contact_address')}
                                            </p>
                                        )}
                                        <p className="mt-1 text-[10px] text-slate-500">
                                            Optional, but helps us verify your
                                            location if needed.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-400">
                                    <p className="mb-1 font-semibold text-slate-200">
                                        Next step: payment
                                    </p>
                                    <p>
                                        After submitting your onboarding
                                        details, you'll be redirected to
                                        complete payment. Once payment is
                                        received, we’ll generate a reference
                                        number for your application.
                                    </p>
                                </div>
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
                                className="rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-medium text-slate-950 hover:bg-emerald-400 md:text-sm"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60 md:text-sm"
                            >
                                {processing
                                    ? 'Submitting...'
                                    : 'Submit & proceed to payment'}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default BorrowerOnboardingPage;
