import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { AdminCard, AdminPageHeader, AdminTable } from '@/components/admin/admin-ui';
import { rupees, shortDate } from '@/components/admin/pagination';

type SitePack = {
    id: string;
    name: string;
    days: number;
    included_credits: number;
    price_label_inr?: string | null;
    price_label_bare_inr?: string | null;
};
type CreditPack = { id: string; name: string; credits: number; price_label_inr?: string | null };
type UserOption = { id: number; name: string; email: string; label: string };
type EventOption = {
    id: number;
    title: string;
    site_billing_status?: string | null;
    site_pack_sku?: string | null;
};
type GrantRow = {
    id: number;
    grant_id?: string | null;
    user?: string | null;
    user_id?: number;
    event_id?: number | null;
    kind: string;
    sku: string;
    pricing?: string | null;
    amount_paise: number;
    credits?: number | null;
    granted_by?: string | null;
    note?: string | null;
    paid_at?: string | null;
    created_at?: string | null;
};

const field =
    'mt-1 block h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-[13px] text-zinc-900';
const label = 'block text-[12px] font-medium text-zinc-500';
const btnDark = 'rounded-lg bg-zinc-950 px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50';

export default function GrantsIndex({
    grants,
    catalog,
    users,
    prefill,
}: {
    grants: GrantRow[];
    catalog: { site_packs: SitePack[]; credit_packs: CreditPack[] };
    users: UserOption[];
    prefill: {
        user_id?: number | null;
        event_id?: number | null;
        user?: { id: number; name: string; email: string } | null;
        events?: EventOption[];
    };
}) {
    const form = useForm({
        mode: 'existing' as 'existing' | 'new',
        user_id: prefill.user_id ? String(prefill.user_id) : '',
        name: '',
        email: '',
        event_id: prefill.event_id ? String(prefill.event_id) : '',
        event_title: '',
        site_pack_sku: catalog.site_packs[0]?.id ?? 'site_30',
        credit_pack_sku: '',
        include_site_credits: false,
        pricing: 'free',
        go_live_mode: 'now',
        note: '',
        send_email: true,
    });

    const [events, setEvents] = useState<EventOption[]>(prefill.events ?? []);
    const [loadingEvents, setLoadingEvents] = useState(false);

    useEffect(() => {
        if (form.data.mode !== 'existing' || !form.data.user_id) {
            return;
        }
        let cancelled = false;
        setLoadingEvents(true);
        fetch(`/admin/grants/users/${form.data.user_id}/events`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then((r) => r.json())
            .then((data: { events?: EventOption[] }) => {
                if (cancelled) {
                    return;
                }
                setEvents(data.events ?? []);
            })
            .catch(() => {
                if (!cancelled) {
                    setEvents([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingEvents(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [form.data.mode, form.data.user_id]);

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            user_id: data.user_id ? Number(data.user_id) : null,
            event_id: data.event_id ? Number(data.event_id) : null,
            credit_pack_sku: data.credit_pack_sku || null,
        }));
        form.post('/admin/grants');
    }

    return (
        <>
            <Head title="Pack grants" />
            <AdminPageHeader
                title="Pack grants"
                description="Assign a free or paid day pack (and optional message credits) to a user. Stored in billing as admin grants — does not touch Razorpay checkout."
                actions={
                    <Link
                        href="/admin/billing?provider=admin"
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800"
                    >
                        Admin payments
                    </Link>
                }
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <AdminCard title="Assign pack">
                    <form className="space-y-4 px-4 py-4" onSubmit={submit}>
                        <div className="flex flex-wrap gap-2">
                            {(['existing', 'new'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                                        form.data.mode === mode
                                            ? 'bg-zinc-950 text-white'
                                            : 'bg-zinc-100 text-zinc-700'
                                    }`}
                                    onClick={() => form.setData('mode', mode)}
                                >
                                    {mode === 'existing' ? 'Existing user' : 'Create account + email'}
                                </button>
                            ))}
                        </div>

                        {form.data.mode === 'existing' ? (
                            <label className={label}>
                                User
                                <select
                                    className={field}
                                    value={form.data.user_id}
                                    onChange={(e) => {
                                        form.setData('user_id', e.target.value);
                                        form.setData('event_id', '');
                                    }}
                                >
                                    <option value="">Select user…</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className={label}>
                                    Name
                                    <input
                                        className={field}
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                    />
                                </label>
                                <label className={label}>
                                    Email
                                    <input
                                        type="email"
                                        className={field}
                                        value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)}
                                        required
                                    />
                                </label>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className={label}>
                                Existing event (optional)
                                <select
                                    className={field}
                                    value={form.data.event_id}
                                    disabled={form.data.mode === 'new' || loadingEvents}
                                    onChange={(e) => form.setData('event_id', e.target.value)}
                                >
                                    <option value="">Create new event…</option>
                                    {events.map((ev) => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.title} · {ev.site_billing_status ?? 'draft'}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {!form.data.event_id ? (
                                <label className={label}>
                                    New event title
                                    <input
                                        className={field}
                                        value={form.data.event_title}
                                        onChange={(e) => form.setData('event_title', e.target.value)}
                                        placeholder="Priya & Arjun"
                                        required={!form.data.event_id}
                                    />
                                </label>
                            ) : (
                                <div />
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className={label}>
                                Day pack
                                <select
                                    className={field}
                                    value={form.data.site_pack_sku}
                                    onChange={(e) => form.setData('site_pack_sku', e.target.value)}
                                >
                                    {catalog.site_packs.map((pack) => (
                                        <option key={pack.id} value={pack.id}>
                                            {pack.name} · {pack.days}d · {pack.price_label_bare_inr ?? pack.price_label_inr}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className={label}>
                                Message pack (optional)
                                <select
                                    className={field}
                                    value={form.data.credit_pack_sku}
                                    onChange={(e) => form.setData('credit_pack_sku', e.target.value)}
                                >
                                    <option value="">None</option>
                                    {catalog.credit_packs.map((pack) => (
                                        <option key={pack.id} value={pack.id}>
                                            {pack.name} · {pack.price_label_inr}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <label className={label}>
                                Pricing
                                <select
                                    className={field}
                                    value={form.data.pricing}
                                    onChange={(e) => form.setData('pricing', e.target.value)}
                                >
                                    <option value="free">Free</option>
                                    <option value="complimentary">Complimentary</option>
                                    <option value="paid">Paid (record catalog price)</option>
                                </select>
                            </label>
                            <label className={label}>
                                Go-live
                                <select
                                    className={field}
                                    value={form.data.go_live_mode}
                                    onChange={(e) => form.setData('go_live_mode', e.target.value)}
                                >
                                    <option value="now">Activate now</option>
                                    <option value="schedule">Await schedule / publish</option>
                                </select>
                            </label>
                            <label className="flex items-end gap-2 pb-1 text-[12px] text-zinc-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.include_site_credits}
                                    onChange={(e) => form.setData('include_site_credits', e.target.checked)}
                                />
                                Include day-pack bundled credits
                            </label>
                        </div>

                        <label className={label}>
                            Internal note
                            <input
                                className={field}
                                value={form.data.note}
                                onChange={(e) => form.setData('note', e.target.value)}
                                maxLength={500}
                                placeholder="Offline UPI / partner giveaway / etc."
                            />
                        </label>

                        <label className="flex items-center gap-2 text-[12px] text-zinc-600">
                            <input
                                type="checkbox"
                                checked={form.data.send_email}
                                onChange={(e) => form.setData('send_email', e.target.checked)}
                            />
                            Email the user (new accounts also get a password-reset link)
                        </label>

                        {form.errors && Object.keys(form.errors).length > 0 ? (
                            <ul className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-900">
                                {Object.entries(form.errors).map(([key, message]) => (
                                    <li key={key}>
                                        {key}: {message}
                                    </li>
                                ))}
                            </ul>
                        ) : null}

                        <button type="submit" disabled={form.processing} className={btnDark}>
                            {form.processing ? 'Assigning…' : 'Assign pack'}
                        </button>
                    </form>
                </AdminCard>

                <AdminCard title="How it works">
                    <ul className="space-y-2 px-4 py-4 text-[13px] leading-relaxed text-zinc-600">
                        <li>
                            <strong className="text-zinc-900">Day pack</strong> unlocks the event site for N days —
                            same entitlements as a customer purchase.
                        </li>
                        <li>
                            <strong className="text-zinc-900">Message pack</strong> is optional and activates
                            immediately (no 24h wait — that delay is only for self-serve Razorpay purchases).
                        </li>
                        <li>
                            <strong className="text-zinc-900">Free / complimentary</strong> store ₹0.
                            <strong className="text-zinc-900"> Paid</strong> stores the catalog amount for offline
                            payment bookkeeping.
                        </li>
                        <li>
                            Regular checkout, Twilio sends, and other users are unchanged. Grants appear below and
                            under Billing (provider = admin).
                        </li>
                    </ul>
                </AdminCard>
            </div>

            <AdminCard title="Recent admin grants" className="mt-4">
                <AdminTable
                    headers={['When', 'User', 'SKU', 'Pricing', 'Amount', 'By', 'Detail']}
                    rows={grants.map((g) => [
                        shortDate(g.paid_at || g.created_at),
                        g.user_id ? (
                            <Link
                                key={`u-${g.id}`}
                                href={`/admin/users/${g.user_id}`}
                                className="hover:underline"
                            >
                                {g.user ?? `#${g.user_id}`}
                            </Link>
                        ) : (
                            (g.user ?? '—')
                        ),
                        <Link
                            key={`p-${g.id}`}
                            href={`/admin/payments/${g.id}`}
                            className="font-medium text-zinc-950 hover:underline"
                        >
                            {g.kind} · {g.sku}
                        </Link>,
                        g.pricing ?? '—',
                        rupees(g.amount_paise),
                        g.granted_by ?? '—',
                        g.note ||
                            (g.credits != null ? `${g.credits} credits` : g.event_id ? `event #${g.event_id}` : '—'),
                    ])}
                />
                {grants.length === 0 ? (
                    <p className="px-4 py-6 text-[13px] text-zinc-400">No admin grants yet.</p>
                ) : null}
            </AdminCard>
        </>
    );
}
