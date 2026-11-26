import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowUpRight,
    Copy,
    Mail,
    MessageCircle,
    Phone,
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { StudioFilterSelect } from '@/components/studio/studio-filter-select';
import {
    StudioCard,
    StudioEyebrow,
    StudioSurface,
    StudioTitle,
} from '@/components/studio/studio-surface';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard';
import { openCreateInvitation } from '@/lib/open-create-invitation';
import { cn } from '@/lib/utils';

type EventOption = { id: number; title: string };

type Guest = {
    id: number;
    name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string | null;
    phone?: string | null;
    country_code?: string | null;
    number_of_guests?: number;
    notes?: string | null;
    group?: string | null;
    event: string | null;
    event_id: number;
    rsvp_status: string;
    invitation_status: string;
    invitation_sent_at?: string | null;
    invitation_send_count?: number;
    guest_url?: string | null;
};

type RsvpFilter = 'all' | 'attending' | 'pending' | 'declined' | 'maybe';
type InviteFilter = 'all' | 'pending' | 'sent' | 'viewed' | 'responded';

const rsvpFilters: { id: RsvpFilter; label: string; match: (g: Guest) => boolean }[] = [
    { id: 'all', label: 'All', match: () => true },
    { id: 'attending', label: 'Attending', match: (g) => g.rsvp_status === 'attending' },
    { id: 'pending', label: 'Pending', match: (g) => g.rsvp_status === 'pending' || g.rsvp_status === 'awaiting' },
    { id: 'maybe', label: 'Maybe', match: (g) => g.rsvp_status === 'maybe' },
    { id: 'declined', label: 'Declined', match: (g) => g.rsvp_status === 'not_attending' || g.rsvp_status === 'declined' },
];

const inviteFilters: { id: InviteFilter; label: string; match: (g: Guest) => boolean }[] = [
    { id: 'all', label: 'Any invite', match: () => true },
    { id: 'pending', label: 'Not sent', match: (g) => g.invitation_status === 'pending' },
    { id: 'sent', label: 'Sent', match: (g) => g.invitation_status === 'sent' },
    { id: 'viewed', label: 'Viewed', match: (g) => g.invitation_status === 'viewed' },
    { id: 'responded', label: 'Responded', match: (g) => g.invitation_status === 'responded' },
];

function rsvpTone(status: string): string {
    switch (status) {
        case 'attending':
            return 'bg-emerald-500/12 text-emerald-800 ring-emerald-600/20 dark:text-emerald-300';
        case 'maybe':
            return 'bg-amber-500/12 text-amber-800 ring-amber-600/20 dark:text-amber-300';
        case 'not_attending':
        case 'declined':
            return 'bg-rose-500/12 text-rose-800 ring-rose-600/20 dark:text-rose-300';
        default:
            return 'bg-zinc-900/6 text-zinc-600 ring-zinc-950/10 dark:bg-white/5 dark:text-zinc-300';
    }
}

function pretty(status: string): string {
    return status.replaceAll('_', ' ');
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function guestShareText(guest: Guest): string {
    const title = (guest.event || 'our celebration').trim();
    return [`You're invited to ${title}.`, 'Open your personal invite:', guest.guest_url || ''].join('\n');
}

function whatsappShareUrl(guest: Guest): string {
    const text = guestShareText(guest);
    const digits = `${guest.country_code || ''}${guest.phone || ''}`.replace(/\D+/g, '');
    if (digits.length >= 8) {
        return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function smsShareUrl(guest: Guest): string {
    const text = guestShareText(guest);
    const digits = `${guest.country_code || ''}${guest.phone || ''}`.replace(/\D+/g, '');
    if (digits.length >= 8) {
        return `sms:${digits}?&body=${encodeURIComponent(text)}`;
    }
    return `sms:?&body=${encodeURIComponent(text)}`;
}

function markShared(eventId: number, guestId: number, channel: 'whatsapp' | 'sms' = 'whatsapp'): void {
    router.post(
        `/events/${eventId}/guests/bulk`,
        { action: 'mark_shared', guest_ids: [guestId], channel },
        { preserveScroll: true },
    );
}

function markSent(eventId: number, guestId: number): void {
    router.post(
        `/events/${eventId}/guests/bulk`,
        { action: 'mark_sent', guest_ids: [guestId] },
        { preserveScroll: true },
    );
}

export default function GuestDirectory({
    guests,
    events = [],
}: {
    guests: Guest[];
    events?: EventOption[];
}) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<RsvpFilter>('all');
    const [inviteFilter, setInviteFilter] = useState<InviteFilter>('all');
    const [eventId, setEventId] = useState<number | 'all'>('all');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [adding, setAdding] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<Guest | null>(null);

    const addForm = useForm({
        event_id: events[0]?.id ? String(events[0].id) : '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        number_of_guests: '1',
    });

    const counts = useMemo(
        () =>
            Object.fromEntries(
                rsvpFilters.map((item) => [item.id, guests.filter(item.match).length]),
            ) as Record<RsvpFilter, number>,
        [guests],
    );

    const eventOptions = useMemo(() => {
        const fromGuests = new Map<number, string>();
        for (const guest of guests) {
            if (!fromGuests.has(guest.event_id)) {
                fromGuests.set(guest.event_id, guest.event || `Event ${guest.event_id}`);
            }
        }
        for (const event of events) {
            if (!fromGuests.has(event.id)) {
                fromGuests.set(event.id, event.title);
            }
        }
        return [...fromGuests.entries()].map(([id, title]) => ({ id, title }));
    }, [events, guests]);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return guests.filter((guest) => {
            if (eventId !== 'all' && guest.event_id !== eventId) {
                return false;
            }
            const matchRsvp = rsvpFilters.find((item) => item.id === filter)?.match(guest) ?? true;
            const matchInvite = inviteFilters.find((item) => item.id === inviteFilter)?.match(guest) ?? true;
            if (!matchRsvp || !matchInvite) {
                return false;
            }
            if (!needle) {
                return true;
            }
            return [guest.name, guest.email, guest.phone, guest.event, guest.group, guest.rsvp_status]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(needle));
        });
    }, [eventId, filter, guests, inviteFilter, query]);

    async function copyLink(guest: Guest): Promise<void> {
        if (!guest.guest_url) {
            return;
        }
        const ok = await copyToClipboard(guest.guest_url);
        if (!ok) {
            return;
        }
        setCopiedId(guest.id);
        window.setTimeout(() => {
            setCopiedId((current) => (current === guest.id ? null : current));
        }, 1600);
    }

    function submitAdd(event: FormEvent): void {
        event.preventDefault();
        const targetId = Number(addForm.data.event_id);
        if (!Number.isFinite(targetId) || targetId <= 0) {
            return;
        }
        addForm.transform((data) => ({
            first_name: data.first_name,
            last_name: data.last_name || null,
            email: data.email || null,
            phone: data.phone || null,
            number_of_guests: Number(data.number_of_guests) || 1,
        }));
        addForm.post(`/events/${targetId}/guests`, {
            preserveScroll: true,
            onSuccess: () => {
                addForm.reset('first_name', 'last_name', 'email', 'phone');
                addForm.setData('number_of_guests', '1');
                setAdding(false);
            },
        });
    }

    function deleteGuest(guest: Guest): void {
        router.delete(`/events/${guest.event_id}/guests/${guest.id}`, {
            preserveScroll: true,
            onFinish: () => setConfirmDelete(null),
        });
    }

    return (
        <>
            <Head title="Guests" />
            <StudioSurface>
                <header className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
                    <div className="flex flex-wrap items-end justify-between gap-5">
                        <div className="max-w-xl">
                            <StudioEyebrow>Directory</StudioEyebrow>
                            <StudioTitle>Guests</StudioTitle>
                            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                                Every invitee across your celebrations — search, filter, share personal links, or add someone new.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-full px-5"
                                onClick={() => setAdding(true)}
                                disabled={events.length === 0}
                            >
                                <Plus className="mr-1.5 size-4" />
                                Add guest
                            </Button>
                            <Button
                                type="button"
                                className="h-11 rounded-full bg-zinc-950 px-5 text-white shadow-lg shadow-zinc-950/20 hover:bg-zinc-800"
                                onClick={() => openCreateInvitation()}
                            >
                                <Plus className="mr-1.5 size-4" />
                                Create Invitation
                            </Button>
                        </div>
                    </div>
                </header>

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {rsvpFilters.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setFilter(item.id)}
                            className={cn(
                                'rounded-2xl border px-4 py-3 text-left transition',
                                filter === item.id
                                    ? 'border-zinc-950/20 bg-zinc-950 text-white shadow-lg dark:border-white/20 dark:bg-white dark:text-zinc-950'
                                    : 'border-zinc-950/8 bg-white/70 text-zinc-700 backdrop-blur hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/55 dark:text-zinc-200',
                            )}
                        >
                            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase opacity-70">
                                {item.label}
                            </p>
                            <p className="mt-1 font-serif text-3xl tabular-nums leading-none">{counts[item.id]}</p>
                        </button>
                    ))}
                </section>

                <StudioCard className="overflow-hidden">
                    <div className="flex flex-wrap items-end gap-3 border-b border-zinc-950/8 px-4 py-3 dark:border-white/10">
                        <div className="relative min-w-[220px] flex-1">
                            <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                Search
                            </span>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search name, email, phone, or event"
                                    className="h-10 w-full rounded-full border border-zinc-950/10 bg-white/80 pr-4 pl-10 text-sm outline-none ring-emerald-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/60"
                                />
                            </div>
                        </div>
                        <StudioFilterSelect
                            label="Event"
                            value={eventId === 'all' ? 'all' : String(eventId)}
                            onValueChange={(value) =>
                                setEventId(value === 'all' ? 'all' : Number(value))
                            }
                            options={[
                                { value: 'all', label: 'All events', hint: 'Every invitation' },
                                ...eventOptions.map((event) => ({
                                    value: String(event.id),
                                    label: event.title,
                                })),
                            ]}
                            wide
                            className="w-full sm:w-auto"
                            triggerClassName="h-10 rounded-full data-[size=default]:h-10"
                        />
                        <StudioFilterSelect
                            label="Invite status"
                            value={inviteFilter}
                            onValueChange={(value) => setInviteFilter(value as InviteFilter)}
                            options={inviteFilters.map((item) => ({
                                value: item.id,
                                label: item.label,
                            }))}
                            className="w-full sm:w-auto"
                            triggerClassName="h-10 rounded-full data-[size=default]:h-10"
                        />
                        <p className="text-sm text-zinc-500">
                            {visible.length} of {guests.length}
                        </p>
                    </div>

                    {guests.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <Users className="mx-auto size-8 text-zinc-300" />
                            <p className="mt-4 font-serif text-3xl text-zinc-950 dark:text-white">No guests yet</p>
                            <p className="mt-2 text-sm text-zinc-500">
                                Add invitees here or from an event’s Manage → Guests tab. Public RSVPs appear in the RSVP inbox.
                            </p>
                            <Button
                                type="button"
                                className="mt-5 rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800"
                                onClick={() => setAdding(true)}
                                disabled={events.length === 0}
                            >
                                Add your first guest
                            </Button>
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="px-6 py-10 text-center text-sm text-zinc-500">
                            No guests match this search or filter.
                        </div>
                    ) : (
                        <ul className="divide-y divide-zinc-950/6 dark:divide-white/8">
                            {visible.map((guest) => (
                                <li
                                    key={guest.id}
                                    className="flex flex-wrap items-center gap-4 px-4 py-4 transition hover:bg-zinc-950/[0.025] dark:hover:bg-white/[0.03]"
                                >
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-sm font-semibold text-white shadow-md">
                                        {initials(guest.name) || '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-zinc-950 dark:text-white">{guest.name}</p>
                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                                            {guest.email ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Mail className="size-3.5" />
                                                    {guest.email}
                                                </span>
                                            ) : null}
                                            {guest.phone ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Phone className="size-3.5" />
                                                    {guest.phone}
                                                </span>
                                            ) : null}
                                            {guest.group ? <span>{guest.group}</span> : null}
                                            {guest.number_of_guests && guest.number_of_guests > 1 ? (
                                                <span>Party of {guest.number_of_guests}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase ring-1',
                                                rsvpTone(guest.rsvp_status),
                                            )}
                                        >
                                            {pretty(guest.rsvp_status)}
                                        </span>
                                        <span className="rounded-full bg-zinc-950/5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:bg-white/5">
                                            {pretty(guest.invitation_status)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {guest.guest_url ? (
                                            <>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-full px-2.5"
                                                    onClick={() => void copyLink(guest)}
                                                    title="Copy invite link"
                                                >
                                                    <Copy className="size-3.5" />
                                                    <span className="ml-1 hidden sm:inline">
                                                        {copiedId === guest.id ? 'Copied' : 'Copy'}
                                                    </span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-full px-2.5"
                                                    onClick={() => {
                                                        window.open(whatsappShareUrl(guest), '_blank', 'noopener,noreferrer');
                                                        markShared(guest.event_id, guest.id, 'whatsapp');
                                                    }}
                                                    title="WhatsApp"
                                                >
                                                    <MessageCircle className="size-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-full px-2.5"
                                                    onClick={() => {
                                                        window.open(smsShareUrl(guest), '_blank', 'noopener,noreferrer');
                                                        markShared(guest.event_id, guest.id, 'sms');
                                                    }}
                                                    title="SMS"
                                                >
                                                    <Phone className="size-3.5" />
                                                </Button>
                                                {guest.email ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 rounded-full px-2.5"
                                                        onClick={() => markSent(guest.event_id, guest.id)}
                                                        title="Email invite"
                                                    >
                                                        <Mail className="size-3.5" />
                                                    </Button>
                                                ) : null}
                                            </>
                                        ) : null}
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 rounded-full px-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                            onClick={() => setConfirmDelete(guest)}
                                            title="Remove guest"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                        <Link
                                            href={`/events/${guest.event_id}`}
                                            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/80 px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200"
                                        >
                                            {guest.event || 'Event'}
                                            <ArrowUpRight className="size-3.5" />
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </StudioCard>
            </StudioSurface>

            {adding ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-4 sm:items-center">
                    <form
                        onSubmit={submitAdd}
                        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-zinc-950"
                    >
                        <p className="font-serif text-2xl text-zinc-950 dark:text-white">Add guest</p>
                        <p className="mt-1 text-sm text-zinc-500">They’ll appear under the event you pick.</p>
                        <div className="mt-4 grid gap-3">
                            <label className="grid gap-1 text-sm">
                                <span className="text-zinc-500">Event</span>
                                <select
                                    value={addForm.data.event_id}
                                    onChange={(event) => addForm.setData('event_id', event.target.value)}
                                    className="h-10 rounded-xl border border-zinc-200 px-3 dark:border-white/10 dark:bg-zinc-900"
                                    required
                                >
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1 text-sm">
                                <span className="text-zinc-500">First name</span>
                                <input
                                    value={addForm.data.first_name}
                                    onChange={(event) => addForm.setData('first_name', event.target.value)}
                                    className="h-10 rounded-xl border border-zinc-200 px-3 dark:border-white/10 dark:bg-zinc-900"
                                    required
                                />
                            </label>
                            <label className="grid gap-1 text-sm">
                                <span className="text-zinc-500">Last name</span>
                                <input
                                    value={addForm.data.last_name}
                                    onChange={(event) => addForm.setData('last_name', event.target.value)}
                                    className="h-10 rounded-xl border border-zinc-200 px-3 dark:border-white/10 dark:bg-zinc-900"
                                />
                            </label>
                            <label className="grid gap-1 text-sm">
                                <span className="text-zinc-500">Email</span>
                                <input
                                    type="email"
                                    value={addForm.data.email}
                                    onChange={(event) => addForm.setData('email', event.target.value)}
                                    className="h-10 rounded-xl border border-zinc-200 px-3 dark:border-white/10 dark:bg-zinc-900"
                                />
                            </label>
                            <label className="grid gap-1 text-sm">
                                <span className="text-zinc-500">Phone</span>
                                <input
                                    value={addForm.data.phone}
                                    onChange={(event) => addForm.setData('phone', event.target.value)}
                                    className="h-10 rounded-xl border border-zinc-200 px-3 dark:border-white/10 dark:bg-zinc-900"
                                />
                            </label>
                            <label className="grid gap-1 text-sm">
                                <span className="text-zinc-500">Party size</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={addForm.data.number_of_guests}
                                    onChange={(event) => addForm.setData('number_of_guests', event.target.value)}
                                    className="h-10 rounded-xl border border-zinc-200 px-3 dark:border-white/10 dark:bg-zinc-900"
                                />
                            </label>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <Button type="button" variant="ghost" className="rounded-full" onClick={() => setAdding(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-full bg-zinc-950 text-white hover:bg-zinc-800"
                                disabled={addForm.processing}
                            >
                                Save guest
                            </Button>
                        </div>
                    </form>
                </div>
            ) : null}

            {confirmDelete ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-4 sm:items-center">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl dark:bg-zinc-950">
                        <p className="font-serif text-2xl text-zinc-950 dark:text-white">Remove {confirmDelete.name}?</p>
                        <p className="mt-2 text-sm text-zinc-500">
                            Their personal invite link will stop working. This can’t be undone from here.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <Button type="button" variant="ghost" className="rounded-full" onClick={() => setConfirmDelete(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="rounded-full bg-rose-600 text-white hover:bg-rose-700"
                                onClick={() => deleteGuest(confirmDelete)}
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
