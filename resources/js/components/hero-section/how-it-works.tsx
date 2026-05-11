import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import {
    BarChart3,
    CheckCircle2,
    FileText,
    HandCoins,
    Megaphone,
    PiggyBank,
    Wallet,
} from 'lucide-react';
import { useRef } from 'react';

const steps = [
    {
        step: '01',
        title: 'SME applies',
        description:
            'Borrower submits a structured application with credit history.',
        icon: FileText,
    },
    {
        step: '02',
        title: 'Risk assessment',
        description:
            'Our engine scores credit risk and proposes a fair rate band.',
        icon: BarChart3,
    },
    {
        step: '03',
        title: 'Loan listed',
        description:
            'Application goes live for the soliciting window — investors see it.',
        icon: Megaphone,
    },
    {
        step: '04',
        title: 'Investors bid',
        description:
            'Anonymous bids set the final rate. Best terms win the allocation.',
        icon: HandCoins,
    },
    {
        step: '05',
        title: 'Funded & disbursed',
        description: 'Once fully subscribed, funds settle directly to the SME.',
        icon: Wallet,
    },
    {
        step: '06',
        title: 'Returns earned',
        description:
            'Investors collect secured payouts as the SME repays on schedule.',
        icon: PiggyBank,
    },
];

const HowItWorks = () => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start 70%', 'end 30%'],
    });

    const springProgress = useSpring(scrollYProgress, {
        stiffness: 80,
        damping: 28,
    });
    const lineHeight = useTransform(springProgress, [0, 1], ['0%', '100%']);

    return (
        <section
            id="how-it-works"
            className="relative overflow-hidden bg-black py-28 text-white"
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 left-1/3 h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_70%)] blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-white/70">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                        How it works
                    </span>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        From application to disbursed, in days.
                    </h2>
                    <p className="mt-4 text-base text-white/60 md:text-lg">
                        Six steps, fully tracked. We handle the heavy lifting
                        between borrowers and investors so capital can move.
                    </p>
                </motion.div>

                <div ref={ref} className="relative mt-20">
                    {/* Vertical animated line (desktop only) */}
                    <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 hidden -translate-x-1/2 md:block">
                        <div className="absolute inset-0 w-[2px] -translate-x-1/2 bg-white/5" />
                        <motion.div
                            style={{ height: lineHeight }}
                            className="absolute top-0 left-0 w-[2px] -translate-x-1/2 bg-white"
                        />
                    </div>

                    <div className="space-y-10 md:space-y-16">
                        {steps.map((s, i) => {
                            const isLeft = i % 2 === 0;
                            return (
                                <motion.div
                                    key={s.step}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.4 }}
                                    transition={{ duration: 0.6 }}
                                    className={`relative flex flex-col items-center gap-6 md:flex-row ${
                                        isLeft ? '' : 'md:flex-row-reverse'
                                    }`}
                                >
                                    <div className="flex w-full md:w-1/2">
                                        <div
                                            className={`group w-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.05] ${
                                                isLeft
                                                    ? 'md:mr-10 md:text-right'
                                                    : 'md:ml-10'
                                            }`}
                                        >
                                            <div
                                                className={`flex items-center gap-3 ${
                                                    isLeft
                                                        ? 'md:flex-row-reverse'
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white text-black">
                                                    <s.icon className="h-5 w-5" />
                                                </div>
                                                <p className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                                                    Step {s.step}
                                                </p>
                                            </div>
                                            <h3 className="mt-4 text-xl font-semibold text-white">
                                                {s.title}
                                            </h3>
                                            <p className="mt-2 text-sm text-white/60">
                                                {s.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Center node */}
                                    <div className="absolute top-6 left-1/2 hidden -translate-x-1/2 md:block">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black text-xs font-semibold text-white">
                                            {s.step}
                                        </div>
                                    </div>

                                    <div className="hidden w-1/2 md:block" />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
