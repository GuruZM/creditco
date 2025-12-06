// resources/js/Pages/auth/select-role/index.tsx

import { Link } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import React from 'react';

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.15 * i, duration: 0.35 },
    }),
    hover: {
        y: -6,
        scale: 1.02,
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
    },
};

const RoleSelectPage: React.FC = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-slate-50">
            <motion.div
                className="mx-auto w-full max-w-3xl px-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Heading */}
                <div className="mb-10 text-center">
                    <h1 className="mb-2 text-3xl font-semibold md:text-4xl">
                        Join <span className="text-emerald-400">CreditCo</span>
                    </h1>
                    <p className="text-sm text-slate-400 md:text-base">
                        Choose how you want to get started.
                    </p>
                </div>

                {/* Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Borrower */}
                    <Link href="/signup/borrower">
                        <motion.div
                            className="h-full cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            custom={0}
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <h2 className="text-xl font-semibold text-slate-50">
                                    I want to borrow
                                </h2>
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                                    Borrower
                                </span>
                            </div>
                            <p className="mb-4 text-sm text-slate-400">
                                Apply for credit, track your repayments, and
                                manage your credit profile in one place.
                            </p>
                            <ul className="space-y-1 text-xs text-slate-400">
                                <li>• Flexible loan applications</li>
                                <li>• Repayment schedules & reminders</li>
                                <li>• Credit performance overview</li>
                            </ul>
                        </motion.div>
                    </Link>

                    {/* Investor */}
                    <Link href="/signup/investor">
                        <motion.div
                            className="h-full cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            custom={1}
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <h2 className="text-xl font-semibold text-slate-50">
                                    I want to invest
                                </h2>
                                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-xs text-sky-300">
                                    Investor
                                </span>
                            </div>
                            <p className="mb-4 text-sm text-slate-400">
                                Fund borrower portfolios, earn returns, and
                                monitor your investment performance.
                            </p>
                            <ul className="space-y-1 text-xs text-slate-400">
                                <li>• Create investment profiles</li>
                                <li>• View performance analytics</li>
                                <li>• Track capital & returns</li>
                            </ul>
                        </motion.div>
                    </Link>
                </div>

                {/* Login link */}
                <div className="mt-8 text-center text-xs text-slate-500">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
                    >
                        Log in
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default RoleSelectPage;
