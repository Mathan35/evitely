import { router } from '@inertiajs/react';
import {
    CalendarPlus,
    ChevronDown,
    Download,
    Flower2,
    Heart,
    MapPin,
    MessageCircle,
    Music2,
    Phone,
    Share2,
    Sparkles,
    Star,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { PreviewSiteCard } from '@/components/marketing/site-previews/preview-site-card';
import { PreviewMusicToggle } from '@/components/marketing/site-previews/preview-music-toggle';
import { PreviewCelebrateBurst } from '@/components/marketing/site-previews/preview-celebrate-burst';
import { useAllowRsvp } from '@/components/marketing/site-previews/preview-interactions';
import {
    gallerySlotsFingerprint,
    liveHeroMediaStyle,
    resolveLiveGallery,
    resolveLiveHeroSrc,
    usePreviewLive} from '@/components/marketing/site-previews/preview-live';
import { SiteGallerySection } from '@/components/marketing/site-previews/site-gallery-section';
import { SiteSectionGate } from '@/components/marketing/site-previews/site-section-note';
import {
    ItineraryStop,
    MapLabel,
    SiteItineraryHeading,
    SiteVenuesHeading,
    VenueCard,
} from '@/components/marketing/site-previews/site-location-blocks';
import { WEDDING_SAMPLE, weddingGalleryPhotos, weddingHeroSrc, weddingSiteTheme, type WeddingHeroAction } from '@/components/marketing/site-previews/wedding-site-themes';
import { CountdownTimer } from '@/components/marketing/site-previews/countdown-timer';
import { SiteHeroSection } from '@/components/marketing/site-previews/site-hero-section';
import { useCountdown } from '@/hooks/use-countdown';
import { useFlashCopy } from '@/hooks/use-flash-copy';
import { resolveCountdownTimerStyleId } from '@/lib/countdown-timer-styles';
import { usePreviewReveal } from '@/hooks/use-preview-reveal';
import { usePreviewHeaderScrolled } from '@/hooks/use-preview-header-scrolled';
import { usePreviewMusic } from '@/hooks/use-preview-music';
import { useSiteSectionScroll } from '@/hooks/use-site-section-scroll';
import { HomeReturnSkeleton } from '@/components/marketing/site-previews/home-return-skeleton';
import { previewHostsFromSample } from '@/lib/gallery-template-seed';
import { useInvitationCopy } from '@/hooks/use-invitation-copy';
import { localizedSiteNav } from '@/lib/invitation-copy';
import { resolveLiveSiteCopy, splitHeadingLines } from '@/lib/live-site-copy';
import { resolveCountdownClock, resolveCountdownDate } from '@/lib/preview-countdown';
import type { CustomSiteText } from '@/lib/template-preview-model';
import { filterSiteNavItems } from '@/lib/site-section-visibility';
import { cn } from '@/lib/utils';
import { CoreSiteSections } from '@/components/marketing/site-previews/core-site-sections';
import {
    SiteGuestsSection,
    useLiveShowcaseGuests,
} from '@/components/marketing/site-previews/site-guests-section';
import { SiteRsvpPanel } from '@/components/marketing/site-previews/site-rsvp-panel';
import {
    ActionCard,
    SiteRsvpActionsSection,
} from '@/components/marketing/site-previews/site-quick-actions';
import { SiteScheduleMoments } from '@/components/marketing/site-previews/site-schedule-moments';
import { SiteShareChannelsRow } from '@/components/marketing/site-previews/site-share-channels';
import { openAddToCalendar } from '@/lib/add-to-calendar';
import { SiteHeaderNav } from '@/components/marketing/site-previews/site-header-nav';
import { previewDockClass, previewOverlayClass, previewScrollClass, previewShellClass } from '@/lib/preview-shell';
import type { PreviewDevice } from '@/lib/preview-device';
import type { GalleryDesign } from '@/types/gallery';
import type { CardDocument, WeddingPage } from '@/types/wedding';
import { previewThemeCssVars } from '@/lib/site-backgrounds';

const SITE_ICONS: Record<string, LucideIcon> = {
    heart: Heart,
    sparkles: Sparkles,
    flower: Flower2,
    star: Star,
    music: Music2,
    users: Users,
    map: MapPin};

const IMG = '/images/gallery/previews/glasshouse';

const CARDS = [
    { id: 'front', src: `${IMG}/card-front.jpg?v=3`, alt: 'Invitation front' },
    { id: 'inner', src: `${IMG}/card-inner.jpg?v=4`, alt: 'Welcome from both families' },
    { id: 'events', src: `${IMG}/card-events.jpg?v=3`, alt: 'Weekend details' },
];

const NAV = [
    { id: 'home', label: 'Home' },
    { id: 'card', label: 'The Card' },
    { id: 'story', label: 'Our Story' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'venue', label: 'Venue' },
    { id: 'guests', label: 'Guest list' },
    { id: 'rsvp', label: 'RSVP' },
] as const;


function initialsOf(groom: string, bride: string): string {
    const a = (groom || '').trim().charAt(0);
    const b = (bride || '').trim().charAt(0);
    if (a && b) {
        return `${a} & ${b}`;
    }
    return (a || b || '·').toUpperCase();
}

export function WeddingWebsitePreview({
    design,
    onReady,
    device = 'mobile',
    framed = true,
    invitationCard = null,
    userCard = null,
    wedding = null,
    interactive = false}: {
    design: GalleryDesign;
    onReady?: () => void;
    device?: PreviewDevice;
    /** false on public View site ? document scroll instead of framed overflow shell. */
    framed?: boolean;
    invitationCard?: GalleryDesign | null;
    userCard?: {
        event_id?: number | string;
        document: CardDocument | null;
        width?: number;
        height?: number;
    } | null;
    wedding?: WeddingPage | null;
    interactive?: boolean;
}) {
    const live = usePreviewLive();
    const ui = useInvitationCopy();
    const navItems = useMemo(
        () => localizedSiteNav(live?.locale ?? 'en', [...NAV]),
        [live?.locale],
    );
    const allowRsvp = useAllowRsvp();
    // Real RSVP whenever this event has a public slug (invite URL + owner View site).
    const isLive = Boolean(wedding?.slug);
    const copy = useMemo(() => resolveLiveSiteCopy(live), [live]);
    const sample = useMemo(() => {
        const hosts = previewHostsFromSample(design.sample);
        const kicker = (design.sample?.kicker || design.sample?.headline || design.sample?.blessing || '').trim();
        const message = (
            design.sample?.message ||
            design.sample?.headline_sub ||
            design.sample?.request_line ||
            ''
        ).trim();

        return {
            ...WEDDING_SAMPLE,
            ...(hosts.bride ? { bride: hosts.bride } : {}),
            ...(hosts.groom ? { groom: hosts.groom } : {}),
            ...(kicker ? { kicker } : {}),
            ...(message ? { message } : {}),
            // Empty string clears sample partner names (do not use truthy checks).
            ...(live?.bride !== undefined ? { bride: (live.bride || '').trim() } : {}),
            ...(live?.groom !== undefined ? { groom: (live.groom || '').trim() } : {}),
            ...(live?.kicker !== undefined ? { kicker: live.kicker } : {}),
            ...(live?.message !== undefined ? { message: live.message } : {}),
            ...(live?.eventLine !== undefined ? { eventLine: live.eventLine } : {}),
            ...(live?.date ? { date: live.date } : {}),
            ...(live?.dateLabel ? { dateLabel: live.dateLabel } : {}),
            ...(live?.dateShort ? { dateShort: live.dateShort } : {}),
            kicker: copy.kicker || kicker || WEDDING_SAMPLE.kicker,
            message: copy.heroMessage || message || WEDDING_SAMPLE.message,
            eventLine: copy.eventLine || live?.eventLine || WEDDING_SAMPLE.eventLine,
            heroMessage: copy.heroMessage,
            storyEyebrow: copy.storyEyebrow,
            storyHeading: copy.storyHeading,
            storyBody: copy.storyBody,
            galleryEyebrow: copy.galleryEyebrow,
            galleryTitle: copy.galleryTitle,
            galleryIntro: copy.galleryIntro,
            guestsIntro: copy.guestsIntro};
    }, [copy, design.sample, live]);
    const baseTheme = weddingSiteTheme(design.style_key);
    const theme = useMemo(
        () => ({
            ...baseTheme,
            bride: sample.bride,
            groom: sample.groom,
            date: sample.date,
            dateLabel: sample.dateLabel,
            dateShort: sample.dateShort,
            ...(live?.venue ? { venue: live.venue } : {}),
            ...(live?.city ? { city: live.city } : {}),
            ...(live?.ceremony?.name ? { ceremony: live.ceremony.name } : {}),
            ...(live?.reception?.name ? { reception: live.reception.name } : {}),
            ...(live?.schedule?.length ? { schedule: live.schedule } : {})}),
        [baseTheme, live, sample.bride, sample.date, sample.dateLabel, sample.dateShort, sample.groom],
    );
    const heroSrc = resolveLiveHeroSrc(live?.heroImage, weddingHeroSrc(design.style_key, device));
    const names = [theme.groom, theme.bride].map((part) => (part || '').trim()).filter(Boolean).join(' & ');
    const desktop = device === 'desktop';
    const vars = previewThemeCssVars(theme, {
        bg: live?.siteBg,
        surface: live?.siteSurface});

    const rootRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLImageElement>(null);
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;
    const [menuOpen, setMenuOpen] = useState(false);
    const [muted, setMuted] = useState(true);
    const [openCard, setOpenCard] = useState(false);
    const [cardIndex, setCardIndex] = useState(0);
    const [rsvpOpen, setRsvpOpen] = useState(false);
    const { copied, copyText } = useFlashCopy();
    const galleryFingerprint = gallerySlotsFingerprint(live?.gallery);
    const gallery = useMemo(
        () => resolveLiveGallery(live?.gallery, weddingGalleryPhotos(design.style_key)),
        // Fingerprint so add / replace / crop always re-renders the gallery mosaic.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [design.style_key, galleryFingerprint],
    );
    const guests = useLiveShowcaseGuests();
    const visibleNav = filterSiteNavItems(navItems, live?.sections);
    const contactPhone = copy.contactPhone || live?.contactPhone || '+1 (555) 014-2218';
    const contactTel = contactPhone.replace(/[^\d+]/g, '') || '+15550142218';
    const target = useMemo(
        () => resolveCountdownDate(theme.date, Boolean(live?.date)),
        [theme.date, live?.date],
    );
    const countdown = useCountdown(
        target,
        resolveCountdownClock(live?.time, '16:00'),
        live?.timezone || 'America/New_York',
    );
    usePreviewReveal(rootRef, `${design.style_key}-${openCard}-${device}-${framed ? 'framed' : 'live'}`, { framed });
    const headerScrolled = usePreviewHeaderScrolled(rootRef, framed);

    usePreviewMusic(live?.musicUrl, muted);

    useEffect(() => {
        if (desktop) {
            setMenuOpen(false);
        }
    }, [desktop]);

    useEffect(() => {
        const image = heroRef.current;
        let settled = false;

        const done = () => {
            if (settled) {
                return;
            }

            settled = true;
            onReadyRef.current?.();
        };

        if (image?.complete) {
            done();
            return;
        }

        image?.addEventListener('load', done);
        image?.addEventListener('error', done);
        const fallback = window.setTimeout(done, 4000);

        return () => {
            image?.removeEventListener('load', done);
            image?.removeEventListener('error', done);
            window.clearTimeout(fallback);
        };
    }, [design.style_key, device]);

    const ceremonyImage = (live?.ceremony?.image || '').trim() || `${IMG}/venue-ceremony.jpg?v=3`;
    const receptionImage = (live?.reception?.image || '').trim() || `${IMG}/venue-reception.jpg?v=3`;
    const ceremony = useMemo(
        () => ({
            id: 'ceremony',
            title: live?.ceremony?.title || ui.ceremony,
            time: live?.ceremony?.time || theme.schedule[0]?.time || '4:00 PM',
            name: live?.ceremony?.name || theme.ceremony,
            address: live?.ceremony?.address || `${theme.venue}, ${theme.city}`,
            image: ceremonyImage,
            map: live?.ceremony?.map_image || `${IMG}/map-ceremony.jpg?v=3`,
            maps:
                live?.ceremony?.maps_url ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${live?.ceremony?.name || theme.ceremony} ${live?.ceremony?.address || theme.city}`,
                )}`}),
        [ceremonyImage, live?.ceremony, theme.ceremony, theme.city, theme.schedule, theme.venue, ui.ceremony],
    );
    const reception = useMemo(
        () => ({
            id: 'reception',
            title: live?.reception?.title || ui.reception,
            time: live?.reception?.time || theme.schedule[theme.schedule.length - 1]?.time || '7:00 PM',
            name: live?.reception?.name || theme.reception,
            address: live?.reception?.address || `${theme.venue}, ${theme.city}`,
            image: receptionImage,
            map: live?.reception?.map_image || `${IMG}/map-reception.jpg?v=3`,
            maps:
                live?.reception?.maps_url ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${live?.reception?.name || theme.reception} ${live?.reception?.address || theme.city}`,
                )}`}),
        [live?.reception, receptionImage, theme.city, theme.reception, theme.schedule, theme.venue, ui.reception],
    );

    const btn = theme.button;
    const fillBtn = cn(btn, 'bg-[var(--w-accent)] py-[0.85rem] text-[13px] tracking-[0.2em] text-[var(--w-btn)] uppercase');
    const outlineBtn = cn(btn, 'border border-[var(--w-accent)] py-[0.85rem] text-[13px] tracking-[0.2em] text-[var(--w-accent)] uppercase');

    const { scrollTo, showHomeSkeleton } = useSiteSectionScroll(rootRef, {
        prefix: 'gh-',
        framed,
        onBeforeScroll: () => setMenuOpen(false)});

    function openRsvp(): void {
        if (!allowRsvp) {
            return;
        }
        setRsvpOpen(true);
    }

    function runHeroAction(action: WeddingHeroAction): void {
        if (action === 'rsvp' || action === 'registry') {
            openRsvp();
            return;
        }

        if (action === 'guests') {
            scrollTo('guests');
            return;
        }

        if (action === 'story') {
            scrollTo('story');
            return;
        }

        if (action === 'itinerary') {
            scrollTo('itinerary');
            return;
        }

        scrollTo('venue');
    }

    function addToCalendar(): void {
        const googleUrl =
            (isLive && wedding
                ? wedding.google_calendar_url || wedding.events[0]?.google_calendar_url
                : null) ||
            live?.googleCalendarUrl ||
            null;

        openAddToCalendar({
            title: `${names} · ${ui.ceremonyAndReception}`,
            date: theme.date,
            startTime: live?.time || '16:00',
            endTime: live?.time ? undefined : '23:00',
            location: `${theme.venue}, ${theme.city}`,
            details: wedding?.share_message || live?.eventLine || undefined,
            googleUrl,
        });
    }

    async function shareInvite(): Promise<void> {
        const shareUrl = (isLive && wedding?.share_url) || (typeof window !== 'undefined' ? window.location.href : '');
        const text = wedding?.share_message || `${names} · ${theme.dateLabel}`;

        if (isLive && wedding?.slug) {
            router.post(`/invite/${wedding.slug}/share`, { channel: 'copy' }, { preserveState: true, preserveScroll: true });
        }

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: names, text, url: shareUrl || undefined });
                return;
            } catch {
                /* cancelled or unsupported — fall through to copy */
            }
        }

        await copyText('share', shareUrl || text);
    }

    return (
        <div
            style={vars}
            data-preview-device={device}
            className={previewShellClass(framed)}
        >
            <HomeReturnSkeleton active={showHomeSkeleton} />
            <p className="sr-only">
                {isLive ? `Invitation website for ${names}` : `Live sample website for ${design.name}, ${device} view`}
            </p>
            <div ref={rootRef} className={previewScrollClass(framed)}>
                {(live?.customTexts ?? [])
                    .filter((item) => item.placement === 'floating' && (item.text.trim() || item.kind === 'icon'))
                    .map((item) => (
                        <div
                            key={item.id}
                            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${item.x ?? 50}%`, top: `${item.y ?? 40}%` }}
                        >
                            <CustomOverlay item={item} />
                        </div>
                    ))}
                <SiteHeaderNav
                    styleId={live?.headerStyle}
                    brand={initialsOf(theme.groom, theme.bride)}
                    items={visibleNav.filter((item) => !(isLive && item.id === 'guests'))}
                    desktop={desktop}
                    scrolled={headerScrolled}
                    onNavigate={scrollTo}
                    onOpenMenu={() => setMenuOpen(true)}
                />

                <SiteHeroSection
                    styleId={live?.heroStyle}
                    framed={framed}
                    heroSrc={heroSrc}
                    alt={`${names} invitation`}
                    desktop={desktop}
                    heroRef={heroRef}
                    mediaStyle={liveHeroMediaStyle(live)}
                    kicker={copy.kicker || sample.kicker}
                    title={
                        sample.groom?.trim() && sample.bride?.trim() ? (
                            <>
                                <span className={cn('block max-w-full break-words leading-none', desktop ? 'text-[clamp(2.75rem,6vw,4.1rem)]' : 'text-[clamp(2.1rem,11vw,2.85rem)]')}>{sample.groom}</span>
                                <span className="mt-2 block font-serif text-[1.35rem] italic opacity-85">&</span>
                                <span className={cn('mt-2 block max-w-full break-words leading-none', desktop ? 'text-[clamp(2.75rem,6vw,4.1rem)]' : 'text-[clamp(2.1rem,11vw,2.85rem)]')}>{sample.bride}</span>
                            </>
                        ) : (
                            <span className={cn('block max-w-full break-words leading-none', desktop ? 'text-[clamp(2.75rem,6vw,4.1rem)]' : 'text-[clamp(2.1rem,11vw,2.85rem)]')}>
                                {sample.groom?.trim() || sample.bride?.trim() || names}
                            </span>
                        )
                    }
                    message={copy.heroMessage || sample.message}
                    eventLine={copy.eventLine || sample.eventLine}
                    allowRsvp={allowRsvp}
                    onRsvp={() => runHeroAction('rsvp')}
                    onGuests={() => runHeroAction('guests')}
                    extras={(live?.customTexts ?? [])
                        .filter((item) => (item.placement ?? 'notes') === 'hero' && (item.text.trim() || item.kind === 'icon'))
                        .map((item) => (
                            <CustomOverlay key={item.id} item={item} tone="light" />
                        ))}
                />

                <div className={cn('relative z-[1]', desktop && 'mx-auto w-full max-w-5xl')}>
                <SiteSectionGate sectionKey="countdown" desktop={desktop} sectionId="gh-countdown">
                <section
                    id="gh-countdown"
                    data-preview-reveal
                    className={cn('preview-reveal border-t border-[var(--w-accent)]/15 px-5 py-10 text-center', desktop && 'px-10 py-14')}
                >
                    <CountdownTimer
                        styleId={resolveCountdownTimerStyleId(live?.timerStyle)}
                        countdown={countdown}
                        dateLabel={theme.dateLabel}
                        year={theme.date.slice(0, 4)}
                        groom={theme.groom}
                        bride={theme.bride}
                        desktop={desktop}
                    />
                </section>
                </SiteSectionGate>

                {userCard?.document || invitationCard ? (
                    <PreviewSiteCard
                        title="Wedding Invitation"
                        invitationCard={invitationCard}
                        userCard={userCard}
                        fallbackSrc={CARDS[0].src}
                        designName={design.name}
                        outlineBtn={outlineBtn}
                        open={openCard}
                        onToggle={() => setOpenCard((value) => !value)}
                        desktop={desktop}
                    />
                ) : (
                    <section id="gh-card" data-preview-reveal className={cn('preview-reveal relative px-5 pt-12 pb-6 text-center', desktop && 'px-10 pt-16')}>
                        <p className="text-[10px] tracking-[0.34em] text-[var(--w-accent)] uppercase">The Card</p>
                        <h3 className="mt-3 font-serif text-4xl font-light tracking-tight">Wedding Invitation</h3>
                        <div className="relative mx-auto mt-10 flex h-[17.5rem] w-[12.5rem] items-center justify-center">
                            {CARDS.map((card, index) => (
                                <img
                                    key={card.id}
                                    src={card.src}
                                    alt=""
                                    className="absolute top-0 left-1/2 h-[17rem] w-[11.5rem] rounded-2xl object-cover shadow-[0_16px_30px_-12px_rgba(0,0,0,0.35)]"
                                    style={{
                                        transform: `translateX(calc(-50% + ${(index - 1) * 18}px)) rotate(${(index - 1) * 7}deg)`,
                                        zIndex: index === 0 ? 3 : 3 - index}}
                                />
                            ))}
                        </div>
                        <button type="button" onClick={() => setOpenCard((value) => !value)} className={cn('mx-auto mt-8 inline-flex items-center gap-2 px-7 py-2.5 text-[11px] tracking-[0.22em] uppercase', outlineBtn)}>
                            <ChevronDown className={`h-3.5 w-3.5 transition ${openCard ? 'rotate-180' : ''}`} />
                            {openCard ? 'Hide invitation' : 'View invitation'}
                        </button>
                        {openCard ? (
                            <div className="invite-open-stage mt-8">
                                <div className="preview-envelope-flap mx-auto mb-[-8px] h-10 w-full max-w-sm origin-top rounded-t-[1.2rem] bg-[var(--w-accent)]/35" aria-hidden />
                                <img
                                    key={CARDS[cardIndex].id}
                                    src={CARDS[cardIndex].src}
                                    alt={CARDS[cardIndex].alt}
                                    className="invite-open-card mx-auto aspect-[3/4] w-full max-w-sm rounded-[1.4rem] border border-[var(--w-accent)]/25 object-cover"
                                />
                                <div className="mt-5 flex justify-center gap-3">
                                    {CARDS.map((card, index) => (
                                        <button key={card.id} type="button" onClick={() => setCardIndex(index)} className={`h-[4.6rem] w-[3.3rem] overflow-hidden rounded-lg border ${cardIndex === index ? 'border-[var(--w-accent)]' : 'border-[var(--w-accent)]/20'}`}>
                                            <img src={card.src} alt="" className="h-full w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </section>
                )}

                <SiteSectionGate sectionKey="story" desktop={desktop} sectionId="gh-story">
                <section id="gh-story" data-preview-reveal className={cn('preview-reveal relative px-7 py-16 text-center', desktop && 'px-10')}>
                    <p className="text-[10px] tracking-[0.34em] text-[var(--w-accent)] uppercase">{copy.storyEyebrow}</p>
                    <h3 className="mt-3 font-serif text-4xl leading-tight font-light">
                        {splitHeadingLines(copy.storyHeading).map((line, index) => (
                            <span key={`${line}-${index}`} className={index > 0 ? 'block' : undefined}>
                                {line}
                            </span>
                        ))}
                    </h3>
                    <span className="mx-auto mt-5 block h-px w-16 bg-[var(--w-accent)]/50" />
                    <p className={cn('mx-auto mt-8 max-w-md font-serif text-[17px] leading-[1.85] font-light text-[var(--w-muted)]', desktop && 'max-w-2xl text-[19px]')}>
                        {copy.storyBody || sample.message}
                    </p>
                </section>
                </SiteSectionGate>

                {(live?.customTexts ?? []).filter((item) => (item.placement ?? 'notes') === 'story' && (item.text.trim() || item.kind === 'icon')).length > 0 ? (
                    <section data-preview-reveal className={cn('preview-reveal relative px-7 py-6 text-center', desktop && 'px-10')}>
                        <div className={cn('mx-auto flex max-w-md flex-wrap items-center justify-center gap-4', desktop && 'max-w-2xl')}>
                            {(live?.customTexts ?? [])
                                .filter((item) => (item.placement ?? 'notes') === 'story' && (item.text.trim() || item.kind === 'icon'))
                                .map((item) => (
                                    <CustomOverlay key={item.id} item={item} />
                                ))}
                        </div>
                    </section>
                ) : null}

                {(live?.customTexts ?? []).filter((item) => (item.placement ?? 'notes') === 'notes' && (item.text.trim() || item.kind === 'icon')).length > 0 ? (
                    <section id="gh-notes" data-preview-reveal className={cn('preview-reveal relative px-7 py-12 text-center', desktop && 'px-10')}>
                        <p className="text-[10px] tracking-[0.34em] text-[var(--w-accent)] uppercase">Notes</p>
                        <div className={cn('mx-auto mt-8 max-w-md space-y-8', desktop && 'max-w-2xl')}>
                            {(live?.customTexts ?? [])
                                .filter((item) => (item.placement ?? 'notes') === 'notes' && (item.text.trim() || item.kind === 'icon'))
                                .map((item) => (
                                    <CustomOverlay key={item.id} item={item} />
                                ))}
                        </div>
                    </section>
                ) : null}

                <SiteSectionGate sectionKey="gallery" desktop={desktop} sectionId="gh-gallery">
                <section id="gh-gallery" data-preview-reveal className={cn('preview-reveal relative px-5 py-14', desktop && 'px-10 py-16')}>
                    <p className="text-center text-[10px] tracking-[0.34em] text-[var(--w-accent)] uppercase">{copy.galleryEyebrow}</p>
                    <h3 className="mt-3 text-center font-serif text-4xl font-light tracking-tight">{copy.galleryTitle}</h3>
                    <span className="mx-auto mt-5 block h-px w-16 bg-[var(--w-accent)]/50" />
                    <p className="mx-auto mt-5 max-w-md text-center text-sm leading-6 text-[var(--w-muted)]">
                        {copy.galleryIntro}
                    </p>
                    {(live?.customTexts ?? [])
                        .filter((item) => item.placement === 'gallery' && (item.text.trim() || item.kind === 'icon'))
                        .map((item) => (
                            <div key={item.id} className="mt-6 flex justify-center">
                                <CustomOverlay item={item} />
                            </div>
                        ))}
                    <SiteGallerySection
                        photos={gallery}
                        styleId={live?.galleryStyle}
                        desktop={desktop}
                        framed={framed}
                    />
                </section>
                </SiteSectionGate>

                <SiteSectionGate sectionKey="venue" desktop={desktop} sectionId="gh-location">
                <section id="gh-itinerary" data-preview-reveal className={cn('site-location-itinerary preview-reveal relative px-5 pb-6', desktop && 'px-10 pb-8')}>
                    <SiteItineraryHeading eyebrow="The Celebration" title="Wedding Itinerary" />
                    <SiteScheduleMoments items={theme.schedule} desktop={desktop} />
                    <div className={cn('relative mt-10', desktop ? 'grid grid-cols-2 gap-8' : 'site-itinerary-rail')}>
                        <ItineraryStop venue={ceremony} overlay={<MapLabel>{theme.venue}</MapLabel>} desktop={desktop} />
                        <ItineraryStop venue={reception} desktop={desktop} />
                    </div>
                </section>

                <section id="gh-venue" data-preview-reveal className={cn('site-location-venues preview-reveal relative px-5 py-14', desktop && 'px-10')}>
                    <SiteVenuesHeading title={ui.eventVenues} />
                    <div className={cn('mt-10 space-y-5', desktop && 'grid grid-cols-2 gap-6 space-y-0')}>
                        <VenueCard venue={ceremony} kicker={ui.ceremony} copied={copied} onCopy={() => copyText(ceremony.id, ceremony.address)} />
                        <VenueCard venue={reception} kicker={ui.reception} copied={copied} onCopy={() => copyText(reception.id, reception.address)} />
                    </div>
                </section>
                </SiteSectionGate>

                <SiteGuestsSection desktop={desktop} intro={copy.guestsIntro || sample.guestsIntro} guests={guests} />

                                <CoreSiteSections desktop={desktop} />

                <SiteSectionGate sectionKey="rsvp" desktop={desktop} sectionId="gh-rsvp">
                <SiteRsvpActionsSection
                    desktop={desktop}
                    eyebrow={names}
                    subtitle={
                        <p className="font-serif text-[16px] leading-relaxed font-light text-[var(--w-muted)]">
                            {theme.dateLabel} · Call / WhatsApp {contactPhone}
                        </p>
                    }
                    cta={
                        <button
                            type="button"
                            onClick={openRsvp}
                            disabled={!allowRsvp}
                            className={cn(
                                'site-rsvp-actions__cta px-10',
                                fillBtn,
                                !allowRsvp && 'cursor-not-allowed opacity-45',
                            )}
                        >
                            {isLive ? ui.sendRsvp : ui.sendSampleRsvp}
                        </button>
                    }
                >
                    <ActionCard icon={<Phone className="h-5 w-5" />} title={ui.callUs} subtitle={contactPhone} href={`tel:${contactTel}`} />
                    <ActionCard
                        icon={<MessageCircle className="h-5 w-5" />}
                        title={ui.whatsapp}
                        subtitle={contactPhone}
                        href={`https://wa.me/${contactTel.replace(/^\+/, '')}`}
                    />
                    <ActionCard
                        icon={<CalendarPlus className="h-5 w-5" />}
                        title={ui.calendar}
                        subtitle={`${theme.dateLabel} · ${ui.ceremonyAndReception}`}
                        onClick={addToCalendar}
                    />
                    <ActionCard
                        icon={<MapPin className="h-5 w-5" />}
                        title={ui.ceremonyMap}
                        subtitle={`${ceremony.name}, ${theme.city}`}
                        href={ceremony.maps}
                    />
                    <ActionCard
                        icon={<MapPin className="h-5 w-5" />}
                        title={ui.receptionMap}
                        subtitle={`${reception.name}, ${theme.city}`}
                        href={reception.maps}
                    />
                    <ActionCard
                        icon={<Share2 className="h-5 w-5" />}
                        title={ui.shareInvitation}
                        subtitle={copied === 'share' ? ui.linkCopied : names}
                        onClick={() => void shareInvite()}
                    />
                    <div className="col-span-full mt-2 mb-1 px-1">
                        <p className="mb-2 text-[10px] tracking-[0.2em] text-[var(--w-accent)] uppercase">
                            Share channels
                        </p>
                        <SiteShareChannelsRow
                            links={isLive && wedding ? wedding.share_links : null}
                            shareUrl={isLive && wedding ? wedding.share_url : null}
                            shareMessage={isLive && wedding ? wedding.share_message : `${names} · ${theme.dateLabel}`}
                            inviteSlug={isLive && wedding ? wedding.slug : null}
                        />
                    </div>
                    {isLive && wedding ? (
                        <ActionCard
                            icon={<Download className="h-5 w-5" />}
                            title={ui.viewInvitationCard}
                            subtitle={ui.openDigitalCard}
                            href={`/invite/${wedding.slug}/card`}
                            openInNewTab
                        />
                    ) : (
                        <a
                            href={`${IMG}/card-front.jpg?v=3`}
                            download="wedding-invitation.jpg"
                            data-preview-reveal
                            className="site-action-card preview-reveal mb-3 block cursor-pointer text-left"
                        >
                            <span className="site-action-card__icon">
                                <Download className="h-5 w-5" />
                            </span>
                            <p className="site-action-card__title mt-4 break-words font-serif text-[1.35rem] leading-tight font-light italic sm:text-[1.5rem] sm:leading-none">
                                {ui.downloadInvitation}
                            </p>
                            <p className="site-action-card__subtitle mt-2 text-sm text-[var(--w-muted)]">
                                {ui.sampleInvitationCard}
                            </p>
                        </a>
                    )}
                </SiteRsvpActionsSection>
                </SiteSectionGate>

                <footer data-preview-reveal className={cn('preview-reveal px-6 pt-4 text-center', isLive ? 'pb-28' : 'pb-16')}>
                    <p className="font-serif text-[1.85rem] italic text-[var(--w-accent)]">{names}</p>
                    <p className="mt-3 text-[10px] tracking-[0.22em] text-[var(--w-muted)] uppercase">
                        {theme.dateLabel} · {theme.venue}
                    </p>
                    <p className="mt-1 text-[10px] tracking-[0.28em] text-[var(--w-muted)] uppercase">{theme.city}</p>
                </footer>
                </div>
            </div>

            {isLive ? (
                <div className={cn(previewDockClass(framed), "pointer-events-none z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]", desktop && "hidden")}>
                    <button
                        type="button"
                        onClick={openRsvp}
                        disabled={!allowRsvp}
                        className={cn(
                            'pointer-events-auto w-full shadow-[0_20px_50px_-18px_rgba(40,32,24,0.65)]',
                            fillBtn,
                            !allowRsvp && 'cursor-not-allowed opacity-45',
                        )}
                    >
                        RSVP now
                    </button>
                </div>
            ) : null}

            <PreviewMusicToggle
                muted={muted}
                onToggle={() => setMuted((value) => !value)}
                className={isLive && !desktop ? 'bottom-[5.5rem]' : undefined}
            />

            <PreviewCelebrateBurst className={isLive && !desktop ? "bottom-[5.5rem]" : undefined} />

            {menuOpen && (
                <div className={previewOverlayClass(framed, "z-40 bg-[var(--w-bg)]/96 px-6 pt-8 backdrop-blur-md sm:px-8")}>
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-[var(--w-accent)]">
                            <X className="h-6 w-6" strokeWidth={1.25} />
                        </button>
                    </div>
                    <p className="mt-6 text-center font-serif text-[15px] tracking-[0.2em] text-[var(--w-accent)]">{initialsOf(theme.groom, theme.bride)}</p>
                    <nav className="mt-10 flex flex-col items-center gap-5">
                        {visibleNav.map((item) => (
                            <button key={item.id} type="button" onClick={() => scrollTo(item.id)} className="font-serif text-3xl font-light">
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            <SiteRsvpPanel
                open={rsvpOpen}
                onClose={() => setRsvpOpen(false)}
                wedding={wedding}
                fillBtn={fillBtn}
                outlineBtn={outlineBtn}
                desktop={desktop}
                framed={framed}
                overlayClassName={previewOverlayClass(framed)}
            />
        </div>
    );
}

function CustomOverlay({ item, tone = 'ink' }: { item: CustomSiteText; tone?: 'ink' | 'light' }) {
    const Icon = item.kind === 'icon' ? SITE_ICONS[item.icon || 'heart'] || Heart : null;
    const light = tone === 'light';

    if (Icon) {
        return (
            <div className="inline-flex flex-col items-center gap-2">
                <Icon className={cn('size-7', light ? 'text-white' : 'text-[var(--w-accent)]')} strokeWidth={1.25} />
                {item.text.trim() ? (
                    <p className={cn('text-[12px] tracking-[0.16em] uppercase', light ? 'text-white/90' : 'text-[var(--w-muted)]')}>
                        {item.text}
                    </p>
                ) : null}
            </div>
        );
    }

    return (
        <div>
            {item.label.trim() ? (
                <p className={cn('text-[11px] font-semibold tracking-[0.18em] uppercase', light ? 'text-white/80' : 'text-[var(--w-accent)]')}>
                    {item.label}
                </p>
            ) : null}
            <p
                className={cn(
                    'mt-2 whitespace-pre-line font-serif text-[17px] leading-[1.85] font-light',
                    light ? 'text-white/90' : 'text-[var(--w-muted)]',
                )}
            >
                {item.text}
            </p>
        </div>
    );
}

