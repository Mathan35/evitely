import { Head, Link, router } from '@inertiajs/react';
import { FormEvent } from 'react';
import { AdminCard, AdminPageHeader, AdminTable } from '@/components/admin/admin-ui';
import { AdminPagination, type Paginator, shortDate } from '@/components/admin/pagination';

type EventRow = {
    id: number;
    title: string;
    slug?: string;
    status: string;
    invitation_mode?: string;
    site_billing_status?: string | null;
    owner?: string | null;
    owner_name?: string | null;
    owner_email?: string | null;
    owner_id?: number | null;
    event_type?: string | null;
    guests_count?: number;
    rsvps_count?: number;
    guestbook_count?: number;
    views?: number;
    unique_views?: number;
    qr_scans?: number;
    shares?: number;
    card_status?: string | null;
    has_card?: boolean;
    starts_on?: string | null;
    deleted?: boolean;
};

export default function EventsIndex({
    events,
    filters,
}: {
    events: Paginator<EventRow>;
    filters: { q: string; status: string; billing: string; sort?: string };
}) {
    function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(
            '/admin/events',
            {
                q: String(data.get('q') ?? ''),
                status: String(data.get('status') ?? ''),
                billing: String(data.get('billing') ?? ''),
                sort: String(data.get('sort') ?? ''),
            },
            { preserveState: true, replace: true },
        );
    }

    const exportHref = `/admin/exports/events?q=${encodeURIComponent(filters.q)}`;

    return (
        <>
            <Head title="Events" />
            <AdminPageHeader
                title="Events"
                description="All user sites and cards — views, RSVPs, billing, and card status."
                actions={
                    <a href={exportHref} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800">
                        Export CSV
                    </a>
                }
            />
            <form onSubmit={search} className="mb-3 flex flex-wrap gap-2">
                <input name="q" defaultValue={filters.q} placeholder="Title, slug, owner" className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px]" />
                <select name="status" defaultValue={filters.status} className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px]">
                    <option value="">Any status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
                <select name="billing" defaultValue={filters.billing} className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px]">
                    <option value="">Any billing</option>
                    <option value="draft_ready">Draft ready</option>
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="paid">Paid</option>
                    <option value="expired">Expired</option>
                </select>
                <select name="sort" defaultValue={filters.sort || 'latest'} className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px]">
                    <option value="latest">Newest</option>
                    <option value="starts">Event date</option>
                </select>
                <button type="submit" className="h-9 rounded-lg bg-zinc-950 px-3 text-[13px] font-medium text-white">
                    Filter
                </button>
            </form>
            <AdminCard>
                <AdminTable
                    headers={['Event', 'Owner', 'Status', 'Billing', 'Views', 'Unique', 'RSVPs', 'Card', 'Date']}
                    rows={events.data.map((event) => [
                        <Link key={event.id} href={`/admin/events/${event.id}`} className="font-medium text-zinc-950 hover:underline">
                            <span className="block">{event.title}</span>
                            <span className="font-normal text-zinc-400">
                                {event.event_type ?? 'Event'}
                                {event.invitation_mode ? ` · ${event.invitation_mode}` : ''}
                                {event.deleted ? ' · deleted' : ''}
                            </span>
                        </Link>,
                        event.owner_id ? (
                            <Link key={`o-${event.id}`} href={`/admin/users/${event.owner_id}`} className="text-zinc-700 hover:underline">
                                {event.owner}
                            </Link>
                        ) : (
                            (event.owner ?? '—')
                        ),
                        event.status,
                        event.site_billing_status ?? '—',
                        event.views ?? 0,
                        event.unique_views ?? 0,
                        `${event.rsvps_count ?? 0}/${event.guests_count ?? 0}`,
                        event.has_card ? event.card_status || 'ready' : '—',
                        shortDate(event.starts_on),
                    ])}
                />
                <AdminPagination paginator={events} />
            </AdminCard>
        </>
    );
}
