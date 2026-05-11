import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { type PropsWithChildren } from 'react';

type Props = {
    title: string;
    description?: string;
    stepLabel?: string;
    progress?: number;
};

export default function SignupFlowLayout({
    title,
    description,
    stepLabel,
    progress,
    children,
}: PropsWithChildren<Props>) {
    return (
        <div className="relative min-h-svh bg-black text-white">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                    backgroundSize: '56px 56px',
                    maskImage:
                        'radial-gradient(ellipse 60% 50% at 50% 0%, black 30%, transparent 80%)',
                }}
            />

            <header className="relative z-10 border-b border-white/10">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
                    <Link
                        href={home.url()}
                        className="flex items-center gap-2 text-white"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04]">
                            <AppLogoIcon className="size-4 fill-current text-white" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">
                            CreditCo
                        </span>
                    </Link>

                    <Link
                        href="/signup"
                        className="inline-flex items-center gap-1 text-xs text-white/50 transition hover:text-white"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Role selection
                    </Link>
                </div>
            </header>

            <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                {title}
                            </h1>
                            {description && (
                                <p className="mt-1 text-sm text-white/55">
                                    {description}
                                </p>
                            )}
                        </div>
                        {stepLabel && (
                            <p className="text-[11px] font-medium tracking-widest text-white/40 uppercase">
                                {stepLabel}
                            </p>
                        )}
                    </div>

                    {typeof progress === 'number' && (
                        <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <motion.div
                                className="h-full rounded-full bg-white"
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${Math.max(0, Math.min(100, progress))}%`,
                                }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    )}

                    {children}
                </motion.div>

                <p className="mt-10 text-center text-[11px] text-white/30">
                    &copy; {new Date().getFullYear()} CreditCo Invest
                </p>
            </main>
        </div>
    );
}
