import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    Download,
    Eye,
    QrCode,
    Share2,
    Sparkles,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
import { StudioFilterSelect } from '@/components/studio/studio-filter-select';
import {
    StudioCard,
    StudioEyebrow,
    StudioSurface,
    StudioTitle,
} from '@/components/studio/studio-surface';
import { cn } from '@/lib/utils';

type Stats = {
    views: number;
    unique_views: number;
    guest_views: number;
    shares: number;
    qr_scans: number;
    rsvps: number;
    card_downloads: number;
    card_shares: number;
    cards_generated: number;
    conversion: number;
    share_rate: number;
};

type Funnel = {
    views: number;
    unique: number;
    rsvps: number;
    shares: number;
    view_to_rsvp: number;
    view_to_share: number;
};

type SeriesPoint = {
    date: string;
    label: string;
    views: number;
    rsvps: number;
    shares: number;
    downloads: number;
};

type EventRow = {
    id: number;
    title: string;
    status: string;
    views: number;
    rsvps: number;
    shares: number;
    downloads: number;
    conversion?: number;
    share_rate?: number;
};

type EventOption = { id: number; title: string; status?: string };

type ChannelRow = { channel: string; total: number; pct?: number };

const heroMetrics = [
    { key: 'views', label: 'Link views', icon: Eye, tone: 'from-teal-600 to-cyan-500' },
    { key: 'unique_views', label: 'Unique visitors', icon: Users, tone: 'from-sky-500 to-blue-500' },
    { key: 'rsvps', label: 'RSVP responses', icon: Sparkles, tone: 'from-violet-600 to-fuchsia-500' },
    { key: 'shares', label: 'Shares', icon: Share2, tone: 'from-emerald-600 to-teal-500' },
    { key: 'qr_scans', label: 'QR scans', icon: QrCode, tone: 'from-amber-500 to-orange-400' },
    { key: 'card_downloads', label: 'Card downloads', icon: Download, tone: 'from-zinc-700 to-zinc-500' },
] as const;

const RANGES = [7, 14, 30] as const;

function analyticsHref(eventId: number | null, range: number): string {
    const params = new URLSearchParams();
    if (eventId) {
        params.set('event', String(eventId));
    }
    if (range !== 14) {
        params.set('range', String(range));
    }
    const query = params.toString();
    return query ? `/analytics?${query}` : '/analytics';
}

export default function Analytics({
    stats,
    funnel,
    series = [],
    by_event: byEvent = [],
    channels = [],
    events = [],
    selected_event: selectedEvent = null,
    range = 14,
    range_label: rangeLabel = 'Last 14 days',
}: {
    stats: Stats;
    funnel?: Funnel;
    series?: SeriesPoint[];
    by_event?: EventRow[];
    channels?: ChannelRow[];
    events?: EventOption[];
    selected_event?: number | null;
    range?: number;
    range_label?: string;
}) {
    const maxViews = Math.max(1, ...series.map((point) => point.views));
    const maxEventViews = Math.max(1, ...byEvent.map((row) => row.views));
    const channelMax = Math.max(1, ...channels.map((row) => row.total));
    const funnelViews = Math.max(1, funnel?.views ?? stats.views + stats.guest_views);

    const totals = useMemo(
        () => ({
            views: series.reduce((sum, point) => sum + point.views, 0),
            rsvps: series.reduce((sum, point) => sum + point.rsvps, 0),
            shares: series.reduce((sum, point) => sum + point.shares, 0),
        }),
        [series],
    );

    const selectedTitle =
        selectedEvent != null
            ? events.find((event) => event.id === selectedEvent)?.title
            : null;

    function visit(nextEvent: number | null, nextRange: number): void {
        router.get(analyticsHref(nextEvent, nextRange), {}, { preserveState: true, preserveScroll: true });
    }

    return (
        <>
            <Head title="Analytics" />
            <StudioSurface className="overflow-x-clip">
                <header className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-5">
                        <div className="min-w-0 max-w-xl">
                            <StudioEyebrow>Insights</StudioEyebrow>
                            <StudioTitle>Analytics</StudioTitle>
                            <p className="mt-3 text-sm leading-relaxed text-zinc-500 break-words">
                                {selectedTitle
                                    ? `Reach for ${selectedTitle} — ${rangeLabel.toLowerCase()} pulse of views, RSVPs, and shares.`
                                    : `Audience reach across every invitation, plus a ${rangeLabel.toLowerCase()} pulse of views, RSVPs, and shares.`}
                            </p>
                        </div>
                        <div className="w-full shrink-0 rounded-2xl border border-zinc-950/8 bg-white/70 px-4 py-3 text-sm backdrop-blur sm:w-auto dark:border-white/10 dark:bg-zinc-950/55">
                            <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                                Conversion
                            </p>
                            <p className="mt-1 font-serif text-3xl tabular-nums text-zinc-950 dark:text-white">
                                {stats.conversion}%
                            </p>
                            <p className="text-xs text-zinc-500">
                                RSVP / views · share rate {stats.share_rate}%
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-end">
                        <StudioFilterSelect
                            label="Event"
                            value={selectedEvent != null ? String(selectedEvent) : 'all'}
                            onValueChange={(value) =>
                                visit(value === 'all' ? null : Number(value), range)
                            }
                            options={[
                                {
                                    value: 'all',
                                    label: 'All invitations',
                                    hint: 'Combined funnel across events',
                                },
                                ...events.map((event) => ({
                                    value: String(event.id),
                                    label: event.title,
                                    hint: event.status === 'published' ? 'Live' : event.status,
                                    badge: event.status === 'published' ? 'Live' : undefined,
                                })),
                            ]}
                            wide
                            className="w-full sm:max-w-md"
                        />

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="flex w-full items-center gap-1 rounded-xl bg-zinc-100/80 p-1 ring-1 ring-zinc-950/5 sm:w-auto dark:bg-zinc-900/60 dark:ring-white/10">
                                {RANGES.map((days) => (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => visit(selectedEvent ?? null, days)}
                                        className={cn(
                                            'h-9 flex-1 rounded-lg px-3 text-[12px] font-semibold transition sm:h-8 sm:flex-none',
                                            range === days
                                                ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white'
                                                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
                                        )}
                                    >
                                        {days}d
                                    </button>
                                ))}
                            </div>
                            {selectedEvent ? (
                                <Link
                                    href={analyticsHref(null, range)}
                                    className="text-[12px] font-semibold text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
                                >
                                    Clear filter
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
                    {heroMetrics.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.key}
                                className={cn(
                                    'rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg sm:p-4',
                                    item.tone,
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-[9px] font-semibold tracking-[0.14em] text-white/75 uppercase sm:text-[10px] sm:tracking-[0.16em]">
                                        {item.label}
                                    </p>
                                    <Icon className="size-3.5 shrink-0 text-white/80 sm:size-4" />
                                </div>
                                <p className="mt-2 font-serif text-[1.75rem] tabular-nums leading-none tracking-tight sm:mt-3 sm:text-4xl">
                                    {stats[item.key]}
                                </p>
                            </div>
                        );
                    })}
                </section>

                <section className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
                    <StudioCard className="min-w-0 p-4 sm:p-5 md:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                            <div className="min-w-0">
                                <StudioEyebrow>{rangeLabel}</StudioEyebrow>
                                <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                                    Activity trend
                                </h2>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
                                <Legend color="#0d9488" label="Views" value={totals.views} />
                                <Legend color="#7c3aed" label="RSVPs" value={totals.rsvps} />
                                <Legend color="#059669" label="Shares" value={totals.shares} />
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-6">
                            <TrendChart series={series} />
                        </div>
                    </StudioCard>

                    <StudioCard className="min-w-0 p-4 sm:p-5 md:p-6">
                        <StudioEyebrow>Funnel</StudioEyebrow>
                        <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                            Guest journey
                        </h2>
                        <div className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
                            <FunnelRow
                                label="Views"
                                value={funnel?.views ?? stats.views + stats.guest_views}
                                max={funnelViews}
                                tone="bg-teal-500"
                            />
                            <FunnelRow
                                label="Unique"
                                value={funnel?.unique ?? stats.unique_views}
                                max={funnelViews}
                                tone="bg-sky-500"
                            />
                            <FunnelRow
                                label="RSVPs"
                                value={funnel?.rsvps ?? stats.rsvps}
                                max={funnelViews}
                                tone="bg-violet-500"
                                rate={funnel?.view_to_rsvp ?? stats.conversion}
                            />
                            <FunnelRow
                                label="Shares"
                                value={funnel?.shares ?? stats.shares}
                                max={funnelViews}
                                tone="bg-emerald-500"
                                rate={funnel?.view_to_share ?? stats.share_rate}
                            />
                            <FunnelRow
                                label="Card saves"
                                value={stats.card_downloads}
                                max={funnelViews}
                                tone="bg-zinc-500"
                            />
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm sm:mt-6 sm:gap-3">
                            <MiniStat label="Cards generated" value={stats.cards_generated} />
                            <MiniStat label="Card shares" value={stats.card_shares} />
                        </div>
                    </StudioCard>
                </section>

                <section className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <StudioCard className="min-w-0 overflow-hidden">
                        <div className="border-b border-zinc-950/8 px-4 py-4 sm:px-5 dark:border-white/10">
                            <StudioEyebrow>By invitation</StudioEyebrow>
                            <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                                Top events
                            </h2>
                        </div>
                        {byEvent.length === 0 ? (
                            <div className="px-4 py-10 text-center text-sm text-zinc-500 sm:px-5">
                                Publish an invitation to start collecting event-level analytics.
                            </div>
                        ) : (
                            <ul className="divide-y divide-zinc-950/6 dark:divide-white/8">
                                {byEvent.map((event) => (
                                    <li key={event.id} className="px-4 py-4 sm:px-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <Link
                                                        href={`/events/${event.id}`}
                                                        className="inline-flex max-w-full items-center gap-1 font-medium text-zinc-950 hover:underline dark:text-white"
                                                    >
                                                        <span className="truncate">{event.title}</span>
                                                        <ArrowUpRight className="size-3.5 shrink-0 text-zinc-400" />
                                                    </Link>
                                                    <Link
                                                        href={analyticsHref(event.id, range)}
                                                        className="shrink-0 text-[11px] font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
                                                    >
                                                        Filter
                                                    </Link>
                                                </div>
                                                <p className="mt-1 text-[11px] leading-relaxed tracking-wide text-zinc-500 uppercase sm:text-xs">
                                                    <span className="capitalize">{event.status}</span>
                                                    {' · '}
                                                    {event.views} views · {event.rsvps} RSVPs
                                                    {event.conversion != null
                                                        ? ` · ${event.conversion}% convert`
                                                        : ''}
                                                </p>
                                            </div>
                                            <p className="shrink-0 font-serif text-xl tabular-nums text-zinc-950 sm:text-2xl dark:text-white">
                                                {event.views}
                                            </p>
                                        </div>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-950/8 dark:bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                                                style={{
                                                    width: `${Math.max(4, (event.views / maxEventViews) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </StudioCard>

                    <StudioCard className="min-w-0 p-4 sm:p-5 md:p-6">
                        <StudioEyebrow>Channels</StudioEyebrow>
                        <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                            Share sources
                        </h2>
                        {channels.length === 0 ? (
                            <p className="mt-6 text-sm leading-relaxed text-zinc-500 sm:mt-8">
                                Channel attribution appears when guests share via WhatsApp, copy link, email, and more.
                            </p>
                        ) : (
                            <div className="mt-5 space-y-3 sm:mt-6">
                                {channels.map((row) => (
                                    <div key={row.channel} className="min-w-0">
                                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                            <span className="min-w-0 truncate capitalize text-zinc-700 dark:text-zinc-200">
                                                {row.channel.replaceAll('_', ' ')}
                                            </span>
                                            <span className="shrink-0 tabular-nums text-zinc-950 dark:text-white">
                                                {row.total}
                                                {row.pct != null ? (
                                                    <span className="ml-1.5 text-xs text-zinc-400">
                                                        {row.pct}%
                                                    </span>
                                                ) : null}
                                            </span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-950/8 dark:bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                                                style={{
                                                    width: `${Math.max(6, (row.total / channelMax) * 100)}%`,
                                                }}
                                            />
                                        </div>
                        </div>
                    ))}
                </div>
                        )}

                        <div className="mt-6 rounded-2xl bg-zinc-950 p-4 text-white sm:mt-8">
                            <p className="text-[10px] font-semibold tracking-[0.16em] text-white/60 uppercase">
                                Peak day
                            </p>
                            <PeakDay series={series} maxViews={maxViews} />
                        </div>
                    </StudioCard>
                </section>
            </StudioSurface>
        </>
    );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-zinc-500">
            <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
            {label}
            <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">{value}</span>
        </span>
    );
}

function MiniStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl bg-zinc-950/[0.03] px-2.5 py-2.5 ring-1 ring-zinc-950/5 sm:px-3 sm:py-3 dark:bg-white/5 dark:ring-white/10">
            <p className="text-[9px] font-semibold tracking-[0.12em] text-zinc-500 uppercase sm:text-[10px] sm:tracking-[0.14em]">
                {label}
            </p>
            <p className="mt-1 font-serif text-xl tabular-nums text-zinc-950 sm:text-2xl dark:text-white">
                {value}
            </p>
        </div>
    );
}

function FunnelRow({
    label,
    value,
    max,
    tone,
    rate,
}: {
    label: string;
    value: number;
    max: number;
    tone: string;
    rate?: number;
}) {
    return (
        <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-zinc-600 dark:text-zinc-300">{label}</span>
                <span className="shrink-0 font-medium tabular-nums text-zinc-950 dark:text-white">
                    {value}
                    {rate != null ? (
                        <span className="ml-1.5 text-xs font-normal text-zinc-400">{rate}%</span>
                    ) : null}
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-950/8 dark:bg-white/10">
                <div
                    className={cn('h-full rounded-full', tone)}
                    style={{ width: `${Math.max(3, (value / max) * 100)}%` }}
                />
            </div>
        </div>
    );
}

function PeakDay({ series, maxViews }: { series: SeriesPoint[]; maxViews: number }) {
    const peak = series.reduce<SeriesPoint | null>(
        (best, point) => (!best || point.views > best.views ? point : best),
        null,
    );

    if (!peak || peak.views === 0) {
        return <p className="mt-2 text-sm text-white/60">Not enough traffic yet in this window.</p>;
    }

    return (
        <>
            <p className="mt-1 font-serif text-2xl tracking-tight sm:text-3xl">{peak.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-white/70">
                {peak.views} views · {peak.rsvps} RSVPs · {Math.round((peak.views / maxViews) * 100)}% of
                peak
            </p>
        </>
    );
}

function TrendChart({ series }: { series: SeriesPoint[] }) {
    const width = 640;
    const height = 220;
    const padX = 12;
    const padY = 16;
    const max = Math.max(1, ...series.flatMap((point) => [point.views, point.rsvps, point.shares]));

    function pathFor(key: 'views' | 'rsvps' | 'shares'): string {
        if (series.length === 0) {
            return '';
        }
        return series
            .map((point, index) => {
                const x = padX + (index / Math.max(1, series.length - 1)) * (width - padX * 2);
                const y = height - padY - (point[key] / max) * (height - padY * 2);
                return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
    }

    if (series.length === 0) {
        return <p className="py-12 text-center text-sm text-zinc-500 sm:py-16">No recent activity yet.</p>;
    }

    return (
        <div className="min-w-0">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-44 w-full max-w-full sm:h-52 md:h-56"
                role="img"
                aria-label="Activity trend chart"
                preserveAspectRatio="xMidYMid meet"
            >
                {[0.25, 0.5, 0.75, 1].map((step) => {
                    const y = height - padY - step * (height - padY * 2);
                    return (
                        <line
                            key={step}
                            x1={padX}
                            x2={width - padX}
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            className="text-zinc-950/8 dark:text-white/10"
                            strokeDasharray="4 6"
                        />
                    );
                })}
                <path
                    d={pathFor('views')}
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={pathFor('shares')}
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                />
                <path
                    d={pathFor('rsvps')}
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                />
                {series.map((point, index) => {
                    const x = padX + (index / Math.max(1, series.length - 1)) * (width - padX * 2);
                    const y = height - padY - (point.views / max) * (height - padY * 2);
                    return (
                        <circle
                            key={point.date}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="#0d9488"
                            className="opacity-90"
                        />
                    );
                })}
            </svg>
            <div className="mt-2 flex justify-between gap-2 px-0.5 text-[10px] tracking-wide text-zinc-400 uppercase">
                <span className="truncate">{series[0]?.label}</span>
                <span className="hidden truncate sm:inline">
                    {series[Math.floor(series.length / 2)]?.label}
                </span>
                <span className="truncate text-right">{series[series.length - 1]?.label}</span>
            </div>
        </div>
    );
}
