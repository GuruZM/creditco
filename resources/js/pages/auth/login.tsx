import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import AuthField from '@/components/auth/auth-field';
import AuthLayout from '@/layouts/auth-layout';
import { request } from '@/routes/password';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, AtSign, CheckCircle2, KeyRound, LoaderCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout
            title="Welcome back"
            description="Sign in to keep your capital moving."
            image="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80"
            showTrustBadges={false}
        >
            <Head title="Log in" />

            {status && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {status}
                </div>
            )}

            <Form
                {...AuthenticatedSessionController.store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <AuthField
                            label="Email address"
                            name="email"
                            type="email"
                            icon={AtSign}
                            placeholder="you@company.com"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            error={errors.email}
                        />

                        <AuthField
                            label="Password"
                            name="password"
                            type="password"
                            icon={KeyRound}
                            placeholder="••••••••"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            error={errors.password}
                            rightSlot={
                                canResetPassword ? (
                                    <Link
                                        href={request.url()}
                                        tabIndex={5}
                                        className="text-[11px] font-medium text-white/60 transition hover:text-white"
                                    >
                                        Forgot password?
                                    </Link>
                                ) : null
                            }
                        />

                        <label className="flex items-center gap-2 text-xs text-white/65 select-none">
                            <input
                                type="checkbox"
                                name="remember"
                                tabIndex={3}
                                className="h-3.5 w-3.5 rounded border border-white/15 bg-white/[0.04] accent-white"
                            />
                            Keep me signed in for 30 days
                        </label>

                        <button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                            className="group mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {processing ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </>
                            )}
                        </button>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
