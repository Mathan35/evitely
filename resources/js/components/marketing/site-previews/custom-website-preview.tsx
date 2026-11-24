import { router } from '@inertiajs/react';
import { CalendarPlus, Download, MapPin, MessageCircle, Phone, Share2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import {
    CUSTOM_SAMPLE,
    CUSTOM_STYLE_KEYS,
    customCardSrc,
    customGalleryPhotos,
    customHeroSrc,
    customSiteTheme} from '@/components/marketing/site-previews/custom-site-themes';
import {
    gallerySlotsFingerprint,
    liveHeroMediaStyle,
    resolveLiveGallery,
    resolveLiveHeroSrc,
    usePreviewLive} from '@/components/marketing/site-previews/preview-live';
import {
    SiteGuestsSection,
    useLiveShowcaseGuests,
} from '@/components/marketing/site-previews/site-guests-section';
import { SiteRsvpPanel } from '@/components/marketing/site-previews/site-rsvp-panel';
import {
    ActionCard,
    SiteRsvpActionsSection,
} from '@/components/marketing/site-previews/site-quick-actions';
import { SiteGallerySection } from '@/components/marketing/site-previews/site-gallery-section';
import { SiteSectionGate } from '@/components/marketing/site-previews/site-section-note';
import { SiteShareChannelsRow } from '@/components/marketing/site-previews/site-share-channels';
import {
    ItineraryStop,
    MapLabel,
    SiteItineraryHeading,
    SiteVenuesHeading,
    VenueCard,
} from '@/components/marketing/site-previews/site-location-blocks';
import { useCountdown } from '@/hooks/use-countdown';
import { useFlashCopy } from '@/hooks/use-flash-copy';
import { PreviewSiteCard, type PreviewUserCard } from '@/components/marketing/site-previews/preview-site-card';
import { resolveCountdownClock, resolveCountdownDate } from '@/lib/preview-countdown';
import { useAllowRsvp } from '@/components/marketing/site-previews/preview-interactions';
import { useInvitationCopy } from '@/hooks/use-invitation-copy';
import { localizedSiteNav } from '@/lib/invitation-copy';
import { resolveLiveSiteCopy, splitHeadingLines } from '@/lib/live-site-copy';
import { usePreviewReveal } from '@/hooks/use-preview-reveal';
import { usePreviewHeaderScrolled } from '@/hooks/use-preview-header-scrolled';
import { useSiteSectionScroll } from '@/hooks/use-site-section-scroll';
import { HomeReturnSkeleton } from '@/components/marketing/site-previews/home-return-skeleton';
import { usePreviewMusic } from '@/hooks/use-preview-music';
import { openAddToCalendar } from '@/lib/add-to-calendar';
import { filterSiteNavItems } from '@/lib/site-section-visibility';
import { cn } from '@/lib/utils';
import { EventCountdownTimerForOccasion } from '@/components/marketing/site-previews/event-countdown-timer';
import { CoreSiteSections } from '@/components/marketing/site-previews/core-site-sections';
import { SiteHeroSection } from '@/components/marketing/site-previews/site-hero-section';
import { SiteHeaderNav } from '@/components/marketing/site-previews/site-header-nav';
import { previewOverlayClass, previewScrollClass, previewShellClass } from '@/lib/preview-shell';
import { PreviewInvitationCard } from '@/components/marketing/site-previews/preview-invitation-card';
import type { PreviewDevice } from '@/lib/preview-device';
import type { GalleryDesign } from '@/types/gallery';
import { PreviewMusicToggle } from '@/components/marketing/site-previews/preview-music-toggle';
import { PreviewCelebrateBurst } from '@/components/marketing/site-previews/preview-celebrate-burst';
import { previewThemeCssVars } from '@/lib/site-backgrounds';

type CustomHeroAction = 'rsvp' | 'guests' | 'story' | 'itinerary' | 'venue';


const NAV = [
    { id: 'home', label: 'Home' },
    { id: 'card', label: 'The Card' },
    { id: 'story', label: 'The Night' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'venue', label: 'Venue' },
    { id: 'guests', label: 'Guest list' },
    { id: 'rsvp', label: 'RSVP' },
] as const;

export function CustomWebsitePreview({
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
    userCard?: PreviewUserCard | null;
    wedding?: import('@/types/wedding').WeddingPage | null;
    interactive?: boolean;
}) {
    const live = usePreviewLive();
    const ui = useInvitationCopy();
    const navItems = useMemo(
        () => localizedSiteNav(live?.locale ?? 'en', [...NAV]),
        [live?.locale],
    );
    const guests = useLiveShowcaseGuests();
    const visibleNav = filterSiteNavItems(navItems, live?.sections);
    const allowRsvp = useAllowRsvp();
    const isLive = Boolean(wedding?.slug);
    const copy = useMemo(
        () =>
            resolveLiveSiteCopy(live, {
                galleryIntro: 'A sample of the day ? tap any frame to open it.'}),
        [live],
    );
    const sample = useMemo(
        () => ({
            ...CUSTOM_SAMPLE,
            ...(live?.host ? { name: live.host } : live?.bride ? { name: live.bride } : {}),
            ...(live?.kicker ? { kicker: live.kicker } : {}),
            ...(live?.message ? { message: live.message } : {}),
            ...(live?.eventLine ? { eventLine: live.eventLine } : {}),
            ...(live?.eventName ? { eventName: live.eventName } : {}),
            ...(live?.ageLine ? { ageLine: live.ageLine } : {}),
            ...(live?.date ? { date: live.date } : {}),
            ...(live?.dateLabel ? { dateLabel: live.dateLabel } : {}),
            ...(live?.dateShort ? { dateShort: live.dateShort } : {})}),
        [live],
    );
    
    const baseTheme = customSiteTheme(design.style_key);
    const theme = useMemo(
        () => ({
            ...baseTheme,
            ...(live?.venue ? { venue: live.venue } : {}),
            ...(live?.city ? { city: live.city } : {})}),
        [baseTheme, live?.city, live?.venue],
    );
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
    usePreviewMusic(live?.musicUrl, muted);
    const [openCard, setOpenCard] = useState(false);
    const [rsvpOpen, setRsvpOpen] = useState(false);
    const [rsvpSent, setRsvpSent] = useState(false);
    const { copied, copyText } = useFlashCopy();
    const contactPhone = copy.contactPhone || live?.contactPhone || '+1 (555) 014-2218';
    const contactTel = contactPhone.replace(/[^\d+]/g, '') || '+15550142218';
    const galleryFingerprint = gallerySlotsFingerprint(live?.gallery);
    const gallery = useMemo(
        () => resolveLiveGallery(live?.gallery, customGalleryPhotos(design.style_key)),
        // Fingerprint so add / replace / crop always re-renders the gallery mosaic.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [design.style_key, galleryFingerprint],
    );
    const cardSrc = invitationCard?.image_mobile || invitationCard?.image || customCardSrc(design.style_key);
    const neighborKey = CUSTOM_STYLE_KEYS[(Math.max(0, CUSTOM_STYLE_KEYS.indexOf(design.style_key as (typeof CUSTOM_STYLE_KEYS)[number])) + 7) % CUSTOM_STYLE_KEYS.length];
    const target = useMemo(() => resolveCountdownDate(sample.date, Boolean(live?.date)), [sample.date, live?.date]);
    const countdown = useCountdown(target, resolveCountdownClock(live?.time, '18:00'), live?.timezone || 'America/New_York');
    usePreviewReveal(rootRef, `${design.style_key}-${openCard}-${device}-${framed ? 'framed' : 'live'}`, { framed });
    const headerScrolled = usePreviewHeaderScrolled(rootRef, framed);

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

    const party = {
        id: 'party',
        title: 'The Table',
        time: theme.schedule[0]?.time ?? '6:00 PM',
        name: theme.space,
        address: `${theme.venue}, ${theme.city}`,
        image: (live?.ceremony?.image || '').trim() || customHeroSrc(design.style_key, 'desktop'),
        map: customHeroSrc(design.style_key, 'mobile'),
        maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${theme.venue} ${theme.city}`)}`};
    const afterparty = {
        id: 'afterparty',
        title: 'The Music',
        time: theme.schedule[theme.schedule.length - 1]?.time ?? '9:00 PM',
        name: theme.afterparty,
        address: `${theme.venue}, ${theme.city}`,
        image: (live?.reception?.image || '').trim() || customHeroSrc(neighborKey, 'desktop'),
        map: customHeroSrc(neighborKey, 'mobile'),
        maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${theme.afterparty} ${theme.city}`)}`};

    const btn = theme.button;
    const fillBtn = cn(btn, 'bg-[var(--w-accent)] py-[0.85rem] text-[13px] tracking-[0.2em] text-[var(--w-btn)] uppercase');
    const outlineBtn = cn(btn, 'border border-[var(--w-accent)] py-[0.85rem] text-[13px] tracking-[0.2em] text-[var(--w-accent)] uppercase');

    const { scrollTo, showHomeSkeleton } = useSiteSectionScroll(rootRef, {
        prefix: 'cu-',
        framed,
        onBeforeScroll: () => setMenuOpen(false)});

    function openRsvp(): void {
        if (!allowRsvp) {
            return;
        }
        setRsvpOpen(true);
    }

    function runHeroAction(action: CustomHeroAction): void {
        if (action === 'rsvp') {
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
        openAddToCalendar({
            title: `${sample.name} ${sample.eventName}`,
            date: sample.date,
            startTime: live?.time || '18:00',
            endTime: live?.time ? undefined : '23:00',
            location: `${theme.venue}, ${theme.city}`,
            details: sample.eventLine,
            googleUrl: (isLive && wedding?.google_calendar_url) || live?.googleCalendarUrl || null,
        });
    }

    async function shareInvite(): Promise<void> {
        const shareUrl = (isLive && wedding?.share_url) || (typeof window !== 'undefined' ? window.location.href : '');
        const text = wedding?.share_message || `${sample.name} · ${sample.dateLabel || sample.eventLine || ''}`.trim();

        if (isLive && wedding?.slug) {
            router.post(`/invite/${wedding.slug}/share`, { channel: 'copy' }, { preserveState: true, preserveScroll: true });
        }

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: text, text, url: shareUrl || undefined });
                return;
            } catch {
                /* fall through */
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
            <p className="sr-only">Live sample website for {design.name}, {device} view</p>
            <div ref={rootRef} className={previewScrollClass(framed)}>
                <SiteHeaderNav
                    styleId={live?.headerStyle}
                    brand={sample.name}
                    items={visibleNav}
                    desktop={desktop}
                    scrolled={headerScrolled}
                    onNavigate={scrollTo}
                    onOpenMenu={() => setMenuOpen(true)}
                />

                <SiteHeroSection
                    styleId={live?.heroStyle}
                    framed={framed}
                    sectionId="cu-home"
                    heroSrc={resolveLiveHeroSrc(live?.heroImage, customHeroSrc(design.style_key, device))}
                    alt={`${sample.name} ${sample.eventName}`}
                    desktop={desktop}
                    heroRef={heroRef}
                    mediaStyle={liveHeroMediaStyle(live)}
                    kicker={copy.kicker || sample.kicker}
                    title={
                        <>
                            <span className={cn('block max-w-full break-words leading-none', desktop ? 'text-[clamp(2.75rem,6vw,4.1rem)]' : 'text-[clamp(2.1rem,11vw,2.85rem)]')}>{sample.name}</span>
                            <span className={cn('mt-3 block font-serif italic opacity-90', desktop ? 'text-[1.65rem]' : 'text-[1.35rem]')}>{sample.eventName}</span>
                        </>
                    }
                    message={copy.heroMessage || sample.message}
                    eventLine={copy.eventLine || sample.eventLine}
                    allowRsvp={allowRsvp}
                    onRsvp={() => runHeroAction('rsvp')}
                    onGuests={() => runHeroAction('guests')}
                />

                <div className={cn('relative z-[1]', desktop && 'mx-auto w-full max-w-5xl')}>
                <SiteSectionGate sectionKey="countdown" desktop={desktop} sectionId="gh-countdown">
                <section
                    id="gh-countdown"
                    data-preview-reveal
                    className={cn('preview-reveal border-t border-[var(--w-accent)]/15 px-5 py-10 text-center', desktop && 'px-10 py-14')}
                >
                    <EventCountdownTimerForOccasion
                        occasion="custom"
                        styleId={live?.timerStyle}
                        countdown={countdown}
                        dateLabel={sample.dateLabel}
                        year={sample.date.slice(0, 4)}
                        host={`${sample.name} ${sample.eventName}`.trim()}
                        desktop={desktop}
                    />
                </section>
                </SiteSectionGate>

                <PreviewSiteCard
                    sectionId="cu-card"
                    title="Custom Invitation"
                    invitationCard={invitationCard}
                    userCard={userCard}
                    fallbackSrc={cardSrc}
                    designName={design.name}
                    outlineBtn={outlineBtn}
                    open={openCard}
                    onToggle={() => setOpenCard((value) => !value)}
                    desktop={desktop}
                />

                <SiteSectionGate sectionKey="story" desktop={desktop} sectionId="cu-story">
                <section id="cu-story" data-preview-reveal className={cn('preview-reveal relative px-7 py-16 text-center', desktop && 'px-10')}>
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

                <SiteSectionGate sectionKey="gallery" desktop={desktop} sectionId="cu-gallery">
                <section id="cu-gallery" data-preview-reveal className={cn('preview-reveal relative px-5 py-14', desktop && 'px-10 py-16')}>
                    <p className="text-center text-[10px] tracking-[0.34em] text-[var(--w-accent)] uppercase">{copy.galleryEyebrow}</p>
                    <h3 className="mt-3 text-center font-serif text-4xl font-light tracking-tight">{copy.galleryTitle}</h3>
                    <span className="mx-auto mt-5 block h-px w-16 bg-[var(--w-accent)]/50" />
                    <p className="mx-auto mt-5 max-w-md text-center text-sm leading-6 text-[var(--w-muted)]">
                        {copy.galleryIntro}
                    </p>
                    <SiteGallerySection
                        photos={gallery}
                        styleId={live?.galleryStyle}
                        desktop={desktop}
                        framed={framed}
                    />
                </section>
                </SiteSectionGate>

                <SiteSectionGate sectionKey="venue" desktop={desktop} sectionId="cu-location">
                <section id="cu-itinerary" data-preview-reveal className={cn('site-location-itinerary preview-reveal relative px-5 pb-6', desktop && 'px-10 pb-8')}>
                    <SiteItineraryHeading eyebrow="The Celebration" title="Evening Itinerary" />
                    <div className={cn('relative mt-10', desktop ? 'grid grid-cols-2 gap-8' : 'site-itinerary-rail')}>
                        <ItineraryStop venue={party} overlay={<MapLabel>{theme.venue}</MapLabel>} desktop={desktop} />
                        <ItineraryStop venue={afterparty} desktop={desktop} />
                    </div>
                </section>

                <section id="cu-venue" data-preview-reveal className={cn('site-location-venues preview-reveal relative px-5 py-14', desktop && 'px-10')}>
                    <SiteVenuesHeading title="Event Venues" />
                    <div className={cn('mt-10 space-y-5', desktop && 'grid grid-cols-2 gap-6 space-y-0')}>
                        <VenueCard venue={party} kicker="The Table" copied={copied} onCopy={() => copyText('party', party.address)} />
                        <VenueCard venue={afterparty} kicker="The Music" copied={copied} onCopy={() => copyText('afterparty', afterparty.address)} />
                    </div>
                </section>
                </SiteSectionGate>

                <SiteGuestsSection desktop={desktop} intro={copy.guestsIntro} guests={guests} sectionId="cu-guests" />

                                <CoreSiteSections desktop={desktop} />

                <SiteSectionGate sectionKey="rsvp" desktop={desktop} sectionId="gh-rsvp">
                <SiteRsvpActionsSection
                    id="cu-rsvp"
                    desktop={desktop}
                    eyebrow={`${sample.name} ${sample.eventName}`}
                    subtitle={
                        <p className="font-serif text-[16px] font-light text-[var(--w-muted)]">{sample.dateLabel} ? Call / WhatsApp {copy.contactPhone}</p>
                    }
                    cta={
                        <button
                            type="button"
                            onClick={openRsvp}
                            disabled={!allowRsvp}
                            className={cn('site-rsvp-actions__cta px-10', fillBtn, !allowRsvp && 'cursor-not-allowed opacity-45')}
                        >
                            Send RSVP
                        </button>
                    }
                >
                    <ActionCard icon={<Phone className="h-5 w-5" />} title={ui.callUs} subtitle={contactPhone} href={`tel:${contactTel}`} />
                    <ActionCard icon={<MessageCircle className="h-5 w-5" />} title={ui.whatsapp} subtitle={contactPhone} href={`https://wa.me/${contactTel.replace(/^\+/, '')}`} />
                    <ActionCard icon={<CalendarPlus className="h-5 w-5" />} title={ui.calendar} subtitle={`${sample.dateLabel} ? ${theme.venue}`} onClick={addToCalendar} />
                    <ActionCard icon={<MapPin className="h-5 w-5" />} title="Table Map" subtitle={`${party.name}, ${theme.city}`} href={party.maps} />
                    <ActionCard icon={<MapPin className="h-5 w-5" />} title="Music Map" subtitle={`${afterparty.name}, ${theme.city}`} href={afterparty.maps} />
                    <ActionCard icon={<Share2 className="h-5 w-5" />} title="Share Invitation" subtitle={copied === 'share' ? 'Copied' : `${sample.name} ${sample.eventName}`} onClick={() => void shareInvite()} />
                    <div className="col-span-full mt-2 mb-1 px-1">
                      <p className="mb-2 text-[10px] tracking-[0.2em] text-[var(--w-accent)] uppercase">Share channels</p>
                      <SiteShareChannelsRow
                        links={isLive && wedding ? wedding.share_links : null}
                        shareUrl={isLive && wedding ? wedding.share_url : null}
                        shareMessage={isLive && wedding ? wedding.share_message : null}
                        inviteSlug={isLive && wedding ? wedding.slug : null}
                      />
                    </div>
                    <a href={cardSrc} download="custom-invitation.jpg" data-preview-reveal className="site-action-card preview-reveal mb-3 block text-left">
                    <span className="site-action-card__icon"><Download className="h-5 w-5" /></span>
                    <p className="site-action-card__title mt-4 break-words font-serif text-[1.35rem] leading-tight font-light italic sm:text-[1.5rem] sm:leading-none">Download Invitation</p>
                    <p className="site-action-card__subtitle mt-2 text-sm text-[var(--w-muted)]">Sample invitation card</p>
                    </a>
                </SiteRsvpActionsSection>
                </SiteSectionGate>

                <footer data-preview-reveal className="preview-reveal px-6 pt-4 pb-16 text-center">
                    <p className="font-serif text-[1.85rem] italic text-[var(--w-accent)]">{sample.name}</p>
                    <p className="mt-1 font-serif text-[1.1rem] italic text-[var(--w-accent)]/80">{sample.eventName}</p>
                    <p className="mt-3 text-[10px] tracking-[0.22em] text-[var(--w-muted)] uppercase">
                        {sample.dateLabel} ? {theme.venue}
                    </p>
                    <p className="mt-1 text-[10px] tracking-[0.28em] text-[var(--w-muted)] uppercase">{theme.city}</p>
                </footer>
                </div>
            </div>

            <PreviewMusicToggle muted={muted} onToggle={() => setMuted((value) => !value)} />

            <PreviewCelebrateBurst />

            {menuOpen && (
                <div className={previewOverlayClass(framed, "z-40 bg-[var(--w-bg)]/96 px-6 pt-8 backdrop-blur-md sm:px-8")}>
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-[var(--w-accent)]">
                            <X className="h-6 w-6" strokeWidth={1.25} />
                        </button>
                    </div>
                    <p className="mt-6 text-center font-serif text-[15px] tracking-[0.2em] text-[var(--w-accent)]">{sample.name}</p>
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
                onClose={() => { setRsvpOpen(false); setRsvpSent(false); }}
                wedding={wedding}
                fillBtn={fillBtn}
                desktop={desktop}
                framed={framed}
                overlayClassName={previewOverlayClass(framed)}
            />
        </div>
    );
}

