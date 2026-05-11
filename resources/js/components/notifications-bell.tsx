import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';

type NotificationItem = {
    id: string;
    data: Record<string, unknown> & {
        kind?: string;
        message?: string;
        href?: string;
    };
    read_at: string | null;
    created_at: string | null;
};

type NotificationsPayload = {
    unread_count: number;
    items: NotificationItem[];
};

type SharedProps = {
    notifications?: NotificationsPayload | null;
};

export default function NotificationsBell() {
    const { notifications } = usePage<SharedProps>().props;
    const unread = notifications?.unread_count ?? 0;
    const items = notifications?.items ?? [];

    const onItemClick = (item: NotificationItem) => {
        if (!item.read_at) {
            router.post(
                `/notifications/${item.id}/read`,
                {},
                { preserveScroll: true, preserveState: true },
            );
        }
        const href = item.data.href;
        if (typeof href === 'string' && href) {
            router.visit(href);
        }
    };

    const markAllRead = () => {
        router.post(
            '/notifications/read-all',
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="group relative h-9 w-9 cursor-pointer"
                    aria-label="Notifications"
                >
                    <Bell className="!size-5 opacity-80 group-hover:opacity-100" />
                    {unread > 0 && (
                        <span className="absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 max-w-[90vw] p-0"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
                    <p className="text-xs font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300">
                        Notifications
                    </p>
                    {unread > 0 && (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        >
                            <CheckCheck className="h-3 w-3" />
                            Mark all read
                        </button>
                    )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {items.length === 0 && (
                        <div className="px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            You&apos;re all caught up.
                        </div>
                    )}

                    {items.map((item) => {
                        const isUnread = !item.read_at;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onItemClick(item)}
                                className={cn(
                                    'flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900',
                                    isUnread &&
                                        'bg-sky-50/50 dark:bg-sky-500/[0.04]',
                                )}
                            >
                                <span
                                    className={cn(
                                        'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                                        isUnread
                                            ? 'bg-sky-500'
                                            : 'bg-transparent',
                                    )}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] text-slate-800 dark:text-slate-200">
                                        {item.data.message ??
                                            'New notification'}
                                    </p>
                                    {item.created_at && (
                                        <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-500">
                                            {item.created_at}
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
