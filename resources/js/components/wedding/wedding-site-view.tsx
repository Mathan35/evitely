import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { CardCanvas } from '@/components/cards/card-canvas';
import { InvitationIntroGate, buildInvitationIntroContent } from '@/components/invitation/invitation-intro';
import { buildPreviewLiveFromForm } from '@/components/marketing/site-previews/preview-live';
import { sectionNotesFromDetails } from '@/lib/site-section-visibility';
import { isCelebrateEnabled } from '@/components/studio/preferences-panel';
import { GuestPhotoWall } from '@/components/wedding/guest-photo-wall';
import { isPhotoWallEnabled } from '@/components/studio/preferences-panel';
import { coreExtrasFromDetails } from '@/lib/core-site-sections';
import { staysFromAccommodations, travelNotesFromRelational } from '@/lib/stays-from-accommodations';
import { GalleryWebsiteCanvas } from '@/components/studio/gallery-website-canvas';
import { PlatformBrandBadge, shouldHidePlatformBrand } from '@/components/platform-brand-badge';
import { WeddingExperience } from '@/components/wedding/wedding-experience';
import type { EditorDevice } from '@/components/studio/editor-modules';
import { useViewportPreviewDevice } from '@/hooks/use-viewport-preview-device';
import { resolveIntroStyleId } from '@/lib/invitation-intro-styles';
import { resolveSiteBackgroundOverride } from '@/lib/site-backgrounds';
import { buildTemplatePreviewModel } from '@/lib/template-preview-model';
import {
    replaceLangInUrl,
    resolveLocalizedWedding,
    weddingLocaleOptions,
} from '@/lib/wedding-locale';
import { cn } from '@/lib/utils';
import type { GalleryDesign } from '@/types/gallery';
import type { CardDocument, WeddingPage } from '@/types/wedding';

export type WeddingSiteUserCard = {
    event_id: number;
    document: CardDocument | null;
    width?: number;
    height?: number;
} | null;

/**
 * Renders the same website guests will see: gallery template + saved details when available,
 * otherwise the classic WeddingExperience.
 */
export function WeddingSiteView({
    wedding,
    galleryDesign = null,
    gallerySlug = null,
    userCard = null,
    device = 'desktop',
    preview = false,
    framed = false,
}: {
    wedding: WeddingPage;
    galleryDesign?: GalleryDesign | null;
    gallerySlug?: string | null;
    userCard?: WeddingSiteUserCard;
    device?: EditorDevice;
    preview?: boolean;
    framed?: boolean;
}) {
    // Public / View site: follow the real viewport. Editor frames keep the explicit device prop.
    const viewportDevice = useViewportPreviewDevice();
    const resolvedDevice: EditorDevice = framed ? device : viewportDevice;
    const useGallery = Boolean(galleryDesign && galleryDesign.kind === 'link' && wedding.invitation_mode !== 'card');
    const hidePlatformBrand = shouldHidePlatformBrand(wedding.site_billing);
    const createCtaUrl = wedding.create_cta_url || '/register';

    const localeOptions = useMemo(() => weddingLocaleOptions(wedding), [wedding]);
    const [activeLocale, setActiveLocale] = useState(
        () => wedding.locale || wedding.language || 'en',
    );
    const [localeFading, setLocaleFading] = useState(false);

    useEffect(() => {
        const next = wedding.locale || wedding.language || 'en';
        setActiveLocale((current) => (current === next ? current : next));
    }, [wedding.locale, wedding.language]);

    function handleLocaleChange(code: string): void {
        if (!code || code === activeLocale) {
            return;
        }
        setLocaleFading(true);
        setActiveLocale(code);
        replaceLangInUrl(code);
        window.setTimeout(() => setLocaleFading(false), 220);
    }

    const localized = useMemo(
        () => resolveLocalizedWedding(wedding, activeLocale),
        [activeLocale, wedding],
    );

    const details = useMemo(() => {
        const raw = localized.details ?? {};
        const next: Record<string, string> = {};
        Object.entries(raw).forEach(([key, value]) => {
            next[key] = value == null ? '' : String(value);
        });
        return next;
    }, [localized.details]);

    const templateModel = useMemo(
        () =>
            buildTemplatePreviewModel(
                galleryDesign,
                {
                    ...details,
                    venue_name: wedding.venue_name ?? '',
                    city_override: wedding.city ?? '',
                    venue_address: wedding.venue_address ?? '',
                    wedding_date_override: wedding.wedding_date ?? '',
                    // Prefer relational itinerary on the live site (omit JSON when events exist).
                    ...(wedding.events?.length
                        ? { schedule_json: undefined }
                        : {}),
                },
                gallerySlug || wedding.occasion,
                wedding.events,
                // Live guests never see invented sample guests / phone / schedule.
                { fillSamples: Boolean(preview) },
            ),
        [
            details,
            galleryDesign,
            gallerySlug,
            preview,
            wedding.city,
            wedding.events,
            wedding.occasion,
            wedding.venue_address,
            wedding.venue_name,
            wedding.wedding_date,
        ],
    );

    const live = useMemo(() => {
        const bgOverride = resolveSiteBackgroundOverride(
            details.site_bg_id,
            details.site_bg,
            details.site_surface,
        );

        const primaryHero =
            details.hero_message ||
            localized.host_message ||
            localized.headline ||
            templateModel.hero_message ||
            null;

        const base = buildPreviewLiveFromForm({
            locale: activeLocale,
            bride_name: localized.bride_name,
            groom_name: localized.groom_name,
            bride_display_name: localized.bride_display_name,
            groom_display_name: localized.groom_display_name,
            headline: localized.headline || details.kicker || templateModel.kicker,
            story: localized.story || details.story_body || templateModel.story_body,
            host_message: localized.host_message,
            wedding_date: wedding.wedding_date || templateModel.wedding_date,
            venue_name: wedding.venue_name || templateModel.venue_name,
            city: wedding.city || templateModel.city,
            occasion: wedding.occasion,
            heroMessage: primaryHero || templateModel.hero_message,
            eventLine: details.event_line || templateModel.event_line,
            storyHeading: details.story_heading || templateModel.story_heading,
            storyEyebrow: details.story_eyebrow || templateModel.story_eyebrow,
            storyBody: localized.story || details.story_body || templateModel.story_body,
            galleryEyebrow: details.gallery_eyebrow || templateModel.gallery_eyebrow,
            galleryTitle: details.gallery_title || templateModel.gallery_title,
            galleryIntro: details.gallery_intro || templateModel.gallery_intro,
            guestsIntro: details.guests_intro || templateModel.guests_intro,
            contactPhone: templateModel.contact_phone,
            heroImage: templateModel.hero_image,
            heroBlur: templateModel.hero_blur,
            heroZoom: templateModel.hero_zoom,
            heroPositionX: templateModel.hero_position_x,
            heroPositionY: templateModel.hero_position_y,
            ceremony: templateModel.ceremony,
            reception: templateModel.reception,
            schedule: templateModel.schedule,
            gallery: templateModel.gallery,
            guests: templateModel.guests,
            customTexts: templateModel.custom_texts,
            musicUrl: wedding.music_enabled ? wedding.music_url : null,
            wedding_time: wedding.wedding_time,
            timezone: wedding.timezone,
            siteBg: bgOverride?.bg ?? null,
            siteSurface: bgOverride?.surface ?? null,
            timerStyle: details.timer_style || null,
            heroStyle: details.hero_style || null,
            headerStyle: details.header_style || null,
            galleryStyle: details.gallery_style || null,
            sections: wedding.sections,
            sectionNotes: sectionNotesFromDetails(details as Record<string, string>),
            coreExtras: coreExtrasFromDetails(details, wedding.occasion, {
                stays: staysFromAccommodations(wedding.accommodations),
                travelNotes: travelNotesFromRelational(
                    typeof details.travel_stays_notes === 'string' ? details.travel_stays_notes : null,
                    wedding.travel,
                ),
                preferRelationalTravel: (wedding.accommodations?.length ?? 0) > 0,
            }),
            celebrateEnabled: isCelebrateEnabled(details as Record<string, string>),
            googleCalendarUrl: wedding.google_calendar_url || wedding.events?.[0]?.google_calendar_url || null,
        });

        return {
            ...base,
            guestbook: wedding.guestbook ?? [],
            inviteSlug: preview ? null : wedding.slug,
            inviteRootDomain: wedding.invite_root_domain,
            allowGuestbook:
                Boolean(wedding.slug) && !preview && wedding.sections?.guestbook !== false,
            guestName: wedding.guest?.name ?? null,
            giftClaimCounts: (wedding as { gift_claim_counts?: Record<string, number> }).gift_claim_counts ?? {},
        };
    }, [activeLocale, details, localized, preview, templateModel, wedding]);

    const hosts = [localized.groom_name, localized.bride_name]
        .map((part) => (part || '').trim())
        .filter(Boolean)
        .join(' & '); // partner / co-host omitted when cleared in Names

    const introStyle = resolveIntroStyleId(details.intro_style);

    const introContent = useMemo(
        () =>
            buildInvitationIntroContent({
                eventSlug: gallerySlug || wedding.occasion || wedding.event_type || 'wedding',
                locale: activeLocale,
                hosts: hosts || localized.headline || undefined,
                guestName: wedding.guest?.name ?? null,
                paper: wedding.theme?.backgroundColor || '#f9ebe7',
                ink: wedding.theme?.textColor || '#7a514d',
                seal: wedding.theme?.primaryColor || '#a67068',
            }),
        [
            activeLocale,
            gallerySlug,
            hosts,
            localized.headline,
            wedding.event_type,
            wedding.guest?.name,
            wedding.occasion,
            wedding.theme,
        ],
    );

    const weddingForClassic = useMemo(
        () => ({
            ...wedding,
            locale: activeLocale,
            bride_name: localized.bride_name,
            groom_name: localized.groom_name,
            bride_display_name: localized.bride_display_name,
            groom_display_name: localized.groom_display_name,
            headline: localized.headline,
            story: localized.story,
            host_message: localized.host_message,
            title: localized.title ?? wedding.title,
            details: localized.details,
        }),
        [activeLocale, localized, wedding],
    );

    // Card-only invitations must preview the edited CardCanvas — same surface guests open.
    if (wedding.invitation_mode === 'card' && userCard?.document) {
        return (
            <InvitationIntroGate
                content={introContent}
                style={introStyle}
                sessionKey={`card:${wedding.id}:${preview ? 'preview' : 'live'}:${introStyle}`}
                autoOpen={Boolean(preview && framed)}
                persistSession={Boolean(preview)}
                fullscreen={!framed}
                className={framed ? 'min-h-full' : 'min-h-svh'}
            >
                <div className="flex min-h-full items-center justify-center bg-[#1c1712] p-6 sm:p-10">
                    <CardCanvas
                        document={userCard.document}
                        width={userCard.width || 1080}
                        height={userCard.height || 1440}
                        fitWidth={resolvedDevice === 'mobile' ? 320 : 420}
                        musicUrl={wedding.music_enabled ? wedding.music_url : null}
                    />
                </div>
            </InvitationIntroGate>
        );
    }

    if (useGallery && galleryDesign) {
        const showInvitationCard = (wedding.details?.card_template ?? '') !== 'none';

        return (
            <div
                className={cn(
                    'transition-opacity duration-200 ease-out',
                    localeFading ? 'opacity-40' : 'opacity-100',
                )}
            >
                {!preview ? (
                    <Head title={wedding.seo.title}>
                        <meta name="description" content={wedding.seo.description} />
                        <link rel="canonical" href={wedding.seo.canonical} />
                        <meta property="og:title" content={wedding.seo.title} />
                        <meta property="og:description" content={wedding.seo.description} />
                        <meta property="og:url" content={wedding.seo.canonical} />
                        <meta property="og:type" content="website" />
                        {wedding.seo.image ? <meta property="og:image" content={wedding.seo.image} /> : null}
                        <meta name="twitter:card" content="summary_large_image" />
                        <meta name="twitter:title" content={wedding.seo.title} />
                        <meta name="twitter:description" content={wedding.seo.description} />
                    </Head>
                ) : null}
                <GalleryWebsiteCanvas
                    slug={gallerySlug}
                    design={galleryDesign}
                    invitationCard={null}
                    userCard={
                        userCard?.document
                            ? {
                                  document: userCard.document,
                                  width: userCard.width,
                                  height: userCard.height,
                              }
                            : null
                    }
                    device={resolvedDevice}
                    live={live}
                    framed={framed}
                    showInvitationCard={showInvitationCard}
                    wedding={weddingForClassic}
                    interactive={Boolean(wedding.slug)}
                    guestName={wedding.guest?.name ?? null}
                    intro
                    introStyle={introStyle}
                    introAutoOpen={Boolean(preview && framed)}
                    introPersistSession={Boolean(preview)}
                    previewLocales={localeOptions}
                    previewLocale={activeLocale}
                    onPreviewLocaleChange={handleLocaleChange}
                />
                {!preview ? (
                    <GuestPhotoWall
                        slug={wedding.slug}
                        inviteRootDomain={wedding.invite_root_domain}
                        photos={wedding.guest_photos ?? []}
                        enabled={isPhotoWallEnabled(details as Record<string, string>)}
                        guestName={wedding.guest?.name}
                    />
                ) : null}
                {!preview ? <PlatformBrandBadge hidden={hidePlatformBrand} href={createCtaUrl} /> : null}
            </div>
        );
    }

    return (
        <InvitationIntroGate
            content={introContent}
            style={introStyle}
            sessionKey={`classic:${wedding.id}:${preview ? 'preview' : 'live'}:${introStyle}`}
            autoOpen={Boolean(preview && framed)}
            persistSession={Boolean(preview)}
            fullscreen={!framed}
            className={framed ? 'min-h-full' : 'min-h-svh'}
        >
            <div
                className={cn(
                    'transition-opacity duration-200 ease-out',
                    localeFading ? 'opacity-40' : 'opacity-100',
                )}
            >
                <WeddingExperience
                    wedding={weddingForClassic}
                    preview={preview}
                    interactive={Boolean(wedding.slug)}
                    activeLocale={activeLocale}
                    localeOptions={localeOptions}
                    onLocaleChange={handleLocaleChange}
                />
            </div>
            {!preview ? <PlatformBrandBadge hidden={hidePlatformBrand} href={createCtaUrl} /> : null}
        </InvitationIntroGate>
    );
}
