import { Head, Link, router } from '@inertiajs/react';
import { FormEvent } from 'react';
import {
    AdminBarChart,
    AdminCard,
    AdminFilters,
    AdminLineChart,
    AdminPageHeader,
    AdminStat,
    AdminTable,
} from '@/components/admin/admin-ui';
import { rupees, shortDate } from '@/components/admin/pagination';

type Check = { id: string; label: string; done: boolean; hint: string; group?: string };
type Point = Record<string, string | number>;

type Filters = {
    preset: string;
    from?: string | null;
    to?: string | null;
    invitation_mode?: string;
    billing?: string;
    plan?: string;
};

type Props = {
    platform: {
        checklist?: Check[];
        jobs?: { pending?: number; failed?: number };
        pending_jobs?: number;
        failed_jobs?: number;
        queue?: string;
        mailer?: string;
    };
    analytics: {
        range: { from: string; to: string; days?: number };
        kpis: Record<string, number>;
        totals?: Record<string, number>;
        series: {
            growth: Point[];
            traffic: Point[];
            revenue: Point[];
            shares?: Point[];
        };
        funnel?: Record<string, number>;
        sku_mix?: Array<{ sku: string; count: number; revenue_paise: number }>;
        billing_health?: Array<{ status: string; count: number }>;
        delivery_health?: { sends: number; failures: number };
        top_events?: Array<{ id: number; title: string; views: number; rsvps: number; revenue_paise: number }>;
        revenue_by_provider?: Array<{ provider: string; revenue_paise: number; count: number }>;
        plan_mix?: Array<{ label: string; count: number }>;
        mode_mix?: Array<{ label: string; count: number }>;
    };
    filters: Filters;
    webhook_urls: { razorpay: string; stripe: string; stripe_enabled?: boolean };
    commands: { queue: string; schedule: string; status: string };
    recent: {
        users: Array<{ id: number; name: string; email: string; plan?: string; message_credits?: number; created_at?: string | null }>;
        events: Array<{
            id: number;
            title: string;
            status?: string;
            site_billing_status?: string | null;
            invitation_mode?: string | null;
            owner?: string | null;
            guests_count?: number;
            rsvps_count?: number;
            views?: number;
            unique_views?: number;
            card_status?: string | null;
            created_at?: string | null;
        }>;
        payments: Array<{
            id: number;
            sku?: string;
            status?: string;
            provider?: string;
            amount_label?: string;
            amount_paise?: number;
            owner?: string | null;
            paid_at?: string | null;
        }>;
    };
};

function line(rows: Point[], key: string) {
    return rows.map((row) => ({ date: String(row.date), value: Number(row[key] ?? 0) }));
}

export default function Dashboard({ platform, analytics, filters, webhook_urls, commands, recent }: Props) {
    const kpis = analytics.kpis ?? {};
    const totals = analytics.totals ?? {};
    const pending = platform.jobs?.pending ?? platform.pending_jobs;
    const failed = platform.jobs?.failed ?? platform.failed_jobs;
    const preset = filters.preset || '7d';

    function apply(next: Partial<Filters>) {
        router.get(
            '/admin',
            {
                preset: next.preset ?? preset,
                from: next.from ?? filters.from ?? '',
                to: next.to ?? filters.to ?? '',
                invitation_mode: next.invitation_mode ?? filters.invitation_mode ?? '',
                billing: next.billing ?? filters.billing ?? '',
                plan: next.plan ?? filters.plan ?? '',
            },
            { preserveState: true, replace: true },
        );
    }

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        apply({
            preset: String(data.get('preset') ?? '7d'),
            from: String(data.get('from') ?? ''),
            to: String(data.get('to') ?? ''),
            invitation_mode: String(data.get('invitation_mode') ?? ''),
            billing: String(data.get('billing') ?? ''),
            plan: String(data.get('plan') ?? ''),
        });
    }

    return (
        <>
            <Head title="Admin dashboard" />
            <AdminPageHeader
                title="Dashboard"
                description={`${analytics.range.from} → ${analytics.range.to} · ${analytics.range.days ?? ''} days`}
                actions={
                    <Link href="/admin/analytics" className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800">
                        Full analytics
                    </Link>
                }
            />

            <form onSubmit={onSubmit}>
                <AdminFilters className="sm:gap-2">
                    <label className="block text-[11px] text-zinc-500 sm:min-w-[8rem]">
                        Range
                        <select
                            name="preset"
                            defaultValue={preset}
                            className="mt-1 block h-10 w-full rounded-lg border border-zinc-200 bg-white px-2 text-[13px] sm:h-9"
                            onChange={(e) => apply({ preset: e.target.value, from: '', to: '' })}
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>
                    </label>
                    <label className="block text-[11px] text-zinc-500 sm:min-w-[9rem]">
                        From
                        <input
                            name="from"
                            type="date"
                            defaultValue={filters.from ?? analytics.range.from}
                            className="mt-1 block h-10 w-full rounded-lg border border-zinc-200 px-2 text-[13px] sm:h-9"
                        />
                    </label>
                    <label className="block text-[11px] text-zinc-500 sm:min-w-[9rem]">
                        To
                        <input
                            name="to"
                            type="date"
                            defaultValue={filters.to ?? analytics.range.to}
                            className="mt-1 block h-10 w-full rounded-lg border border-zinc-200 px-2 text-[13px] sm:h-9"
                        />
                    </label>
                    <label className="block text-[11px] text-zinc-500 sm:min-w-[8rem]">
                        Mode
                        <select
                            name="invitation_mode"
                            defaultValue={filters.invitation_mode ?? ''}
                            className="mt-1 block h-10 w-full rounded-lg border border-zinc-200 bg-white px-2 text-[13px] sm:h-9"
                        >
                            <option value="">All modes</option>
                            <option value="site">Site</option>
                            <option value="card">Card</option>
                            <option value="both">Both</option>
                            <option value="link">Link</option>
                        </select>
                    </label>
                    <label className="block text-[11px] text-zinc-500 sm:min-w-[8rem]">
                        Billing
                        <select
                            name="billing"
                            defaultValue={filters.billing ?? ''}
                            className="mt-1 block h-10 w-full rounded-lg border border-zinc-200 bg-white px-2 text-[13px] sm:h-9"
                        >
                            <option value="">All billing</option>
                            <option value="draft_ready">Draft ready</option>
                            <option value="trial">Trial</option>
                            <option value="active">Active</option>
                            <option value="paid">Paid</option>
                            <option value="expired">Expired</option>
                        </select>
                    </label>
                    <label className="block text-[11px] text-zinc-500 sm:min-w-[7rem]">
                        Plan
                        <select
                            name="plan"
                            defaultValue={filters.plan ?? ''}
                            className="mt-1 block h-10 w-full rounded-lg border border-zinc-200 bg-white px-2 text-[13px] sm:h-9"
                        >
                            <option value="">All plans</option>
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                        </select>
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
                        <button
                            type="submit"
                            className="h-10 rounded-lg bg-zinc-950 px-3 text-[13px] font-medium text-white sm:h-9"
                        >
                            Apply filters
                        </button>
                        <button
                            type="button"
                            className="h-10 rounded-lg border border-zinc-200 px-3 text-[13px] font-medium text-zinc-700 sm:h-9"
                            onClick={() =>
                                apply({
                                    preset: '7d',
                                    from: '',
                                    to: '',
                                    invitation_mode: '',
                                    billing: '',
                                    plan: '',
                                })
                            }
                        >
                            Reset
                        </button>
                    </div>
                </AdminFilters>
            </form>

            <div className="mb-3 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                <AdminStat label="Users (all)" value={totals.users ?? 0} />
                <AdminStat label="Events (all)" value={totals.events ?? 0} />
                <AdminStat label="Published (all)" value={totals.published_events ?? 0} />
                <AdminStat label="Cards (all)" value={totals.cards ?? 0} />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                <AdminStat label="New users" value={kpis.new_users ?? 0} />
                <AdminStat label="Events created" value={kpis.events_created ?? 0} />
                <AdminStat label="Published" value={kpis.events_published ?? 0} />
                <AdminStat label="Revenue" value={rupees(kpis.revenue_paise)} />
                <AdminStat label="Views" value={kpis.views ?? 0} />
                <AdminStat label="Unique" value={kpis.unique_views ?? 0} />
                <AdminStat label="RSVPs" value={kpis.rsvps ?? 0} />
                <AdminStat label="QR / shares" value={`${kpis.qr_scans ?? 0} / ${kpis.shares ?? 0}`} />
                <AdminStat label="Card downloads" value={kpis.card_downloads ?? 0} />
                <AdminStat label="Failed payments" value={kpis.failed_payments ?? 0} />
                <AdminStat label="Jobs pending" value={pending ?? 0} />
                <AdminStat label="Jobs failed" value={failed ?? 0} />
                <AdminStat label="Guestbook pending" value={kpis.pending_guestbook ?? 0} />
                <AdminStat label="Photos pending" value={kpis.pending_guest_photos ?? 0} />
                <AdminStat label="Delivery sends" value={analytics.delivery_health?.sends ?? 0} />
                <AdminStat label="Delivery failures" value={analytics.delivery_health?.failures ?? 0} />
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <AdminCard title="Growth">
                    <AdminLineChart
                        series={[
                            { key: 'signups', label: 'Signups', color: '#18181b', points: line(analytics.series?.growth ?? [], 'signups') },
                            { key: 'events', label: 'Events', color: '#71717a', points: line(analytics.series?.growth ?? [], 'events_created') },
                            { key: 'published', label: 'Published', color: '#a1a1aa', points: line(analytics.series?.growth ?? [], 'events_published') },
                        ]}
                    />
                </AdminCard>
                <AdminCard title="Traffic">
                    <AdminLineChart
                        series={[
                            { key: 'views', label: 'Views', color: '#18181b', points: line(analytics.series?.traffic ?? [], 'views') },
                            { key: 'unique', label: 'Unique', color: '#52525b', points: line(analytics.series?.traffic ?? [], 'unique_views') },
                            { key: 'guest', label: 'Guest', color: '#a1a1aa', points: line(analytics.series?.traffic ?? [], 'guest_views') },
                        ]}
                    />
                </AdminCard>
                <AdminCard title="Revenue">
                    <AdminLineChart
                        series={[
                            {
                                key: 'revenue',
                                label: '₹',
                                color: '#18181b',
                                points: (analytics.series?.revenue ?? []).map((p) => ({
                                    date: String(p.date),
                                    value: Number(p.revenue_paise ?? p.amount_paise ?? 0) / 100,
                                })),
                            },
                        ]}
                    />
                </AdminCard>
                <AdminCard title="Shares & QR">
                    <AdminLineChart
                        series={[
                            { key: 'shares', label: 'Shares', color: '#18181b', points: line(analytics.series?.shares ?? [], 'shares') },
                            { key: 'qr', label: 'QR', color: '#71717a', points: line(analytics.series?.shares ?? [], 'qr_scans') },
                        ]}
                    />
                </AdminCard>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                <AdminCard title="Engagement funnel">
                    <AdminBarChart items={Object.entries(analytics.funnel ?? {}).map(([label, count]) => ({ label, count }))} />
                </AdminCard>
                <AdminCard title="Billing health">
                    <AdminBarChart
                        items={(analytics.billing_health ?? []).map((row) => ({ label: row.status, count: row.count }))}
                    />
                </AdminCard>
                <AdminCard title="Plan mix">
                    <AdminBarChart items={(analytics.plan_mix ?? []).map((row) => ({ label: row.label, count: row.count }))} />
                </AdminCard>
                <AdminCard title="Invitation modes">
                    <AdminBarChart items={(analytics.mode_mix ?? []).map((row) => ({ label: row.label, count: row.count }))} />
                </AdminCard>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <AdminCard title="Top events in range">
                    <AdminTable
                        headers={['Event', 'Views', 'RSVPs', 'Revenue']}
                        rows={(analytics.top_events ?? []).map((event) => [
                            <Link key={event.id} href={`/admin/events/${event.id}`} className="font-medium text-zinc-950 hover:underline">
                                {event.title}
                            </Link>,
                            event.views,
                            event.rsvps,
                            rupees(event.revenue_paise),
                        ])}
                    />
                </AdminCard>
                <AdminCard title="SKU mix / providers">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <AdminBarChart
                            items={(analytics.sku_mix ?? []).map((row) => ({ label: row.sku, count: row.count }))}
                        />
                        <AdminBarChart
                            items={(analytics.revenue_by_provider ?? []).map((row) => ({
                                label: row.provider,
                                count: Math.round(row.revenue_paise / 100),
                            }))}
                        />
                    </div>
                </AdminCard>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <AdminCard title="Readiness">
                    <ul className="max-h-72 divide-y divide-zinc-100 overflow-auto">
                        {(platform.checklist ?? []).map((item) => (
                            <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                                <div>
                                    <p className="text-[13px] text-zinc-800">{item.label}</p>
                                    <p className="text-[11px] text-zinc-400">{item.hint}</p>
                                </div>
                                <span className={item.done ? 'text-[11px] font-medium text-emerald-700' : 'text-[11px] font-medium text-amber-700'}>
                                    {item.done ? 'Ready' : 'Open'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </AdminCard>
                <AdminCard title="Webhooks">
                    <div className="space-y-2 px-4 py-3 text-[12px] break-all text-zinc-600">
                        <p>Razorpay · {webhook_urls.razorpay}</p>
                        {webhook_urls.stripe_enabled ? (
                            <p>Stripe · {webhook_urls.stripe}</p>
                        ) : (
                            <p className="text-zinc-400">Stripe · disabled (BILLING_STRIPE_ENABLED=false)</p>
                        )}
                        <p className="text-zinc-400">Mailer {platform.mailer ?? '—'} · Queue {platform.queue ?? '—'}</p>
                    </div>
                </AdminCard>
                <AdminCard title="Commands">
                    <ul className="space-y-1 px-4 py-3 font-mono text-[12px] text-zinc-700">
                        <li>{commands.queue}</li>
                        <li>{commands.schedule}</li>
                        <li>{commands.status}</li>
                    </ul>
                </AdminCard>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
                <AdminCard title="Users in range">
                    <AdminTable
                        headers={['Name', 'Plan', 'Credits']}
                        rows={(recent.users ?? []).map((user) => [
                            <Link key={user.id} href={`/admin/users/${user.id}`} className="font-medium text-zinc-950 hover:underline">
                                {user.name}
                            </Link>,
                            user.plan ?? '—',
                            user.message_credits ?? 0,
                        ])}
                    />
                </AdminCard>
                <AdminCard title="Events in range">
                    <AdminTable
                        headers={['Event', 'Views', 'RSVPs', 'Card']}
                        rows={(recent.events ?? []).map((event) => [
                            <Link key={event.id} href={`/admin/events/${event.id}`} className="font-medium text-zinc-950 hover:underline">
                                <span className="block">{event.title}</span>
                                <span className="font-normal text-zinc-400">
                                    {event.status} · {event.site_billing_status ?? '—'}
                                </span>
                            </Link>,
                            event.views ?? 0,
                            `${event.rsvps_count ?? 0}/${event.guests_count ?? 0}`,
                            event.card_status ?? '—',
                        ])}
                    />
                </AdminCard>
                <AdminCard title="Payments in range">
                    <AdminTable
                        headers={['SKU', 'Status', 'Amount']}
                        rows={(recent.payments ?? []).map((payment) => [
                            <Link key={payment.id} href={`/admin/payments/${payment.id}`} className="font-medium text-zinc-950 hover:underline">
                                {payment.sku ?? `#${payment.id}`}
                            </Link>,
                            payment.status ?? '—',
                            payment.amount_label ?? rupees(payment.amount_paise),
                        ])}
                    />
                </AdminCard>
            </div>
        </>
    );
}
