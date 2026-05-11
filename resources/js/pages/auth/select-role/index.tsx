import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Building2, LineChart } from 'lucide-react';

const roles = [
    {
        href: '/signup/borrower',
        eyebrow: 'For SMEs',
        title: 'I want to borrow',
        icon: Building2,
        description:
            'Apply for credit, track repayments, and manage your business credit profile in one place.',
        bullets: [
            'Flexible loan applications',
            'Repayment schedules & reminders',
            'Credit performance overview',
        ],
    },
    {
        href: '/signup/investor',
        eyebrow: 'For investors',
        title: 'I want to invest',
        icon: LineChart,
        description:
            'Fund borrower portfolios, earn transparent secured returns, and monitor performance over time.',
        bullets: [
            'Curated investment opportunities',
            'Performance analytics',
            'Track capital & returns',
        ],
    },
];

export default function SelectRole() {
    return (
        <AuthLayout
            title="Join CreditCo"
            description="Choose how you want to get started. You can always switch later from your account."
            image="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&q=80"
        >
            <Head title="Sign up" />

            <div className="flex flex-col gap-3">
                {roles.map((role) => {
                    const Icon = role.icon;
                    return (
                        <Link
                            key={role.href}
                            href={role.href}
                            className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/30 hover:bg-white/[0.05]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium tracking-widest text-white/40 uppercase">
                                            {role.eyebrow}
                                        </p>
                                        <h2 className="text-base font-semibold text-white">
                                            {role.title}
                                        </h2>
                                    </div>
                                </div>
                                <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
                            </div>

                            <p className="text-sm text-white/60">
                                {role.description}
                            </p>

                            <ul className="grid gap-1.5 text-[12px] text-white/50">
                                {role.bullets.map((b) => (
                                    <li
                                        key={b}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="h-1 w-1 rounded-full bg-white/40" />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-8 flex items-center gap-3 text-[11px] text-white/40">
                <span className="h-px flex-1 bg-white/10" />
                <span className="tracking-wide uppercase">
                    Already have an account?
                </span>
                <span className="h-px flex-1 bg-white/10" />
            </div>

            <Link
                href={login.url()}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.05]"
            >
                Log in
            </Link>
        </AuthLayout>
    );
}
