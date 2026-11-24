import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CountdownComplete } from '@/components/marketing/site-previews/countdown-complete';
import { CountdownTimer } from '@/components/marketing/site-previews/countdown-timer';
import { CoreSiteSections } from '@/components/marketing/site-previews/core-site-sections';
import { GuestPhotoWall } from '@/components/wedding/guest-photo-wall';
import { isPhotoWallEnabled } from '@/components/studio/preferences-panel';
import { PreviewLiveProvider } from '@/components/marketing/site-previews/preview-live';
import { SiteGallerySection } from '@/components/marketing/site-previews/site-gallery-section';
import { SiteHeroSection } from '@/components/marketing/site-previews/site-hero-section';
import { SiteLanguageMenu } from '@/components/marketing/site-previews/preview-locale-switch';
import { SiteShareChannelsRow } from '@/components/marketing/site-previews/site-share-channels';
import { useCountdown } from '@/hooks/use-countdown';
import { copyToClipboard } from '@/lib/clipboard';
import { coreExtrasFromDetails } from '@/lib/core-site-sections';
import { resolveCountdownTimerStyleId } from '@/lib/countdown-timer-styles';
import { resolveGalleryStyleId } from '@/lib/gallery-section-styles';
import { inviteActionPath } from '@/lib/invite-actions';
import { contrastingInk } from '@/lib/site-backgrounds';
import { staysFromAccommodations, travelNotesFromRelational } from '@/lib/stays-from-accommodations';
import { copyFor } from '@/lib/invitation-copy';
import { cn } from '@/lib/utils';
import type { WeddingPage } from '@/types/wedding';

const CLASSIC_HERO_FALLBACK =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="16"><rect fill="#1c1917" width="100%" height="100%"/></svg>',
    );

function scrollClassicTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatDate(value: string | null, locale: string): string {
    if (!value) {
        return '';
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}

function ClassicSectionNote({
    title,
    body,
    headingFont,
}: {
    title: string;
    body: string;
    headingFont: string;
}) {
    const heading = title.trim();
    const copy = body.trim();

    if (!heading && !copy) {
        return null;
    }

    return (
        <section className="mx-auto max-w-xl px-6 py-12 text-center">
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--invite-primary)]/30 px-6 py-7">
                {heading ? (
                    <h2 className="text-3xl font-light" style={{ fontFamily: headingFont }}>
                        {heading}
                    </h2>
                ) : null}
                {copy ? <p className={`text-sm leading-relaxed opacity-80 ${heading ? 'mt-3' : ''}`}>{copy}</p> : null}
            </div>
        </section>
    );
}

export function WeddingExperience({
    wedding,
    preview = false,
    interactive = true,
    activeLocale = null,
    localeOptions = null,
    onLocaleChange = null,
}: {
    wedding: WeddingPage;
    preview?: boolean;
    interactive?: boolean;
    activeLocale?: string | null;
    localeOptions?: { code: string; label: string }[] | null;
    onLocaleChange?: ((code: string) => void) | null;
}) {
    const locale = activeLocale || wedding.locale || wedding.language || 'en';
    const copy = copyFor(locale);
    const theme = wedding.theme;
    const show = (section: string): boolean => wedding.sections[section] !== false;
    const coreTravelOn = wedding.sections.travel_stays === true;
    const timerStyle = String(wedding.details?.timer_style || '').trim();
    const galleryStyle = String(wedding.details?.gallery_style || '').trim();
    const heroStyle = String(wedding.details?.hero_style || '').trim();
    const useStyledCountdown = Boolean(timerStyle);
    const useStyledGallery = Boolean(galleryStyle);
    const useStyledHero = Boolean(heroStyle);
    const coreExtras = useMemo(
        () =>
            coreExtrasFromDetails(wedding.details as Record<string, unknown>, wedding.occasion, {
                stays: staysFromAccommodations(wedding.accommodations),
                travelNotes: travelNotesFromRelational(
                    typeof wedding.details?.travel_stays_notes === 'string'
                        ? wedding.details.travel_stays_notes
                        : null,
                    wedding.travel,
                ),
                preferRelationalTravel: (wedding.accommodations?.length ?? 0) > 0,
            }),
        [wedding.accommodations, wedding.details, wedding.occasion, wedding.travel],
    );
    const styledGalleryPhotos = useMemo(
        () =>
            wedding.photos.map((photo) => ({
                id: String(photo.id),
                src: photo.url,
                title: photo.caption || '',
                note: '',
                span: 'square' as const,
            })),
        [wedding.photos],
    );
    const classicLive = useMemo(
        () => ({
            locale,
            timerStyle: timerStyle || undefined,
            galleryStyle: galleryStyle || undefined,
            heroStyle: heroStyle || undefined,
            inviteSlug: !preview && interactive ? wedding.slug : null,
            inviteRootDomain: wedding.invite_root_domain,
            guestName: wedding.guest?.name ?? null,
            giftClaimCounts: wedding.gift_claim_counts ?? {},
            coreExtras,
            sections: wedding.sections,
        }),
        [
            coreExtras,
            galleryStyle,
            heroStyle,
            interactive,
            locale,
            preview,
            timerStyle,
            wedding.gift_claim_counts,
            wedding.guest?.name,
            wedding.invite_root_domain,
            wedding.sections,
            wedding.slug,
        ],
    );
    const [musicOn, setMusicOn] = useState(false);
    const [copied, setCopied] = useState(false);
    const countdown = useCountdown(
        wedding.wedding_date,
        wedding.wedding_time,
        wedding.timezone,
    );
    const place = [wedding.city, wedding.state, wedding.country]
        .filter(Boolean)
        .join(', ');
    const animation =
        theme.animationStyle === 'fade' ? 'invite-fade' : 'invite-rise';

    function track(channel: string): void {
        if (!interactive || preview) {
            return;
        }

        router.post(
            inviteActionPath(wedding, 'share'),
            { channel },
            { preserveScroll: true, preserveState: true },
        );
    }

    async function copyLink(channel = 'copy'): Promise<void> {
        const ok = await copyToClipboard(wedding.share_url);
        if (!ok) {
            return;
        }
        setCopied(true);
        track(channel);
        window.setTimeout(() => setCopied(false), 1600);
    }

    const languages =
        localeOptions && localeOptions.length > 0
            ? localeOptions.map((item) => item.code)
            : [wedding.language, wedding.secondary_language].filter(
                  (code, index, all): code is string =>
                      Boolean(code) && all.indexOf(code) === index,
              );

    return (
        <PreviewLiveProvider value={classicLive}>
        <article
            className="min-h-screen"
            lang={locale}
            style={{
                background: theme.backgroundColor,
                color: theme.textColor,
                fontFamily: theme.bodyFont,
                ['--invite-primary' as string]: theme.primaryColor,
                ['--invite-secondary' as string]: theme.secondaryColor,
                ['--invite-radius' as string]: theme.borderRadius,
                ['--w-ink' as string]: theme.textColor,
                ['--w-muted' as string]: theme.secondaryColor || theme.textColor,
                ['--w-accent' as string]: theme.primaryColor,
                ['--w-surface' as string]: theme.backgroundColor,
                ['--w-btn' as string]: contrastingInk(theme.primaryColor),
            }}
        >
            <Head title={wedding.seo.title}>
                <meta name="description" content={wedding.seo.description} />
                <link rel="canonical" href={wedding.seo.canonical} />
                <meta property="og:title" content={wedding.seo.title} />
                <meta
                    property="og:description"
                    content={wedding.seo.description}
                />
                <meta property="og:url" content={wedding.seo.canonical} />
                <meta property="og:type" content="website" />
                {wedding.seo.image && (
                    <meta property="og:image" content={wedding.seo.image} />
                )}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={wedding.seo.title} />
                <meta
                    name="twitter:description"
                    content={wedding.seo.description}
                />
            </Head>

            {wedding.music_url && (
                <audio id="wedding-music" src={wedding.music_url} loop />
            )}

            <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
                {languages.length > 1 ? (
                    <SiteLanguageMenu
                        scrolled
                        locales={languages.map((code) => ({
                            code,
                            label:
                                localeOptions?.find((item) => item.code === code)?.label ??
                                wedding.options.locales[code]?.native ??
                                code.toUpperCase(),
                        }))}
                        active={locale}
                        onChange={(code) => {
                            if (onLocaleChange) {
                                onLocaleChange(code);
                                return;
                            }
                            const url = new URL(window.location.href);
                            url.searchParams.set('lang', code);
                            window.history.replaceState(
                                window.history.state,
                                '',
                                `${url.pathname}${url.search}${url.hash}`,
                            );
                        }}
                    />
                ) : null}
                {wedding.music_url && (
                    <button
                        type="button"
                        className="min-h-11 rounded-full border px-3 text-xs"
                        style={{ borderColor: theme.primaryColor }}
                        aria-pressed={musicOn}
                        onClick={() => {
                            const audio = document.getElementById(
                                'wedding-music',
                            ) as HTMLAudioElement | null;
                            if (!audio) {
                                return;
                            }
                            if (musicOn) {
                                audio.pause();
                                setMusicOn(false);
                            } else {
                                void audio.play();
                                setMusicOn(true);
                            }
                        }}
                    >
                        {copy.music}
                    </button>
                )}
            </div>

            {show('hero') && useStyledHero ? (
                <SiteHeroSection
                    sectionId="classic-home"
                    styleId={heroStyle}
                    desktop
                    heroSrc={wedding.cover_url || CLASSIC_HERO_FALLBACK}
                    alt={`${wedding.display.bride || wedding.title || 'Invitation'} cover`}
                    kicker={wedding.event_type_name || copy.together}
                    title={
                        wedding.display.groom?.trim() && wedding.display.bride?.trim() ? (
                            <>
                                <span
                                    className={cn(
                                        'block max-w-full break-words leading-none',
                                        'text-[clamp(2.75rem,6vw,4.1rem)]',
                                    )}
                                    style={{ fontFamily: theme.headingFont }}
                                >
                                    {wedding.display.groom}
                                </span>
                                <span className="mt-2 block font-serif text-[1.35rem] italic opacity-85">
                                    &
                                </span>
                                <span
                                    className={cn(
                                        'mt-2 block max-w-full break-words leading-none',
                                        'text-[clamp(2.75rem,6vw,4.1rem)]',
                                    )}
                                    style={{ fontFamily: theme.headingFont }}
                                >
                                    {wedding.display.bride}
                                </span>
                            </>
                        ) : (
                            <span
                                className="block max-w-full break-words leading-none text-[clamp(2.75rem,6vw,4.1rem)]"
                                style={{ fontFamily: theme.headingFont }}
                            >
                                {wedding.title ||
                                    wedding.display.bride ||
                                    wedding.display.groom ||
                                    copy.together}
                            </span>
                        )
                    }
                    message={
                        wedding.headline ||
                        wedding.host_message ||
                        wedding.description ||
                        ''
                    }
                    eventLine={[formatDate(wedding.wedding_date, locale), place]
                        .filter(Boolean)
                        .join(' · ')}
                    allowRsvp={show('rsvp') && interactive && !preview}
                    onRsvp={() => scrollClassicTo('rsvp')}
                    onGuests={() => scrollClassicTo('guestbook')}
                />
            ) : null}

            {show('hero') && !useStyledHero ? (
                <header
                    className={`${animation} relative flex min-h-[100svh] max-w-[100vw] flex-col justify-end overflow-x-hidden px-6 pt-24 pb-16 sm:px-10`}
                    style={
                        wedding.cover_url
                            ? {
                                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.62)), url(${wedding.cover_url})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  color: '#f6f1e8',
                              }
                            : undefined
                    }
                >
                    <p className="text-xs tracking-[0.28em] uppercase">
                        {wedding.event_type_name ?? copy.together}
                    </p>
                    <h1
                        className="mt-4 max-w-full break-words text-[clamp(2.5rem,12vw,6rem)] leading-[0.9] sm:max-w-4xl sm:text-8xl"
                        style={{ fontFamily: theme.headingFont }}
                    >
                        {wedding.title || wedding.display.bride}
                    </h1>
                    {wedding.hosts && wedding.hosts.length > 0 && (
                        <p className="mt-4 max-w-xl text-lg">
                            {wedding.hosts.map((host) => host.name).join(' · ')}
                        </p>
                    )}
                    {wedding.headline && (
                        <p className="mt-6 max-w-xl text-lg">{wedding.headline}</p>
                    )}
                    <p className="mt-8 text-sm tracking-[0.18em] uppercase">
                        {formatDate(wedding.wedding_date, wedding.locale)}
                        {place ? ` · ${place}` : ''}
                    </p>
                    <p className="mt-10 text-xs tracking-[0.22em] uppercase opacity-80">
                        {copy.scroll}
                    </p>
                </header>
            ) : null}

            {show('countdown') && wedding.wedding_date && (
                <section
                    className="px-6 py-16 text-center"
                    aria-live="polite"
                >
                    {useStyledCountdown ? (
                        <CountdownTimer
                            styleId={resolveCountdownTimerStyleId(timerStyle)}
                            countdown={countdown}
                            dateLabel={formatDate(wedding.wedding_date, locale)}
                            year={(wedding.wedding_date || '').slice(0, 4)}
                            groom={wedding.display.groom}
                            bride={wedding.display.bride}
                            desktop
                        />
                    ) : countdown.ready && countdown.past ? (
                        <CountdownComplete
                            dateLabel={formatDate(wedding.wedding_date, wedding.locale)}
                            hosts={[wedding.display.groom, wedding.display.bride].filter(Boolean).join(' & ') || null}
                            showCouple
                        />
                    ) : (
                        <>
                            <p className="text-xs tracking-[0.24em] uppercase">
                                {countdown.today
                                    ? copy.today
                                    : formatDate(wedding.wedding_date, wedding.locale)}
                            </p>
                            {countdown.ready && !countdown.today && (
                                <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                                    {(
                                        [
                                            ['days', countdown.days, copy.days],
                                            ['hours', countdown.hours, copy.hours],
                                            ['minutes', countdown.minutes, copy.minutes],
                                            ['seconds', countdown.seconds, copy.seconds],
                                        ] as const
                                    ).map(([key, value, label]) => (
                                        <div key={key}>
                                            <dt className="sr-only">{label}</dt>
                                            <dd
                                                className="text-4xl sm:text-5xl"
                                                style={{ fontFamily: theme.headingFont }}
                                            >
                                                {String(value).padStart(2, '0')}
                                            </dd>
                                            <p className="mt-2 text-[11px] tracking-[0.16em] uppercase">
                                                {label}
                                            </p>
                                        </div>
                                    ))}
                                </dl>
                            )}
                        </>
                    )}
                </section>
            )}

            {show('couple') && (
                <section className="mx-auto grid max-w-5xl gap-10 px-6 py-8 sm:grid-cols-2">
                    {(wedding.hosts && wedding.hosts.length > 0
                        ? wedding.hosts
                        : [
                              { id: 1, name: wedding.display.bride, role: 'bride', description: null },
                              { id: 2, name: wedding.display.groom, role: 'groom', description: null },
                          ].filter((host) => host.name)
                    ).map((host) => (
                        <div
                            key={host.id}
                            className="border-t pt-6"
                            style={{ borderColor: theme.secondaryColor }}
                        >
                            <p className="text-xs tracking-[0.18em] uppercase">{host.role}</p>
                            <p
                                className="text-5xl"
                                style={{ fontFamily: theme.headingFont }}
                            >
                                {host.name}
                            </p>
                            {host.description && <p className="mt-2">{host.description}</p>}
                        </div>
                    ))}
                </section>
            )}

            {show('message') && (wedding.description || wedding.host_message) && (
                <section className="mx-auto max-w-2xl px-6 py-16">
                    <p className="text-lg leading-8 whitespace-pre-wrap">
                        {wedding.description || wedding.host_message}
                    </p>
                </section>
            )}

            {show('story') && wedding.story && (
                <section className="mx-auto max-w-2xl px-6 py-16">
                    <h2
                        className="text-4xl"
                        style={{ fontFamily: theme.headingFont }}
                    >
                        {copy.story}
                    </h2>
                    <p className="mt-6 text-lg leading-8 whitespace-pre-wrap">
                        {wedding.story}
                    </p>
                </section>
            )}

            {show('events') && wedding.events.length > 0 && (
                <section className="mx-auto max-w-3xl px-6 py-16">
                    <h2
                        className="text-4xl"
                        style={{ fontFamily: theme.headingFont }}
                    >
                        {copy.events}
                    </h2>
                    <ol className="mt-10 space-y-8 border-l pl-6" style={{ borderColor: theme.primaryColor }}>
                        {wedding.events.map((event) => (
                            <li key={event.id}>
                                <p className="text-xs tracking-[0.18em] uppercase">
                                    {formatDate(event.event_date, wedding.locale)}
                                    {event.start_time
                                        ? ` · ${event.start_time}${event.end_time ? `–${event.end_time}` : ''}`
                                        : ''}
                                </p>
                                <h3
                                    className="mt-1 text-3xl"
                                    style={{ fontFamily: theme.headingFont }}
                                >
                                    {event.title}
                                </h3>
                                {event.description && (
                                    <p className="mt-2 whitespace-pre-wrap">
                                        {event.description}
                                    </p>
                                )}
                                <p className="mt-2 text-sm">
                                    {[event.venue_name, event.city]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                                {event.dress_code && (
                                    <p className="text-sm opacity-80">
                                        {event.dress_code}
                                    </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                                    {event.map_url && (
                                        <a
                                            className="underline"
                                            href={event.map_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {copy.directions}
                                        </a>
                                    )}
                                    <a className="underline" href={event.google_calendar_url} target="_blank" rel="noreferrer">
                                        {copy.calendar}
                                    </a>
                                    <a className="underline" href={event.ics_url}>
                                        .ics
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {show('gallery') && wedding.photos.length > 0 ? (
                <section className="mx-auto max-w-5xl px-6 py-16">
                    <h2 className="text-4xl" style={{ fontFamily: theme.headingFont }}>
                        {copy.gallery}
                    </h2>
                    {useStyledGallery ? (
                        <SiteGallerySection
                            photos={styledGalleryPhotos}
                            styleId={resolveGalleryStyleId(galleryStyle)}
                            desktop
                        />
                    ) : (
                        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
                            {wedding.photos.map((photo) => (
                                <figure key={photo.id} className="overflow-hidden" style={{ borderRadius: theme.borderRadius }}>
                                    <img
                                        src={photo.url}
                                        alt={photo.caption ?? ''}
                                        loading="lazy"
                                        className="aspect-[4/5] w-full object-cover"
                                    />
                                    {photo.caption && (
                                        <figcaption className="mt-2 text-sm">
                                            {photo.caption}
                                        </figcaption>
                                    )}
                                </figure>
                            ))}
                        </div>
                    )}
                </section>
            ) : !show('gallery') ? (
                <ClassicSectionNote
                    title={String(wedding.details?.section_note_gallery_title || '')}
                    body={String(wedding.details?.section_note_gallery_body || '')}
                    headingFont={theme.headingFont}
                />
            ) : null}

            {show('venue') && (wedding.venue_name || place) ? (
                <section className="mx-auto max-w-3xl px-6 py-16">
                    <h2 className="text-4xl" style={{ fontFamily: theme.headingFont }}>
                        {copy.venue}
                    </h2>
                    <p className="mt-4 text-2xl" style={{ fontFamily: theme.headingFont }}>
                        {wedding.venue_name}
                    </p>
                    <p className="mt-2">
                        {[wedding.venue_address, place].filter(Boolean).join(', ')}
                    </p>
                    {show('map') && wedding.map_url && (
                        <a
                            className="mt-6 inline-flex min-h-11 items-center rounded-full px-5"
                            style={{
                                background: theme.primaryColor,
                                color: theme.backgroundColor,
                            }}
                            href={wedding.map_url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {copy.directions}
                        </a>
                    )}
                </section>
            ) : !show('venue') ? (
                <ClassicSectionNote
                    title={String(wedding.details?.section_note_venue_title || '')}
                    body={String(wedding.details?.section_note_venue_body || '')}
                    headingFont={theme.headingFont}
                />
            ) : null}

            {/* Legacy travel/stay blocks only when Core Extras travel_stays is off (avoid double render). */}
            {show('travel') && !coreTravelOn && wedding.travel.length > 0 && (
                <section className="mx-auto max-w-3xl px-6 py-10">
                    <h2 className="text-4xl" style={{ fontFamily: theme.headingFont }}>
                        {copy.travel}
                    </h2>
                    <div className="mt-6 space-y-5">
                        {wedding.travel.map((item) => (
                            <div key={item.id}>
                                <p className="text-xs tracking-[0.16em] uppercase">
                                    {item.kind}
                                </p>
                                <h3 className="text-2xl" style={{ fontFamily: theme.headingFont }}>
                                    {item.title}
                                </h3>
                                {item.description && (
                                    <p className="mt-1 whitespace-pre-wrap">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {show('accommodation') && !coreTravelOn && wedding.accommodations.length > 0 && (
                <section className="mx-auto max-w-3xl px-6 py-10">
                    <h2 className="text-4xl" style={{ fontFamily: theme.headingFont }}>
                        {copy.stay}
                    </h2>
                    <div className="mt-6 space-y-6">
                        {wedding.accommodations.map((stay) => (
                            <div key={stay.id}>
                                <h3 className="text-2xl" style={{ fontFamily: theme.headingFont }}>
                                    {stay.hotel_name}
                                </h3>
                                {stay.address && <p>{stay.address}</p>}
                                {stay.price_info && <p>{stay.price_info}</p>}
                                {stay.description && (
                                    <p className="mt-1 whitespace-pre-wrap">
                                        {stay.description}
                                    </p>
                                )}
                                <div className="mt-2 flex gap-4 text-sm">
                                    {stay.phone && <span>{stay.phone}</span>}
                                    {stay.booking_url && (
                                        <a className="underline" href={stay.booking_url}>
                                            Book
                                        </a>
                                    )}
                                    {stay.website && (
                                        <a className="underline" href={stay.website}>
                                            Website
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {show('agenda') && wedding.details?.agenda && (
                <section className="mx-auto max-w-2xl px-6 py-10">
                    <h2 className="text-4xl" style={{ fontFamily: theme.headingFont }}>Agenda</h2>
                    <p className="mt-4 whitespace-pre-wrap">{wedding.details.agenda}</p>
                </section>
            )}

            {show('speakers') && wedding.details?.speakers && (
                <section className="mx-auto max-w-2xl px-6 py-10">
                    <h2 className="text-4xl" style={{ fontFamily: theme.headingFont }}>Speakers</h2>
                    <p className="mt-4 whitespace-pre-wrap">{wedding.details.speakers}</p>
                </section>
            )}

            {show('registry') && wedding.details?.registry && (
                <section className="mx-auto max-w-2xl px-6 py-10">
                    <h2 className="text-4xl" style={{ fontFamily: theme.headingFont }}>Registry</h2>
                    <p className="mt-4 whitespace-pre-wrap">{wedding.details.registry}</p>
                </section>
            )}

            {show('contact') && wedding.details?.contact && (
                <section className="mx-auto max-w-2xl px-6 py-10">
                    <h2 className="text-4xl" style={{ fontFamily: theme.headingFont }}>Contact</h2>
                    <p className="mt-4 whitespace-pre-wrap">{wedding.details.contact}</p>
                </section>
            )}

            <CoreSiteSections
                sections={wedding.sections}
                extras={coreExtras}
                occasion={wedding.occasion}
                desktop
            />

            <GuestPhotoWall
                slug={interactive && !preview ? wedding.slug : ''}
                inviteRootDomain={wedding.invite_root_domain}
                photos={wedding.guest_photos ?? []}
                enabled={isPhotoWallEnabled(wedding.details as Record<string, string>)}
                guestName={wedding.guest?.name}
            />

            {show('rsvp') && (
                <section id="rsvp" className="mx-auto max-w-xl px-6 py-16">
                    <h2 className="text-4xl" style={{ fontFamily: theme.headingFont }}>
                        {copy.rsvp}
                    </h2>
                    {interactive ? (
                        <RsvpForm wedding={wedding} />
                    ) : (
                        <p className="mt-4 text-sm opacity-80">
                            Replies open on the published invitation.
                        </p>
                    )}
                </section>
            )}

            {show('guestbook') && (
                <section id="guestbook" className="mx-auto max-w-xl px-6 py-10">
                    <h2 className="text-4xl" style={{ fontFamily: theme.headingFont }}>
                        {copy.guestbook}
                    </h2>
                    <div className="mt-6 space-y-4">
                        {wedding.guestbook.map((entry) => (
                            <blockquote key={entry.id}>
                                <p className="whitespace-pre-wrap">{entry.message}</p>
                                <footer className="mt-1 text-sm">{entry.name}</footer>
                            </blockquote>
                        ))}
                    </div>
                    {interactive && !preview && <GuestbookForm wedding={wedding} />}
                </section>
            )}

            <section className="mx-auto max-w-xl px-6 py-8">
                <SiteShareChannelsRow
                    variant="classic"
                    links={wedding.share_links}
                    shareUrl={wedding.share_url}
                    shareMessage={wedding.share_message}
                    inviteSlug={!preview && interactive ? wedding.slug : null}
                    inviteRootDomain={wedding.invite_root_domain}
                    className="justify-start"
                />
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <button type="button" className="min-h-11 underline" onClick={() => void copyLink('instagram')}>
                        Instagram
                    </button>
                    {copied ? (
                        <span className="inline-flex min-h-11 items-center opacity-70">{copy.copied}</span>
                    ) : null}
                </div>
            </section>

            {show('footer') && (
                <footer className="px-6 py-16 text-center text-sm tracking-[0.16em] uppercase">
                    {wedding.host_message && (
                        <p className="mb-6 text-base tracking-normal normal-case">
                            {wedding.host_message}
                        </p>
                    )}
                    {copy.footer}
                </footer>
            )}

            {show('rsvp') && interactive && (
                <a
                    href="#rsvp"
                    className="fixed right-4 bottom-4 left-4 z-30 flex min-h-12 items-center justify-center rounded-full text-sm sm:hidden"
                    style={{
                        background: theme.primaryColor,
                        color: theme.backgroundColor,
                    }}
                >
                    {copy.rsvp}
                </a>
            )}
        </article>
        </PreviewLiveProvider>
    );
}

function RsvpForm({ wedding }: { wedding: WeddingPage }) {
    const copy = copyFor(wedding.locale);
    const fields = wedding.rsvp_fields ?? ['attend', 'schedule', 'party_size', 'meal', 'note'];
    const wants = (field: string) => fields.includes(field);
    const form = useForm({
        guest_name: wedding.guest?.name ?? '',
        email: wedding.guest?.email ?? '',
        status: 'attending',
        guest_count: wedding.guest?.number_of_guests ?? 1,
        meal_preference: 'no_preference',
        dietary_restrictions: '',
        message: '',
        company: '',
        job_title: '',
        events: Object.fromEntries(
            wedding.events.map((event) => [String(event.id), true]),
        ) as Record<string, boolean>,
    });

    const action = wedding.guest
        ? inviteActionPath(wedding, `g/${wedding.guest.token}/rsvp`)
        : inviteActionPath(wedding, 'rsvp');

    const windowState = wedding.rsvp_window;
    const deadlineLabel = windowState?.deadline
        ? new Date(`${windowState.deadline}T12:00:00`).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : null;
    const softClosed = Boolean(windowState?.closed && (windowState?.soft_close ?? true));

    if (softClosed) {
        return (
            <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-5 py-6 text-center">
                <p className="font-serif text-2xl text-zinc-950">RSVPs are closed</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {deadlineLabel
                        ? `Replies closed on ${deadlineLabel}. Please contact the hosts if you need to update your response.`
                        : 'Replies are no longer being accepted online. Please contact the hosts directly.'}
                </p>
            </div>
        );
    }

    return (
        <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                form.post(action, { preserveScroll: true });
            }}
        >
            <fieldset className="grid gap-2">
                <legend className="sr-only">{copy.rsvp}</legend>
                {(
                    [
                        ['attending', copy.yes],
                        ['not_attending', copy.no],
                        ['maybe', copy.maybe],
                    ] as const
                ).map(([value, label]) => (
                    <label key={value} className="flex min-h-11 items-center gap-3">
                        <input
                            type="radio"
                            name="status"
                            value={value}
                            checked={form.data.status === value}
                            onChange={() => form.setData('status', value)}
                        />
                        {label}
                    </label>
                ))}
            </fieldset>
            <label className="block text-sm">
                {copy.yourName}
                <input
                    className="mt-1 w-full border bg-transparent px-3 py-3"
                    value={form.data.guest_name}
                    onChange={(event) => form.setData('guest_name', event.target.value)}
                    required
                />
            </label>
            <label className="block text-sm">
                Email
                <input
                    type="email"
                    className="mt-1 w-full border bg-transparent px-3 py-3"
                    value={form.data.email}
                    onChange={(event) => form.setData('email', event.target.value)}
                    required
                />
            </label>
            {form.data.status === 'attending' && (
                <>
                    {wants('party_size') && (
                    <label className="block text-sm">
                        {copy.guests}
                        <input
                            type="number"
                            min={1}
                            max={20}
                            className="mt-1 w-full border bg-transparent px-3 py-3"
                            value={form.data.guest_count}
                            onChange={(event) =>
                                form.setData('guest_count', Number(event.target.value))
                            }
                        />
                    </label>
                    )}
                    {wants('meal') && (
                    <label className="block text-sm">
                        {copy.meal}
                        <select
                            className="mt-1 w-full border bg-transparent px-3 py-3"
                            value={form.data.meal_preference}
                            onChange={(event) =>
                                form.setData('meal_preference', event.target.value)
                            }
                        >
                            {Object.entries(wedding.options.meals).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    )}
                    {wants('schedule') && wedding.events.length > 0 && (
                    <fieldset>
                        <legend className="text-sm">{copy.events}</legend>
                        {wedding.events.map((event) => (
                            <label key={event.id} className="mt-2 flex min-h-11 items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={form.data.events[String(event.id)] ?? false}
                                    onChange={(input) =>
                                        form.setData('events', {
                                            ...form.data.events,
                                            [String(event.id)]: input.target.checked,
                                        })
                                    }
                                />
                                {event.title}
                            </label>
                        ))}
                    </fieldset>
                    )}
                    {wants('company') && (
                        <label className="block text-sm">
                            Company
                            <input className="mt-1 w-full border bg-transparent px-3 py-3" value={form.data.company} onChange={(event) => form.setData('company', event.target.value)} />
                        </label>
                    )}
                    {wants('job_title') && (
                        <label className="block text-sm">
                            Job title
                            <input className="mt-1 w-full border bg-transparent px-3 py-3" value={form.data.job_title} onChange={(event) => form.setData('job_title', event.target.value)} />
                        </label>
                    )}
                </>
            )}
            {wants('dietary') && (
            <label className="block text-sm">
                {copy.dietary}
                <input
                    className="mt-1 w-full border bg-transparent px-3 py-3"
                    value={form.data.dietary_restrictions}
                    onChange={(event) =>
                        form.setData('dietary_restrictions', event.target.value)
                    }
                />
            </label>
            )}
            {(wants('note') || wants('message')) && (
            <label className="block text-sm">
                {copy.message}
                <textarea
                    className="mt-1 w-full border bg-transparent px-3 py-3"
                    value={form.data.message}
                    onChange={(event) => form.setData('message', event.target.value)}
                />
            </label>
            )}
            {form.hasErrors && (
                <p className="text-sm">{Object.values(form.errors)[0]}</p>
            )}
            <button
                type="submit"
                className="min-h-12 w-full rounded-full"
                style={{
                    background: 'var(--invite-primary)',
                    color: wedding.theme.backgroundColor,
                }}
                disabled={form.processing}
            >
                {copy.send}
            </button>
        </form>
    );
}

function GuestbookForm({ wedding }: { wedding: WeddingPage }) {
    const copy = copyFor(wedding.locale);
    const form = useForm<{ name: string; message: string; photo: File | null }>({
        name: wedding.guest?.name ?? '',
        message: '',
        photo: null,
    });

    return (
        <form
            className="mt-8 space-y-3"
            onSubmit={(event) => {
                event.preventDefault();
                form.post(inviteActionPath(wedding, 'guestbook'), {
                    preserveScroll: true,
                    forceFormData: true,
                });
            }}
        >
            <label className="block text-sm">
                {copy.yourName}
                <input
                    className="mt-1 w-full border bg-transparent px-3 py-3"
                    value={form.data.name}
                    onChange={(event) => form.setData('name', event.target.value)}
                    required
                />
            </label>
            <label className="block text-sm">
                {copy.message}
                <textarea
                    className="mt-1 w-full border bg-transparent px-3 py-3"
                    value={form.data.message}
                    onChange={(event) => form.setData('message', event.target.value)}
                    required
                />
            </label>
            <label className="block text-sm">
                Photo
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-1 block w-full"
                    onChange={(event) =>
                        form.setData('photo', event.target.files?.[0] ?? null)
                    }
                />
            </label>
            <button type="submit" className="min-h-11 underline" disabled={form.processing}>
                {copy.send}
            </button>
        </form>
    );
}
