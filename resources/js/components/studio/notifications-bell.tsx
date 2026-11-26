import { Link } from '@inertiajs/react';
import { ArrowUpRight, Bell, Gift, Heart, Inbox, PartyPopper, Ticket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    useNotificationsFeed,
    type AppNotificationItem,
} from '@/hooks/use-notifications-feed';
import { cn } from '@/lib/utils';

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

function iconFor(type: string) {
    if (type === 'celebrate') {
        return PartyPopper;
    }
    if (type === 'coupon') {
        return Ticket;
    }
    if (type === 'wish') {
        return Heart;
    }
    if (type === 'photo') {
        return Gift;
    }
    return Inbox;
}

function toneFor(type: string): string {
    if (type === 'celebrate') {
        return 'bg-amber-50 text-amber-700 ring-amber-100/80';
    }
    if (type === 'coupon') {
        return 'bg-violet-50 text-violet-700 ring-violet-100/80';
    }
    if (type === 'wish') {
        return 'bg-rose-50 text-rose-600 ring-rose-100/80';
    }
    if (type === 'photo') {
        return 'bg-sky-50 text-sky-700 ring-sky-100/80';
    }
    return 'bg-emerald-50 text-emerald-700 ring-emerald-100/80';
}

function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function NotificationRow({
    item,
    index,
    enterKey,
    exiting,
    reading,
    onOpen,
}: {
    item: AppNotificationItem;
    index: number;
    enterKey: number;
    exiting?: boolean;
    reading?: boolean;
    onOpen: (item: AppNotificationItem) => void;
}) {
    const Icon = iconFor(item.type);
    const when = formatWhen(item.last_occurred_at);
    const href = item.href || '/notifications';

    return (
        <DropdownMenuItem
            asChild
            className={cn(
                'rounded-none px-0 py-0 focus:bg-transparent',
                exiting && 'notify-row-exit',
                !exiting && 'notify-row-enter',
                reading && 'notify-row-reading',
            )}
            style={{ ['--notify-i' as string]: index }}
            data-enter={enterKey}
        >
            <Link
                href={href}
                className={cn(
                    'notify-row-tint group/row flex w-full items-start gap-3 px-3.5 py-2.5 text-left',
                    'transition-[background-color,transform,opacity] duration-300 ease-out',
                    'hover:bg-zinc-50/90 dark:hover:bg-zinc-900/60',
                    !item.read && 'bg-emerald-50/35 dark:bg-emerald-950/15',
                )}
                onClick={() => onOpen(item)}
            >
                <span
                    className={cn(
                        'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ring-1 transition duration-300 ease-out',
                        toneFor(item.type),
                        reading && 'scale-[0.96] opacity-75',
                    )}
                >
                    <Icon className="size-3.5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                    <span className="flex items-baseline gap-2">
                        <span className="truncate text-[13px] font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                            {item.actor_name || item.title}
                        </span>
                        {item.count > 1 ? (
                            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-zinc-400">
                                ×{item.count}
                            </span>
                        ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">
                        {item.body || item.title}
                    </span>
                </span>
                {when ? (
                    <span className="mt-1 shrink-0 text-[10px] tabular-nums tracking-wide text-zinc-400">
                        {when}
                    </span>
                ) : null}
            </Link>
        </DropdownMenuItem>
    );
}

/** Responsive in-app notifications — recent in dropdown, full list on /notifications. */
export function NotificationsBell({ className }: { className?: string }) {
    const { unread, recent, pulse, markAllRead, clearAll } = useNotificationsFeed();
    const [open, setOpen] = useState(false);
    const [enterKey, setEnterKey] = useState(0);
    const [phase, setPhase] = useState<'idle' | 'marking' | 'clearing' | 'empty'>('idle');
    const [displayItems, setDisplayItems] = useState<AppNotificationItem[]>(recent);
    const [badgeLeaving, setBadgeLeaving] = useState(false);
    const timersRef = useRef<number[]>([]);
    const badge = Math.min(99, unread);
    const busy = phase === 'clearing';
    const showList = displayItems.length > 0 && phase !== 'empty';

    useEffect(() => {
        if (phase === 'clearing' || phase === 'marking') {
            return;
        }
        setDisplayItems(recent);
        if (recent.length > 0) {
            setPhase('idle');
        }
    }, [recent, phase]);

    useEffect(() => {
        return () => {
            for (const id of timersRef.current) {
                window.clearTimeout(id);
            }
        };
    }, []);

    const later = (fn: () => void, ms: number) => {
        const id = window.setTimeout(fn, ms);
        timersRef.current.push(id);
        return id;
    };

    const markOpenedAsRead = (rows: AppNotificationItem[], hasUnread: boolean) => {
        if (!hasUnread) {
            return;
        }

        void markAllRead();

        if (prefersReducedMotion()) {
            setDisplayItems(rows.map((row) => ({ ...row, read: true })));
            setBadgeLeaving(false);
            return;
        }

        setPhase('marking');
        setBadgeLeaving(true);
        later(() => {
            setDisplayItems((prev) => prev.map((row) => ({ ...row, read: true })));
            setPhase('idle');
            setBadgeLeaving(false);
        }, 420);
    };

    const handleOpenChange = (next: boolean) => {
        if (busy && next) {
            return;
        }
        setOpen(next);
        if (next) {
            const rows = recent;
            setPhase(rows.length === 0 ? 'empty' : 'idle');
            setDisplayItems(rows);
            setEnterKey((n) => n + 1);
            markOpenedAsRead(rows, unread > 0 || rows.some((row) => !row.read));
        }
    };

    const handleClear = () => {
        if (busy || displayItems.length === 0) {
            return;
        }

        if (prefersReducedMotion()) {
            void clearAll();
            setDisplayItems([]);
            setPhase('empty');
            return;
        }

        setPhase('clearing');
        setBadgeLeaving(true);
        const duration = 320 + Math.max(0, displayItems.length - 1) * 38 + 80;
        later(() => {
            void clearAll();
            setDisplayItems([]);
            setPhase('empty');
            setBadgeLeaving(false);
        }, duration);
    };

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={badge > 0 ? `${badge} unread notifications` : 'Notifications'}
                    className={cn(
                        'relative inline-flex size-10 items-center justify-center rounded-full border border-zinc-950/10 bg-white/80 text-zinc-700 shadow-sm backdrop-blur transition',
                        'hover:bg-white hover:text-zinc-950 active:scale-95',
                        'dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900',
                        pulse && 'animate-[notification-bell-pop_0.55s_ease]',
                        className,
                    )}
                >
                    <Bell className={cn('size-4 transition', pulse && 'text-emerald-600')} />
                    {badge > 0 || badgeLeaving ? (
                        <span
                            className={cn(
                                'absolute -top-0.5 -right-0.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white tabular-nums shadow ring-2 ring-white dark:ring-zinc-950',
                                badgeLeaving && 'notify-badge-exit',
                            )}
                        >
                            {badge > 0 ? badge : ''}
                        </span>
                    ) : null}
                    {pulse ? (
                        <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-emerald-400/50 animate-ping" />
                    ) : null}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={10}
                className={cn(
                    'notify-panel w-[min(calc(100vw-1.25rem),21.5rem)] overflow-hidden rounded-2xl border-zinc-200/70 p-0',
                    'bg-white/95 shadow-[0_28px_64px_-32px_rgba(24,24,27,0.55)] backdrop-blur-xl',
                    'dark:border-white/10 dark:bg-zinc-950/95',
                    'data-[state=open]:animate-none data-[state=closed]:animate-none',
                )}
            >
                <div
                    key={`hdr-${enterKey}`}
                    className="notify-row-enter flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5"
                    style={{ ['--notify-i' as string]: 0 }}
                >
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">
                            Inbox
                        </p>
                        <p className="mt-0.5 font-serif text-[1.35rem] leading-none tracking-tight text-zinc-950 dark:text-white">
                            Notifications
                        </p>
                    </div>
                    {showList ? (
                        <button
                            type="button"
                            disabled={busy}
                            className="shrink-0 text-[11px] font-medium text-zinc-500 transition hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-200"
                            onClick={handleClear}
                        >
                            Clear
                        </button>
                    ) : null}
                </div>

                <div className="mx-3 h-px bg-zinc-950/6 dark:bg-white/8" />

                {!showList ? (
                    <div
                        key={`empty-${enterKey}-${phase}`}
                        className="notify-empty-enter flex flex-col items-center gap-2 px-5 py-11 text-center"
                    >
                        <span className="grid size-9 place-items-center rounded-full bg-zinc-50 text-zinc-400 ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                            <Bell className="size-3.5" strokeWidth={1.75} />
                        </span>
                        <p className="text-[13px] text-zinc-500">You&apos;re all caught up</p>
                        <p className="max-w-[16rem] text-[11px] leading-relaxed text-zinc-400">
                            RSVPs, celebrates, and coupons show up here. Cleared items stay in View all.
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[min(58dvh,20.5rem)] overflow-y-auto overscroll-contain py-1">
                        {displayItems.map((item, index) => (
                            <NotificationRow
                                key={`${item.id}-${enterKey}`}
                                item={item}
                                index={index + 1}
                                enterKey={enterKey}
                                exiting={phase === 'clearing'}
                                reading={phase === 'marking' && !item.read}
                                onOpen={() => {
                                    if (busy) {
                                        return;
                                    }
                                    setOpen(false);
                                }}
                            />
                        ))}
                    </div>
                )}

                <div className="mx-3 h-px bg-zinc-950/6 dark:bg-white/8" />

                <div
                    key={`foot-${enterKey}`}
                    className="notify-row-enter flex items-center justify-center px-3 py-2.5"
                    style={{ ['--notify-i' as string]: showList ? displayItems.length + 1 : 1 }}
                >
                    <Link
                        href="/notifications"
                        onClick={() => setOpen(false)}
                        className={cn(
                            'group inline-flex items-center gap-1 text-[12px] font-medium text-zinc-600',
                            'underline decoration-zinc-300/80 underline-offset-[3px]',
                            'transition hover:text-zinc-950 hover:decoration-zinc-500',
                            'dark:text-zinc-300 dark:decoration-white/20 dark:hover:text-white dark:hover:decoration-white/50',
                        )}
                    >
                        View all notifications
                        <ArrowUpRight className="size-3.5 opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
