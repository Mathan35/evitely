import { Head, Link, router } from '@inertiajs/react';
import { AdminBarChart, AdminCard, AdminLineChart, AdminPageHeader, AdminStat, AdminTable } from '@/components/admin/admin-ui';
import { rupees } from '@/components/admin/pagination';

type Point = Record<string, string | number>;

type Analytics = {
    range: { from: string; to: string; days?: number };
    kpis: Record<string, number>;
    series: {
        growth: Point[];
        traffic: Point[];
        revenue: Point[];
        shares: Point[];
    };
    funnel: Record<string, number>;
    sku_mix: Array<{ sku: string; count: number; revenue_paise: number }>;
    billing_health: Array<{ status: string; count: number }>;
    delivery_health: { sends: number; failures: number };
    top_events: Array<{ id: number; title: string; views: number; rsvps: number; revenue_paise: number }>;
    revenue_by_provider: Array<{ provider: string; revenue_paise: number; count: number }>;
};

function line(rows: Point[], key: string) {
    return rows.map((row) => ({ date: String(row.date), value: Number(row[key] ?? 0) }));
}

export default function AnalyticsIndex({
    analytics,
    filters,
}: {
    analytics: Analytics;
    filters?: { preset?: string; from?: string; to?: string };
}) {
    const preset = filters?.preset ?? '30d';
    const kpis = analytics.kpis ?? {};

    function apply(next: { preset?: string; from?: string; to?: string }) {
        router.get('/admin/analytics', { preset: next.preset ?? preset, from: next.from ?? '', to: next.to ?? '' }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Analytics" />
            <AdminPageHeader
                title="Analytics"
                description={`${analytics.range.from} → ${analytics.range.to}`}
                actions={
                    <a
                        href={`/admin/analytics/export?preset=${encodeURIComponent(preset)}`}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800"
                    >
                        Export CSV
                    </a>
                }
            />
            <form
                className="mb-3 flex flex-wrap items-end gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    apply({ preset: String(data.get('preset')), from: String(data.get('from') ?? ''), to: String(data.get('to') ?? '') });
                }}
            >
                <select name="preset" defaultValue={preset} className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px]" onChange={(e) => apply({ preset: e.target.value })}>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="90d">90 days</option>
                </select>
                <input name="from" type="date" defaultValue={filters?.from ?? analytics.range.from} className="h-9 rounded-lg border border-zinc-200 px-2 text-[13px]" />
                <input name="to" type="date" defaultValue={filters?.to ?? analytics.range.to} className="h-9 rounded-lg border border-zinc-200 px-2 text-[13px]" />
                <button type="submit" className="h-9 rounded-lg bg-zinc-950 px-3 text-[13px] font-medium text-white">
                    Apply
                </button>
            </form>

            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AdminStat label="New users" value={kpis.new_users ?? 0} />
                <AdminStat label="Published" value={kpis.events_published ?? 0} />
                <AdminStat label="Views" value={kpis.views ?? 0} />
                <AdminStat label="Revenue" value={rupees(kpis.revenue_paise)} />
                <AdminStat label="RSVPs" value={kpis.rsvps ?? 0} />
                <AdminStat label="Shares" value={kpis.shares ?? 0} />
                <AdminStat label="QR scans" value={kpis.qr_scans ?? 0} />
                <AdminStat label="Failed payments" value={kpis.failed_payments ?? 0} />
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
                <AdminCard title="Growth">
                    <AdminLineChart
                        series={[
                            { key: 'signups', label: 'Signups', color: '#18181b', points: line(analytics.series.growth, 'signups') },
                            { key: 'events', label: 'Created', color: '#71717a', points: line(analytics.series.growth, 'events_created') },
                            { key: 'published', label: 'Published', color: '#a1a1aa', points: line(analytics.series.growth, 'events_published') },
                        ]}
                    />
                </AdminCard>
                <AdminCard title="Traffic">
                    <AdminLineChart
                        series={[
                            { key: 'views', label: 'Views', color: '#18181b', points: line(analytics.series.traffic, 'views') },
                            { key: 'unique', label: 'Unique', color: '#52525b', points: line(analytics.series.traffic, 'unique_views') },
                            { key: 'guest', label: 'Guest', color: '#a1a1aa', points: line(analytics.series.traffic, 'guest_views') },
                        ]}
                    />
                </AdminCard>
                <AdminCard title="Revenue">
                    <AdminLineChart
                        series={[
                            {
                                key: 'rev',
                                label: '₹',
                                color: '#18181b',
                                points: (analytics.series.revenue ?? []).map((row) => ({
                                    date: String(row.date),
                                    value: Number(row.revenue_paise ?? row.amount_paise ?? 0) / 100,
                                })),
                            },
                        ]}
                    />
                </AdminCard>
                <AdminCard title="Shares">
                    <AdminLineChart
                        series={[
                            { key: 'shares', label: 'Shares', color: '#18181b', points: line(analytics.series.shares ?? [], 'shares') },
                            { key: 'qr', label: 'QR', color: '#71717a', points: line(analytics.series.shares ?? [], 'qr_scans') },
                        ]}
                    />
                </AdminCard>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <AdminCard title="Funnel">
                    <AdminBarChart
                        items={Object.entries(analytics.funnel ?? {}).map(([label, count]) => ({ label, count }))}
                    />
                </AdminCard>
                <AdminCard title="Billing health">
                    <AdminBarChart
                        labelKey="status"
                        items={(analytics.billing_health ?? []).map((row) => ({ status: row.status, count: row.count }))}
                    />
                </AdminCard>
                <AdminCard title="Delivery">
                    <div className="grid grid-cols-2 gap-3 p-4">
                        <AdminStat label="Sends" value={analytics.delivery_health?.sends ?? 0} />
                        <AdminStat label="Failures" value={analytics.delivery_health?.failures ?? 0} />
                    </div>
                </AdminCard>
                <AdminCard title="Providers">
                    <AdminTable
                        headers={['Provider', 'Count', 'Revenue']}
                        rows={(analytics.revenue_by_provider ?? []).map((row) => [row.provider, row.count, rupees(row.revenue_paise)])}
                    />
                </AdminCard>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <AdminCard title="SKU mix">
                    <AdminTable
                        headers={['SKU', 'Count', 'Revenue']}
                        rows={(analytics.sku_mix ?? []).map((row) => [row.sku, row.count, rupees(row.revenue_paise)])}
                    />
                </AdminCard>
                <AdminCard title="Top events">
                    <AdminTable
                        headers={['Event', 'Views', 'RSVPs', 'Revenue']}
                        rows={(analytics.top_events ?? []).map((event) => [
                            <Link key={event.id} href={`/admin/events/${event.id}`} className="font-medium hover:underline">
                                {event.title}
                            </Link>,
                            event.views,
                            event.rsvps,
                            rupees(event.revenue_paise),
                        ])}
                    />
                </AdminCard>
            </div>
        </>
    );
}
