import { Link } from '@inertiajs/react';
import { ArrowLeft, Heart, LayoutGrid, LayoutList, Search, SlidersHorizontal, Zap } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthGate } from '@/components/auth-gate';
import { CardUnpackPreview } from '@/components/marketing/card-unpack-preview';
import { FormatSwitch } from '@/components/marketing/format-switch';
import { customizeHref, GalleryDesignCard } from '@/components/marketing/gallery-design-card';
import { CardPreview, LinkPreview } from '@/components/marketing/gallery-previews';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';
import { InvitationIntro } from '@/components/invitation/invitation-intro';
import { PreviewLeaves, PreviewLoader } from '@/components/marketing/preview-effects';
import { PreviewChrome } from '@/components/preview/preview-chrome';
import { PreviewDeviceShell } from '@/components/preview/preview-device-shell';
import { resolveInvitationIntroContent } from '@/lib/invitation-intro-theme';
import { usePreviewDevice } from '@/hooks/use-preview-device';
import { PREVIEW_VIEWPORTS } from '@/lib/preview-device';
import { OccasionIcon, OccasionMark } from '@/components/marketing/occasion-icon';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGalleryFavorites } from '@/hooks/use-gallery-favorites';
import { matchedGalleryCard } from '@/lib/matched-gallery-card';
import type { EventGallery, GalleryDesign } from '@/types/gallery';

const GalleryWebsiteCanvas = lazy(() =>
    import('@/components/studio/gallery-website-canvas').then((m) => ({
        default: m.GalleryWebsiteCanvas,
    })),
);

function DesignGrid({
    designs,
    onPreview,
    view,
    savedIds,
    onFavorite,
    showStyle = false,
    showFeatured = false,
}: {
    designs: GalleryDesign[];
    onPreview: (design: GalleryDesign) => void;
    view: 'grid' | 'list';
    savedIds: string[];
    onFavorite: (id: string) => void;
    showStyle?: boolean;
    showFeatured?: boolean;
}) {
    if (designs.length === 0) {
        return <p className="mt-8 text-center text-sm text-[#6d645b]">No designs match those filters.</p>;
    }

    return (
        <ul className={view === 'list' ? 'mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-2' : 'mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4'}>
            {designs.map((design, index) => (
                <li key={design.id} className="gallery-tab-tile flex h-full min-w-0" style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}>
                    <GalleryDesignCard
                        design={design}
                        view={view}
                        saved={savedIds.includes(design.id)}
                        onFavorite={onFavorite}
                        preview={{ type: 'dialog', onPreview }}
                        showStyle={showStyle}
                        featured={showFeatured && index === 0}
                    />
                </li>
            ))}
        </ul>
    );
}

export default function EventGalleryPage({
    gallery,
    slug,
    tab = 'cards',
    occasions = [],
    seo,
}: {
    gallery: EventGallery | null;
    slug: string;
    tab?: 'links' | 'cards';
    occasions?: { slug: string; name: string; href: string }[];
    canRegister?: boolean;
    seo?: MarketingSeoPayload;
}) {
    const [activeTab, setActiveTab] = useState<'links' | 'cards'>(tab === 'links' ? 'links' : 'cards');
    const [direction, setDirection] = useState<1 | -1>(1);
    const [query, setQuery] = useState('');
    const [mood, setMood] = useState('all');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [preview, setPreview] = useState<GalleryDesign | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewIntroOpen, setPreviewIntroOpen] = useState(false);
    const { device, setDevice, showToggle } = usePreviewDevice();
    const previewReady = useRef<(() => void) | null>(null);
    const previewReadyQueued = useRef(false);

    function markPreviewReady(): void {
        if (previewReady.current) {
            previewReady.current();
            return;
        }

        previewReadyQueued.current = true;
    }
    const favorites = useGalleryFavorites();
    const { ensure } = useAuthGate();
    const liveSite = preview?.kind === 'link';
    const invitationCard = useMemo(() => {
        if (!preview || preview.kind !== 'link' || !gallery?.cards?.length) {
            return null;
        }

        const websiteIndex = gallery.links.findIndex((item) => item.id === preview.id);

        return matchedGalleryCard(preview, gallery.cards, websiteIndex >= 0 ? websiteIndex : 0);
    }, [preview, gallery]);
    const unpackCard = preview?.kind === 'card';
    const liveTheme = preview
        ? {
              bg: preview.palette.paper,
              surface: preview.palette.paper,
              accent: preview.palette.gold,
              ink: preview.palette.ink,
              buttonInk: '#ffffff',
          }
        : null;

    useEffect(() => {
        if (preview) {
            setPreviewIntroOpen(true);
        } else {
            setPreviewIntroOpen(false);
        }
    }, [preview?.id]);

    useEffect(() => {
        if (!preview || unpackCard || liveSite) {
            setPreviewLoading(false);
            previewReady.current = null;
            previewReadyQueued.current = false;
            return;
        }

        setPreviewLoading(true);
        const started = Date.now();
        let closed = false;
        let hideTimer: number | undefined;

        const finish = () => {
            if (closed) {
                return;
            }

            closed = true;
            const wait = Math.max(0, 400 - (Date.now() - started));
            hideTimer = window.setTimeout(() => setPreviewLoading(false), wait);
        };

        previewReady.current = finish;
        const fallback = window.setTimeout(finish, 5200);

        if (previewReadyQueued.current || (!liveSite && !preview.image)) {
            previewReadyQueued.current = false;
            finish();
        }

        return () => {
            closed = true;
            previewReady.current = null;
            window.clearTimeout(hideTimer);
            window.clearTimeout(fallback);
        };
    }, [preview, liveSite, unpackCard]);

    const designs = gallery ? (activeTab === 'cards' ? gallery.cards : gallery.links) : [];
    const moodFilters = (gallery?.moods ?? []).filter((item) => item !== 'All Styles' && item !== 'Top Rated');
    const visible = useMemo(
        () =>
            designs.filter((design) => {
                const haystack = `${design.name} ${design.style}`.toLowerCase();
                const matchesQuery = query.trim() === '' || haystack.includes(query.trim().toLowerCase());
                const matchesMood =
                    mood === 'all' || (design.moods ?? []).includes(mood) || design.style === mood;
                const matchesFavorite = !favoritesOnly || favorites.ids.includes(design.id);

                return matchesQuery && matchesMood && matchesFavorite;
            }),
        [designs, favorites.ids, favoritesOnly, mood, query],
    );

    function setTab(next: 'links' | 'cards'): void {
        if (next === activeTab) {
            return;
        }

        setDirection(next === 'cards' ? 1 : -1);
        setActiveTab(next);
        setQuery('');
        setMood('all');
        window.history.replaceState(window.history.state, '', `${window.location.pathname}?tab=${next}`);
    }

    const heading = activeTab === 'cards'
        ? (gallery?.heading_cards ?? gallery?.heading)
        : (gallery?.heading_links ?? gallery?.heading);
    const description = activeTab === 'cards'
        ? (gallery?.description_cards ?? gallery?.description)
        : (gallery?.description_links ?? gallery?.description);
    const gridTitle = activeTab === 'cards'
        ? (gallery?.grid_title_cards ?? 'Card and envelope suites')
        : (gallery?.grid_title_links ?? 'Invitation websites');
    const enter = direction === 1 ? 'gallery-tab-in-right' : 'gallery-tab-in-left';

    return (
        <>
            {seo ? (
                <MarketingSeoHead seo={seo} />
            ) : (
                <MarketingSeoHead
                    seo={{
                        title: heading ?? 'Invitation designs',
                        description: description ?? '',
                        canonical: '',
                        image: '',
                    }}
                />
            )}
            <div className="min-h-svh overflow-x-hidden bg-background text-foreground">
                <MarketingHeader back={{ href: '/designs', label: 'Back to all event types' }} />

                <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
                    {gallery ? (
                        <>
                            <div className="flex flex-col items-center">
                                <OccasionMark slug={gallery.slug} size="lg" />
                                <h1 key={`${activeTab}-title`} className={`mt-4 text-center font-serif text-3xl leading-tight sm:text-4xl ${enter}`}>
                                    {heading}
                                </h1>
                            </div>
                            <p key={`${activeTab}-copy`} className={`occasion-sub mx-auto mt-3 max-w-3xl text-center text-sm leading-6 text-[#6d645b]`}>
                                {description}
                            </p>

                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Event types">
                                <Link
                                    href="/designs"
                                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2b241c]/10 bg-white px-3 py-1.5 text-xs"
                                >
                                    <LayoutGrid className="h-3.5 w-3.5 text-[#c6a36a]" aria-hidden />
                                    All Event Types
                                </Link>
                                {occasions.map((item) => (
                                    <Link
                                        key={item.slug}
                                        href={`${item.href}?tab=${activeTab}`}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${item.slug === gallery.slug ? 'bg-[#2b241c] text-[#f4efe6]' : 'border border-[#2b241c]/10 bg-white'}`}
                                    >
                                        <OccasionIcon slug={item.slug} className={`h-3.5 w-3.5 ${item.slug === gallery.slug ? 'text-[#c6a36a]' : 'text-[#7a7168]'}`} />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-6 rounded-2xl border border-[#2b241c]/8 bg-white/80 p-3 shadow-sm sm:p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                    {!gallery.hide_search && (
                                        <label className="relative w-full max-w-sm">
                                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9a9188]" aria-hidden />
                                            <input
                                                value={query}
                                                onChange={(event) => setQuery(event.target.value)}
                                                placeholder={
                                                    (activeTab === 'cards' ? gallery.search_placeholder_cards : gallery.search_placeholder_links)
                                                    ?? gallery.search_placeholder
                                                    ?? `Search ${designs.length} digital ${activeTab === 'cards' ? 'card' : 'link'} templates...`
                                                }
                                                aria-label="Search designs"
                                                className="h-10 w-full rounded-full border border-[#2b241c]/10 bg-white pr-4 pl-9 text-sm outline-none"
                                            />
                                        </label>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                                        <p className="text-xs text-[#7a7168]">Showing {visible.length} of {designs.length}</p>
                                        <button
                                            type="button"
                                            aria-pressed={favoritesOnly}
                                            onClick={() => setFavoritesOnly(!favoritesOnly)}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${favoritesOnly ? 'bg-[#e11d48] text-white' : 'border border-[#2b241c]/10 bg-white text-[#7a7168] dark:border-white/10 dark:bg-transparent'}`}
                                        >
                                            <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-white' : ''}`} aria-hidden />
                                            Favorites{favorites.count > 0 ? ` (${favorites.count})` : ''}
                                        </button>
                                    </div>
                                </div>
                                {moodFilters.length > 0 && (
                                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#2b241c]/8 pt-3">
                                        <span className="mr-1 inline-flex items-center gap-1 text-[11px] tracking-[0.14em] text-[#9a9188] uppercase">
                                            <SlidersHorizontal className="h-3 w-3" aria-hidden />
                                            Filters
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setMood('all')}
                                            className={`rounded-full px-2.5 py-1 text-[11px] ${mood === 'all' ? 'bg-[#2b241c] text-[#f4efe6]' : 'border border-[#2b241c]/10 bg-white'}`}
                                        >
                                            All styles
                                        </button>
                                        {moodFilters.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => setMood(mood === item ? 'all' : item)}
                                                className={`rounded-full px-2.5 py-1 text-[11px] ${mood === item ? 'bg-[#2b241c] text-[#f4efe6]' : 'border border-[#2b241c]/10 bg-white'}`}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <FormatSwitch
                                tab={activeTab}
                                onChange={setTab}
                                linkCount={gallery.links.length}
                                cardCount={gallery.cards.length}
                            />

                            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                                <h2 key={`${activeTab}-grid`} className={`min-w-0 flex-1 ${gallery.hide_toolbar_meta ? 'text-[11px] font-semibold tracking-[0.16em] text-[#9a9188] uppercase' : 'font-serif text-2xl'} ${enter}`}>
                                    {gridTitle || heading}
                                </h2>
                                <div className="inline-flex shrink-0 rounded-full border border-[#2b241c]/10 bg-white p-0.5 dark:border-white/10 dark:bg-transparent" role="group" aria-label="View">
                                    <button
                                        type="button"
                                        aria-pressed={view === 'grid'}
                                        aria-label="Grid view"
                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${view === 'grid' ? 'bg-[#2b241c] text-[#f4efe6]' : 'text-[#7a7168]'}`}
                                        onClick={() => setView('grid')}
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                                        Grid
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={view === 'list'}
                                        aria-label="List view"
                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${view === 'list' ? 'bg-[#2b241c] text-[#f4efe6]' : 'text-[#7a7168]'}`}
                                        onClick={() => setView('list')}
                                    >
                                        <LayoutList className="h-3.5 w-3.5" aria-hidden />
                                        List
                                    </button>
                                </div>
                            </div>

                            {visible.length === 0 ? (
                                <p className="mt-16 text-center text-sm text-[#6d645b]">No designs match those filters. Clear search or pick All styles.</p>
                            ) : (
                                <DesignGrid
                                    designs={visible}
                                    onPreview={setPreview}
                                    view={view}
                                    savedIds={favorites.ids}
                                    onFavorite={favorites.toggle}
                                    showStyle
                                    showFeatured={['baby-shower', 'party', 'wedding', 'graduation', 'bridal-shower', 'housewarming', 'custom'].includes(gallery.slug)}
                                />
                            )}

                            {gallery.show_planning_cta && (
                                <section className="mt-16 border-t border-[#2b241c]/10 pt-12 text-center">
                                    <h2 className="font-serif text-3xl">Ready to start planning your next masterpiece?</h2>
                                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                        <Link href="/register" className="inline-flex rounded-full bg-[#2b241c] px-6 py-3 text-sm text-[#f4efe6]">
                                            Design Your Free Invite
                                        </Link>
                                        <a href="#preview" className="inline-flex rounded-full border border-[#2b241c]/15 bg-white px-6 py-3 text-sm">
                                            Watch Demo Video
                                        </a>
                                    </div>
                                </section>
                            )}
                        </>
                    ) : (
                        <div className="mx-auto mt-16 max-w-lg text-center">
                            <h1 className="font-serif text-4xl">We don’t have that event type yet</h1>
                            <p className="mt-4 text-sm leading-6 text-[#6d645b]">
                                “{slug}” isn’t in the studio. Go back to the homepage to pick an event type.
                            </p>
                            <Link href="/" className="mt-8 inline-flex items-center gap-1.5 text-sm">
                                <ArrowLeft className="h-4 w-4" aria-hidden />
                                Back to Browse All Event Types
                            </Link>
                        </div>
                    )}
                </main>
                <SiteFooter />
            </div>

            <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
                <DialogContent
                    overlayClassName={liveSite || preview ? 'z-[70] bg-[#1c1814]/55 backdrop-blur-[8px]' : 'z-[70]'}
                    className={`preview-invite-dialog relative fixed inset-0 z-[80] m-auto flex min-h-0 translate-x-0 translate-y-0 flex-col gap-0 overflow-visible border-0 bg-transparent p-0 [&>button]:z-40 [&>button]:rounded-full [&>button]:bg-[var(--preview-accent,#c6a36a)] [&>button]:p-1.5 [&>button]:text-[var(--preview-btn,#2b241c)] [&>button]:opacity-100 data-[state=open]:zoom-in-100 ${PREVIEW_VIEWPORTS[device].widthClass}`}
                    style={
                        liveTheme
                            ? {
                                  backgroundColor: 'transparent',
                                  color: liveTheme.ink,
                                  ['--preview-accent' as string]: liveTheme.accent,
                                  ['--preview-btn' as string]: liveTheme.buttonInk,
                              }
                            : {
                                  backgroundColor: 'transparent',
                                  color: '#2b241c',
                                  ['--preview-accent' as string]: '#c6a36a',
                                  ['--preview-btn' as string]: '#fff',
                              }
                    }
                >
                    {preview && liveSite && liveTheme ? (
                        <>
                            <DialogHeader className="sr-only">
                                <DialogTitle>{preview.name} live preview</DialogTitle>
                                <DialogDescription>
                                    Sample {gallery?.name || 'event'} website with countdown, invitation card, itinerary, venue, and RSVP.
                                </DialogDescription>
                            </DialogHeader>
                            {showToggle ? <PreviewChrome device={device} onDeviceChange={setDevice} /> : null}
                            <PreviewDeviceShell
                                className="overflow-hidden rounded-[1.35rem] shadow-[0_28px_80px_-24px_rgba(20,16,12,0.45)]"
                                style={{ backgroundColor: liveTheme.bg }}
                            >
                                <PreviewLeaves eventSlug={gallery?.slug} />
                                <Suspense
                                    fallback={
                                        <div
                                            className="min-h-[50vh] w-full"
                                            style={{ backgroundColor: liveTheme.bg }}
                                            aria-hidden
                                        />
                                    }
                                >
                                    <GalleryWebsiteCanvas
                                        design={preview}
                                        slug={gallery?.slug}
                                        device={device === 'desktop' ? 'desktop' : 'mobile'}
                                        invitationCard={invitationCard}
                                        framed
                                        intro={false}
                                        interactive={false}
                                        showInvitationCard={Boolean(invitationCard)}
                                    />
                                </Suspense>
                                {previewIntroOpen ? (
                                    <InvitationIntro
                                        key={`intro-${preview.id}`}
                                        content={resolveInvitationIntroContent({
                                            eventSlug: gallery?.slug || 'custom',
                                            design: preview,
                                        })}
                                        onOpened={() => setPreviewIntroOpen(false)}
                                    />
                                ) : null}
                                <div
                                    className="flex shrink-0 justify-end border-t px-4 py-3"
                                    style={{
                                        borderColor: `${liveTheme.accent}33`,
                                        backgroundColor: liveTheme.surface,
                                    }}
                                >
                                    <Link
                                        href={customizeHref(preview)}
                                        onClick={(event) => {
                                            if (ensure({ type: 'customize', href: customizeHref(preview) })) {
                                                return;
                                            }

                                            event.preventDefault();
                                        }}
                                        className="inline-flex items-center justify-center gap-1 rounded-md px-5 py-2.5 text-sm text-white"
                                        style={{
                                            backgroundColor: liveTheme.accent,
                                        }}
                                    >
                                        <Zap className="h-4 w-4" aria-hidden />
                                        Customize this site
                                    </Link>
                                </div>
                            </PreviewDeviceShell>
                        </>
                    ) : preview ? (
                        <>
                            {showToggle ? <PreviewChrome device={device} onDeviceChange={setDevice} /> : null}
                            <PreviewDeviceShell className="overflow-hidden rounded-[1.35rem] shadow-[0_28px_80px_-24px_rgba(20,16,12,0.45)]">
                            <PreviewLeaves eventSlug={gallery?.slug} />
                            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4efe6] text-[#2b241c]">
                            <DialogHeader className={`shrink-0 ${device === 'desktop' ? 'px-8 pt-6' : 'px-5 pt-8'}`}>
                                <DialogTitle className="font-serif text-3xl">{preview.name}</DialogTitle>
                                <DialogDescription>
                                    {preview.style} · {preview.kind === 'card' ? 'digital card & envelope' : 'invitation website'} · {gallery?.name}
                                </DialogDescription>
                            </DialogHeader>
                            <div className={`relative min-h-0 flex-1 px-4 ${unpackCard ? 'overflow-y-auto overscroll-contain' : 'flex flex-col overflow-hidden'}`}>
                            {unpackCard ? (
                                <div className="flex justify-center py-12">
                                    <CardUnpackPreview design={preview} device={device} onReady={markPreviewReady} />
                                </div>
                            ) : (
                            <div className={`invite-open-stage py-4 ${device === 'desktop' ? 'mx-auto w-full max-w-xl px-4' : ''}`}>
                                <div className="preview-envelope-flap mx-auto mb-[-6px] h-9 w-[min(100%,22rem)] rounded-t-[1.1rem] bg-[#c6a36a]/40" aria-hidden />
                                {preview.image ? (
                                    <img
                                        src={preview.image}
                                        alt={preview.name}
                                        className="preview-invite-reveal w-full rounded-md"
                                        onLoad={markPreviewReady}
                                        onError={markPreviewReady}
                                    />
                                ) : preview.kind === 'card' ? (
                                    <div className="preview-invite-reveal">
                                        <CardPreview design={preview} large />
                                    </div>
                                ) : (
                                    <div className="preview-invite-reveal">
                                        <LinkPreview design={preview} large />
                                    </div>
                                )}
                            </div>
                            )}
                            </div>
                            <Link
                                href={customizeHref(preview)}
                                onClick={(event) => {
                                    if (ensure({ type: 'customize', href: customizeHref(preview) })) {
                                        return;
                                    }

                                    event.preventDefault();
                                }}
                                className="mx-4 mb-5 inline-flex shrink-0 items-center justify-center gap-1 self-center rounded-full bg-[#c6a36a] px-5 py-2.5 text-sm text-white"
                            >
                                <Zap className="h-4 w-4" aria-hidden />
                                Customize
                            </Link>
                            {previewIntroOpen ? (
                                <InvitationIntro
                                    key={`intro-card-${preview.id}`}
                                    content={resolveInvitationIntroContent({
                                        eventSlug: gallery?.slug || 'custom',
                                        design: preview,
                                    })}
                                    onOpened={() => setPreviewIntroOpen(false)}
                                />
                            ) : previewLoading ? (
                                <PreviewLoader
                                    key={preview.id}
                                    visible={previewLoading}
                                    design={preview}
                                    device={device}
                                    eventSlug={gallery?.slug}
                                    background={preview.palette.paper}
                                    accent={preview.palette.gold}
                                />
                            ) : null}
                            </div>
                            </PreviewDeviceShell>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}
