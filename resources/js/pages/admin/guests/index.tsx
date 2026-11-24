import { Head, Link, router } from '@inertiajs/react';
import { FormEvent } from 'react';
import { AdminCard, AdminPageHeader, AdminTable } from '@/components/admin/admin-ui';
import { AdminPagination, type Paginator } from '@/components/admin/pagination';

type Guest = {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    rsvp_status?: string;
    event_id?: number;
    event_title?: string | null;
    has_delivery_error?: boolean;
    token?: string | null;
    revoked?: boolean;
};

type Collaborator = {
    id: number;
    email: string;
    role: string;
    accepted?: boolean;
    event_id?: number;
    event_title?: string | null;
};

const btn = 'rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700';

export default function GuestsIndex({
    guests,
    collaborators,
    filters,
}: {
    guests: Paginator<Guest>;
    collaborators: Collaborator[];
    filters: { q: string };
}) {
    function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get('/admin/guests', { q: String(data.get('q') ?? '') }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Guests" />
            <AdminPageHeader
                title="Guests"
                description="RSVPs, tokens, and event collaborators."
                actions={
                    <a
                        href={`/admin/exports/guests?q=${encodeURIComponent(filters.q)}`}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800"
                    >
                        Export CSV
                    </a>
                }
            />
            <form onSubmit={search} className="mb-3 flex gap-2">
                <input name="q" defaultValue={filters.q} placeholder="Name, email, phone, token" className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] md:max-w-sm" />
                <button type="submit" className="h-9 rounded-lg bg-zinc-950 px-3 text-[13px] font-medium text-white">
                    Search
                </button>
            </form>

            <AdminCard className="mb-4">
                <AdminTable
                    headers={['Guest', 'Event', 'RSVP', 'Delivery', 'Token']}
                    rows={guests.data.map((guest) => [
                        <span key={guest.id}>
                            <span className="block font-medium text-zinc-950">{guest.name}</span>
                            <span className="text-zinc-400">{guest.email || guest.phone || '—'}</span>
                        </span>,
                        guest.event_id ? (
                            <Link href={`/admin/events/${guest.event_id}`} className="hover:underline">
                                {guest.event_title}
                            </Link>
                        ) : (
                            '—'
                        ),
                        <form
                            key={`rsvp-${guest.id}`}
                            className="flex items-center gap-1"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                router.post(`/admin/guests/${guest.id}/rsvp`, {
                                    rsvp_status: String(data.get('rsvp_status')),
                                    number_of_guests: Number(data.get('number_of_guests') || 1),
                                });
                            }}
                        >
                            <select name="rsvp_status" defaultValue={guest.rsvp_status || 'pending'} className="h-7 rounded border border-zinc-200 bg-white px-1 text-[12px]">
                                {['attending', 'not_attending', 'maybe', 'pending'].map((status) => (
                                    <option key={status}>{status}</option>
                                ))}
                            </select>
                            <input name="number_of_guests" type="number" min={1} max={50} defaultValue={1} className="h-7 w-14 rounded border border-zinc-200 px-1 text-[12px]" />
                            <button type="submit" className={btn}>
                                Save
                            </button>
                        </form>,
                        guest.has_delivery_error ? 'Error' : 'OK',
                        <span key={`tok-${guest.id}`} className="inline-flex items-center gap-2">
                            <span className="font-mono text-[11px]">{guest.revoked ? 'revoked' : (guest.token ?? '').slice(0, 8)}</span>
                            <button
                                type="button"
                                className={btn}
                                onClick={() => {
                                    if (confirm('Revoke this guest token?')) {
                                        router.post(`/admin/guests/${guest.id}/revoke`);
                                    }
                                }}
                            >
                                Revoke
                            </button>
                        </span>,
                    ])}
                />
                <AdminPagination paginator={guests} />
            </AdminCard>

            <AdminCard title="Collaborators">
                <AdminTable
                    headers={['Email', 'Event', 'Role']}
                    rows={collaborators.map((person) => [
                        person.email,
                        person.event_title ?? '—',
                        <span key={person.id} className="inline-flex gap-1">
                            {['editor', 'viewer'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    className={person.role === role ? 'rounded-md bg-zinc-950 px-2 py-1 text-[11px] text-white' : btn}
                                    onClick={() => router.post(`/admin/collaborators/${person.id}`, { role })}
                                >
                                    {role}
                                </button>
                            ))}
                            <button
                                type="button"
                                className={btn}
                                onClick={() => {
                                    if (confirm('Remove this collaborator?')) {
                                        router.post(`/admin/collaborators/${person.id}`, { role: person.role, revoke: true });
                                    }
                                }}
                            >
                                Revoke
                            </button>
                        </span>,
                    ])}
                />
            </AdminCard>
        </>
    );
}
