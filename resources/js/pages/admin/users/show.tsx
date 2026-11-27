import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Ban,
    CheckCircle2,
    KeyRound,
    ShieldAlert,
    Sparkles,
    Trash2,
    UserRoundCheck,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminCard, AdminPageHeader, AdminStat, AdminTable } from '@/components/admin/admin-ui';
import { rupees, shortDate } from '@/components/admin/pagination';
import { cn } from '@/lib/utils';

type UserDetail = {
    id: number;
    name: string;
    email: string;
    plan: string;
    raw_plan?: string;
    message_credits: number;
    plan_ends_at: string | null;
    email_verified_at: string | null;
    disabled_at: string | null;
    two_factor?: boolean;
    stripe_id?: string | null;
    created_at: string | null;
    weddings_count: number;
    is_platform_admin?: boolean;
    is_self?: boolean;
};

type LifecycleImpact = {
    events: number;
    published_events: number;
    guests: number;
    payments: number;
    coupons: number;
    collaborations: number;
    support_messages: number;
    social_accounts: number;
    favorites: number;
    is_platform_admin: boolean;
    can_deactivate: boolean;
    can_purge: boolean;
    block_reason: string | null;
};

type EventRow = {
    id: number;
    title: string;
    slug?: string;
    status: string;
    site_billing_status?: string | null;
    invitation_mode?: string | null;
    guests_count?: number;
    rsvps_count?: number;
    views?: number;
    unique_views?: number;
    qr_scans?: number;
    shares?: number;
    card_status?: string | null;
    starts_on?: string | null;
};

type PaymentRow = {
    id: number;
    sku: string;
    status: string;
    amount_paise: number;
    provider?: string;
    paid_at?: string | null;
};

type Props = {
    user: UserDetail;
    events: EventRow[];
    payments: PaymentRow[];
    lifecycle: LifecycleImpact;
};

const field =
    'mt-1.5 flex h-11 w-full items-center rounded-xl border border-zinc-200/90 bg-white px-3.5 text-[13.5px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10';
const btn =
    'inline-flex h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-[12.5px] font-semibold text-zinc-800 transition hover:bg-zinc-50';
const btnDark =
    'inline-flex h-10 items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 text-[12.5px] font-semibold text-white transition hover:bg-zinc-800';

type DangerMode = 'deactivate' | 'purge' | null;

export default function UserShow({ user, events, payments, lifecycle }: Props) {
    const form = useForm({
        plan: user.plan === 'pro' ? 'pro' : 'free',
        message_credits: user.message_credits,
        plan_ends_at: user.plan_ends_at ? user.plan_ends_at.slice(0, 10) : '',
    });

    const [dangerMode, setDangerMode] = useState<DangerMode>(null);
    const [confirmEmail, setConfirmEmail] = useState('');
    const [acknowledge, setAcknowledge] = useState(false);
    const [busy, setBusy] = useState(false);
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        const id = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        if (!dangerMode) {
            setConfirmEmail('');
            setAcknowledge(false);
        }
    }, [dangerMode]);

    const disabled = Boolean(user.disabled_at);
    const emailMatches = confirmEmail.trim().toLowerCase() === user.email.trim().toLowerCase();
    const canSubmitPurge = emailMatches && acknowledge && !busy && lifecycle.can_purge;
    const canSubmitDeactivate = acknowledge && !busy && lifecycle.can_deactivate;

    const impactRows = useMemo(
        () => [
            { label: 'Events / sites', value: lifecycle.events },
            { label: 'Live sites', value: lifecycle.published_events },
            { label: 'Guests', value: lifecycle.guests },
            { label: 'Payments', value: lifecycle.payments },
            { label: 'Coupons', value: lifecycle.coupons },
            { label: 'Collaborations', value: lifecycle.collaborations },
            { label: 'Support threads', value: lifecycle.support_messages },
            { label: 'Social logins', value: lifecycle.social_accounts },
        ],
        [lifecycle],
    );

    function runDeactivate() {
        if (!canSubmitDeactivate) {
            return;
        }
        setBusy(true);
        router.post(
            `/admin/users/${user.id}/disable`,
            {},
            {
                onFinish: () => {
                    setBusy(false);
                    setDangerMode(null);
                },
            },
        );
    }

    function runPurge(event: FormEvent) {
        event.preventDefault();
        if (!canSubmitPurge) {
            return;
        }
        setBusy(true);
        router.delete(`/admin/users/${user.id}`, {
            data: {
                confirmation: confirmEmail.trim(),
                acknowledge: true,
            },
            onFinish: () => setBusy(false),
        });
    }

    return (
        <>
            <Head title={user.name} />

            <div
                className={cn(
                    'transition duration-500 ease-out',
                    entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                )}
            >
                <AdminPageHeader
                    title={user.name}
                    description={user.email}
                    actions={
                        <>
                            <button
                                type="button"
                                className={btn}
                                onClick={() => router.post(`/admin/users/${user.id}/verify`)}
                            >
                                <CheckCircle2 className="size-3.5" />
                                Verify email
                            </button>
                            <button
                                type="button"
                                className={btn}
                                onClick={() => router.post(`/admin/users/${user.id}/send-reset`)}
                            >
                                <KeyRound className="size-3.5" />
                                Send reset
                            </button>
                            <Link href={`/admin/grants?user_id=${user.id}`} className={btn}>
                                <Sparkles className="size-3.5" />
                                Grant pack
                            </Link>
                            {disabled ? (
                                <button
                                    type="button"
                                    className={btnDark}
                                    onClick={() => router.post(`/admin/users/${user.id}/enable`)}
                                >
                                    <UserRoundCheck className="size-3.5" />
                                    Reactivate
                                </button>
                            ) : null}
                        </>
                    }
                />

                <div className="mb-5 overflow-hidden rounded-[1.5rem] border border-zinc-950/10 bg-zinc-950 text-zinc-50 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.55)]">
                    <div
                        aria-hidden
                        className={cn(
                            'h-1.5 bg-gradient-to-r',
                            disabled
                                ? 'from-rose-500 via-amber-500 to-zinc-500'
                                : 'from-emerald-400 via-teal-400 to-sky-500',
                        )}
                    />
                    <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={cn(
                                        'rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide',
                                        disabled
                                            ? 'bg-rose-500/20 text-rose-100'
                                            : 'bg-emerald-500/20 text-emerald-100',
                                    )}
                                >
                                    {disabled ? 'Deactivated' : 'Active'}
                                </span>
                                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-zinc-200">
                                    {user.plan}
                                </span>
                                {user.is_platform_admin ? (
                                    <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-violet-100">
                                        Platform admin
                                    </span>
                                ) : null}
                            </div>
                            <h2 className="mt-3 font-serif text-[clamp(1.6rem,4vw,2.35rem)] leading-none tracking-tight">
                                {user.name}
                            </h2>
                            <p className="mt-2 text-[13px] text-zinc-400">{user.email}</p>
                            <p className="mt-2 text-[12px] text-zinc-500">
                                Joined {shortDate(user.created_at)} · Verified{' '}
                                {shortDate(user.email_verified_at)} · 2FA{' '}
                                {user.two_factor ? 'on' : 'off'}
                                {user.stripe_id ? ` · Stripe ${user.stripe_id}` : ''}
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:min-w-[18rem]">
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                                <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                                    Credits
                                </p>
                                <p className="mt-1 font-serif text-xl tabular-nums">{user.message_credits}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                                <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                                    Events
                                </p>
                                <p className="mt-1 font-serif text-xl tabular-nums">{user.weddings_count}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                                <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                                    Live
                                </p>
                                <p className="mt-1 font-serif text-xl tabular-nums">
                                    {lifecycle.published_events}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-4">
                    <AdminStat label="Plan" value={user.plan} />
                    <AdminStat label="Credits" value={user.message_credits} />
                    <AdminStat label="Events" value={user.weddings_count} />
                    <AdminStat label="Joined" value={shortDate(user.created_at)} />
                </div>

                <AdminCard title="Billing" className="mb-4">
                    <form
                        className="flex flex-wrap items-end gap-3 px-4 py-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(`/admin/users/${user.id}`);
                        }}
                    >
                        <label className="text-[12px] text-zinc-500">
                            Plan
                            <select
                                value={form.data.plan}
                                onChange={(e) => form.setData('plan', e.target.value)}
                                className="mt-1 block h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px] text-zinc-900"
                            >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                            </select>
                        </label>
                        <label className="text-[12px] text-zinc-500">
                            Message credits
                            <input
                                type="number"
                                min={0}
                                value={form.data.message_credits}
                                onChange={(e) => form.setData('message_credits', Number(e.target.value))}
                                className="mt-1 block h-9 w-28 rounded-lg border border-zinc-200 px-2 text-[13px]"
                            />
                        </label>
                        <label className="text-[12px] text-zinc-500">
                            Plan ends
                            <input
                                type="date"
                                value={form.data.plan_ends_at}
                                onChange={(e) => form.setData('plan_ends_at', e.target.value)}
                                className="mt-1 block h-9 rounded-lg border border-zinc-200 px-2 text-[13px]"
                            />
                        </label>
                        <button type="submit" disabled={form.processing} className={btnDark}>
                            Save
                        </button>
                    </form>
                </AdminCard>

                <div className="mb-4 grid gap-3 xl:grid-cols-2">
                    <AdminCard title="Sites & cards">
                        <AdminTable
                            headers={['Event', 'Status', 'Billing', 'Views', 'Unique', 'RSVPs', 'Card']}
                            rows={events.map((event) => [
                                <Link
                                    key={event.id}
                                    href={`/admin/events/${event.id}`}
                                    className="font-medium text-zinc-950 hover:underline"
                                >
                                    <span className="block">{event.title}</span>
                                    <span className="font-normal text-zinc-400">
                                        {event.invitation_mode ?? '—'}
                                    </span>
                                </Link>,
                                event.status,
                                event.site_billing_status ?? '—',
                                event.views ?? 0,
                                event.unique_views ?? 0,
                                `${event.rsvps_count ?? 0}/${event.guests_count ?? 0}`,
                                event.card_status ?? '—',
                            ])}
                        />
                    </AdminCard>
                    <AdminCard title="Payments">
                        <AdminTable
                            headers={['SKU', 'Status', 'Amount']}
                            rows={payments.map((payment) => [
                                <Link
                                    key={payment.id}
                                    href={`/admin/payments/${payment.id}`}
                                    className="font-medium text-zinc-950 hover:underline"
                                >
                                    {payment.sku}
                                </Link>,
                                payment.status,
                                rupees(payment.amount_paise),
                            ])}
                        />
                    </AdminCard>
                </div>

                {/* Danger zone */}
                <section className="overflow-hidden rounded-[1.5rem] border border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-zinc-50 shadow-[0_16px_48px_-36px_rgba(127,29,29,0.35)]">
                    <div className="flex flex-col gap-3 border-b border-rose-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="size-4 text-rose-700" />
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-rose-700/80 uppercase">
                                    Account lifecycle
                                </p>
                            </div>
                            <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-zinc-950">
                                Deactivate or permanently delete
                            </h2>
                            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-zinc-600">
                                Deactivate blocks login and unpublishes live sites (data kept). Delete
                                removes the account and all owned product data — irreversible.
                            </p>
                        </div>
                        {lifecycle.block_reason ? (
                            <p className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-950">
                                {lifecycle.block_reason}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
                        {impactRows.map((row) => (
                            <div
                                key={row.label}
                                className="rounded-2xl border border-zinc-200/80 bg-white/80 px-3.5 py-3"
                            >
                                <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                    {row.label}
                                </p>
                                <p className="mt-1 font-serif text-2xl tabular-nums text-zinc-950">
                                    {row.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-rose-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p className="text-[12px] text-zinc-500">
                            Prefer deactivate for abuse / chargebacks. Use delete only for GDPR erasure
                            or abandoned spam accounts.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {!disabled ? (
                                <button
                                    type="button"
                                    disabled={!lifecycle.can_deactivate}
                                    onClick={() => setDangerMode('deactivate')}
                                    className={cn(
                                        'inline-flex h-11 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-[13px] font-semibold text-amber-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50',
                                    )}
                                >
                                    <Ban className="size-4" />
                                    Deactivate account
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={btnDark}
                                    onClick={() => router.post(`/admin/users/${user.id}/enable`)}
                                >
                                    <UserRoundCheck className="size-3.5" />
                                    Reactivate account
                                </button>
                            )}
                            <button
                                type="button"
                                disabled={!lifecycle.can_purge}
                                onClick={() => setDangerMode('purge')}
                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-[13px] font-semibold text-white shadow-md shadow-rose-700/20 transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 className="size-4" />
                                Delete forever
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {dangerMode ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="user-danger-title"
                    onClick={() => !busy && setDangerMode(null)}
                >
                    <div
                        className="w-full max-w-lg overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={cn(
                                'border-b px-5 py-4',
                                dangerMode === 'purge'
                                    ? 'border-rose-100 bg-rose-50/80'
                                    : 'border-amber-100 bg-amber-50/80',
                            )}
                        >
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                                {dangerMode === 'purge' ? 'Permanent deletion' : 'Deactivate account'}
                            </p>
                            <h3
                                id="user-danger-title"
                                className="mt-1 font-serif text-xl tracking-tight text-zinc-950"
                            >
                                {dangerMode === 'purge'
                                    ? `Delete ${user.name}?`
                                    : `Deactivate ${user.name}?`}
                            </h3>
                            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
                                {dangerMode === 'purge'
                                    ? 'This erases the account, events, guests, media, payments history ownership, coupons, and sessions. Billing processor records outside this app are not refunded automatically.'
                                    : 'Login is blocked immediately. Live invitation sites are unpublished. Data stays recoverable via Reactivate.'}
                            </p>
                        </div>

                        <form
                            className="space-y-4 px-5 py-5"
                            onSubmit={
                                dangerMode === 'purge'
                                    ? runPurge
                                    : (e) => {
                                          e.preventDefault();
                                          runDeactivate();
                                      }
                            }
                        >
                            {dangerMode === 'purge' ? (
                                <label className="block text-[12px] font-medium text-zinc-600">
                                    Type <span className="font-semibold text-zinc-950">{user.email}</span>{' '}
                                    to confirm
                                    <input
                                        autoFocus
                                        value={confirmEmail}
                                        onChange={(e) => setConfirmEmail(e.target.value)}
                                        className={field}
                                        placeholder={user.email}
                                        autoComplete="off"
                                    />
                                </label>
                            ) : null}

                            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-3">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 size-4 rounded border-zinc-300"
                                    checked={acknowledge}
                                    onChange={(e) => setAcknowledge(e.target.checked)}
                                />
                                <span className="text-[13px] leading-relaxed text-zinc-700">
                                    {dangerMode === 'purge'
                                        ? `I understand this permanently deletes ${lifecycle.events} event(s), ${lifecycle.guests} guest(s), and related product data.`
                                        : `I understand login will be blocked and ${lifecycle.published_events} live site(s) will be unpublished.`}
                                </span>
                            </label>

                            <div className="flex flex-wrap justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setDangerMode(null)}
                                    className={btn}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        dangerMode === 'purge' ? !canSubmitPurge : !canSubmitDeactivate
                                    }
                                    className={cn(
                                        'inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-[12.5px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45',
                                        dangerMode === 'purge'
                                            ? 'bg-rose-700 hover:bg-rose-800'
                                            : 'bg-amber-700 hover:bg-amber-800',
                                    )}
                                >
                                    {busy
                                        ? 'Working…'
                                        : dangerMode === 'purge'
                                          ? 'Delete forever'
                                          : 'Deactivate now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}
