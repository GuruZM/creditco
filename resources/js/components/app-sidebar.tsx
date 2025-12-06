import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    BriefcaseBusiness,
    Coins,
    Folder,
    HandCoins,
    LayoutGrid,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

type PageProps = {
    auth: {
        user: {
            roles?: string[];
        } | null;
    };
};

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage<PageProps>().props;
    const rawRoles = auth?.user?.roles ?? [];
    const roles = rawRoles.map((r: any) => r.name);

    const isAdmin = roles.includes('admin');
    const isBorrower = roles.includes('borrower');
    const isInvestor = roles.includes('investor');

    console.log('isAdmin:', isAdmin);
    console.log('isBorrower:', isBorrower);
    console.log('isInvestor:', isInvestor);

    let mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
    ];

    if (isAdmin) {
        mainNavItems = [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Investors',
                href: '/investors',
                icon: BriefcaseBusiness,
            },
            {
                title: 'Borrowers',
                href: '/borrowers',
                icon: HandCoins,
            },
            {
                title: 'Coins',
                href: '/admin/coins',
                icon: Coins,
            },
            {
                title: 'Users',
                href: '/users',
                icon: Users,
            },
        ];
    } else if (isInvestor) {
        mainNavItems = [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Coins',
                href: '/coins',
                icon: HandCoins,
            },
        ];
    } else if (isBorrower) {
        mainNavItems = [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Coins',
                href: '/coins',
                icon: HandCoins,
            },
        ];
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/* If you want footer links, uncomment and use this */}
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
