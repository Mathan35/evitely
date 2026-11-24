import { Link, usePage } from '@inertiajs/react';
import { Bell, Gift, Heart, Image, Inbox } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type HostAlertItem = {
    id: string;
    type: string;
    title: string;
    detail: string;
    href: string;
    at?: string | null;
};

type HostAlerts = {
    total: number;
    rsvps: number;
    wishes: number;
    photos: number;
    items: HostAlertItem[];
};

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

/** In-app host alerts for recent RSVPs, pending wishes, and photo uploads. */
export function HostAlertsBell({ className }: { className?: string }) {
    const page = usePage<{ hostAlerts?: HostAlerts }>();
    const alerts = page.props.hostAlerts ?? {
        total: 0,
        rsvps: 0,
        wishes: 0,
        photos: 0,
        items: [],
    };
    const [open, setOpen] = useState(false);
    const badge = useMemo(
        () => Math.min(99, alerts.wishes + alerts.photos + Math.min(alerts.rsvps, 9)),
        [alerts.photos, alerts.rsvps, alerts.wishes],
    );

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Host alerts"
                    className={cn(
                        'relative inline-flex size-9 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900',
                        className,
                    )}
                >
                    <Bell className="size-4" />
                    {badge > 0 ? (
                        <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white tabular-nums shadow">
                            {badge}
                        </span>
                    ) : null}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[22rem] rounded-2xl border-zinc-200/80 p-0 shadow-[0_24px_60px_-28px_rgba(24,24,27,0.5)] dark:border-white/10"
            >
                <DropdownMenuLabel className="px-4 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                        Activity
                    </p>
                    <p className="mt-0.5 font-serif text-lg text-zinc-950 dark:text-white">Host alerts</p>
                    <p className="mt-1 text-[12px] font-normal text-zinc-500">
                        {alerts.wishes} wishes · {alerts.photos} photos · {alerts.rsvps} recent RSVPs
                    </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                {alerts.items.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-zinc-500">
                        You&apos;re caught up — new RSVPs, wishes, and photos will show here.
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto py-1">
                        {alerts.items.map((item) => {
                            const Icon =
                                item.type === 'wish'
                                    ? Heart
                                    : item.type === 'photo'
                                      ? Image
                                      : item.type === 'gift'
                                        ? Gift
                                        : Inbox;
                            const when = formatWhen(item.at);
                            return (
                                <DropdownMenuItem key={item.id} asChild className="rounded-none px-0 py-0 focus:bg-transparent">
                                    <Link
                                        href={item.href}
                                        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/70"
                                        onClick={() => setOpen(false)}
                                    >
                                        <span
                                            className={cn(
                                                'mt-0.5 grid size-8 place-items-center rounded-xl ring-1',
                                                item.type === 'wish'
                                                    ? 'bg-rose-50 text-rose-700 ring-rose-100'
                                                    : item.type === 'photo'
                                                      ? 'bg-sky-50 text-sky-700 ring-sky-100'
                                                      : 'bg-emerald-50 text-emerald-700 ring-emerald-100',
                                            )}
                                        >
                                            <Icon className="size-3.5" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[13px] font-semibold text-zinc-950 dark:text-white">
                                                {item.title}
                                            </span>
                                            <span className="mt-0.5 block truncate text-[12px] text-zinc-500">
                                                {item.detail}
                                            </span>
                                        </span>
                                        {when ? (
                                            <span className="shrink-0 text-[10px] tabular-nums text-zinc-400">
                                                {when}
                                            </span>
                                        ) : null}
                                    </Link>
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
