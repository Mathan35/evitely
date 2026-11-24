import { Head, Link, router } from '@inertiajs/react';
import { AdminCard, AdminLineChart, AdminPageHeader, AdminStat, AdminTable } from '@/components/admin/admin-ui';
import { rupees, shortDate } from '@/components/admin/pagination';

type EventDetail = {
    id: number;
    title: string;
    slug: string;
    status: string;
    invitation_mode?: string;
    theme?: string | null;
    style?: string | null;
    language?: string | null;
    secondary_language?: string | null;
    starts_on?: string | null;
    starts_at?: string | null;
    timezone?: string | null;
    venue_name?: string | null;
    venue_address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    site_billing_status?: string | null;
    site_pack_sku?: string | null;
    site_pack_days?: number | null;
    site_pack_ends_at?: string | null;
    site_trial_ends_at?: string | null;
    published_at?: string | null;
    created_at?: string | null;
    deleted?: boolean;
    public_url?: string | null;
    preview_url?: string | null;
    studio_url?: string | null;
    card_editor_url?: string | null;
    owner?: { id?: number; name?: string | null; email?: string | null; plan?: string | null; message_credits?: number };
    event_type?: string | null;
    counts?: Record<string, number>;
    guest_stats?: Record<string, number>;
    moderation?: {
        guestbook: Record<string, number>;
        guest_photos: Record<string, number>;
    };
    analytics?: Record<string, number>;
    traffic_14d?: Array<{ date: string; views: number; unique_views: number; guest_views: number }>;
    card?: {
        exists: boolean;
        status?: string | null;
        format?: string | null;
        width?: number | null;
        height?: number | null;
        preview_url?: string | null;
        template_id?: string | null;
        page_count?: number | null;
        updated_at?: string | null;
    };
    settings?: Record<string, string | number | boolean | null>;
    hosts?: Array<{ id: number; name: string; role?: string | null }>;
    schedules?: Array<{ id: number; title?: string | null; event_date?: string | null; start_time?: string | null; venue_name?: string | null }>;
    locales?: string[];
    collaborators?: Array<{ id: number; email: string; role: string; accepted?: boolean }>;
    payments?: Array<{ id: number; sku: string; status: string; amount_paise: number; provider?: string; paid_at?: string | null }>;
    recent_guests?: Array<{
        id: number;
        name: string;
        email?: string | null;
        phone?: string | null;
        rsvp_status?: string;
        invitation_status?: string;
        delivery_error?: boolean;
        revoked?: boolean;
    }>;
};

const btn = 'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800 hover:bg-zinc-50';
const btnDark = 'rounded-lg bg-zinc-950 px-3 py-1.5 text-[12px] font-medium text-white';

export default function EventShow({ event, pack_actions }: { event: EventDetail; pack_actions: string[] }) {
    const analytics = event.analytics ?? {};
    const guests = event.guest_stats ?? {};
    const counts = event.counts ?? {};

    return (
        <>
            <Head title={event.title} />
            <AdminPageHeader
                title={event.title}
                description={`${event.slug} · ${event.event_type ?? 'Event'}${event.deleted ? ' · deleted' : ''}`}
                actions={
                    <>
                        {event.public_url ? (
                            <a href={event.public_url} target="_blank" rel="noreferrer" className={btn}>
                                Public site
                            </a>
                        ) : null}
                        {event.preview_url ? (
                            <a href={event.preview_url} target="_blank" rel="noreferrer" className={btn}>
                                Preview
                            </a>
                        ) : null}
                        {event.studio_url ? (
                            <a href={event.studio_url} target="_blank" rel="noreferrer" className={btn}>
                                Studio
                            </a>
                        ) : null}
                        {event.card_editor_url ? (
                            <a href={event.card_editor_url} target="_blank" rel="noreferrer" className={btn}>
                                Card editor
                            </a>
                        ) : null}
                        {event.status === 'published' ? (
                            <button type="button" className={btn} onClick={() => router.post(`/admin/events/${event.id}/unpublish`)}>
                                Unpublish
                            </button>
                        ) : (
                            <button type="button" className={btnDark} onClick={() => router.post(`/admin/events/${event.id}/publish`)}>
                                Publish
                            </button>
                        )}
                        {event.deleted ? (
                            <button
                                type="button"
                                className={btn}
                                onClick={() => {
                                    if (confirm('Restore this event?')) {
                                        router.post(`/admin/events/${event.id}/restore`);
                                    }
                                }}
                            >
                                Restore
                            </button>
                        ) : null}
                    </>
                }
            />

            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AdminStat label="Views" value={(analytics.views ?? 0) + (analytics.guest_views ?? 0)} />
                <AdminStat label="Unique" value={analytics.unique_views ?? 0} />
                <AdminStat label="QR scans" value={analytics.qr_scans ?? 0} />
                <AdminStat label="Shares" value={analytics.shares ?? 0} />
                <AdminStat label="Guests" value={guests.total ?? counts.guests ?? 0} />
                <AdminStat label="Attending" value={guests.attending ?? 0} />
                <AdminStat label="RSVPs" value={counts.rsvps ?? 0} />
                <AdminStat label="Pending RSVP" value={guests.pending ?? 0} />
            </div>

            <AdminCard title="Traffic (14 days)" className="mb-3">
                <AdminLineChart
                    series={[
                        {
                            key: 'views',
                            label: 'Views',
                            color: '#18181b',
                            points: (event.traffic_14d ?? []).map((p) => ({ date: p.date, value: p.views })),
                        },
                        {
                            key: 'unique',
                            label: 'Unique',
                            color: '#71717a',
                            points: (event.traffic_14d ?? []).map((p) => ({ date: p.date, value: p.unique_views })),
                        },
                        {
                            key: 'guest',
                            label: 'Guest',
                            color: '#a1a1aa',
                            points: (event.traffic_14d ?? []).map((p) => ({ date: p.date, value: p.guest_views })),
                        },
                    ]}
                />
            </AdminCard>

            <div className="grid gap-3 lg:grid-cols-2">
                <AdminCard title="Site">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-[13px]">
                        <dt className="text-zinc-400">Owner</dt>
                        <dd>
                            {event.owner?.id ? (
                                <Link href={`/admin/users/${event.owner.id}`} className="text-zinc-950 hover:underline">
                                    {event.owner.name || 'User'}
                                    {event.owner.email ? ` (${event.owner.email})` : ''}
                                </Link>
                            ) : (
                                '—'
                            )}
                        </dd>
                        <dt className="text-zinc-400">Owner plan</dt>
                        <dd>
                            {event.owner?.plan ?? '—'} · {event.owner?.message_credits ?? 0} credits
                        </dd>
                        <dt className="text-zinc-400">Status</dt>
                        <dd>{event.status}</dd>
                        <dt className="text-zinc-400">Mode</dt>
                        <dd>{event.invitation_mode ?? '—'}</dd>
                        <dt className="text-zinc-400">Theme / style</dt>
                        <dd>
                            {event.theme ?? '—'} / {event.style ?? '—'}
                        </dd>
                        <dt className="text-zinc-400">Languages</dt>
                        <dd>
                            {event.language ?? '—'}
                            {event.secondary_language ? ` + ${event.secondary_language}` : ''}
                            {(event.locales ?? []).length ? ` · locales ${event.locales?.join(', ')}` : ''}
                        </dd>
                        <dt className="text-zinc-400">When</dt>
                        <dd>
                            {shortDate(event.starts_on)} {event.starts_at ?? ''} {event.timezone ?? ''}
                        </dd>
                        <dt className="text-zinc-400">Venue</dt>
                        <dd className="break-words">
                            {[event.venue_name, event.city, event.state, event.country].filter(Boolean).join(' · ') || '—'}
                        </dd>
                        <dt className="text-zinc-400">Published</dt>
                        <dd>{shortDate(event.published_at)}</dd>
                        <dt className="text-zinc-400">Created</dt>
                        <dd>{shortDate(event.created_at)}</dd>
                        <dt className="text-zinc-400">Public URL</dt>
                        <dd className="break-all">{event.public_url ?? '—'}</dd>
                    </dl>
                </AdminCard>

                <AdminCard title="Card">
                    {event.card?.exists ? (
                        <div className="space-y-3 px-4 py-3">
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                                <dt className="text-zinc-400">Status</dt>
                                <dd>{event.card.status ?? '—'}</dd>
                                <dt className="text-zinc-400">Format</dt>
                                <dd>{event.card.format ?? '—'}</dd>
                                <dt className="text-zinc-400">Size</dt>
                                <dd>
                                    {event.card.width ?? '—'}×{event.card.height ?? '—'}
                                </dd>
                                <dt className="text-zinc-400">Template</dt>
                                <dd className="break-all">{String(event.card.template_id ?? '—')}</dd>
                                <dt className="text-zinc-400">Pages</dt>
                                <dd>{event.card.page_count ?? '—'}</dd>
                                <dt className="text-zinc-400">Generated</dt>
                                <dd>{analytics.cards_generated ?? 0}</dd>
                                <dt className="text-zinc-400">Downloads</dt>
                                <dd>{analytics.card_downloads ?? 0}</dd>
                                <dt className="text-zinc-400">Card shares</dt>
                                <dd>{analytics.card_shares ?? 0}</dd>
                                <dt className="text-zinc-400">Updated</dt>
                                <dd>{shortDate(event.card.updated_at)}</dd>
                            </dl>
                            {event.card.preview_url ? (
                                <img src={event.card.preview_url} alt="Card preview" className="max-h-64 rounded-xl border border-zinc-200 object-contain" />
                            ) : null}
                        </div>
                    ) : (
                        <p className="px-4 py-6 text-[13px] text-zinc-400">No invitation card yet.</p>
                    )}
                </AdminCard>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <AdminCard title="Guests / RSVP">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-[13px]">
                        <dt className="text-zinc-400">Attending</dt>
                        <dd>{guests.attending ?? 0}</dd>
                        <dt className="text-zinc-400">Declined</dt>
                        <dd>{guests.declined ?? 0}</dd>
                        <dt className="text-zinc-400">Maybe</dt>
                        <dd>{guests.maybe ?? 0}</dd>
                        <dt className="text-zinc-400">Pending</dt>
                        <dd>{guests.pending ?? 0}</dd>
                        <dt className="text-zinc-400">Delivery errors</dt>
                        <dd>{guests.delivery_errors ?? 0}</dd>
                        <dt className="text-zinc-400">Revoked</dt>
                        <dd>{guests.revoked ?? 0}</dd>
                    </dl>
                </AdminCard>
                <AdminCard title="Moderation">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-[13px]">
                        <dt className="text-zinc-400">Guestbook pending</dt>
                        <dd>{event.moderation?.guestbook.pending ?? 0}</dd>
                        <dt className="text-zinc-400">Guestbook approved</dt>
                        <dd>{event.moderation?.guestbook.approved ?? 0}</dd>
                        <dt className="text-zinc-400">Photos pending</dt>
                        <dd>{event.moderation?.guest_photos.pending ?? 0}</dd>
                        <dt className="text-zinc-400">Photos approved</dt>
                        <dd>{event.moderation?.guest_photos.approved ?? 0}</dd>
                        <dt className="text-zinc-400">Gift claims</dt>
                        <dd>{counts.gift_claims ?? 0}</dd>
                        <dt className="text-zinc-400">Host photos</dt>
                        <dd>{counts.photos ?? 0}</dd>
                    </dl>
                </AdminCard>
                <AdminCard title="Billing">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-[13px]">
                        <dt className="text-zinc-400">Status</dt>
                        <dd>{event.site_billing_status ?? '—'}</dd>
                        <dt className="text-zinc-400">Pack</dt>
                        <dd>{event.site_pack_sku ?? '—'}</dd>
                        <dt className="text-zinc-400">Pack days</dt>
                        <dd>{event.site_pack_days ?? '—'}</dd>
                        <dt className="text-zinc-400">Pack ends</dt>
                        <dd>{shortDate(event.site_pack_ends_at)}</dd>
                        <dt className="text-zinc-400">Trial ends</dt>
                        <dd>{shortDate(event.site_trial_ends_at)}</dd>
                        <dt className="text-zinc-400">Branding off</dt>
                        <dd>{event.settings?.remove_branding ? 'Yes' : 'No'}</dd>
                    </dl>
                    <div className="flex flex-wrap gap-2 border-t border-zinc-100 px-4 py-3">
                        {pack_actions.map((action) => (
                            <button
                                key={action}
                                type="button"
                                className={btn}
                                onClick={() => {
                                    if (confirm(`Apply billing action “${action}”?`)) {
                                        router.post(`/admin/events/${event.id}/billing`, { action });
                                    }
                                }}
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                </AdminCard>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <AdminCard title="Hosts">
                    <AdminTable headers={['Name', 'Role']} rows={(event.hosts ?? []).map((host) => [host.name, host.role ?? '—'])} />
                </AdminCard>
                <AdminCard title="Schedule">
                    <AdminTable
                        headers={['Title', 'When', 'Venue']}
                        rows={(event.schedules ?? []).map((row) => [
                            row.title ?? '—',
                            `${row.event_date ?? ''} ${row.start_time ?? ''}`.trim() || '—',
                            row.venue_name ?? '—',
                        ])}
                    />
                </AdminCard>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-2">
                <AdminCard title="Recent guests">
                    <AdminTable
                        headers={['Guest', 'RSVP', 'Invite', 'Flags']}
                        rows={(event.recent_guests ?? []).map((guest) => [
                            <span key={guest.id}>
                                <span className="block font-medium text-zinc-900">{guest.name}</span>
                                <span className="text-zinc-400">{guest.email || guest.phone || '—'}</span>
                            </span>,
                            guest.rsvp_status ?? '—',
                            guest.invitation_status ?? '—',
                            [guest.delivery_error ? 'delivery err' : null, guest.revoked ? 'revoked' : null].filter(Boolean).join(', ') || '—',
                        ])}
                    />
                </AdminCard>
                <AdminCard title="Payments">
                    <AdminTable
                        headers={['SKU', 'Status', 'Amount', 'Paid']}
                        rows={(event.payments ?? []).map((payment) => [
                            <Link key={payment.id} href={`/admin/payments/${payment.id}`} className="font-medium text-zinc-950 hover:underline">
                                {payment.sku}
                            </Link>,
                            payment.status,
                            rupees(payment.amount_paise),
                            shortDate(payment.paid_at),
                        ])}
                    />
                </AdminCard>
            </div>

            <AdminCard title="Collaborators" className="mt-3">
                <AdminTable
                    headers={['Email', 'Role', 'Accepted']}
                    rows={(event.collaborators ?? []).map((row) => [row.email, row.role, row.accepted ? 'Yes' : 'No'])}
                />
            </AdminCard>
        </>
    );
}
