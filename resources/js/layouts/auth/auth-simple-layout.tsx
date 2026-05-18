import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
    image?: string;
    showTrustBadges?: boolean;
}

const trustBadges = [
    {
        icon: ShieldCheck,
        label: 'AML compliant',
    },
    {
        icon: Sparkles,
        label: 'Live in Zambia',
    },
    {
        icon: TrendingUp,
        label: 'Transparent secured returns',
    },
];

export default function AuthSimpleLayout({
    children,
    title,
    description,
    image,
    showTrustBadges = true,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="grid min-h-svh bg-black text-white lg:grid-cols-[1.05fr_1fr]">
            {/* Brand panel */}
            <div className="relative hidden overflow-hidden border-red-400 lg:flex lg:flex-col">
                {/* Background image */}
                {image && (
                    <>
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${image})` }}
                        />
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/85 via-black/70 to-black/90"
                        />
                    </>
                )}

                {/* Subtle grid */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                        backgroundSize: '56px 56px',
                        maskImage:
                            'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',
                    }}
                />

                {/* Soft white spotlight */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-20 -left-20 h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)] blur-3xl"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-32 -bottom-32 h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_70%)] blur-3xl"
                />

                <BrandParticles />

                <div className="relative z-10 flex h-full flex-col p-10">
                    <Link
                        href={home.url()}
                        className="flex items-center gap-2 text-white"
                    >
                        <AppLogoIcon className="size-6 fill-current text-white" />
                        <span className="text-sm font-semibold tracking-tight">
                            CreditCo Invest
                        </span>
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.7,
                            ease: [0.21, 0.47, 0.32, 0.98],
                        }}
                        className="mt-auto"
                    >
                        <p className="text-[11px] font-medium tracking-widest text-white/40 uppercase">
                            Welcome to CreditCo
                        </p>
                        <h2 className="mt-3 text-4xl leading-tight font-bold tracking-tight md:text-5xl">
                            Capital that{' '}
                            <span className="relative inline-block">
                                <span>moves</span>
                                <motion.span
                                    aria-hidden
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{
                                        delay: 0.6,
                                        duration: 0.7,
                                    }}
                                    className="absolute right-0 -bottom-1 left-0 h-[3px] origin-left rounded-full bg-white"
                                />
                            </span>{' '}
                            at the speed of business.
                        </h2>
                        <p className="mt-4 max-w-md text-sm text-white/60">
                            Peer-to-peer lending for Zambian SMEs. Get funded
                            fast, or earn transparent secured returns — all on
                            one trusted platform.
                        </p>

                        {showTrustBadges && (
                            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                                {trustBadges.map((b, i) => (
                                    <motion.span
                                        key={b.label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: 0.4 + i * 0.08,
                                            duration: 0.5,
                                        }}
                                        className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-white/70 uppercase"
                                    >
                                        <b.icon className="h-3 w-3 text-white/85" />
                                        {b.label}
                                    </motion.span>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    <p className="mt-10 text-[11px] text-white/40">
                        &copy; {new Date().getFullYear()} CreditCo Invest. All
                        rights reserved.
                    </p>
                </div>
            </div>

            {/* Form panel */}
            <div className="relative flex flex-col items-center justify-center bg-black px-6 py-10 sm:px-10">
                {/* Mobile logo + back link */}
                <div className="absolute top-6 right-6 left-6 flex items-center justify-between lg:hidden">
                    <Link
                        href={home.url()}
                        className="flex items-center gap-2 text-white"
                    >
                        <AppLogoIcon className="size-5 fill-current text-white" />
                        <span className="text-sm font-semibold tracking-tight">
                            CreditCo
                        </span>
                    </Link>
                </div>

                <Link
                    href={home.url()}
                    className="absolute top-6 left-6 hidden items-center gap-1 text-xs text-white/50 transition hover:text-white lg:flex"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to site
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-8 space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-white/55">
                                {description}
                            </p>
                        )}
                    </div>
                    {children}
                </motion.div>
            </div>
        </div>
    );
}

function BrandParticles() {
    const particles = Array.from({ length: 14 });
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {particles.map((_, i) => {
                const size = 1 + (i % 3) * 0.5;
                const delay = (i % 6) * 0.7;
                const duration = 8 + (i % 4) * 1.6;
                const top = (i * 41) % 100;
                const left = (i * 59) % 100;
                return (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 0.5, 0],
                            y: [0, -30, 0],
                            x: [0, i % 2 === 0 ? 8 : -8, 0],
                        }}
                        transition={{
                            duration,
                            delay,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute rounded-full bg-white"
                        style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                            filter: 'blur(0.5px)',
                        }}
                    />
                );
            })}
        </div>
    );
}
