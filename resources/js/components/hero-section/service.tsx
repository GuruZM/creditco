import { Link } from '@inertiajs/react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
    ArrowUpRight,
    BadgeDollarSign,
    Banknote,
    Briefcase,
    Building2,
    Eye,
    Fingerprint,
    HandCoins,
    Receipt,
    ShieldCheck,
    Sparkles,
    Timer,
} from 'lucide-react';
import { useRef } from 'react';

const Service = () => {
    return (
        <section
            id="services"
            className="relative overflow-hidden bg-black py-28 text-white"
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
                    backgroundSize: '100% 56px',
                    maskImage:
                        'radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 80%)',
                }}
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-white/70">
                        <Sparkles className="h-3 w-3 text-white" />
                        Two sides, one platform
                    </span>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        Pick your side. We'll do the rest.
                    </h2>
                    <p className="mt-4 text-base text-white/60 md:text-lg">
                        Whether you're raising or deploying capital, CreditCo
                        gives you the tools, transparency and speed of a
                        modern fintech.
                    </p>
                </motion.div>

                <div className="mt-16 grid gap-8 lg:grid-cols-2">
                    <ServiceCard
                        icon={Building2}
                        eyebrow="For SMEs"
                        title="Funding that respects your timeline."
                        description="Apply in minutes, get matched with investors in days, draw down on your terms."
                        bullets={[
                            {
                                icon: Timer,
                                label: 'Fast applications',
                                text: 'Apply online with a structured workflow — no email chains.',
                            },
                            {
                                icon: Receipt,
                                label: 'Smart pricing',
                                text: 'Risk-based rates negotiated by investors during bidding.',
                            },
                            {
                                icon: Banknote,
                                label: 'Flexible terms',
                                text: 'Choose maturity, repayment cadence and amounts that fit.',
                            },
                            {
                                icon: ShieldCheck,
                                label: 'Documented',
                                text: 'Every loan is contractually secured end-to-end.',
                            },
                        ]}
                        cta={{ href: '/signup/borrower', label: 'Apply for funding' }}
                        ctaClass="bg-white text-black hover:bg-white/90"
                    />

                    <ServiceCard
                        icon={Briefcase}
                        eyebrow="For investors"
                        title="Returns you can actually trace."
                        description="Bid anonymously on vetted SMEs, hold credit-claim documents, see your portfolio in real time."
                        bullets={[
                            {
                                icon: Fingerprint,
                                label: 'Anonymous bidding',
                                text: 'Coded usernames protect your identity during bidding.',
                            },
                            {
                                icon: BadgeDollarSign,
                                label: 'Bid for yield',
                                text: 'Set the rate you want — match with the SMEs that fit.',
                            },
                            {
                                icon: HandCoins,
                                label: 'Secured returns',
                                text: 'Receive credit-claim documents that guarantee payouts.',
                            },
                            {
                                icon: Eye,
                                label: 'Full transparency',
                                text: 'Risk grades, credit history and progress on every loan.',
                            },
                        ]}
                        cta={{ href: '/signup/investor', label: 'Start investing' }}
                        ctaClass="border border-white/30 bg-transparent text-white hover:bg-white hover:text-black"
                    />
                </div>
            </div>
        </section>
    );
};

type Bullet = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    text: string;
};

function ServiceCard({
    icon: Icon,
    eyebrow,
    title,
    description,
    bullets,
    cta,
    ctaClass,
}: {
    icon: React.ComponentType<{ className?: string }>;
    eyebrow: string;
    title: string;
    description: string;
    bullets: Bullet[];
    cta: { href: string; label: string };
    ctaClass: string;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const transformY = useTransform(rotateX, (v) => v);
    const transformX = useTransform(rotateY, (v) => v);

    const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        rotateY.set(x * 8);
        rotateX.set(-y * 8);
    };

    const onLeave = () => {
        rotateX.set(0);
        rotateY.set(0);
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            style={{
                rotateX: transformY,
                rotateY: transformX,
                transformPerspective: 1000,
                transformStyle: 'preserve-3d',
            }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm transition hover:border-white/20"
        >
            <div className="relative">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/80">
                        {eyebrow}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04]">
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                </div>

                <h3 className="mt-6 text-2xl font-semibold tracking-tight md:text-3xl">
                    {title}
                </h3>
                <p className="mt-3 max-w-md text-sm text-white/60">
                    {description}
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {bullets.map((b) => (
                        <div
                            key={b.label}
                            className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                        >
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                                <b.icon className="h-3.5 w-3.5 text-white/85" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-white">
                                    {b.label}
                                </p>
                                <p className="mt-0.5 text-[11px] text-white/50">
                                    {b.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex items-center justify-between">
                    <Link
                        href={cta.href}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${ctaClass}`}
                    >
                        {cta.label}
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

export default Service;
