import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CtaBand({ auth }: { auth: any }) {
    return (
        <section className="relative overflow-hidden bg-black pt-10 pb-24 text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7 }}
                    className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.02] p-10 sm:p-14"
                >
                    {/* subtle grid */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.05]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                            maskImage:
                                'radial-gradient(ellipse 60% 70% at 50% 50%, black 30%, transparent 80%)',
                        }}
                    />

                    <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
                        <div>
                            <h3 className="text-3xl font-bold tracking-tight md:text-4xl">
                                Ready to put capital to work?
                            </h3>
                            <p className="mt-3 max-w-xl text-base text-white/60">
                                Join borrowers and investors building Zambia's
                                next chapter of growth. Funding takes minutes
                                to start.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                            {auth?.user ? (
                                <Link
                                    href="/dashboard"
                                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
                                >
                                    Go to dashboard
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/signup/borrower"
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
                                    >
                                        I'm an SME
                                    </Link>
                                    <Link
                                        href="/signup/investor"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-black"
                                    >
                                        I'm an investor
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
