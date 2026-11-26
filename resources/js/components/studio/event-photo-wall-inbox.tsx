import { router } from '@inertiajs/react';
import { Check, EyeOff, Image, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

export type GuestPhotoQueueRow = {
    id: number;
    name: string;
    caption: string | null;
    status: string;
    photo_url: string | null;
    created_at?: string | null;
};

type FilterId = 'all' | 'pending' | 'approved' | 'hidden';

const FILTERS: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'hidden', label: 'Hidden' },
];

/** Host moderation inbox for guest photo wall uploads. */
export function EventPhotoWallInbox({
    eventId,
    photos = [],
}: {
    eventId: number;
    photos?: GuestPhotoQueueRow[] | null;
}) {
    const rows = Array.isArray(photos) ? photos : [];
    const [filter, setFilter] = useState<FilterId>('pending');
    const [query, setQuery] = useState('');
    const [busyId, setBusyId] = useState<number | null>(null);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [pendingDelete, setPendingDelete] = useState<GuestPhotoQueueRow | null>(null);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return rows.filter((photo) => {
            if (filter !== 'all' && photo.status !== filter) {
                return false;
            }
            if (!needle) {
                return true;
            }
            return [photo.name, photo.caption || ''].some((part) => part.toLowerCase().includes(needle));
        });
    }, [filter, query, rows]);

    const counts = useMemo(() => {
        const next: Record<FilterId, number> = { all: rows.length, pending: 0, approved: 0, hidden: 0 };
        for (const photo of rows) {
            if (photo.status === 'pending') next.pending += 1;
            else if (photo.status === 'approved') next.approved += 1;
            else if (photo.status === 'hidden') next.hidden += 1;
        }
        return next;
    }, [rows]);

    const allSelected = filtered.length > 0 && selected.length === filtered.length;

    function toggleAll(): void {
        setSelected((current) =>
            current.length === filtered.length ? [] : filtered.map((photo) => photo.id),
        );
    }

    function toggleOne(id: number): void {
        setSelected((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    }

    function act(photoId: number, action: 'approve' | 'hide'): void {
        setBusyId(photoId);
        router.post(`/events/${eventId}/guest-photos/${photoId}/${action}`, {}, {
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
            `/events/${eventId}/guest-photos/bulk`,
            { action, photo_ids: selected },
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
        <>
            <section
                id="photos"
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
            >
                <div className="overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05]">
                    <div className="border-b border-zinc-100 px-5 py-5 sm:px-6">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                            Guest uploads
                        </p>
                        <h2 className="mt-1 font-serif text-2xl tracking-tight text-zinc-950">Photo wall</h2>
                        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-zinc-500">
                            Approve photos before they appear on your invitation.
                        </p>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search name or caption…"
                                    className="h-11 w-full rounded-full border border-zinc-200 bg-zinc-50/80 pr-4 pl-10 text-sm outline-none focus:border-zinc-400 focus:bg-white"
                                />
                            </div>
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
                                            'relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-full px-3 text-[12px] font-semibold',
                                            filter === item.id
                                                ? 'bg-zinc-950 text-white'
                                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80',
                                        )}
                                    >
                                        {item.label}
                                        <span className="tabular-nums opacity-70">{counts[item.id]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <div className="mx-auto grid size-14 place-items-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                                <Image className="size-6" />
                            </div>
                            <p className="mt-4 font-serif text-2xl text-zinc-950">No photos yet</p>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                                Enable the photo wall in Preferences, then guests can upload from the invitation.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-5 py-3 sm:px-6">
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
                                    {selected.length > 0
                                        ? `${selected.length} selected`
                                        : `${filtered.length} photos`}
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
                                        Remove
                                    </button>
                                </div>
                            </div>
                            <ul className="divide-y divide-zinc-100">
                                {filtered.map((photo) => {
                                    const checked = selected.includes(photo.id);
                                    return (
                                        <li
                                            key={photo.id}
                                            className={cn(
                                                'flex flex-wrap items-start gap-3 px-5 py-4 sm:px-6',
                                                checked && 'bg-emerald-50/40',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleOne(photo.id)}
                                                className="mt-5 size-3.5 rounded border-zinc-300"
                                                aria-label={`Select ${photo.name}`}
                                            />
                                            {photo.photo_url ? (
                                                <img
                                                    src={photo.photo_url}
                                                    alt=""
                                                    className="size-16 rounded-2xl object-cover ring-1 ring-zinc-950/5"
                                                />
                                            ) : (
                                                <div className="grid size-16 place-items-center rounded-2xl bg-zinc-100 text-zinc-400">
                                                    <Image className="size-5" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-zinc-950">{photo.name}</p>
                                                {photo.caption ? (
                                                    <p className="mt-1 text-[13px] text-zinc-600">{photo.caption}</p>
                                                ) : null}
                                                <p className="mt-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                                                    {photo.status}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {photo.status !== 'approved' ? (
                                                    <button
                                                        type="button"
                                                        disabled={busyId === photo.id}
                                                        onClick={() => act(photo.id, 'approve')}
                                                        className="inline-flex h-9 items-center gap-1 rounded-full bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-900"
                                                    >
                                                        <Check className="size-3.5" />
                                                        Approve
                                                    </button>
                                                ) : null}
                                                {photo.status !== 'hidden' ? (
                                                    <button
                                                        type="button"
                                                        disabled={busyId === photo.id}
                                                        onClick={() => act(photo.id, 'hide')}
                                                        className="inline-flex h-9 items-center gap-1 rounded-full bg-zinc-100 px-3 text-[12px] font-semibold text-zinc-700"
                                                    >
                                                        <EyeOff className="size-3.5" />
                                                        Hide
                                                    </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingDelete(photo)}
                                                    className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[12px] font-semibold text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    Remove
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                </div>
            </section>

            <ConfirmDialog
                open={pendingDelete != null}
                onOpenChange={(open) => {
                    if (!open) setPendingDelete(null);
                }}
                title="Remove this photo?"
                description={
                    pendingDelete
                        ? `“${pendingDelete.name}” will be removed from the photo wall queue.`
                        : undefined
                }
                confirmLabel="Remove photo"
                tone="danger"
                onConfirm={() => {
                    if (!pendingDelete) return;
                    router.delete(`/events/${eventId}/guest-photos/${pendingDelete.id}`, {
                        preserveScroll: true,
                        onFinish: () => setPendingDelete(null),
                    });
                }}
            />
        </>
    );
}
