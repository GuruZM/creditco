import PasswordResetLinkController from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import AuthField from '@/components/auth/auth-field';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    AtSign,
    CheckCircle2,
    LoaderCircle,
} from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Reset your password"
            description="Enter the email tied to your account and we'll send you a link to reset your password."
        >
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {status}
                </div>
            )}

            <Form
                {...PasswordResetLinkController.store.form()}
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
                            autoComplete="off"
                            error={errors.email}
                        />

                        <button
                            type="submit"
                            disabled={processing}
                            data-test="email-password-reset-link-button"
                            className="group mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {processing ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Send reset link
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </>
                            )}
                        </button>
                    </>
                )}
            </Form>

            <Link
                href={login.url()}
                className="mt-6 inline-flex items-center gap-1.5 text-xs text-white/55 transition hover:text-white"
            >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
            </Link>
        </AuthLayout>
    );
}
