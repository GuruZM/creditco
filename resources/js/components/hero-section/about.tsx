import { motion, Variants } from 'framer-motion';
import {
    BadgeCheck,
    FileSignature,
    Lock,
    Scale,
    ShieldCheck,
    Users,
} from 'lucide-react';

const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] },
    },
};

const checkpoints = [
    {
        title: 'SMEs apply online',
        description:
            'Submit loan amount, maturity, repayment plan and credit history.',
    },
    {
        title: 'Risk-priced offers',
        description:
            'Our engine assesses credit risk and proposes a fair rate band.',
    },
    {
        title: 'Anonymous bidding',
        description:
            'Investors compete during the soliciting window — best terms win.',
    },
    {
        title: 'Secured returns',
        description:
            'Once funded, investors receive credit-claim documents that guarantee returns.',
    },
];

const security = [
    {
        icon: ShieldCheck,
        title: 'Smart contracts',
        text: 'All loan agreements are codified and digitally enforced.',
    },
    {
        icon: Lock,
        title: 'AML compliance',
        text: 'KYC and AML checks before any borrower or investor goes live.',
    },
    {
        icon: Users,
        title: 'No fund custody',
        text: 'CreditCo never holds investor money — funds settle directly.',
    },
];

const About = () => {
    return (
        <section
            id="about"
            className="relative overflow-hidden bg-black py-28 text-white"
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-1/4 left-1/2 h-[40vh] w-[40vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_70%)] blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.4 }}
                    variants={sectionVariants}
                    className="mx-auto max-w-2xl text-center"
                >
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-white/70">
                        <BadgeCheck className="h-3 w-3 text-white" />
                        Why CreditCo
                    </span>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        We built the bridge between growth and return.
                    </h2>
                    <p className="mt-4 text-base text-white/60 md:text-lg">
                        SMEs need capital that moves fast. Investors want
                        transparent, secured yield. CreditCo unifies both on a
                        single, regulated platform.
                    </p>
                </motion.div>

                <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-2">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={sectionVariants}
                        className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-white/50 uppercase">
                            <FileSignature className="h-3.5 w-3.5 text-white/80" />
                            How the platform works
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold">
                            Four steps from application to funded.
                        </h3>

                        <ol className="mt-8 space-y-5">
                            {checkpoints.map((c, i) => (
                                <motion.li
                                    key={c.title}
                                    initial={{ opacity: 0, x: -16 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, amount: 0.4 }}
                                    transition={{
                                        delay: i * 0.08,
                                        duration: 0.5,
                                    }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[11px] font-semibold text-white">
                                        0{i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {c.title}
                                        </p>
                                        <p className="mt-0.5 text-sm text-white/55">
                                            {c.description}
                                        </p>
                                    </div>
                                </motion.li>
                            ))}
                        </ol>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={sectionVariants}
                        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8"
                    >
                        <div className="relative">
                            <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-white/50 uppercase">
                                <Scale className="h-3.5 w-3.5 text-white/80" />
                                Security & trust
                            </div>
                            <h3 className="mt-3 text-2xl font-semibold">
                                Built on rails you can audit.
                            </h3>

                            <div className="mt-8 grid gap-3">
                                {security.map((s, i) => (
                                    <motion.div
                                        key={s.title}
                                        initial={{ opacity: 0, y: 12 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{
                                            once: true,
                                            amount: 0.3,
                                        }}
                                        transition={{
                                            delay: i * 0.08,
                                            duration: 0.5,
                                        }}
                                        className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25 hover:bg-white/[0.05]"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                            <s.icon className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {s.title}
                                            </p>
                                            <p className="mt-0.5 text-sm text-white/55">
                                                {s.text}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default About;
