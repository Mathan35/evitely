import { Head, Link, router, useForm } from '@inertiajs/react';
import { AdminCard, AdminPageHeader, AdminStat, AdminTable } from '@/components/admin/admin-ui';
import { rupees, shortDate } from '@/components/admin/pagination';

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
type PaymentRow = { id: number; sku: string; status: string; amount_paise: number; provider?: string; paid_at?: string | null };

const btn = 'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800 hover:bg-zinc-50';
const btnDark = 'rounded-lg bg-zinc-950 px-3 py-1.5 text-[12px] font-medium text-white';

export default function UserShow({ user, events, payments }: { user: UserDetail; events: EventRow[]; payments: PaymentRow[] }) {
    const form = useForm({
        plan: user.plan === 'pro' ? 'pro' : 'free',
        message_credits: user.message_credits,
        plan_ends_at: user.plan_ends_at ? user.plan_ends_at.slice(0, 10) : '',
    });

    return (
        <>
            <Head title={user.name} />
            <AdminPageHeader
                title={user.name}
                description={user.email}
                actions={
                    <>
                        <button type="button" className={btn} onClick={() => router.post(`/admin/users/${user.id}/verify`)}>
                            Verify email
                        </button>
                        <button type="button" className={btn} onClick={() => router.post(`/admin/users/${user.id}/send-reset`)}>
                            Send reset
                        </button>
                        <Link href={`/admin/grants?user_id=${user.id}`} className={btn}>
                            Grant pack
                        </Link>
                        {user.disabled_at ? (
                            <button type="button" className={btnDark} onClick={() => router.post(`/admin/users/${user.id}/enable`)}>
                                Enable
                            </button>
                        ) : (
                            <button
                                type="button"
                                className={btn}
                                onClick={() => {
                                    if (confirm('Disable this account?')) {
                                        router.post(`/admin/users/${user.id}/disable`);
                                    }
                                }}
                            >
                                Disable
                            </button>
                        )}
                    </>
                }
            />

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
                <p className="px-4 pb-3 text-[12px] text-zinc-400">
                    Verified {shortDate(user.email_verified_at)} · 2FA {user.two_factor ? 'on' : 'off'}
                    {user.stripe_id ? ` · Stripe ${user.stripe_id}` : ''}
                </p>
            </AdminCard>

            <div className="grid gap-3 xl:grid-cols-2">
                <AdminCard title="Sites & cards">
                    <AdminTable
                        headers={['Event', 'Status', 'Billing', 'Views', 'Unique', 'RSVPs', 'Card']}
                        rows={events.map((event) => [
                            <Link key={event.id} href={`/admin/events/${event.id}`} className="font-medium text-zinc-950 hover:underline">
                                <span className="block">{event.title}</span>
                                <span className="font-normal text-zinc-400">{event.invitation_mode ?? '—'}</span>
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
                            <Link key={payment.id} href={`/admin/payments/${payment.id}`} className="font-medium text-zinc-950 hover:underline">
                                {payment.sku}
                            </Link>,
                            payment.status,
                            rupees(payment.amount_paise),
                        ])}
                    />
                </AdminCard>
            </div>
        </>
    );
}
