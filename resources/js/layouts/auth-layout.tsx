import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    children,
    title,
    description,
    image,
    showTrustBadges,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
    image?: string;
    showTrustBadges?: boolean;
}) {
    return (
        <AuthLayoutTemplate
            title={title}
            description={description}
            image={image}
            showTrustBadges={showTrustBadges}
            {...props}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
