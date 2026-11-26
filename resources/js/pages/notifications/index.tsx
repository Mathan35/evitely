import { Head, Link, router } from '@inertiajs/react';
import { Bell, Heart, Inbox, PartyPopper, Ticket } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
    StudioCard,
    StudioEyebrow,
    StudioSurface,
    StudioTitle,
} from '@/components/studio/studio-surface';
import type { AppNotificationItem } from '@/hooks/use-notifications-feed';
import { cn } from '@/lib/utils';

function iconFor(type: string) {
    if (type === 'celebrate') return PartyPopper;
    if (type === 'coupon') return Ticket;
    if (type === 'wish') return Heart;
    return Inbox;
}

function formatWhen(value?: string | null): string | null {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function NotificationsIndex({
    items = [],
    next_page,
    unread = 0,
}: {
    items?: AppNotificationItem[];
    next_page: number | null;
    unread?: number;
}) {
    const list = Array.isArray(items) ? items : [];
    const markedRef = useRef(false);

    useEffect(() => {
        if (markedRef.current || unread <= 0) {
            return;
        }
        markedRef.current = true;
        void fetch('/notifications/read-all', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN':
                    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                Accept: 'application/json',
            },
            credentials: 'same-origin',
        }).then(() => router.reload({ only: ['items', 'unread'] }));
    }, [unread]);

    return (
        <>
            <Head title="Notifications" />
            <StudioSurface>
                <header className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
                    <StudioEyebrow>Inbox</StudioEyebrow>
                    <StudioTitle>Notifications</StudioTitle>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
                        Opened notifications are marked read. Cleared items from the bell stay here.
                    </p>
                </header>

                <StudioCard className="overflow-hidden">
                    {list.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                            <span className="grid size-12 place-items-center rounded-2xl bg-zinc-50 text-zinc-400 ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                                <Bell className="size-5" />
                            </span>
                            <p className="text-sm text-zinc-500">No notifications yet.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-zinc-950/5 dark:divide-white/10">
                            {list.map((item) => {
                                const Icon = iconFor(item.type);
                                const when = formatWhen(item.last_occurred_at);
                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={item.href || '/notifications'}
                                            className={cn(
                                                'flex items-start gap-3 px-4 py-4 transition hover:bg-zinc-50 sm:px-5 dark:hover:bg-zinc-900/50',
                                                !item.read && !item.cleared && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                                                item.cleared && 'opacity-70',
                                            )}
                                        >
                                            <span className="mt-0.5 grid size-10 place-items-center rounded-2xl bg-zinc-50 text-zinc-700 ring-1 ring-zinc-950/8 dark:bg-zinc-900 dark:text-zinc-200">
                                                <Icon className="size-4" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold text-zinc-950 dark:text-white">
                                                        {item.actor_name || item.title}
                                                    </span>
                                                    {item.count > 1 ? (
                                                        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-white">
                                                            ×{item.count}
                                                        </span>
                                                    ) : null}
                                                    {item.cleared ? (
                                                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase dark:bg-zinc-900 dark:text-zinc-400">
                                                            Cleared
                                                        </span>
                                                    ) : null}
                                                </span>
                                                <span className="mt-0.5 block text-sm text-zinc-500">
                                                    {item.body || item.title}
                                                </span>
                                            </span>
                                            {when ? (
                                                <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
                                                    {when}
                                                </span>
                                            ) : null}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </StudioCard>

                {next_page ? (
                    <div className="flex justify-center">
                        <Link
                            href={`/notifications?page=${next_page}`}
                            className="text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-950 dark:text-zinc-300 dark:decoration-white/20 dark:hover:text-white"
                        >
                            Load more
                        </Link>
                    </div>
                ) : null}
            </StudioSurface>
        </>
    );
}
