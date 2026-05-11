import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    AdminDashboard,
    type AdminDashboardData,
} from './dashboard/admin';
import {
    BorrowerDashboard,
    type BorrowerDashboardData,
} from './dashboard/borrower';
import {
    InvestorDashboard,
    type InvestorDashboardData,
} from './dashboard/investor';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type Props =
    | { role: 'admin'; data: AdminDashboardData }
    | { role: 'borrower'; data: BorrowerDashboardData }
    | { role: 'investor'; data: InvestorDashboardData };

export default function Dashboard(props: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            {props.role === 'admin' ? (
                <AdminDashboard data={props.data} />
            ) : props.role === 'investor' ? (
                <InvestorDashboard data={props.data} />
            ) : (
                <BorrowerDashboard data={props.data} />
            )}
        </AppLayout>
    );
}
