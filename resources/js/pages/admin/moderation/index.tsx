import { Head, Link, router } from '@inertiajs/react';
import { AdminCard, AdminPageHeader } from '@/components/admin/admin-ui';
import { shortDate } from '@/components/admin/pagination';

type GuestItem = {
    id: number;
    name?: string | null;
    message?: string | null;
    caption?: string | null;
    status: string;
    event_id?: number;
    event_title?: string | null;
    photo_url?: string | null;
    created_at?: string | null;
};

type Gift = {
    id: number;
    name?: string | null;
    gift_label?: string | null;
    status: string;
    event_id?: number;
    event_title?: string | null;
};

const btn = 'rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50';

function StatusButtons({ onPick }: { onPick: (status: string) => void }) {
    return (
        <div className="flex gap-1">
            {['approved', 'hidden', 'pending'].map((status) => (
                <button key={status} type="button" className={btn} onClick={() => onPick(status)}>
                    {status}
                </button>
            ))}
        </div>
    );
}

export default function ModerationIndex({
    guestbook,
    photos,
    gifts,
    filters,
}: {
    guestbook: GuestItem[];
    photos: GuestItem[];
    gifts: Gift[];
    filters: { status: string };
}) {
    return (
        <>
            <Head title="Moderation" />
            <AdminPageHeader
                title="Moderation"
                description="Guestbook notes, guest photos, and gift claims."
                actions={
                    <select
                        value={filters.status}
                        onChange={(e) => router.get('/admin/moderation', { status: e.target.value }, { preserveState: true, replace: true })}
                        className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px]"
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="hidden">Hidden</option>
                        <option value="all">All</option>
                    </select>
                }
            />

            <div className="grid gap-3 xl:grid-cols-2">
                <AdminCard title="Guestbook">
                    <ul className="divide-y divide-zinc-100">
                        {guestbook.map((entry) => (
                            <li key={entry.id} className="space-y-2 px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[13px] font-medium text-zinc-900">{entry.name}</p>
                                        <p className="text-[13px] text-zinc-600">{entry.message}</p>
                                        <p className="text-[11px] text-zinc-400">
                                            {entry.event_id ? (
                                                <Link href={`/admin/events/${entry.event_id}`} className="hover:underline">
                                                    {entry.event_title}
                                                </Link>
                                            ) : null}{' '}
                                            · {entry.status} · {shortDate(entry.created_at)}
                                        </p>
                                    </div>
                                    {entry.photo_url ? <img src={entry.photo_url} alt="" className="size-12 rounded-md object-cover" /> : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusButtons onPick={(status) => router.post(`/admin/moderation/guestbook/${entry.id}`, { status })} />
                                    <button
                                        type="button"
                                        className={btn}
                                        onClick={() => {
                                            if (confirm('Delete this guestbook entry?')) {
                                                router.delete(`/admin/moderation/guestbook/${entry.id}`);
                                            }
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                        {guestbook.length === 0 ? <li className="px-4 py-8 text-center text-[13px] text-zinc-400">No entries.</li> : null}
                    </ul>
                </AdminCard>

                <AdminCard title="Photos">
                    <ul className="divide-y divide-zinc-100">
                        {photos.map((photo) => (
                            <li key={photo.id} className="space-y-2 px-4 py-3">
                                <div className="flex gap-3">
                                    {photo.photo_url ? <img src={photo.photo_url} alt="" className="size-16 rounded-md object-cover" /> : null}
                                    <div>
                                        <p className="text-[13px] font-medium">{photo.name}</p>
                                        <p className="text-[13px] text-zinc-600">{photo.caption}</p>
                                        <p className="text-[11px] text-zinc-400">
                                            {photo.status} · {shortDate(photo.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <StatusButtons onPick={(status) => router.post(`/admin/moderation/photos/${photo.id}`, { status })} />
                                    <button
                                        type="button"
                                        className={btn}
                                        onClick={() => {
                                            if (confirm('Delete this photo?')) {
                                                router.delete(`/admin/moderation/photos/${photo.id}`);
                                            }
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                        {photos.length === 0 ? <li className="px-4 py-8 text-center text-[13px] text-zinc-400">No photos.</li> : null}
                    </ul>
                </AdminCard>
            </div>

            <AdminCard title="Gifts" className="mt-3">
                <ul className="divide-y divide-zinc-100">
                    {gifts.map((gift) => (
                        <li key={gift.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px]">
                            <div>
                                <p className="font-medium text-zinc-900">
                                    {gift.name} · {gift.gift_label}
                                </p>
                                <p className="text-[11px] text-zinc-400">
                                    {gift.event_title} · {gift.status}
                                </p>
                            </div>
                            <select
                                defaultValue={gift.status}
                                onChange={(e) => router.post(`/admin/moderation/gifts/${gift.id}`, { status: e.target.value })}
                                className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-[12px]"
                            >
                                {['pending', 'claimed', 'fulfilled', 'cancelled'].map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </li>
                    ))}
                    {gifts.length === 0 ? <li className="px-4 py-8 text-center text-[13px] text-zinc-400">No gifts.</li> : null}
                </ul>
            </AdminCard>
        </>
    );
}
