import { Gift, Heart, Image, Inbox } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

type FeedItem = {
    id: string;
    type: 'rsvp' | 'wish' | 'gift' | 'photo';
    title: string;
    detail: string;
    at: string | null;
    tab?: 'rsvps' | 'wishes' | 'photos' | 'overview';
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

/** Chronological host feed of RSVPs, wishes, gift claims, and photo uploads. */
export function EventActivityFeed({
    rsvps = [],
    wishes = [],
    gifts = [],
    photos = [],
    onOpenTab,
}: {
    rsvps?: {
        id: number;
        guest_name: string;
        status: string;
        created_at?: string | null;
    }[];
    wishes?: {
        id: number;
        name: string;
        message: string;
        status: string;
        created_at?: string | null;
    }[];
    gifts?: {
        id: number;
        name: string;
        gift_label: string | null;
        status: string;
        created_at?: string | null;
    }[];
    photos?: {
        id: number;
        name: string;
        caption: string | null;
        status: string;
        created_at?: string | null;
    }[];
    onOpenTab?: (tab: 'rsvps' | 'wishes' | 'photos' | 'overview') => void;
}) {
    const items = useMemo(() => {
        const next: FeedItem[] = [];
        for (const row of rsvps) {
            next.push({
                id: `rsvp-${row.id}`,
                type: 'rsvp',
                title: row.guest_name || 'Guest',
                detail: `RSVP · ${row.status.replace(/_/g, ' ')}`,
                at: row.created_at ?? null,
                tab: 'rsvps',
            });
        }
        for (const row of wishes) {
            next.push({
                id: `wish-${row.id}`,
                type: 'wish',
                title: row.name,
                detail: row.status === 'pending' ? 'Wish · pending' : `Wish · ${row.status}`,
                at: row.created_at ?? null,
                tab: 'wishes',
            });
        }
        for (const row of gifts) {
            next.push({
                id: `gift-${row.id}`,
                type: 'gift',
                title: row.name,
                detail: `Gift · ${row.gift_label || 'registry item'}`,
                at: row.created_at ?? null,
                tab: 'overview',
            });
        }
        for (const row of photos) {
            next.push({
                id: `photo-${row.id}`,
                type: 'photo',
                title: row.name,
                detail: row.status === 'pending' ? 'Photo · pending' : `Photo · ${row.status}`,
                at: row.created_at ?? null,
                tab: 'photos',
            });
        }
        return next
            .sort((a, b) => {
                const aTime = a.at ? new Date(a.at).getTime() : 0;
                const bTime = b.at ? new Date(b.at).getTime() : 0;
                return bTime - aTime;
            })
            .slice(0, 16);
    }, [gifts, photos, rsvps, wishes]);

    if (items.length === 0) {
        return null;
    }

    return (
        <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 [animation-delay:160ms]">
            <div className="overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05]">
                <div className="border-b border-zinc-100 px-5 py-4">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">Live</p>
                    <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950">Recent activity</h2>
                    <p className="mt-1 text-[12px] text-zinc-500">RSVPs, wishes, gifts, and photo uploads</p>
                </div>
                <ul className="divide-y divide-zinc-100">
                    {items.map((item) => {
                        const Icon =
                            item.type === 'rsvp'
                                ? Inbox
                                : item.type === 'wish'
                                  ? Heart
                                  : item.type === 'gift'
                                    ? Gift
                                    : Image;
                        const when = formatWhen(item.at);
                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    onClick={() => item.tab && onOpenTab?.(item.tab)}
                                    className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-zinc-50/80"
                                >
                                    <span
                                        className={cn(
                                            'mt-0.5 grid size-9 place-items-center rounded-2xl ring-1',
                                            item.type === 'rsvp'
                                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                                                : item.type === 'wish'
                                                  ? 'bg-rose-50 text-rose-700 ring-rose-100'
                                                  : item.type === 'gift'
                                                    ? 'bg-amber-50 text-amber-800 ring-amber-100'
                                                    : 'bg-sky-50 text-sky-700 ring-sky-100',
                                        )}
                                    >
                                        <Icon className="size-3.5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[14px] font-semibold text-zinc-950">
                                            {item.title}
                                        </span>
                                        <span className="mt-0.5 block text-[12px] text-zinc-500">{item.detail}</span>
                                    </span>
                                    {when ? (
                                        <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">{when}</span>
                                    ) : null}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
