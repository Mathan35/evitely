import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    LayoutGrid,
    List,
    MapPin,
    Plus,
    Search,
    Sparkles,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StudioFilterSelect } from '@/components/studio/studio-filter-select';
import {
    StudioCard,
    StudioEyebrow,
    StudioSurface,
    StudioTitle,
} from '@/components/studio/studio-surface';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { TrialEventLimitDialog } from '@/components/studio/trial-event-limit-dialog';
import {
    OPEN_CREATE_INVITATION_EVENT,
    registerCreateInvitationOpener,
} from '@/lib/open-create-invitation';
import { cn } from '@/lib/utils';
import type { WeddingSummary } from '@/types/wedding';

type ModeFilter = 'all' | 'card' | 'link';
type StatusFilter = 'all' | 'published' | 'draft';
type LayoutView = 'grid' | 'list';

type EventTypeOption = {
    name: string;
    slug: string;
    category: string;
    profile: string;
    icon?: string;
    available?: boolean;
    designs_href?: string | null;
    designs_label?: string | null;
};

const categoryLabels: Record<string, string> = {
    wedding: 'Wedding',
    family: 'Family & milestones',
    religious: 'Religious',
    cultural: 'Cultural',
    professional: 'Corporate',
    education: 'Education',
    social: 'Party & social',
    other: 'Other',
};

function matchesMode(wedding: WeddingSummary, mode: ModeFilter): boolean {
    const invitation = wedding.invitation_mode ?? 'both';
    if (mode === 'all') {
        return true;
    }
    if (mode === 'card') {
        return invitation === 'card' || invitation === 'both';
    }
    return invitation === 'link' || invitation === 'both';
}

function modeLabel(mode?: string): string {
    if (mode === 'card') {
        return 'Card';
    }
    if (mode === 'link') {
        return 'Site';
    }
    return 'Card + Site';
}

function formatDate(value: string | null): string | null {
    if (!value) {
        return null;
    }
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    // Fixed locale — `undefined` mismatches Node SSR vs browser (en-GB "12 Sept"
    // vs en-US "Sep 12"), which breaks hydration and kills the view toggle.
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export default function WeddingIndex({
    weddings,
    eventTypes = [],
}: {
    weddings: WeddingSummary[];
    eventTypes?: EventTypeOption[];
}) {
    const page = usePage<{
        billing?: {
            is_pro?: boolean;
            upgrade_url?: string;
            can_create_event?: boolean;
            event_limit?: number | null;
        } | null;
        flash?: { trial_event_limit?: boolean };
    }>();
    const canCreateEvent = page.props.billing?.can_create_event !== false;
    const freeEventLimit = page.props.billing?.event_limit ?? 1;
    const upgradeUrl = page.props.billing?.upgrade_url || '/settings/billing';
    const existingEventHref = weddings[0] ? `/events/${weddings[0].id}/edit` : '/events';
    const [mode, setMode] = useState<ModeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [layout, setLayout] = useState<LayoutView>('grid');
    const [createOpen, setCreateOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search).get('create') === '1' && canCreateEvent;
        }
        return page.url.includes('create=1') && canCreateEvent;
    });
    const [limitOpen, setLimitOpen] = useState(() => {
        const wantsCreate =
            typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search).get('create') === '1'
                : page.url.includes('create=1');
        return Boolean(page.props.flash?.trial_event_limit) || (wantsCreate && !canCreateEvent);
    });
    const [createQuery, setCreateQuery] = useState('');
    const [panelReady, setPanelReady] = useState(true);
    const [panelKey, setPanelKey] = useState('all-grid');

    const customType = useMemo(
        () => eventTypes.find((type) => type.slug === 'custom' && type.available && type.designs_href),
        [eventTypes],
    );

    const filtered = useMemo(
        () =>
            weddings.filter((wedding) => {
                if (!matchesMode(wedding, mode)) {
                    return false;
                }
                if (statusFilter === 'published') {
                    return wedding.status === 'published';
                }
                if (statusFilter === 'draft') {
                    return wedding.status !== 'published';
                }
                return true;
            }),
        [mode, statusFilter, weddings],
    );

    const statusCounts = useMemo(
        () => ({
            all: weddings.filter((w) => matchesMode(w, mode)).length,
            published: weddings.filter((w) => matchesMode(w, mode) && w.status === 'published').length,
            draft: weddings.filter((w) => matchesMode(w, mode) && w.status !== 'published').length,
        }),
        [mode, weddings],
    );

    const counts = useMemo(
        () => ({
            all: weddings.length,
            card: weddings.filter((w) => matchesMode(w, 'card')).length,
            link: weddings.filter((w) => matchesMode(w, 'link')).length,
        }),
        [weddings],
    );

    const groupedTypes = useMemo(() => {
        const needle = createQuery.trim().toLowerCase();
        const visible = eventTypes.filter((type) => {
            // Only show event types with live site/card galleries — hide Coming soon.
            if (!type.available || !type.designs_href) {
                return false;
            }
            if (!needle) {
                return true;
            }
            const categoryLabel = (categoryLabels[type.category] ?? type.category).toLowerCase();
            const haystack = [
                type.name,
                type.slug,
                type.category,
                categoryLabel,
                type.profile ?? '',
                type.designs_label ?? '',
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(needle);
        });

        const order = Object.keys(categoryLabels);
        const groups = new Map<string, EventTypeOption[]>();

        for (const type of visible) {
            const key = categoryLabels[type.category] ? type.category : 'other';
            const list = groups.get(key) ?? [];
            list.push(type);
            groups.set(key, list);
        }

        return order
            .filter((key) => groups.has(key))
            .map((key) => ({
                id: key,
                label: categoryLabels[key] ?? key,
                types: groups.get(key) ?? [],
            }));
    }, [createQuery, eventTypes]);

    useEffect(() => {
        if (!createOpen) {
            setCreateQuery('');
        }
    }, [createOpen]);

    function clearCreateQueryParam(): void {
        if (typeof window === 'undefined') {
            return;
        }
        const url = new URL(window.location.href);
        if (!url.searchParams.has('create')) {
            return;
        }
        url.searchParams.delete('create');
        const next = url.searchParams.toString();
        window.history.replaceState(
            window.history.state,
            '',
            next ? `${url.pathname}?${next}` : url.pathname,
        );
    }

    function requestCreate(): void {
        if (!canCreateEvent) {
            setLimitOpen(true);
            return;
        }
        setCreateOpen(true);
    }

    function setCreateDialog(open: boolean): void {
        if (open && !canCreateEvent) {
            setLimitOpen(true);
            return;
        }
        setCreateOpen(open);
        if (!open) {
            clearCreateQueryParam();
        }
    }

    useEffect(() => {
        const onOpen = () => {
            if (!canCreateEvent) {
                setLimitOpen(true);
                return;
            }
            setCreateOpen(true);
        };
        registerCreateInvitationOpener(onOpen);
        window.addEventListener(OPEN_CREATE_INVITATION_EVENT, onOpen);
        return () => {
            registerCreateInvitationOpener(null);
            window.removeEventListener(OPEN_CREATE_INVITATION_EVENT, onOpen);
        };
    }, [canCreateEvent]);

    function transitionTo(nextMode: ModeFilter, nextLayout: LayoutView): void {
        if (nextMode === mode && nextLayout === layout) {
            return;
        }

        // Layout-only: switch immediately so the View toggle feels responsive.
        if (nextMode === mode) {
            setLayout(nextLayout);
            setPanelKey(`${nextMode}-${nextLayout}`);
            setPanelReady(true);
            return;
        }

        setPanelReady(false);
        window.setTimeout(() => {
            setMode(nextMode);
            setLayout(nextLayout);
            setPanelKey(`${nextMode}-${nextLayout}`);
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => setPanelReady(true));
            });
        }, 160);
    }

    return (
        <>
            <Head title="My Events" />
            <StudioSurface>
                <header className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
                    <div className="flex flex-wrap items-end justify-between gap-5">
                        <div className="max-w-xl">
                            <StudioEyebrow>Library</StudioEyebrow>
                            <StudioTitle>My Events</StudioTitle>
                            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                                Every invitation card and guest site in one place. Switch views, open the studio, or start a new celebration.
                            </p>
                        </div>
                        <Button
                            type="button"
                            className="h-11 rounded-full bg-zinc-950 px-5 text-white shadow-lg shadow-zinc-950/20 hover:bg-zinc-800"
                            onClick={requestCreate}
                        >
                            <Plus className="mr-1.5 size-4" />
                            Create Invitation
                        </Button>
                    </div>
                </header>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end">
                        <StudioFilterSelect
                            label="Format"
                            value={mode}
                            onValueChange={(value) => transitionTo(value as ModeFilter, layout)}
                            options={[
                                {
                                    value: 'all',
                                    label: 'All formats',
                                    hint: 'Cards and guest sites',
                                    badge: String(counts.all),
                                },
                                {
                                    value: 'card',
                                    label: 'Invitation cards',
                                    hint: 'Printable / shareable cards',
                                    badge: String(counts.card),
                                },
                                {
                                    value: 'link',
                                    label: 'Guest sites',
                                    hint: 'Interactive invitation pages',
                                    badge: String(counts.link),
                                },
                            ]}
                            className="w-full sm:w-auto"
                            triggerClassName="rounded-full"
                        />
                        <StudioFilterSelect
                            label="Status"
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                            options={[
                                {
                                    value: 'all',
                                    label: 'Any status',
                                    badge: String(statusCounts.all),
                                },
                                {
                                    value: 'published',
                                    label: 'Live',
                                    hint: 'Published invitations',
                                    badge: String(statusCounts.published),
                                },
                                {
                                    value: 'draft',
                                    label: 'Drafts',
                                    hint: 'Not published yet',
                                    badge: String(statusCounts.draft),
                                },
                            ]}
                            className="w-full sm:w-auto"
                            triggerClassName="rounded-full"
                        />
                    </div>

                    <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:shrink-0">
                        <span className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                            View
                        </span>
                        <div
                            role="group"
                            aria-label="View layout"
                            className="flex h-11 w-full rounded-full border border-zinc-200/90 bg-white/90 p-1 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.04] backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 sm:w-auto"
                        >
                            {(
                                [
                                    ['grid', LayoutGrid, 'Grid'],
                                    ['list', List, 'List'],
                                ] as const
                            ).map(([value, Icon, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={layout === value}
                                    aria-label={`${label} view`}
                                    onClick={() => transitionTo(mode, value)}
                                    className={cn(
                                        'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-all duration-300 sm:flex-none sm:px-2.5',
                                        layout === value
                                            ? 'bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950'
                                            : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white',
                                    )}
                                >
                                    <Icon className="size-4 shrink-0" aria-hidden />
                                    <span className="sm:hidden">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div
                    key={panelKey}
                    className={cn(
                        'transition-all duration-300 ease-out',
                        panelReady
                            ? 'translate-y-0 scale-100 opacity-100'
                            : 'translate-y-2 scale-[0.985] opacity-0',
                    )}
                >
                    {weddings.length === 0 ? (
                        <StudioCard className="relative overflow-hidden border-dashed p-10 text-center">
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 bg-[radial-gradient(480px_220px_at_50%_0%,rgba(16,185,129,0.12),transparent_60%)]"
                            />
                            <div className="relative mx-auto max-w-md">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-emerald-700 uppercase ring-1 ring-emerald-600/15">
                                    <Sparkles className="size-3" />
                                    Start here
                                </span>
                                <h2 className="mt-4 font-serif text-4xl tracking-tight text-zinc-950 dark:text-white">
                                    Create your first invitation
                                </h2>
                                <p className="mt-3 text-sm text-zinc-500">
                                    Choose an event type, then design a printable card, publish a guest site, or do both.
                                </p>
                                <div className="mt-6 flex flex-wrap justify-center gap-3">
                                    <Button
                                        type="button"
                                        className="rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800"
                                        onClick={requestCreate}
                                    >
                                        <Plus className="mr-1.5 size-4" />
                                        Create Invitation
                                    </Button>
                                    <Button asChild variant="outline" className="rounded-full border-zinc-200 bg-white/80 px-5">
                                        <Link href="/designs">Browse templates</Link>
                                    </Button>
                                </div>
                            </div>
                        </StudioCard>
                    ) : filtered.length === 0 ? (
                        <StudioCard className="p-8 text-center">
                            <p className="font-serif text-2xl text-zinc-950 dark:text-white">
                                No {mode === 'card' ? 'cards' : 'sites'} in this view
                            </p>
                            <p className="mt-2 text-sm text-zinc-500">
                                Try another filter, or create a new invitation with that format.
                            </p>
                            <Button
                                type="button"
                                className="mt-5 rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800"
                                onClick={requestCreate}
                            >
                                Create {mode === 'card' ? 'card' : 'site'} invitation
                            </Button>
                        </StudioCard>
                    ) : layout === 'grid' ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {filtered.map((wedding, index) => (
                                <EventCard key={wedding.id} wedding={wedding} delay={index * 35} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filtered.map((wedding, index) => (
                                <EventRow key={wedding.id} wedding={wedding} delay={index * 25} />
                            ))}
                        </div>
                    )}
                </div>
            </StudioSurface>

            <CreateInvitationDialog
                open={createOpen}
                onOpenChange={setCreateDialog}
                query={createQuery}
                onQueryChange={setCreateQuery}
                groups={groupedTypes}
                customHref={customType?.designs_href ?? '/designs/custom'}
            />

            <TrialEventLimitDialog
                open={limitOpen}
                onOpenChange={setLimitOpen}
                upgradeUrl={upgradeUrl}
                eventLimit={typeof freeEventLimit === 'number' ? freeEventLimit : 1}
                existingEventHref={existingEventHref}
            />
        </>
    );
}

function CreateInvitationDialog({
    open,
    onOpenChange,
    query,
    onQueryChange,
    groups,
    customHref,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    query: string;
    onQueryChange: (value: string) => void;
    groups: { id: string; label: string; types: EventTypeOption[] }[];
    customHref: string;
}) {
    function pickOccasion(href: string): void {
        router.visit(href);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85dvh] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border-zinc-200 p-0 sm:max-w-2xl">
                <DialogHeader className="shrink-0 space-y-0 border-b border-zinc-950/8 px-6 py-5 pr-14 text-left dark:border-white/10">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-emerald-700 uppercase">
                        ~3 minutes to a shareable invite
                    </p>
                    <DialogTitle className="mt-1 font-serif text-3xl tracking-tight">
                        Create Invitation
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 text-sm text-zinc-500">
                        Pick an occasion → choose a design → customize → publish &amp; share. Cards stay free forever.
                    </DialogDescription>
                    <div className="relative mt-4">
                        <Search className="pointer-events-none absolute top-1/2 left-3 z-[1] size-4 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => onQueryChange(event.target.value)}
                            onKeyDown={(event) => event.stopPropagation()}
                            onPointerDown={(event) => event.stopPropagation()}
                            placeholder="Search events…"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            aria-label="Search events"
                            className="h-11 w-full rounded-full border border-zinc-950/10 bg-zinc-50/80 pr-4 pl-10 text-sm outline-none ring-emerald-500/30 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/60"
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                    {groups.length === 0 ? (
                        <p className="py-10 text-center text-sm text-zinc-500">No events match that search.</p>
                    ) : (
                        groups.map((group) => (
                            <section key={group.id}>
                                <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                                    {group.label}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {group.types.map((type) => (
                                        <button
                                            key={type.slug}
                                            type="button"
                                            onClick={() => pickOccasion(type.designs_href!)}
                                            className="group flex items-center justify-between gap-3 rounded-2xl border border-zinc-950/8 bg-white/80 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-zinc-950/15 hover:bg-zinc-950 hover:text-white hover:shadow-lg dark:border-white/10 dark:bg-zinc-950/40 dark:hover:bg-white dark:hover:text-zinc-950"
                                        >
                                            <span>
                                                <span className="block text-sm font-medium">{type.name}</span>
                                                <span className="mt-0.5 block text-[11px] tracking-wide text-emerald-700 uppercase group-hover:text-emerald-300 dark:text-emerald-400 dark:group-hover:text-emerald-700">
                                                    Site & card designs
                                                </span>
                                            </span>
                                            <ArrowRight className="size-3.5 shrink-0 opacity-50 transition group-hover:opacity-100" />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ))
                    )}
                </div>

                <div className="border-t border-zinc-950/8 bg-zinc-50/80 px-6 py-4 dark:border-white/10 dark:bg-zinc-950/40">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-zinc-500">
                            Need a different occasion? Start from Custom — it works for any celebration.
                        </p>
                        <Button
                            type="button"
                            className="rounded-full bg-zinc-950 px-4 text-white hover:bg-zinc-800"
                            onClick={() => pickOccasion(customHref)}
                        >
                            Open Custom designs
                            <ArrowRight className="ml-1.5 size-3.5" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EventCard({ wedding, delay }: { wedding: WeddingSummary; delay: number }) {
    const title = wedding.title || `${wedding.bride_name} & ${wedding.groom_name}`;
    const live = wedding.status === 'published';
    const date = formatDate(wedding.wedding_date);
    const invitation = wedding.invitation_mode ?? 'both';

    return (
        <article
            className="group relative animate-in fade-in slide-in-from-bottom-2 fill-mode-both overflow-hidden rounded-3xl border border-zinc-950/8 bg-white/80 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-zinc-950/15 hover:shadow-xl dark:border-white/10 dark:bg-zinc-950/55"
            style={{ animationDelay: `${delay}ms`, animationDuration: '420ms' }}
        >
            <div
                aria-hidden
                className={cn(
                    'absolute inset-x-0 top-0 h-28 transition-opacity duration-300',
                    live
                        ? 'bg-gradient-to-br from-emerald-500/20 via-teal-400/10 to-transparent'
                        : 'bg-gradient-to-br from-zinc-900/10 via-zinc-500/5 to-transparent',
                )}
            />
            <div className="relative p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={wedding.status} paused={Boolean(wedding.live_paused)} />
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase ring-1 ring-zinc-950/5 dark:bg-zinc-900/80">
                        {modeLabel(invitation)}
                    </span>
                    {wedding.event_type ? (
                        <span className="rounded-full bg-zinc-950/5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:bg-white/5">
                            {wedding.event_type}
                        </span>
                    ) : null}
                </div>

                <h2 className="mt-4 font-serif text-[1.85rem] leading-[1.02] tracking-tight text-zinc-950 dark:text-white">
                    {title}
                </h2>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-500">
                    {date ? (
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-3.5 text-emerald-600" />
                            {date}
                        </span>
                    ) : null}
                    {wedding.city ? (
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-emerald-600" />
                            {wedding.city}
                        </span>
                    ) : null}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <MetricChip icon={<Users className="size-3.5" />} label="Guests" value={wedding.guests_count} />
                    <MetricChip icon={<Sparkles className="size-3.5" />} label="Replies" value={wedding.rsvps_count} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild size="sm" className="rounded-full bg-zinc-950 px-3.5 text-white hover:bg-zinc-800">
                        <Link href={`/events/${wedding.id}`}>
                            Manage
                            <ArrowUpRight className="ml-1 size-3.5" />
                        </Link>
                    </Button>
                    {wedding.rsvps_count > 0 ? (
                        <Button asChild size="sm" variant="outline" className="rounded-full border-emerald-200 bg-emerald-50/80 px-3.5 text-emerald-800">
                            <Link href={`/events/${wedding.id}#rsvps`}>
                                RSVPs · {wedding.rsvps_count}
                            </Link>
                        </Button>
                    ) : null}
                    {invitation === 'card' || invitation === 'both' ? (
                        <Button asChild size="sm" variant="outline" className="rounded-full border-zinc-200 bg-white/80 px-3.5">
                            <Link href={`/events/${wedding.id}/card`}>
                                {invitation === 'both' ? 'Edit card' : 'Edit'}
                            </Link>
                        </Button>
                    ) : null}
                    {invitation === 'link' || invitation === 'both' ? (
                        <Button asChild size="sm" variant="outline" className="rounded-full border-zinc-200 bg-white/80 px-3.5">
                            <Link href={`/events/${wedding.id}/edit`}>
                                {invitation === 'both' ? 'Edit site' : 'Edit'}
                            </Link>
                        </Button>
                    ) : null}
                    {live ? (
                        <Button asChild size="sm" variant="outline" className="rounded-full border-emerald-200 bg-emerald-50/80 px-3.5 text-emerald-800">
                            <Link href={`/invite/${wedding.slug}`} target="_blank">
                                Open live
                            </Link>
                        </Button>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function EventRow({ wedding, delay }: { wedding: WeddingSummary; delay: number }) {
    const title = wedding.title || `${wedding.bride_name} & ${wedding.groom_name}`;
    const date = formatDate(wedding.wedding_date);

    return (
        <Link
            href={`/events/${wedding.id}`}
            className="group flex animate-in fade-in slide-in-from-bottom-1 fill-mode-both flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-950/8 bg-white/75 px-5 py-4 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-zinc-950/55"
            style={{ animationDelay: `${delay}ms`, animationDuration: '380ms' }}
        >
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={wedding.status} paused={Boolean(wedding.live_paused)} />
                    <span className="text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                        {modeLabel(wedding.invitation_mode)}
                    </span>
                </div>
                <p className="mt-1.5 font-serif text-2xl tracking-tight text-zinc-950 dark:text-white">{title}</p>
                <p className="mt-1 text-sm text-zinc-500">
                    {[date, wedding.city, wedding.event_type].filter(Boolean).join(' · ')}
                </p>
            </div>
            <div className="flex items-center gap-5 text-sm">
                <div className="text-right">
                    <p className="tabular-nums text-zinc-950 dark:text-white">{wedding.guests_count}</p>
                    <p className="text-[11px] tracking-wide text-zinc-500 uppercase">Guests</p>
                </div>
                <div className="text-right">
                    <p className="tabular-nums text-zinc-950 dark:text-white">{wedding.rsvps_count}</p>
                    <p className="text-[11px] tracking-wide text-zinc-500 uppercase">Replies</p>
                </div>
                <ArrowUpRight className="size-4 text-zinc-400 transition group-hover:text-zinc-950 dark:group-hover:text-white" />
            </div>
        </Link>
    );
}

function StatusPill({ status, paused = false }: { status: string; paused?: boolean }) {
    const live = status === 'published' && !paused;
    const stopped = status === 'published' && paused;
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase',
                live
                    ? 'bg-emerald-500/12 text-emerald-800 ring-1 ring-emerald-600/20 dark:text-emerald-300'
                    : stopped
                      ? 'bg-amber-500/12 text-amber-900 ring-1 ring-amber-600/20 dark:text-amber-200'
                      : 'bg-zinc-900/6 text-zinc-600 ring-1 ring-zinc-950/10 dark:bg-white/5 dark:text-zinc-300',
            )}
        >
            <span
                className={cn(
                    'size-1.5 rounded-full',
                    live ? 'bg-emerald-500' : stopped ? 'bg-amber-500' : 'bg-zinc-400',
                )}
            />
            {live ? 'Live' : stopped ? 'Stopped' : status}
        </span>
    );
}

function MetricChip({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-2xl bg-zinc-950/[0.03] px-3 py-2.5 ring-1 ring-zinc-950/5 dark:bg-white/5 dark:ring-white/10">
            <div className="flex items-center gap-1.5 text-[11px] tracking-wide text-zinc-500 uppercase">
                {icon}
                {label}
            </div>
            <p className="mt-1 font-serif text-2xl tabular-nums tracking-tight text-zinc-950 dark:text-white">{value}</p>
        </div>
    );
}
