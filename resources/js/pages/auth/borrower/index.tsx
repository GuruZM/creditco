import AuthField from '@/components/auth/auth-field';
import AuthFileField from '@/components/auth/auth-file-field';
import AuthSelect from '@/components/auth/auth-select';
import SignupFlowLayout from '@/layouts/auth/signup-flow-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    FileText,
    LoaderCircle,
    Receipt,
    UserCircle2,
    Wallet,
} from 'lucide-react';
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

const stepVariants: Variants = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

const COMPANY_TYPES = [
    { value: 'limited', label: 'Limited company' },
    { value: 'sole_prop', label: 'Sole proprietor' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'ngo', label: 'NGO / Non-profit' },
    { value: 'other', label: 'Other' },
];

const INDUSTRIES = [
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
    { value: 'other', label: 'Other' },
];

const STEPS = [
    { label: 'Company profile', icon: Building2 },
    { label: 'Registration documents', icon: FileText },
    { label: 'Bank statement', icon: Wallet },
    { label: 'Company printout', icon: Receipt },
    { label: 'Contact details', icon: UserCircle2 },
];

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

    const progress = ((step + 1) / STEPS.length) * 100;

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

        if (currentStep === 1 && !data.reg_documents) {
            errs.reg_documents = 'Registration documents are required.';
        }
        if (currentStep === 2 && !data.bank_statement) {
            errs.bank_statement = 'Bank statement is required.';
        }
        if (currentStep === 3 && !data.company_printout) {
            errs.company_printout = 'Company printout is required.';
        }

        if (currentStep === 4) {
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
        }

        if (Object.keys(errs).length > 0) {
            setLocalErrors((prev) => ({ ...prev, ...errs }));
            return false;
        }

        const stepFields: Record<number, string[]> = {
            0: [
                'company_name',
                'company_registration_number',
                'company_type',
                'years_in_operation',
                'industry',
            ],
            1: ['reg_documents'],
            2: ['bank_statement'],
            3: ['company_printout'],
            4: [
                'contact_name',
                'contact_email',
                'contact_phone',
                'contact_id_copy',
            ],
        };
        clearStepErrors(stepFields[currentStep] ?? []);

        return true;
    };

    const nextStep = () => {
        if (!validateStep(step)) {
            return;
        }
        if (step < STEPS.length - 1) {
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
        if (!validateStep(step)) {
            return;
        }
        post('/signup/borrower', { forceFormData: true });
    };

    const StepIcon = STEPS[step].icon;

    return (
        <SignupFlowLayout
            title="Borrower onboarding"
            description="Tell us about your business so we can review your application."
            stepLabel={`Step ${step + 1} of ${STEPS.length}`}
            progress={progress}
        >
            <Head title="Borrower onboarding" />

            <form
                onSubmit={handleSubmit}
                encType="multipart/form-data"
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm sm:p-7"
            >
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white">
                        <StepIcon className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium tracking-widest text-white/40 uppercase">
                            Section {step + 1}
                        </p>
                        <h2 className="text-base font-semibold text-white">
                            {STEPS[step].label}
                        </h2>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="step-1"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="grid gap-5 md:grid-cols-2"
                        >
                            <div className="md:col-span-2">
                                <AuthField
                                    label="Company name"
                                    name="company_name"
                                    type="text"
                                    placeholder="Acme Holdings Ltd"
                                    required
                                    value={data.company_name}
                                    onChange={(e) =>
                                        setData('company_name', e.target.value)
                                    }
                                    error={getError('company_name')}
                                />
                            </div>
                            <AuthField
                                label="Registration / TPIN"
                                name="company_registration_number"
                                type="text"
                                placeholder="e.g. 1001234567"
                                required
                                value={data.company_registration_number}
                                onChange={(e) =>
                                    setData(
                                        'company_registration_number',
                                        e.target.value,
                                    )
                                }
                                error={getError('company_registration_number')}
                            />
                            <AuthSelect
                                label="Company type"
                                name="company_type"
                                required
                                placeholder="Select type"
                                options={COMPANY_TYPES}
                                value={data.company_type}
                                onChange={(e) =>
                                    setData('company_type', e.target.value)
                                }
                                error={getError('company_type')}
                            />
                            <AuthField
                                label="Years in operation"
                                name="years_in_operation"
                                type="text"
                                placeholder="e.g. 5"
                                required
                                value={data.years_in_operation}
                                onChange={(e) =>
                                    setData(
                                        'years_in_operation',
                                        e.target.value.replace(/[^0-9]/g, ''),
                                    )
                                }
                                error={getError('years_in_operation')}
                            />
                            <div className="md:col-span-2">
                                <AuthSelect
                                    label="Industry"
                                    name="industry"
                                    required
                                    placeholder="Select industry"
                                    options={INDUSTRIES}
                                    value={data.industry}
                                    onChange={(e) =>
                                        setData('industry', e.target.value)
                                    }
                                    error={getError('industry')}
                                />
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="step-2"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-4"
                        >
                            <p className="text-sm text-white/55">
                                Upload your company registration documents — for
                                example PACRA certificate, ZRA registration, or
                                tax clearance.
                            </p>
                            <AuthFileField
                                label="Registration documents"
                                name="reg_documents"
                                accept=".pdf,image/*"
                                required
                                hint="PDF or image · max ~10 MB"
                                value={data.reg_documents}
                                onChange={(file) =>
                                    setData('reg_documents', file)
                                }
                                error={getError('reg_documents')}
                            />
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step-3"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-4"
                        >
                            <p className="text-sm text-white/55">
                                Upload a recent bank statement so we can assess
                                your cash flow.
                            </p>
                            <AuthFileField
                                label="Latest bank statement"
                                name="bank_statement"
                                accept=".pdf"
                                required
                                hint="PDF only"
                                value={data.bank_statement}
                                onChange={(file) =>
                                    setData('bank_statement', file)
                                }
                                error={getError('bank_statement')}
                            />
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step-4"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-4"
                        >
                            <p className="text-sm text-white/55">
                                Upload a recent PACRA company printout or
                                equivalent profile document.
                            </p>
                            <AuthFileField
                                label="Company printout"
                                name="company_printout"
                                accept=".pdf,image/*"
                                required
                                hint="PDF or image"
                                value={data.company_printout}
                                onChange={(file) =>
                                    setData('company_printout', file)
                                }
                                error={getError('company_printout')}
                            />
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step-5"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-5"
                        >
                            <div className="grid gap-5 md:grid-cols-2">
                                <AuthField
                                    label="Full names"
                                    name="contact_name"
                                    type="text"
                                    placeholder="Jane Mwansa"
                                    required
                                    value={data.contact_name}
                                    onChange={(e) =>
                                        setData('contact_name', e.target.value)
                                    }
                                    error={getError('contact_name')}
                                />
                                <AuthField
                                    label="Email"
                                    name="contact_email"
                                    type="email"
                                    placeholder="you@company.com"
                                    required
                                    value={data.contact_email}
                                    onChange={(e) =>
                                        setData('contact_email', e.target.value)
                                    }
                                    error={getError('contact_email')}
                                />
                                <AuthField
                                    label="Phone number"
                                    name="contact_phone"
                                    type="text"
                                    placeholder="+260 …"
                                    required
                                    value={data.contact_phone}
                                    onChange={(e) =>
                                        setData('contact_phone', e.target.value)
                                    }
                                    error={getError('contact_phone')}
                                />
                                <AuthFileField
                                    label="Copy of ID"
                                    name="contact_id_copy"
                                    accept=".pdf,image/*"
                                    required
                                    hint="PDF or image"
                                    value={data.contact_id_copy}
                                    onChange={(file) =>
                                        setData('contact_id_copy', file)
                                    }
                                    error={getError('contact_id_copy')}
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-medium tracking-wide text-white/70 uppercase">
                                    Physical address{' '}
                                    <span className="ml-1 text-white/40">
                                        (optional)
                                    </span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Street, area, town"
                                    value={data.contact_address}
                                    onChange={(e) =>
                                        setData(
                                            'contact_address',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/30 transition outline-none focus:border-white/40 focus:bg-white/[0.06]"
                                />
                                {getError('contact_address') && (
                                    <p className="mt-1 text-[11px] font-medium text-red-300">
                                        {getError('contact_address')}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/65">
                                <p className="mb-1 font-semibold text-white">
                                    Next step: payment
                                </p>
                                <p className="text-[13px] text-white/55">
                                    After submitting your details, you&apos;ll
                                    be redirected to complete payment. Once
                                    received we&apos;ll generate a reference for
                                    your application.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={step === 0}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-transparent px-4 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    {step < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-white/90"
                        >
                            Next
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={processing}
                            className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {processing ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Submit & continue to payment
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </SignupFlowLayout>
    );
};

export default BorrowerOnboardingPage;
