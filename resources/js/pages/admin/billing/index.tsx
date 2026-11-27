import { Head, Link, router } from '@inertiajs/react';
import { FormEvent } from 'react';
import { AdminCard, AdminPageHeader, AdminStat, AdminTable } from '@/components/admin/admin-ui';
import { AdminPagination, type Paginator, rupees, shortDate } from '@/components/admin/pagination';

type PaymentRow = {
    id: number;
    user?: string | null;
    event_id?: number | null;
    provider?: string;
    kind?: string;
    sku: string;
    status: string;
    amount_paise: number;
    currency?: string;
    paid_at?: string | null;
    created_at?: string | null;
    fail_reason?: string | null;
    credits_pending?: boolean;
    credits?: number | null;
    activate_after?: string | null;
};

type Pack = { id: string; name: string; days?: number | null; price_label_inr?: string | null; included_credits?: number; credits?: number };

type Stats = {
    paid: number;
    failed: number;
    cancelled: number;
    pending: number;
    credits_pending: number;
    tries: number;
    revenue_paise: number;
};

function statusClass(status: string, creditsPending?: boolean): string {
    if (creditsPending) {
        return 'bg-sky-50 text-sky-900';
    }
    switch (status) {
        case 'paid':
            return 'bg-emerald-50 text-emerald-800';
        case 'failed':
            return 'bg-rose-50 text-rose-800';
        case 'cancelled':
        case 'expired':
            return 'bg-zinc-100 text-zinc-600';
        case 'created':
            return 'bg-amber-50 text-amber-800';
        default:
            return 'bg-zinc-100 text-zinc-700';
    }
}

function statusLabel(status: string, creditsPending?: boolean): string {
    if (creditsPending) {
        return 'credits pending';
    }
    if (status === 'created') {
        return 'pending';
    }
    return status;
}

export default function BillingIndex({
    payments,
    filters,
    catalog,
    stats,
}: {
    payments: Paginator<PaymentRow>;
    filters: { q: string; status: string; provider: string };
    catalog: { site_packs: Pack[]; credit_packs: Pack[] };
    stats: Stats;
}) {
    function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(
            '/admin/billing',
            {
                q: String(data.get('q') ?? ''),
                status: String(data.get('status') ?? ''),
                provider: String(data.get('provider') ?? ''),
            },
            { preserveState: true, replace: true },
        );
    }

    function filterStatus(status: string) {
        router.get(
            '/admin/billing',
            { q: filters.q, status, provider: filters.provider },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Billing" />
            <AdminPageHeader
                title="Billing"
                description="Payment tries — successes, failures, abandoned checkouts, and message-pack activations."
                actions={
                    <a
                        href={`/admin/exports/payments?status=${encodeURIComponent(filters.status === 'pending' ? 'created' : filters.status === 'credits_pending' ? 'paid' : filters.status)}`}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800"
                    >
                        Export CSV
                    </a>
                }
            />

            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <button type="button" className="text-left" onClick={() => filterStatus('')}>
                    <AdminStat label="All tries" value={stats.tries} />
                </button>
                <button type="button" className="text-left" onClick={() => filterStatus('paid')}>
                    <AdminStat label="Successful" value={stats.paid} />
                </button>
                <button type="button" className="text-left" onClick={() => filterStatus('credits_pending')}>
                    <AdminStat label="Message packs pending" value={stats.credits_pending} />
                </button>
                <button type="button" className="text-left" onClick={() => filterStatus('failed')}>
                    <AdminStat label="Failed" value={stats.failed} />
                </button>
                <button type="button" className="text-left" onClick={() => filterStatus('cancelled')}>
                    <AdminStat label="Cancelled / expired" value={stats.cancelled} />
                </button>
                <button type="button" className="text-left" onClick={() => filterStatus('pending')}>
                    <AdminStat label="Checkout pending" value={stats.pending} />
                </button>
            </div>

            {stats.credits_pending > 0 ? (
                <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] text-sky-950">
                    <p className="font-semibold">
                        {stats.credits_pending} paid message pack{stats.credits_pending === 1 ? '' : 's'} awaiting
                        credit activation
                    </p>
                    <p className="mt-1 text-sky-900/80">
                        Credits auto-activate within 24 hours via the site lifecycle scheduler. Open a payment to
                        activate early.
                    </p>
                    <button
                        type="button"
                        className="mt-2 text-[12px] font-semibold text-sky-800 underline"
                        onClick={() => filterStatus('credits_pending')}
                    >
                        Show pending message packs
                    </button>
                </div>
            ) : null}

            <p className="mb-3 text-[12px] text-zinc-500">
                Paid revenue (filtered list is separate) · {rupees(stats.revenue_paise, 'INR')} across all successful
                payments
            </p>

            <form onSubmit={search} className="mb-3 flex flex-wrap gap-2">
                <input
                    name="q"
                    defaultValue={filters.q}
                    placeholder="SKU, order, email"
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px]"
                />
                <select
                    name="status"
                    defaultValue={filters.status}
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px]"
                >
                    <option value="">Any status</option>
                    <option value="paid">Paid</option>
                    <option value="credits_pending">Message packs pending</option>
                    <option value="pending">Checkout pending</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                    <option value="created">Created (raw)</option>
                </select>
                <select
                    name="provider"
                    defaultValue={filters.provider}
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px]"
                >
                    <option value="">Any provider</option>
                    <option value="razorpay">Razorpay</option>
                    <option value="stripe">Stripe</option>
                    <option value="admin">Admin grant</option>
                </select>
                <button type="submit" className="h-9 rounded-lg bg-zinc-950 px-3 text-[13px] font-medium text-white">
                    Filter
                </button>
            </form>

            <AdminCard className="mb-4">
                <AdminTable
                    headers={['Payment', 'User', 'Provider', 'Status', 'Amount', 'When', 'Detail']}
                    rows={payments.data.map((payment) => [
                        <Link
                            key={payment.id}
                            href={`/admin/payments/${payment.id}`}
                            className="font-medium text-zinc-950 hover:underline"
                        >
                            {payment.sku}
                        </Link>,
                        payment.user ?? '—',
                        payment.provider ?? '—',
                        <span
                            key={`st-${payment.id}`}
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusClass(payment.status, payment.credits_pending)}`}
                        >
                            {statusLabel(payment.status, payment.credits_pending)}
                        </span>,
                        rupees(payment.amount_paise, payment.currency),
                        shortDate(payment.paid_at || payment.created_at),
                        payment.credits_pending ? (
                            <span
                                key={`cp-${payment.id}`}
                                className="max-w-[14rem] text-[12px] text-sky-800"
                                title={payment.activate_after ?? undefined}
                            >
                                {payment.credits ?? '?'} credits · auto by{' '}
                                {payment.activate_after ? shortDate(payment.activate_after) : '24h'}
                            </span>
                        ) : payment.fail_reason ? (
                            <span
                                key={`fr-${payment.id}`}
                                className="max-w-[14rem] truncate text-[12px] text-zinc-500"
                                title={payment.fail_reason}
                            >
                                {payment.fail_reason}
                            </span>
                        ) : (
                            '—'
                        ),
                    ])}
                />
                <AdminPagination paginator={payments} />
            </AdminCard>

            <div className="grid gap-3 lg:grid-cols-2">
                <AdminCard title="Site packs">
                    <AdminTable
                        headers={['Pack', 'Days', 'Price', 'Credits']}
                        rows={catalog.site_packs.map((pack) => [
                            pack.name,
                            pack.days ?? '—',
                            pack.price_label_inr ?? '—',
                            pack.included_credits ?? 0,
                        ])}
                    />
                </AdminCard>
                <AdminCard title="Credit packs">
                    <AdminTable
                        headers={['Pack', 'Credits', 'Price']}
                        rows={catalog.credit_packs.map((pack) => [
                            pack.name,
                            pack.credits ?? 0,
                            pack.price_label_inr ?? '—',
                        ])}
                    />
                </AdminCard>
            </div>
        </>
    );
}
