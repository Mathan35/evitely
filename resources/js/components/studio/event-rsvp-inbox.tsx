import { router } from '@inertiajs/react';
import { Bell, Check, Clock, Download, HelpCircle, Mail, MessageSquare, Search, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

export type EventRsvpRow = {
    id: number;
    guest_name: string;
    email: string;
    status: string;
    guest_count: number;
    meal_preference: string | null;
    dietary_restrictions: string | null;
    message: string | null;
    created_at?: string | null;
};

type FilterId = 'all' | 'attending' | 'maybe' | 'not_attending';

const FILTERS: { id: FilterId; label: string; match: (status: string) => boolean }[] = [
    { id: 'all', label: 'All', match: () => true },
    { id: 'attending', label: 'Attending', match: (s) => s === 'attending' },
    { id: 'maybe', label: 'Maybe', match: (s) => s === 'maybe' },
    { id: 'not_attending', label: 'Declined', match: (s) => s === 'not_attending' || s === 'declined' },
];

function statusMeta(status: string): {
    label: string;
    icon: typeof Check;
    chip: string;
    accent: string;
} {
    switch (status) {
        case 'attending':
            return {
                label: 'Attending',
                icon: Check,
                chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
                accent: 'from-emerald-500/15 to-teal-400/5',
            };
        case 'maybe':
            return {
                label: 'Maybe',
                icon: HelpCircle,
                chip: 'bg-amber-50 text-amber-800 ring-amber-200/80',
                accent: 'from-amber-500/15 to-orange-400/5',
            };
        case 'not_attending':
        case 'declined':
            return {
                label: 'Declined',
                icon: X,
                chip: 'bg-rose-50 text-rose-800 ring-rose-200/80',
                accent: 'from-rose-500/12 to-pink-400/5',
            };
        default:
            return {
                label: status.replace(/_/g, ' '),
                icon: Clock,
                chip: 'bg-zinc-100 text-zinc-700 ring-zinc-200/80',
                accent: 'from-zinc-500/10 to-zinc-400/5',
            };
    }
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

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function mealLabel(value: string | null | undefined, meals?: Record<string, string>): string | null {
    if (!value || value === 'no_preference') {
        return null;
    }
    return meals?.[value] || value.replace(/_/g, ' ');
}

/** Creator inbox for live site RSVP replies — used on Manage event. */
export function EventRsvpInbox({
    eventId,
    rsvps = [],
    meals,
    pendingCount = 0,
    remindableCount,
    remindersEnabled = false,
    className,
}: {
    eventId?: number;
    rsvps?: EventRsvpRow[] | null;
    meals?: Record<string, string>;
    pendingCount?: number;
    /** Pending guests with an email on file (manual remind target). */
    remindableCount?: number;
    remindersEnabled?: boolean;
    className?: string;
}) {
    const [filter, setFilter] = useState<FilterId>('all');
    const [query, setQuery] = useState('');
    const [reminding, setReminding] = useState(false);
    const [confirmRemind, setConfirmRemind] = useState(false);
    const rows = Array.isArray(rsvps) ? rsvps : [];
    const canRemind = typeof remindableCount === 'number' ? remindableCount : pendingCount;

    function sendReminders(): void {
        if (!eventId || canRemind < 1) {
            return;
        }
        setReminding(true);
        router.post(
            `/events/${eventId}/rsvp-reminders`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setReminding(false),
            },
        );
    }

    const sorted = useMemo(
        () =>
            [...rows].sort((a, b) => {
                const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
                return bTime - aTime || b.id - a.id;
            }),
        [rows],
    );

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const active = FILTERS.find((item) => item.id === filter) ?? FILTERS[0];
        return sorted.filter((rsvp) => {
            if (!active.match(rsvp.status)) {
                return false;
            }
            if (!needle) {
                return true;
            }
            return [rsvp.guest_name, rsvp.email, rsvp.message]
                .filter(Boolean)
                .some((part) => String(part).toLowerCase().includes(needle));
        });
    }, [filter, query, sorted]);

    const counts = useMemo(() => {
        const next: Record<FilterId, number> = {
            all: sorted.length,
            attending: 0,
            maybe: 0,
            not_attending: 0,
        };
        for (const rsvp of sorted) {
            if (rsvp.status === 'attending') next.attending += 1;
            else if (rsvp.status === 'maybe') next.maybe += 1;
            else if (rsvp.status === 'not_attending' || rsvp.status === 'declined') next.not_attending += 1;
        }
        return next;
    }, [sorted]);

    const catering = useMemo(() => {
        const mealsMap = new Map<string, number>();
        const dietary: { name: string; note: string; guests: number }[] = [];
        let headcount = 0;
        for (const rsvp of sorted) {
            if (rsvp.status !== 'attending' && rsvp.status !== 'maybe') {
                continue;
            }
            const seats = Math.max(1, rsvp.guest_count || 1);
            headcount += seats;
            const meal = (rsvp.meal_preference || 'no_preference').trim() || 'no_preference';
            mealsMap.set(meal, (mealsMap.get(meal) ?? 0) + seats);
            if (rsvp.dietary_restrictions?.trim()) {
                dietary.push({
                    name: rsvp.guest_name || 'Guest',
                    note: rsvp.dietary_restrictions.trim(),
                    guests: seats,
                });
            }
        }
        return {
            headcount,
            meals: [...mealsMap.entries()]
                .map(([key, count]) => ({
                    key,
                    label: mealLabel(key === 'no_preference' ? null : key, meals) || 'No preference',
                    count,
                }))
                .sort((a, b) => b.count - a.count),
            dietary,
        };
    }, [meals, sorted]);

    return (
        <>
        <section
            id="rsvps"
            className={cn(
                'animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 [animation-delay:150ms]',
                className,
            )}
        >
            <div className="overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05] backdrop-blur">
                <div className="relative border-b border-zinc-100 px-5 py-5 sm:px-6">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(480px_180px_at_100%_0%,rgba(16,185,129,0.10),transparent_55%)]"
                    />
                    <div className="relative flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                Live replies
                            </p>
                            <h2 className="mt-1 font-serif text-2xl tracking-tight text-zinc-950">
                                RSVP inbox
                            </h2>
                            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-zinc-500">
                                Every response guests send from your invitation — names, party size, and notes.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {eventId ? (
                                <a
                                    href={`/events/${eventId}/rsvps/export`}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50"
                                >
                                    <Download className="size-3.5" />
                                    Export CSV
                                </a>
                            ) : null}
                            {eventId && catering.headcount > 0 ? (
                                <a
                                    href={`/events/${eventId}/rsvps/catering-export`}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 text-[12px] font-semibold text-amber-950 hover:bg-amber-100"
                                    title="Meal + dietary list for your caterer"
                                >
                                    <Download className="size-3.5" />
                                    Catering CSV
                                </a>
                            ) : null}
                            {remindersEnabled ? (
                                <span className="inline-flex h-9 items-center rounded-full border border-teal-200 bg-teal-50 px-3 text-[11px] font-semibold text-teal-800">
                                    Auto on
                                </span>
                            ) : null}
                            {eventId ? (
                                <button
                                    type="button"
                                    disabled={reminding || canRemind < 1}
                                    onClick={() => setConfirmRemind(true)}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-40"
                                    title={
                                        remindersEnabled
                                            ? 'Email pending invitees now (also runs daily when enabled in Preferences)'
                                            : 'Email pending invitees now — enable automatic reminders in Preferences'
                                    }
                                >
                                    <Bell className="size-3.5" />
                                    {reminding
                                        ? 'Sending…'
                                        : `Remind pending${canRemind > 0 ? ` (${canRemind})` : ''}`}
                                </button>
                            ) : null}
                            <div className="rounded-full bg-zinc-950 px-3.5 py-1.5 text-[12px] font-semibold text-white tabular-nums">
                                {sorted.length} {sorted.length === 1 ? 'reply' : 'replies'}
                            </div>
                        </div>
                    </div>

                    {catering.headcount > 0 ? (
                        <div className="relative mt-5 rounded-2xl bg-amber-50/70 px-4 py-3.5 ring-1 ring-amber-200/60">
                            <div className="flex flex-wrap items-end justify-between gap-2">
                                <div>
                                    <p className="text-[10px] font-semibold tracking-[0.14em] text-amber-800/70 uppercase">
                                        Catering snapshot
                                    </p>
                                    <p className="mt-0.5 text-[13px] font-semibold text-amber-950">
                                        {catering.headcount} seats · attending &amp; maybe
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {catering.meals.map((row) => (
                                    <span
                                        key={row.key}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-amber-950 ring-1 ring-amber-200/70"
                                    >
                                        {row.label}
                                        <span className="tabular-nums text-amber-700/80">{row.count}</span>
                                    </span>
                                ))}
                            </div>
                            {catering.dietary.length > 0 ? (
                                <ul className="mt-3 space-y-1 border-t border-amber-200/50 pt-2.5">
                                    {catering.dietary.slice(0, 6).map((row, index) => (
                                        <li key={`${row.name}-${index}`} className="text-[12px] text-amber-950/85">
                                            <span className="font-semibold">{row.name}</span>
                                            {row.guests > 1 ? ` (${row.guests})` : ''} — {row.note}
                                        </li>
                                    ))}
                                    {catering.dietary.length > 6 ? (
                                        <li className="text-[11px] text-amber-800/70">
                                            +{catering.dietary.length - 6} more — use Catering CSV
                                        </li>
                                    ) : null}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="relative mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search name, email, or note…"
                                className="h-11 w-full rounded-full border border-zinc-200 bg-zinc-50/80 pr-4 pl-10 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:bg-white"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {FILTERS.map((item) => {
                                const active = filter === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setFilter(item.id)}
                                        className={cn(
                                            'relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-full px-3 text-[12px] font-semibold transition',
                                            active
                                                ? 'bg-zinc-950 text-white shadow-sm'
                                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80',
                                        )}
                                    >
                                        {item.label}
                                        <span
                                            className={cn(
                                                'tabular-nums',
                                                active ? 'text-white/70' : 'text-zinc-400',
                                            )}
                                        >
                                            {counts[item.id]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {sorted.length === 0 ? (
                    <div className="px-5 py-12 text-center sm:px-6">
                        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                            <Mail className="size-6" />
                        </div>
                        <p className="mt-4 font-serif text-2xl tracking-tight text-zinc-950">Waiting for replies</p>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
                            When guests RSVP from your live invitation, their responses will appear here instantly.
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="px-5 py-10 text-center sm:px-6">
                        <p className="font-serif text-xl text-zinc-800">No matches</p>
                        <p className="mt-1 text-sm text-zinc-500">Try another filter or clear the search.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-zinc-100">
                        {filtered.map((rsvp, index) => {
                            const meta = statusMeta(rsvp.status);
                            const Icon = meta.icon;
                            const when = formatWhen(rsvp.created_at);
                            const meal = mealLabel(rsvp.meal_preference, meals);

                            return (
                                <li
                                    key={rsvp.id}
                                    className="group relative px-5 py-4 transition hover:bg-zinc-50/80 sm:px-6"
                                    style={{ animationDelay: `${index * 28}ms` }}
                                >
                                    <div
                                        aria-hidden
                                        className={cn(
                                            'pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b opacity-0 transition group-hover:opacity-100',
                                            meta.accent,
                                        )}
                                    />
                                    <div className="flex items-start gap-3.5">
                                        <div
                                            className={cn(
                                                'grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-[12px] font-semibold tracking-wide text-zinc-700 ring-1 ring-zinc-950/5',
                                                meta.accent,
                                            )}
                                        >
                                            {initials(rsvp.guest_name || 'Guest')}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-[15px] font-semibold text-zinc-950">
                                                    {rsvp.guest_name || 'Guest'}
                                                </p>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ring-1',
                                                        meta.chip,
                                                    )}
                                                >
                                                    <Icon className="size-3" />
                                                    {meta.label}
                                                </span>
                                            </div>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-500">
                                                {rsvp.email ? (
                                                    <span className="inline-flex min-w-0 items-center gap-1">
                                                        <Mail className="size-3 shrink-0 opacity-70" />
                                                        <span className="truncate">{rsvp.email}</span>
                                                    </span>
                                                ) : null}
                                                {rsvp.status === 'attending' ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Users className="size-3 opacity-70" />
                                                        {rsvp.guest_count}{' '}
                                                        {rsvp.guest_count === 1 ? 'guest' : 'guests'}
                                                    </span>
                                                ) : null}
                                                {meal ? <span>Meal · {meal}</span> : null}
                                                {when ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock className="size-3 opacity-70" />
                                                        {when}
                                                    </span>
                                                ) : null}
                                            </div>
                                            {rsvp.message?.trim() ? (
                                                <p className="mt-2.5 flex gap-2 rounded-2xl bg-zinc-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-700 ring-1 ring-zinc-950/5">
                                                    <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
                                                    <span>{rsvp.message.trim()}</span>
                                                </p>
                                            ) : null}
                                            {rsvp.dietary_restrictions?.trim() ? (
                                                <p className="mt-2 text-[12px] text-zinc-500">
                                                    Dietary · {rsvp.dietary_restrictions.trim()}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>

        <ConfirmDialog
            open={confirmRemind}
            onOpenChange={setConfirmRemind}
            title="Send RSVP reminders?"
            description={
                canRemind === 1
                    ? 'Email 1 guest who has not replied yet. Manual sends ignore the automatic cooldown.'
                    : `Email ${canRemind} guests who have not replied yet. Manual sends ignore the automatic cooldown.`
            }
            confirmLabel={canRemind === 1 ? 'Send 1 reminder' : `Send ${canRemind} reminders`}
            tone="default"
            loading={reminding}
            onConfirm={sendReminders}
        />
        </>
    );
}
