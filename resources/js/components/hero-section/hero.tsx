import { Link } from '@inertiajs/react';
import {
    AnimatePresence,
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    Variants,
} from 'framer-motion';
import {
    ArrowRight,
    Building2,
    LineChart,
    PiggyBank,
    Play,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type HeroListing = {
    id: number;
    company: string;
    industry: string | null;
    amount: number;
    duration: string | null;
};

type HeroData = {
    stats: {
        capital_requested: number;
        approved_capital: number;
        verified_borrowers: number;
        active_investors: number;
        live_listings: number;
        industries_served: number;
    };
    listings: HeroListing[];
};

const HERO_BACKDROP =
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=2000&q=80';

const TRUST_AVATARS = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
];

const INDUSTRY_IMAGES: Record<string, string> = {
    Transport:
        'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
    Agriculture:
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    Retail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
    Manufacturing:
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=600&q=80',
    Construction:
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',
    Technology:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    Energy: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=600&q=80',
    Healthcare:
        'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=600&q=80',
    General:
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80',
};

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] },
    },
};

function useCountUp(target: number, duration = 1.6, start = 0) {
    const [value, setValue] = useState(start);

    useEffect(() => {
        let raf = 0;
        const t0 = performance.now();
        const animate = (now: number) => {
            const progress = Math.min(1, (now - t0) / (duration * 1000));
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(start + (target - start) * eased);
            if (progress < 1) raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [target, duration, start]);

    return value;
}

function formatZmw(n: number): string {
    if (n >= 1_000_000) return `ZMW ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `ZMW ${(n / 1_000).toFixed(1)}K`;
    return `ZMW ${Math.round(n).toLocaleString()}`;
}

const Hero = ({ auth, hero }: { auth: any; hero?: HeroData }) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springX = useSpring(mouseX, { stiffness: 120, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 120, damping: 30 });

    const orb1X = useTransform(springX, (v) => v * 30);
    const orb1Y = useTransform(springY, (v) => v * 30);
    const orb2X = useTransform(springX, (v) => v * -45);
    const orb2Y = useTransform(springY, (v) => v * -25);
    const heroImageX = useTransform(springX, (v) => v * -16);
    const heroImageY = useTransform(springY, (v) => v * -16);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const rect = sectionRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            mouseX.set(x);
            mouseY.set(y);
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, [mouseX, mouseY]);

    const stats = hero?.stats;
    const capitalTarget = stats?.capital_requested ?? 0;
    const investorsTarget = stats?.active_investors ?? 0;
    const borrowersTarget = stats?.verified_borrowers ?? 0;
    const listingsTarget = stats?.live_listings ?? 0;
    const industriesTarget = stats?.industries_served ?? 0;

    const capital = useCountUp(capitalTarget);
    const investors = useCountUp(investorsTarget);
    const borrowers = useCountUp(borrowersTarget);
    const listings = useCountUp(listingsTarget);

    const statBlocks: Array<{
        label: string;
        value: string;
        icon: React.ReactNode;
    }> = [];

    if (capitalTarget > 0) {
        statBlocks.push({
            label: 'Capital requested',
            value: formatZmw(capital),
            icon: <PiggyBank className="h-3.5 w-3.5 text-white/70" />,
        });
    }
    if (investorsTarget > 0) {
        statBlocks.push({
            label: 'Active investors',
            value: `${Math.round(investors)}`,
            icon: <TrendingUp className="h-3.5 w-3.5 text-white/70" />,
        });
    }
    if (borrowersTarget > 0) {
        statBlocks.push({
            label: 'Verified borrowers',
            value: `${Math.round(borrowers)}`,
            icon: <Building2 className="h-3.5 w-3.5 text-white/70" />,
        });
    }
    if (listingsTarget > 0 && statBlocks.length < 3) {
        statBlocks.push({
            label: 'Live listings',
            value: `${Math.round(listings)}`,
            icon: <LineChart className="h-3.5 w-3.5 text-white/70" />,
        });
    }

    const visibleStats = statBlocks.slice(0, 3);

    return (
        <section
            id="hero"
            ref={sectionRef}
            className="relative flex min-h-screen w-full items-center overflow-hidden bg-black"
        >
            <motion.div
                style={{ x: heroImageX, y: heroImageY }}
                aria-hidden
                className="pointer-events-none absolute inset-0"
            >
                <img
                    src={HERO_BACKDROP}
                    alt=""
                    loading="eager"
                    className="h-full w-full scale-110 object-cover opacity-30 grayscale"
                />
            </motion.div>

            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/85 via-black/70 to-black/90"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"
            />

            <div className="pointer-events-none absolute inset-0">
                <motion.div
                    style={{ x: orb1X, y: orb1Y }}
                    className="absolute top-[-10%] left-[-5%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_70%)] blur-3xl"
                />
                <motion.div
                    style={{ x: orb2X, y: orb2Y }}
                    className="absolute top-[15%] right-[-10%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent_70%)] blur-3xl"
                />
            </div>

            <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
                    backgroundSize: '56px 56px',
                    maskImage:
                        'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',
                }}
            />

            <FloatingParticles />

            <div className="relative z-10 mx-auto grid w-[90%] max-w-7xl items-center gap-12 px-2 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-0">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-left"
                >
                    <motion.h1
                        variants={itemVariants}
                        className="mt-6 text-5xl leading-[1.05] font-bold tracking-tight text-white md:text-6xl lg:text-7xl"
                    >
                        Capital that{' '}
                        <span className="relative inline-block">
                            <span className="text-white">moves</span>
                            <motion.span
                                aria-hidden
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.9, duration: 0.8 }}
                                className="absolute right-0 -bottom-2 left-0 h-[6px] origin-left rounded-full bg-white"
                            />
                        </span>
                        <br /> at the speed of business.
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="mt-6 max-w-xl text-base text-white/75 md:text-lg"
                    >
                        Peer-to-peer lending for Zambian SMEs. Borrowers get
                        funded fast. Investors earn transparent, secured returns
                        — all on one trusted platform.
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        className="mt-8 flex flex-wrap items-center gap-3"
                    >
                        {auth.user ? (
                            <PrimaryCta
                                href="/dashboard"
                                label="Go to dashboard"
                            />
                        ) : (
                            <>
                                <PrimaryCta
                                    href="/signup"
                                    label="Get started"
                                />
                                <SecondaryCta href="/login" label="Sign in" />
                            </>
                        )}
                        <a
                            href="#how-it-works"
                            className="group inline-flex items-center gap-2 px-1 py-2.5 text-xs font-semibold text-white/75 transition hover:text-white"
                        >
                            <Play className="h-3 w-3 fill-white text-white" />
                            See how it works
                        </a>
                    </motion.div>

                    {visibleStats.length > 0 && (
                        <motion.div
                            variants={itemVariants}
                            className="mt-10 grid max-w-xl gap-3"
                            style={{
                                gridTemplateColumns: `repeat(${visibleStats.length}, minmax(0, 1fr))`,
                            }}
                        >
                            {visibleStats.map((s) => (
                                <StatBlock
                                    key={s.label}
                                    label={s.label}
                                    value={s.value}
                                    icon={s.icon}
                                />
                            ))}
                        </motion.div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ duration: 0.9, delay: 0.4 }}
                    className="relative mx-auto w-full max-w-md lg:max-w-lg"
                >
                    <ProductMockup
                        listings={hero?.listings ?? []}
                        industries={industriesTarget}
                    />
                </motion.div>
            </div>

            <motion.a
                href="#about"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 text-[11px] tracking-widest text-white/60 uppercase hover:text-white lg:block"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex flex-col items-center gap-2"
                >
                    <span>Scroll</span>
                    <span className="h-8 w-[1px] bg-gradient-to-b from-white/50 to-transparent" />
                </motion.div>
            </motion.a>
        </section>
    );
};

function PrimaryCta({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_10px_40px_-10px_rgba(255,255,255,0.4)] transition-transform hover:scale-[1.02]"
        >
            <span className="relative z-10 flex items-center gap-2">
                {label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-black/10 to-white/0 transition-transform duration-700 group-hover:translate-x-full"
            />
        </Link>
    );
}

function SecondaryCta({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/45 hover:bg-white/[0.08]"
        >
            {label}
        </Link>
    );
}

function StatBlock({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-white/55 uppercase">
                {icon}
                {label}
            </div>
            <div className="text-xl font-semibold text-white tabular-nums">
                {value}
            </div>
        </div>
    );
}

const FALLBACK_LISTINGS: HeroListing[] = [
    {
        id: -1,
        company: 'Awaiting first listing',
        industry: 'General',
        amount: 0,
        duration: null,
    },
];

function ProductMockup({
    listings,
    industries,
}: {
    listings: HeroListing[];
    industries: number;
}) {
    const data = listings.length > 0 ? listings : FALLBACK_LISTINGS;
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (data.length <= 1) return;
        const id = setInterval(
            () => setIndex((i) => (i + 1) % data.length),
            3200,
        );
        return () => clearInterval(id);
    }, [data.length]);

    const current = data[index];
    const industryKey =
        (current.industry && INDUSTRY_IMAGES[current.industry]) ?? null;
    const image = industryKey ?? INDUSTRY_IMAGES.General;
    const isPlaceholder = current.id === -1;

    return (
        <div className="relative">
            <div
                aria-hidden
                className="absolute -inset-6 rounded-[32px] bg-white/[0.05] blur-3xl"
            />

            <motion.div
                whileHover={{ y: -4, rotate: 0.4 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] shadow-2xl backdrop-blur-xl"
            >
                <div className="relative h-40 w-full overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={image + current.id}
                            src={image}
                            alt={current.industry ?? ''}
                            initial={{ opacity: 0, scale: 1.08 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.7 }}
                            className="absolute inset-0 h-full w-full object-cover grayscale"
                        />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur">
                        <Sparkles className="h-3 w-3" />
                        {isPlaceholder ? 'Coming soon' : 'Funding now'}
                    </div>
                    <div className="absolute right-3 bottom-3 left-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white text-black">
                            <Zap className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-[10px] tracking-wide text-white/70 uppercase">
                                Live opportunity
                            </p>
                            <p className="text-xs font-semibold text-white">
                                {current.industry ?? 'General'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.45 }}
                        >
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="truncate text-base font-semibold text-white">
                                    {current.company}
                                </p>
                                <p className="shrink-0 text-xs text-white/60">
                                    {current.duration
                                        ? `${current.duration} days`
                                        : 'Flexible'}
                                </p>
                            </div>

                            <p className="mt-1 text-3xl font-semibold text-white tabular-nums">
                                {isPlaceholder
                                    ? 'ZMW —'
                                    : formatZmw(current.amount)}
                            </p>

                            <div className="mt-4">
                                <div className="flex items-center justify-between text-[11px] text-white/65">
                                    <span>Funding progress</span>
                                    <span className="text-white tabular-nums">
                                        {isPlaceholder ? '0%' : 'Open'}
                                    </span>
                                </div>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                        key={current.id}
                                        initial={{ width: '0%' }}
                                        animate={{
                                            width: isPlaceholder ? '4%' : '38%',
                                        }}
                                        transition={{
                                            duration: 1.1,
                                            ease: 'easeOut',
                                        }}
                                        className="h-full rounded-full bg-white"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-[10px] text-white/65">
                        <div>
                            <p className="font-medium tracking-wide uppercase">
                                Industries
                            </p>
                            <p className="mt-0.5 text-xs text-white">
                                {industries > 0 ? industries : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="font-medium tracking-wide uppercase">
                                Status
                            </p>
                            <p className="mt-0.5 text-xs text-white">
                                {isPlaceholder ? 'Pending' : 'Approved'}
                            </p>
                        </div>
                        <div>
                            <p className="font-medium tracking-wide uppercase">
                                Backed
                            </p>
                            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-white">
                                <ShieldCheck className="h-3 w-3" />
                                Collateral
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function FloatingParticles() {
    const particles = Array.from({ length: 22 });
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {particles.map((_, i) => {
                const size = 1 + (i % 4) * 0.5;
                const delay = (i % 7) * 0.6;
                const duration = 7 + (i % 5) * 1.4;
                const top = (i * 37) % 100;
                const left = (i * 53) % 100;
                return (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 0.6, 0],
                            y: [0, -40, 0],
                            x: [0, i % 2 === 0 ? 12 : -12, 0],
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

export default Hero;
