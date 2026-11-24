import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    Download,
    Eye,
    MapPin,
    Plus,
    Sparkles,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
    StudioCard,
    StudioEyebrow,
    StudioSurface,
    StudioTitle,
} from '@/components/studio/studio-surface';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const metricMeta = [
    { key: 'weddings', label: 'Events', hint: 'All invitations', tone: 'ink' },
    { key: 'published', label: 'Live', hint: 'Published sites', tone: 'emerald' },
    { key: 'drafts', label: 'Drafts', hint: 'Still polishing', tone: 'amber' },
    { key: 'guests', label: 'Guests', hint: 'Across events', tone: 'sky' },
    { key: 'views', label: 'Views', hint: 'Invitation opens', tone: 'teal' },
    { key: 'responses', label: 'RSVPs', hint: 'Guest replies', tone: 'violet' },
    { key: 'attending', label: 'Attending', hint: 'Confirmed seats', tone: 'rose' },
    { key: 'card_downloads', label: 'Downloads', hint: 'Card saves', tone: 'zinc' },
] as const;

const tones: Record<(typeof metricMeta)[number]['tone'], string> = {
    ink: 'from-zinc-950 to-zinc-700 text-white',
    emerald: 'from-emerald-600 to-teal-500 text-white',
    amber: 'from-amber-500 to-orange-400 text-white',
    sky: 'from-sky-500 to-blue-500 text-white',
    teal: 'from-teal-600 to-cyan-500 text-white',
    violet: 'from-violet-600 to-fuchsia-500 text-white',
    rose: 'from-rose-500 to-pink-500 text-white',
    zinc: 'from-zinc-600 to-zinc-500 text-white',
};

type Stats = {
    weddings: number;
    published: number;
    drafts: number;
    guests: number;
    responses: number;
    views: number;
    card_downloads: number;
    attending: number;
};

type Recent = {
    id: number;
    names: string;
    type?: string | null;
    date: string | null;
    city: string | null;
    status: string;
    guests: number;
    responses: number;
};

export default function Dashboard({
    stats,
    upcoming,
    recent,
}: {
    stats: Stats;
    upcoming: { id: number; names: string; date: string | null; city: string | null } | null;
    recent: Recent[];
}) {
    const replyRate =
        stats.guests > 0 ? Math.round((stats.responses / stats.guests) * 100) : 0;

    return (
        <>
            <Head title="Dashboard" />
            <StudioSurface>
                <header className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
                    <div className="flex flex-wrap items-end justify-between gap-5">
                        <div className="max-w-xl">
                            <StudioEyebrow>Studio overview</StudioEyebrow>
                            <StudioTitle>Your celebration desk</StudioTitle>
                            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
                                Track live invitations, guest momentum, and the next date on your calendar — then jump straight into creating.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" className="h-11 rounded-full border-zinc-200 bg-white/80 px-5 backdrop-blur">
                                <Link href="/events">
                                    Browse events
                                    <ArrowUpRight className="ml-1.5 size-3.5" />
                                </Link>
                            </Button>
                            <Button asChild className="h-11 rounded-full bg-zinc-950 px-5 text-white shadow-lg shadow-zinc-950/20 hover:bg-zinc-800">
                                <Link href="/events?create=1">
                                    <Plus className="mr-1.5 size-4" />
                                    Create Invitation
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {metricMeta.map((item, index) => (
                        <div
                            key={item.key}
                            className={cn(
                                'animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-2xl bg-gradient-to-br p-4 shadow-lg',
                                tones[item.tone],
                            )}
                            style={{ animationDelay: `${80 + index * 40}ms` }}
                        >
                            <p className="text-[10px] font-semibold tracking-[0.18em] text-white/70 uppercase">
                                {item.label}
                            </p>
                            <p className="mt-2 font-sans text-4xl font-semibold tabular-nums leading-none tracking-tight">
                                {stats[item.key]}
                            </p>
                            <p className="mt-2 text-xs text-white/70">{item.hint}</p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    {upcoming ? (
                        <Link
                            href={`/events/${upcoming.id}`}
                            className="group relative overflow-hidden rounded-3xl bg-zinc-950 p-7 text-white shadow-2xl shadow-zinc-950/25 transition hover:-translate-y-0.5"
                        >
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_240px_at_90%_0%,rgba(16,185,129,0.35),transparent_55%)]"
                            />
                            <div className="relative">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-emerald-300 uppercase ring-1 ring-emerald-400/25">
                                        <Sparkles className="size-3" />
                                        Next celebration
                                    </span>
                                </div>
                                <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3rem)] leading-[0.95] tracking-tight">
                                    {upcoming.names}
                                </h2>
                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-300">
                                    {upcoming.date ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <CalendarDays className="size-3.5 text-emerald-300" />
                                            {upcoming.date}
                                        </span>
                                    ) : null}
                                    {upcoming.city ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="size-3.5 text-emerald-300" />
                                            {upcoming.city}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-6 inline-flex items-center text-sm text-emerald-300 transition group-hover:gap-2">
                                    Open command center
                                    <ArrowUpRight className="ml-1 size-3.5" />
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <StudioCard className="flex flex-col justify-between border-dashed p-7">
                            <div>
                                <StudioEyebrow>Calendar</StudioEyebrow>
                                <h2 className="mt-2 font-serif text-3xl tracking-tight text-zinc-950 dark:text-white">
                                    No date on the calendar yet
                                </h2>
                                <p className="mt-2 max-w-sm text-sm text-zinc-500">
                                    Create your first invitation and the next celebration will light up here.
                                </p>
                            </div>
                            <Button asChild className="mt-6 w-fit rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800">
                                <Link href="/events?create=1">
                                    <Plus className="mr-1.5 size-4" />
                                    Create Invitation
                                </Link>
                            </Button>
                        </StudioCard>
                    )}

                    <StudioCard className="p-6">
                        <StudioEyebrow>Momentum</StudioEyebrow>
                        <h2 className="mt-2 font-serif text-2xl tracking-tight text-zinc-950 dark:text-white">
                            Guest pulse
                        </h2>
                        <div className="mt-6 space-y-4">
                            <PulseRow
                                icon={<Users className="size-3.5" />}
                                label="Reply rate"
                                value={`${replyRate}%`}
                                bar={replyRate}
                            />
                            <PulseRow
                                icon={<Eye className="size-3.5" />}
                                label="Invitation views"
                                value={String(stats.views)}
                                bar={Math.min(100, stats.views)}
                            />
                            <PulseRow
                                icon={<Download className="size-3.5" />}
                                label="Card downloads"
                                value={String(stats.card_downloads)}
                                bar={Math.min(100, stats.card_downloads * 8)}
                            />
                        </div>
                        <Link
                            href="/analytics"
                            className="mt-6 inline-flex items-center text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                            Open analytics
                            <ArrowUpRight className="ml-1 size-3.5" />
                        </Link>
                    </StudioCard>
                </section>

                <section>
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <StudioEyebrow>Recent</StudioEyebrow>
                            <h2 className="mt-1 font-serif text-3xl tracking-tight text-zinc-950 dark:text-white">
                                Active invitations
                            </h2>
                        </div>
                        <Link href="/events" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
                            View all
                        </Link>
                    </div>

                    {recent.length === 0 ? (
                        <StudioCard className="border-dashed p-8 text-center">
                            <p className="font-serif text-2xl text-zinc-950 dark:text-white">No events yet</p>
                            <p className="mt-2 text-sm text-zinc-500">
                                Create an invitation to begin designing cards and guest sites.
                            </p>
                            <Button asChild className="mt-5 rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800">
                                <Link href="/events?create=1">Create Invitation</Link>
                            </Button>
                        </StudioCard>
                    ) : (
                        <div className="grid gap-3">
                            {recent.map((wedding, index) => (
                                <Link
                                    key={wedding.id}
                                    href={`/events/${wedding.id}`}
                                    className="group flex flex-col gap-3 rounded-2xl border border-zinc-950/8 bg-white/75 px-4 py-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-zinc-950/15 hover:shadow-lg sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-5 dark:border-white/10 dark:bg-zinc-950/55"
                                    style={{ animationDelay: `${index * 40}ms` }}
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusPill status={wedding.status} />
                                            {wedding.type ? (
                                                <span className="rounded-full bg-zinc-950/5 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:bg-white/5">
                                                    {wedding.type}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-1.5 font-serif text-[1.35rem] tracking-tight text-zinc-950 transition group-hover:text-emerald-800 sm:text-2xl dark:text-white dark:group-hover:text-emerald-300">
                                            {wedding.names}
                                        </p>
                                        <p className="mt-1 text-sm text-zinc-500">
                                            {[wedding.date, wedding.city].filter(Boolean).join(' · ') || 'Details coming soon'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-5 text-sm sm:gap-6">
                                        <div className="text-left sm:text-right">
                                            <p className="font-semibold tabular-nums text-zinc-950 dark:text-white">{wedding.responses}</p>
                                            <p className="text-[11px] tracking-wide text-zinc-500 uppercase">Replies</p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="font-semibold tabular-nums text-zinc-950 dark:text-white">{wedding.guests}</p>
                                            <p className="text-[11px] tracking-wide text-zinc-500 uppercase">Guests</p>
                                        </div>
                                        <ArrowUpRight className="size-4 text-zinc-400 transition group-hover:text-zinc-950 dark:group-hover:text-white" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </StudioSurface>
        </>
    );
}

function StatusPill({ status }: { status: string }) {
    const live = status === 'published';
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase',
                live
                    ? 'bg-emerald-500/12 text-emerald-800 ring-1 ring-emerald-600/20 dark:text-emerald-300'
                    : 'bg-zinc-900/6 text-zinc-600 ring-1 ring-zinc-950/10 dark:bg-white/5 dark:text-zinc-300',
            )}
        >
            <span className={cn('size-1.5 rounded-full', live ? 'bg-emerald-500' : 'bg-zinc-400')} />
            {live ? 'Live' : status}
        </span>
    );
}

function PulseRow({
    icon,
    label,
    value,
    bar,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    bar: number;
}) {
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                    {icon}
                    {label}
                </span>
                <span className="font-medium tabular-nums text-zinc-950 dark:text-white">{value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-950/8 dark:bg-white/10">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${Math.max(4, Math.min(100, bar))}%` }}
                />
            </div>
        </div>
    );
}
