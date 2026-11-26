import { router } from '@inertiajs/react';
import { Check, EyeOff, Heart, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

export type GuestbookQueueRow = {
    id: number;
    name: string;
    message: string;
    status: string;
    photo_url: string | null;
};

type FilterId = 'all' | 'pending' | 'approved' | 'hidden';

const FILTERS: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'hidden', label: 'Hidden' },
];

function statusChip(status: string): string {
    switch (status) {
        case 'approved':
            return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80';
        case 'hidden':
            return 'bg-zinc-100 text-zinc-600 ring-zinc-200/80';
        default:
            return 'bg-amber-50 text-amber-800 ring-amber-200/80';
    }
}

/** Host moderation inbox for guest wishes / guestbook entries. */
export function EventGuestbookInbox({
    eventId,
    entries = [],
}: {
    eventId: number;
    entries?: GuestbookQueueRow[] | null;
}) {
    const rows = Array.isArray(entries) ? entries : [];
    const [filter, setFilter] = useState<FilterId>('pending');
    const [query, setQuery] = useState('');
    const [busyId, setBusyId] = useState<number | null>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<GuestbookQueueRow | null>(null);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return rows.filter((entry) => {
            if (filter !== 'all' && entry.status !== filter) {
                return false;
            }
            if (!needle) {
                return true;
            }
            return [entry.name, entry.message].some((part) => part.toLowerCase().includes(needle));
        });
    }, [filter, query, rows]);

    const counts = useMemo(() => {
        const next: Record<FilterId, number> = {
            all: rows.length,
            pending: 0,
            approved: 0,
            hidden: 0,
        };
        for (const entry of rows) {
            if (entry.status === 'pending') next.pending += 1;
            else if (entry.status === 'approved') next.approved += 1;
            else if (entry.status === 'hidden') next.hidden += 1;
        }
        return next;
    }, [rows]);

    const allSelected = filtered.length > 0 && selected.length === filtered.length;

    function toggleOne(id: number): void {
        setSelected((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
        );
    }

    function toggleAll(): void {
        setSelected(allSelected ? [] : filtered.map((entry) => entry.id));
    }

    function moderate(entry: GuestbookQueueRow, action: 'approve' | 'hide'): void {
        setBusyId(entry.id);
        router.post(`/events/${eventId}/guestbook/${entry.id}/${action}`, {}, {
            preserveScroll: true,
            onFinish: () => setBusyId(null),
        });
    }

    function bulk(action: 'approve' | 'hide' | 'delete'): void {
        if (selected.length === 0) {
            return;
        }
        setBulkBusy(true);
        router.post(
            `/events/${eventId}/guestbook/bulk`,
            { action, entry_ids: selected },
            {
                preserveScroll: true,
                onFinish: () => {
                    setBulkBusy(false);
                    setSelected([]);
                },
            },
        );
    }

    return (
        <section id="wishes" className="space-y-5">
            <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.06]">
                <div className="relative border-b border-zinc-950/6 px-5 py-5 sm:px-6">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(480px_180px_at_100%_0%,rgba(24,24,27,0.06),transparent_55%)]"
                    />
                    <div className="relative">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                            Guest wall
                        </p>
                        <h2 className="mt-1 font-serif text-3xl tracking-tight text-zinc-950">Wishes inbox</h2>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
                            Approve messages before they appear on your live invitation. Pending wishes stay private
                            until you publish them.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-b border-zinc-950/6 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                    <div className="flex flex-wrap gap-1.5">
                        {FILTERS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setFilter(item.id);
                                    setSelected([]);
                                }}
                                className={cn(
                                    'relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-full px-3 text-[12px] font-semibold transition',
                                    filter === item.id
                                        ? 'bg-zinc-950 text-white'
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
                                )}
                            >
                                {item.label}
                                <span className="tabular-nums opacity-70">{counts[item.id]}</span>
                            </button>
                        ))}
                    </div>
                    <label className="relative ml-auto block w-full sm:max-w-[14rem]">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search wishes…"
                            className="h-9 w-full rounded-full border border-zinc-950/8 bg-zinc-50 pr-3 pl-9 text-[13px] outline-none focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
                        />
                    </label>
                </div>

                {filtered.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-950/6 px-5 py-3 sm:px-6">
                        <label className="inline-flex items-center gap-2 text-[12px] font-medium text-zinc-600">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleAll}
                                className="size-3.5 rounded border-zinc-300"
                            />
                            Select all
                        </label>
                        <span className="text-[12px] text-zinc-400">
                            {selected.length > 0 ? `${selected.length} selected` : `${filtered.length} wishes`}
                        </span>
                        <div className="ml-auto flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={bulkBusy || selected.length === 0}
                                onClick={() => bulk('approve')}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-3 text-[12px] font-semibold text-white disabled:opacity-40"
                            >
                                <Check className="size-3.5" />
                                Approve
                            </button>
                            <button
                                type="button"
                                disabled={bulkBusy || selected.length === 0}
                                onClick={() => bulk('hide')}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 disabled:opacity-40"
                            >
                                <EyeOff className="size-3.5" />
                                Hide
                            </button>
                            <button
                                type="button"
                                disabled={bulkBusy || selected.length === 0}
                                onClick={() => bulk('delete')}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                            >
                                <Trash2 className="size-3.5" />
                                Delete
                            </button>
                        </div>
                    </div>
                ) : null}

                {filtered.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Heart className="mx-auto size-8 text-zinc-300" />
                        <p className="mt-4 font-serif text-3xl text-zinc-950">No wishes here</p>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                            {filter === 'pending'
                                ? 'New guest messages will land here for approval.'
                                : 'Nothing matches this filter yet.'}
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-zinc-950/6">
                        {filtered.map((entry) => {
                            const busy = busyId === entry.id;
                            const checked = selected.includes(entry.id);
                            return (
                                <li key={entry.id} className="px-5 py-4 sm:px-6">
                                    <div className="flex flex-wrap items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleOne(entry.id)}
                                            className="mt-3.5 size-3.5 rounded border-zinc-300"
                                            aria-label={`Select ${entry.name}`}
                                        />
                                        {entry.photo_url ? (
                                            <img
                                                src={entry.photo_url}
                                                alt=""
                                                className="size-12 rounded-xl object-cover ring-1 ring-zinc-950/8"
                                            />
                                        ) : (
                                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 font-semibold text-zinc-500">
                                                {entry.name.trim().charAt(0).toUpperCase() || '•'}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium text-zinc-950">{entry.name}</p>
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 capitalize',
                                                        statusChip(entry.status),
                                                    )}
                                                >
                                                    {entry.status}
                                                </span>
                                            </div>
                                            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                                                “{entry.message}”
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 pl-7">
                                        {entry.status !== 'approved' ? (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => moderate(entry, 'approve')}
                                                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-3 text-[12px] font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                                            >
                                                <Check className="size-3.5" />
                                                Approve
                                            </button>
                                        ) : null}
                                        {entry.status !== 'hidden' ? (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => moderate(entry, 'hide')}
                                                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-950/10 bg-white px-3 text-[12px] font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
                                            >
                                                <EyeOff className="size-3.5" />
                                                Hide
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => setPendingDelete(entry)}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                                        >
                                            <Trash2 className="size-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <ConfirmDialog
                open={pendingDelete != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDelete(null);
                    }
                }}
                title="Delete this wish?"
                description={
                    pendingDelete
                        ? `“${pendingDelete.name}”’s message will be permanently removed.`
                        : undefined
                }
                confirmLabel="Delete wish"
                tone="danger"
                onConfirm={() => {
                    if (!pendingDelete) {
                        return;
                    }
                    setBusyId(pendingDelete.id);
                    router.delete(`/events/${eventId}/guestbook/${pendingDelete.id}`, {
                        preserveScroll: true,
                        onFinish: () => {
                            setBusyId(null);
                            setPendingDelete(null);
                        },
                    });
                }}
            />
        </section>
    );
}
