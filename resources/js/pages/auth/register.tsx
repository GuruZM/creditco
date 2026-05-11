import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
import AuthField from '@/components/auth/auth-field';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    AtSign,
    KeyRound,
    LoaderCircle,
    ShieldCheck,
    User,
} from 'lucide-react';

export default function Register() {
    return (
        <AuthLayout
            title="Create your account"
            description="Get started in under a minute. No credit card required."
            image="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&q=80"
        >
            <Head title="Register" />

            <Form
                {...RegisteredUserController.store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <AuthField
                            label="Full name"
                            name="name"
                            type="text"
                            icon={User}
                            placeholder="Jane Mwansa"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            error={errors.name}
                        />

                        <AuthField
                            label="Email address"
                            name="email"
                            type="email"
                            icon={AtSign}
                            placeholder="you@company.com"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            error={errors.email}
                        />

                        <AuthField
                            label="Password"
                            name="password"
                            type="password"
                            icon={KeyRound}
                            placeholder="At least 8 characters"
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            error={errors.password}
                        />

                        <AuthField
                            label="Confirm password"
                            name="password_confirmation"
                            type="password"
                            icon={KeyRound}
                            placeholder="Repeat your password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            error={errors.password_confirmation}
                        />

                        <p className="-mt-1 flex items-start gap-2 text-[11px] text-white/45">
                            <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-white/70" />
                            By creating an account you agree to our terms and
                            privacy policy. We'll never sell your data.
                        </p>

                        <button
                            type="submit"
                            tabIndex={5}
                            data-test="register-user-button"
                            className="group mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {processing ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </>
                            )}
                        </button>
                    </>
                )}
            </Form>

            <div className="mt-8 flex items-center gap-3 text-[11px] text-white/40">
                <span className="h-px flex-1 bg-white/10" />
                <span className="tracking-wide uppercase">Already a member?</span>
                <span className="h-px flex-1 bg-white/10" />
            </div>

            <Link
                href={login.url()}
                tabIndex={6}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.05]"
            >
                Sign in instead
            </Link>
        </AuthLayout>
    );
}
