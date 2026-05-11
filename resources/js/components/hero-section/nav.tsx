import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogo from '../app-logo';

const sections = [
    { id: 'hero', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'how-it-works', label: 'How it works' },
];

const Nav = ({ auth }: any) => {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('hero');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: '-50% 0px -45% 0px', threshold: 0 },
        );

        sections.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMenuOpen(false);
    };

    return (
        <motion.nav
            initial={{ y: -28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={`fixed top-3 left-1/2 z-50 w-[94%] max-w-6xl -translate-x-1/2 rounded-full border transition-all duration-300 ${
                scrolled
                    ? 'border-white/10 bg-black/80 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl'
                    : 'border-white/5 bg-white/[0.03] backdrop-blur'
            }`}
        >
            <div className="flex items-center justify-between gap-4 px-5 py-2.5">
                <button
                    onClick={() => scrollToSection('hero')}
                    className="flex items-center text-white"
                >
                    <AppLogo />
                </button>

                <div className="hidden md:block">
                    <div className="flex items-center gap-1">
                        {sections.map((item) => {
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className="relative rounded-full px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:text-white"
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute inset-0 rounded-full bg-white/10"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 380,
                                                damping: 32,
                                            }}
                                        />
                                    )}
                                    <span className="relative">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="hidden items-center gap-2 md:flex">
                    {auth?.user ? (
                        <Link
                            href="/dashboard"
                            className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-white/90"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="rounded-full px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/signup"
                                className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-white/90"
                            >
                                Get started
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    aria-label="Toggle menu"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white md:hidden"
                    onClick={() => setIsMenuOpen((v) => !v)}
                >
                    {isMenuOpen ? (
                        <X className="h-4 w-4" />
                    ) : (
                        <Menu className="h-4 w-4" />
                    )}
                </button>
            </div>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden"
                    >
                        <div className="border-t border-white/10 px-4 py-3">
                            <div className="grid gap-1">
                                {sections.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() =>
                                            scrollToSection(item.id)
                                        }
                                        className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                                            activeSection === item.id
                                                ? 'bg-white/10 text-white'
                                                : 'text-white/70 hover:text-white'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
                                {auth?.user ? (
                                    <Link
                                        href="/dashboard"
                                        className="flex-1 rounded-full bg-white px-4 py-1.5 text-center text-xs font-semibold text-slate-900"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="flex-1 rounded-full border border-white/15 px-4 py-1.5 text-center text-xs font-semibold text-white"
                                        >
                                            Sign in
                                        </Link>
                                        <Link
                                            href="/signup"
                                            className="flex-1 rounded-full bg-white px-4 py-1.5 text-center text-xs font-semibold text-slate-900"
                                        >
                                            Get started
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Nav;
