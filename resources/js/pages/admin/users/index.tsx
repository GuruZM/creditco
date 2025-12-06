import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Ban,
    Edit3,
    KeyRound,
    Search,
    Shield,
    Trash2,
    Users,
} from 'lucide-react';
import { useState } from 'react';

type UserItem = {
    id: number;
    name: string;
    email: string;
    status: string;
    roles: string[];
    created_at: string | null;
};

type Paginated<T> = {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type PageProps = {
    users: Paginated<UserItem>;
    filters: {
        search: string;
        role: string;
        status: string;
    };
    available_roles: string[];
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Users', href: '/users' },
];

export default function UsersIndex() {
    const { users, filters, available_roles } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmResetOpen, setConfirmResetOpen] = useState(false);
    const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

    const applyFilters = () => {
        router.get(
            '/users',
            {
                search,
                role: roleFilter,
                status: statusFilter,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const onDelete = () => {
        if (!selectedUser) return;
        router.delete(`/users/${selectedUser.id}`, {
            onSuccess: () => {
                setConfirmDeleteOpen(false);
                setSelectedUser(null);
            },
        });
    };

    const onResetPassword = () => {
        if (!selectedUser) return;
        router.post(
            `/users/${selectedUser.id}/reset-password`,
            {},
            {
                onSuccess: () => {
                    setConfirmResetOpen(false);
                    setSelectedUser(null);
                },
            },
        );
    };

    const onToggleStatus = () => {
        if (!selectedUser) return;
        router.post(
            `/users/${selectedUser.id}/toggle-status`,
            {},
            {
                onSuccess: () => {
                    setConfirmSuspendOpen(false);
                    setSelectedUser(null);
                },
            },
        );
    };

    const openDelete = (user: UserItem) => {
        setSelectedUser(user);
        setConfirmDeleteOpen(true);
    };

    const openReset = (user: UserItem) => {
        setSelectedUser(user);
        setConfirmResetOpen(true);
    };

    const openSuspend = (user: UserItem) => {
        setSelectedUser(user);
        setConfirmSuspendOpen(true);
    };

    const totalUsers = users.data.length;
    const totalSuspended = users.data.filter(
        (u) => u.status === 'suspended',
    ).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users | CreditCo" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
                {/* Top quick stats */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                Total users
                            </h2>
                            <Users className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                            {totalUsers}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            All users with access to CreditCo.
                        </p>
                    </div>

                    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                Suspended
                            </h2>
                            <Ban className="h-4 w-4 text-red-500" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold text-red-600 dark:text-red-400">
                            {totalSuspended}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            Users currently suspended from access.
                        </p>
                    </div>

                    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                Roles configured
                            </h2>
                            <Shield className="h-4 w-4 text-emerald-500" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                            {available_roles.length}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            Distinct role types available for assignment.
                        </p>
                    </div>
                </div>

                {/* Filters + table */}
                <div className="relative min-h-[100vh] flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:min-h-min dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-full w-full flex-col gap-4">
                        {/* Filters row */}
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
                                <div className="flex flex-1 items-center gap-2">
                                    <div className="relative flex-1">
                                        <Search className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                        <Input
                                            placeholder="Search by name or email"
                                            className="pl-8 text-xs"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    applyFilters();
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col gap-2 md:flex-row">
                                    <Select
                                        value={roleFilter || 'all'}
                                        onValueChange={(value) => {
                                            setRoleFilter(
                                                value === 'all' ? '' : value,
                                            );
                                        }}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Filter by role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All roles
                                            </SelectItem>
                                            {available_roles.map((role) => (
                                                <SelectItem
                                                    key={role}
                                                    value={role}
                                                >
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* <Select
                                        value={statusFilter || 'all'}
                                        onValueChange={(value) => {
                                            setStatusFilter(
                                                value === 'all' ? '' : value,
                                            );
                                        }}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All statuses
                                            </SelectItem>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="suspended">
                                                Suspended
                                            </SelectItem>
                                        </SelectContent>
                                    </Select> */}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    size="sm"
                                    className="bg-slate-900 text-xs text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                    onClick={applyFilters}
                                >
                                    Apply filters
                                </Button>
                            </div>
                        </div>

                        {/* Users table */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            User
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Roles
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Created
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {users.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                                            >
                                                No users found.
                                            </td>
                                        </tr>
                                    )}

                                    {users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                                        {user.name}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-500">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-800 dark:text-slate-200">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.length ===
                                                        0 && (
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-500">
                                                            —
                                                        </span>
                                                    )}
                                                    {user.roles.map((role) => (
                                                        <span
                                                            key={role}
                                                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                        >
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className={[
                                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]',
                                                        user.status ===
                                                        'suspended'
                                                            ? 'border-red-200 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                                                            : 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
                                                    ].join(' ')}
                                                >
                                                    {user.status === 'suspended'
                                                        ? 'Suspended'
                                                        : 'Active'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-800 dark:text-slate-200">
                                                {user.created_at || '—'}
                                            </td>

                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Edit: you can point to a dedicated edit page later */}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-slate-300 text-[11px] text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-400"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/users/${user.id}/edit`}
                                                        >
                                                            <Edit3 className="mr-1 h-3 w-3" />
                                                            Edit
                                                        </Link>
                                                    </Button>

                                                    {/* Reset password */}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-slate-300 text-[11px] text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-400"
                                                        onClick={() =>
                                                            openReset(user)
                                                        }
                                                    >
                                                        <KeyRound className="mr-1 h-3 w-3" />
                                                        Reset
                                                    </Button>

                                                    {/* Suspend / Activate */}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={
                                                            user.status ===
                                                            'suspended'
                                                                ? 'border-emerald-300 text-[11px] text-emerald-700 hover:border-emerald-500 hover:text-emerald-800 dark:border-emerald-500/60 dark:text-emerald-300 dark:hover:border-emerald-400'
                                                                : 'border-red-300 text-[11px] text-red-700 hover:border-red-500 hover:text-red-800 dark:border-red-500/60 dark:text-red-300 dark:hover:border-red-400'
                                                        }
                                                        onClick={() =>
                                                            openSuspend(user)
                                                        }
                                                    >
                                                        <Ban className="mr-1 h-3 w-3" />
                                                        {user.status ===
                                                        'suspended'
                                                            ? 'Activate'
                                                            : 'Suspend'}
                                                    </Button>

                                                    {/* Delete */}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-300 text-[11px] text-red-700 hover:border-red-500 hover:text-red-800 dark:border-red-500/60 dark:text-red-300 dark:hover:border-red-400"
                                                        onClick={() =>
                                                            openDelete(user)
                                                        }
                                                    >
                                                        <Trash2 className="mr-1 h-3 w-3" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {users.links && users.links.length > 0 && (
                                <div className="flex justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                                    <div className="flex items-center gap-1 text-xs">
                                        {users.links.map((link, index) => {
                                            if (!link.url) {
                                                return (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 text-slate-400 dark:text-slate-600"
                                                        dangerouslySetInnerHTML={{
                                                            __html: link.label,
                                                        }}
                                                    />
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.url}
                                                    className={[
                                                        'rounded-md px-2 py-1',
                                                        link.active
                                                            ? 'bg-slate-900 text-slate-50 dark:bg-slate-700'
                                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                                                    ].join(' ')}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Delete */}
            <Dialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
            >
                <DialogContent className="max-w-sm border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4 text-red-500" />
                            Delete user
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            This action cannot be undone. The user will lose
                            access to CreditCo.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <p className="text-xs text-slate-700 dark:text-slate-200">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">
                                {selectedUser.name}
                            </span>{' '}
                            ({selectedUser.email})?
                        </p>
                    )}

                    <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                            onClick={() => setConfirmDeleteOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="bg-red-600 text-xs text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400"
                            onClick={onDelete}
                        >
                            Delete user
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Reset Password */}
            <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
                <DialogContent className="max-w-sm border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-sky-500" />
                            Reset password
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            This will set a new temporary password for this
                            user.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <p className="text-xs text-slate-700 dark:text-slate-200">
                            Are you sure you want to reset the password for{' '}
                            <span className="font-semibold">
                                {selectedUser.name}
                            </span>{' '}
                            ({selectedUser.email})?
                        </p>
                    )}

                    <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                            onClick={() => setConfirmResetOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="bg-sky-600 text-xs text-white hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
                            onClick={onResetPassword}
                        >
                            Reset password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Suspend / Activate */}
            <Dialog
                open={confirmSuspendOpen}
                onOpenChange={setConfirmSuspendOpen}
            >
                <DialogContent className="max-w-sm border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Ban className="h-4 w-4 text-amber-500" />
                            {selectedUser?.status === 'suspended'
                                ? 'Activate user'
                                : 'Suspend user'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            You can toggle a user&apos;s ability to access
                            CreditCo without deleting their account.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <p className="text-xs text-slate-700 dark:text-slate-200">
                            Are you sure you want to{' '}
                            <span className="font-semibold">
                                {selectedUser.status === 'suspended'
                                    ? 'activate'
                                    : 'suspend'}
                            </span>{' '}
                            <span className="font-semibold">
                                {selectedUser.name}
                            </span>{' '}
                            ({selectedUser.email})?
                        </p>
                    )}

                    <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-xs text-slate-800 hover:border-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
                            onClick={() => setConfirmSuspendOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="bg-amber-500 text-xs text-white hover:bg-amber-400 dark:bg-amber-500 dark:hover:bg-amber-400"
                            onClick={onToggleStatus}
                        >
                            {selectedUser?.status === 'suspended'
                                ? 'Activate user'
                                : 'Suspend user'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
