import AuthField from '@/components/auth/auth-field';
import AuthFileField from '@/components/auth/auth-file-field';
import SignupFlowLayout from '@/layouts/auth/signup-flow-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    Layers,
    LoaderCircle,
    UserCircle2,
} from 'lucide-react';
import React, { FormEvent, useState } from 'react';

interface InvestorOnboardingForm {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    id_document: File | null;
    industries: string[];
}

const stepVariants: Variants = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
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

const STEPS = [
    { label: 'Personal details', icon: UserCircle2 },
    { label: 'ID document', icon: BadgeCheck },
    { label: 'Select industries', icon: Layers },
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

        if (currentStep === 1 && !data.id_document) {
            errs.id_document = 'Stamped ID (PDF) is required.';
        }

        if (currentStep === 2 && (!data.industries || data.industries.length === 0)) {
            errs.industries = 'Please select at least one industry.';
        }

        if (Object.keys(errs).length > 0) {
            setLocalErrors((prev) => ({ ...prev, ...errs }));
            return false;
        }

        const stepFields: Record<number, string[]> = {
            0: ['first_name', 'last_name', 'phone', 'email'],
            1: ['id_document'],
            2: ['industries'],
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

    const toggleIndustry = (value: string) => {
        const current = data.industries ?? [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];

        setData('industries', updated);
        setLocalErrors((prev) => {
            const copy = { ...prev };
            delete copy.industries;
            return copy;
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep(step)) {
            return;
        }
        post('/signup/investor', { forceFormData: true });
    };

    const StepIcon = STEPS[step].icon;

    return (
        <SignupFlowLayout
            title="Investor onboarding"
            description="Set up your investor profile in a few quick steps."
            stepLabel={`Step ${step + 1} of ${STEPS.length}`}
            progress={progress}
        >
            <Head title="Investor onboarding" />

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
                            <AuthField
                                label="First name"
                                name="first_name"
                                type="text"
                                placeholder="Jane"
                                required
                                value={data.first_name}
                                onChange={(e) =>
                                    setData('first_name', e.target.value)
                                }
                                error={getError('first_name')}
                            />
                            <AuthField
                                label="Last name"
                                name="last_name"
                                type="text"
                                placeholder="Mwansa"
                                required
                                value={data.last_name}
                                onChange={(e) =>
                                    setData('last_name', e.target.value)
                                }
                                error={getError('last_name')}
                            />
                            <AuthField
                                label="Phone number"
                                name="phone"
                                type="text"
                                placeholder="+260 …"
                                required
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                                error={getError('phone')}
                            />
                            <AuthField
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                error={getError('email')}
                            />
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
                                Upload a stamped copy of your ID in PDF format
                                so we can verify your identity.
                            </p>
                            <AuthFileField
                                label="Stamped ID"
                                name="id_document"
                                accept=".pdf"
                                required
                                hint="PDF only"
                                value={data.id_document}
                                onChange={(file) =>
                                    setData('id_document', file)
                                }
                                error={getError('id_document')}
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
                                Pick the industries you&apos;re interested in
                                funding. Choose as many as you like — we&apos;ll
                                use this to surface relevant opportunities.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {INDUSTRY_OPTIONS.map((industry) => {
                                    const isSelected = data.industries.includes(
                                        industry.value,
                                    );
                                    return (
                                        <button
                                            key={industry.value}
                                            type="button"
                                            onClick={() =>
                                                toggleIndustry(industry.value)
                                            }
                                            className={[
                                                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                                                isSelected
                                                    ? 'border-white bg-white text-black'
                                                    : 'border-white/15 bg-white/[0.03] text-white/80 hover:border-white/40 hover:text-white',
                                            ].join(' ')}
                                        >
                                            {industry.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {getError('industries') && (
                                <p className="text-[11px] font-medium text-red-300">
                                    {getError('industries')}
                                </p>
                            )}

                            <p className="text-[11px] text-white/40">
                                Your selections help us match you with suitable
                                borrower opportunities.
                            </p>
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
                                    Complete onboarding
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

export default InvestorOnboardingPage;
