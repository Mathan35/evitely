import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { replaceLangInUrl } from '@/lib/wedding-locale';
import { InvitationIntroGate } from '@/components/invitation/invitation-intro';
import { PreviewLeaves } from '@/components/marketing/preview-effects';
import { PreviewInteractionsProvider } from '@/components/marketing/site-previews/preview-interactions';
import {
    PreviewLiveProvider,
    type PreviewLiveContent,
} from '@/components/marketing/site-previews/preview-live';
import { PreviewLocaleProvider } from '@/components/marketing/site-previews/preview-locale-context';
import type { PreviewLocaleOption } from '@/components/marketing/site-previews/preview-locale-switch';
import type { EditorDevice, EditorSectionId } from '@/components/studio/editor-modules';
import {
    EDITOR_TO_PREVIEW_SECTION,
    liveContentFromGalleryDesign,
    mergePreviewLive,
} from '@/lib/gallery-template-seed';
import { resolveInvitationIntroContent } from '@/lib/invitation-intro-theme';
import { DEFAULT_INTRO_STYLE, resolveIntroStyleId } from '@/lib/invitation-intro-styles';
import type { PreviewDevice } from '@/lib/preview-device';
import { cn } from '@/lib/utils';
import type { GalleryDesign } from '@/types/gallery';
import type { WeddingPage } from '@/types/wedding';

function toPreviewDevice(device: EditorDevice): PreviewDevice {
    return device === 'mobile' ? 'mobile' : 'desktop';
}

type OccasionPreviewProps = {
    design: GalleryDesign;
    device: PreviewDevice;
    invitationCard?: GalleryDesign | null;
    userCard?: {
        event_id?: number | string;
        document: unknown;
        width?: number;
        height?: number;
    } | null;
    framed?: boolean;
    wedding?: WeddingPage | null;
    interactive?: boolean;
};

const OccasionPreviews = {
    wedding: lazy(() =>
        import('@/components/marketing/site-previews/wedding-website-preview').then((m) => ({
            default: m.WeddingWebsitePreview as ComponentType<OccasionPreviewProps>,
        })),
    ),
    birthday: lazy(() =>
        import('@/components/marketing/site-previews/birthday-website-preview').then((m) => ({
            default: m.BirthdayWebsitePreview as ComponentType<OccasionPreviewProps>,
        })),
    ),
    corporate: lazy(() =>
        import('@/components/marketing/site-previews/corporate-website-preview').then((m) => ({
            default: m.CorporateWebsitePreview as ComponentType<OccasionPreviewProps>,
        })),
    ),
    'baby-shower': lazy(() =>
        import('@/components/marketing/site-previews/baby-shower-website-preview').then((m) => ({
            default: m.BabyShowerWebsitePreview as ComponentType<OccasionPreviewProps>,
        })),
    ),
    party: lazy(() =>
        import('@/components/marketing/site-previews/party-website-preview').then((m) => ({
            default: m.PartyWebsitePreview as ComponentType<OccasionPreviewProps>,
        })),
    ),
    graduation: lazy(() =>
        import('@/components/marketing/site-previews/graduation-website-preview').then((m) => ({
            default: m.GraduationWebsitePreview as ComponentType<OccasionPreviewProps>,
        })),
    ),
    'bridal-shower': lazy(() =>
        import('@/components/marketing/site-previews/bridal-shower-website-preview').then((m) => ({
            default: m.BridalShowerWebsitePreview as ComponentType<OccasionPreviewProps>,
        })),
    ),
    housewarming: lazy(() =>
        import('@/components/marketing/site-previews/housewarming-website-preview').then((m) => ({
            default: m.HousewarmingWebsitePreview as ComponentType<OccasionPreviewProps>,
        })),
    ),
    custom: lazy(() =>
        import('@/components/marketing/site-previews/custom-website-preview').then((m) => ({
            default: m.CustomWebsitePreview as ComponentType<OccasionPreviewProps>,
        })),
    ),
} as const;

function OccasionWebsitePreview({
    slug,
    shared,
}: {
    slug: string;
    shared: OccasionPreviewProps;
}) {
    const Preview =
        OccasionPreviews[slug as keyof typeof OccasionPreviews] ?? OccasionPreviews.custom;

    return (
        <Suspense fallback={<div className="min-h-[50vh] w-full bg-[#f6f1e8]" aria-hidden />}>
            <Preview key={`${shared.design.id}-${slug}`} {...shared} />
        </Suspense>
    );
}

const EVENT_TYPE_TO_SLUG: Record<string, string> = {
    wedding: 'wedding',
    birthday: 'birthday',
    'corporate-event': 'corporate',
    corporate: 'corporate',
    'baby-shower': 'baby-shower',
    party: 'party',
    graduation: 'graduation',
    'bridal-shower': 'bridal-shower',
    housewarming: 'housewarming',
    custom: 'custom',
};

export function resolveGallerySlug(design: GalleryDesign, slug?: string | null): string {
    if (slug) {
        return slug;
    }

    if (design.event_type && EVENT_TYPE_TO_SLUG[design.event_type]) {
        return EVENT_TYPE_TO_SLUG[design.event_type];
    }

    const fromId = design.id.split('-')[0];

    return fromId || 'wedding';
}

export function GalleryWebsiteCanvas({
    slug,
    design,
    invitationCard,
    userCard,
    device,
    live,
    focusSection,
    focusAnchor = null,
    focusKey = 0,
    framed = true,
    showInvitationCard = true,
    wedding = null,
    interactive = false,
    intro = true,
    introStyle = DEFAULT_INTRO_STYLE,
    introReplayKey = 0,
    introAutoOpen = false,
    introPersistSession = true,
    introShowPreparing = true,
    introPreparingMs,
    introAutoOpenMs,
    guestName = null,
    previewLocales = null,
    previewLocale = null,
    onPreviewLocaleChange = null,
}: {
    slug?: string | null;
    design: GalleryDesign;
    invitationCard?: GalleryDesign | null;
    userCard?: {
        event_id?: number | string;
        document: unknown;
        width?: number;
        height?: number;
    } | null;
    device: EditorDevice;
    live?: PreviewLiveContent | null;
    focusSection?: EditorSectionId | null;
    /** Preview section id suffix (home/story/gallery/…) — overrides focusSection mapping. */
    focusAnchor?: string | null;
    /** Bump to re-scroll even when the anchor is unchanged (e.g. re-clicking a content layer). */
    focusKey?: number;
    /** When true, force reveal sections visible (editor / device-framed preview). */
    framed?: boolean;
    /** When false, hide the “The Card” block on every occasion template. */
    showInvitationCard?: boolean;
    /** Live wedding — enables real RSVP / share / calendar on the published site. */
    wedding?: WeddingPage | null;
    interactive?: boolean;
    /** Product intro overlay before the site. */
    intro?: boolean;
    /** One of ten product intro animations. */
    introStyle?: string | null;
    /** Bump from the editor to remount / replay the intro. */
    introReplayKey?: number;
    /** Studio: auto-open after cover so editing isn’t blocked. */
    introAutoOpen?: boolean;
    /** When false, editor style picks always replay (no session skip). */
    introPersistSession?: boolean;
    introShowPreparing?: boolean;
    introPreparingMs?: number;
    introAutoOpenMs?: number;
    /** Personalized “Dear …” line when known. */
    guestName?: string | null;
    /** Editor bilingual preview switch (client-side). */
    previewLocales?: PreviewLocaleOption[] | null;
    previewLocale?: string | null;
    onPreviewLocaleChange?: ((code: string) => void) | null;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const previewDevice = toPreviewDevice(device);
    const card = invitationCard ?? null;
    const resolvedSlug = resolveGallerySlug(design, slug);
    // Remount when the site template / device shell changes — not on locale.
    // Locale swaps update live props + a soft fade (no full page refresh).
    const key = `${design.id}-${card?.id ?? 'none'}-${showInvitationCard ? 'card-on' : 'card-off'}-${previewDevice}`;

    const resolvedLocale =
        previewLocale || wedding?.locale || wedding?.language || live?.locale || 'en';

    const [localeFading, setLocaleFading] = useState(false);
    useEffect(() => {
        setLocaleFading(true);
        const timer = window.setTimeout(() => setLocaleFading(false), 200);
        return () => window.clearTimeout(timer);
    }, [resolvedLocale]);

    const mergedLive = useMemo(
        () =>
            mergePreviewLive(liveContentFromGalleryDesign(design), {
                ...live,
                locale: resolvedLocale,
            }),
        [design, live, resolvedLocale],
    );

    useEffect(() => {
        if (!rootRef.current) {
            return;
        }

        const anchor =
            (focusAnchor && focusAnchor.trim()) ||
            (focusSection ? EDITOR_TO_PREVIEW_SECTION[focusSection] : null) ||
            null;

        if (!anchor) {
            return;
        }

        const scrollToAnchor = (): void => {
            const root = rootRef.current;
            if (!root) {
                return;
            }

            const target =
                root.querySelector<HTMLElement>(`[id$="-${anchor}"]`) ??
                root.querySelector<HTMLElement>(`#gh-${anchor}`);

            if (!target) {
                return;
            }

            // Reveal first so height is final, then center in the editor canvas scroller.
            root.querySelectorAll<HTMLElement>('[data-preview-reveal]:not(.is-in)').forEach((node) => {
                node.classList.add('is-in');
            });
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        };

        // Two frames: layout after reveal classes, then scroll — feels immediate on click.
        const frame = window.requestAnimationFrame(() => {
            window.requestAnimationFrame(scrollToAnchor);
        });

        return () => window.cancelAnimationFrame(frame);
    }, [focusSection, focusAnchor, focusKey]);

    const shared: OccasionPreviewProps = {
        design,
        device: previewDevice,
        invitationCard: card,
        userCard: userCard ?? null,
        framed,
        wedding: wedding ?? null,
        interactive,
    };

    const preview = (
        <OccasionWebsitePreview key={key} slug={resolvedSlug} shared={shared} />
    );

    const introContent = useMemo(
        () =>
            resolveInvitationIntroContent({
                eventSlug: resolvedSlug,
                design,
                live: mergedLive,
                guestName,
                locale: resolvedLocale,
            }),
        [design, guestName, mergedLive, resolvedLocale, resolvedSlug],
    );

    const localeOptions = useMemo((): PreviewLocaleOption[] => {
        if (previewLocales && previewLocales.length > 0) {
            return previewLocales;
        }
        if (!wedding) {
            return [];
        }
        const codes = [wedding.language, wedding.secondary_language].filter(
            (code, index, all): code is string => Boolean(code) && all.indexOf(code) === index,
        );
        if (codes.length < 2) {
            return [];
        }
        return codes.map((code) => ({
            code,
            label: wedding.options?.locales?.[code]?.native ?? code.toUpperCase(),
        }));
    }, [previewLocales, wedding]);

    const activeLocale = previewLocale || wedding?.locale || wedding?.language || localeOptions[0]?.code || '';

    function handleLocaleChange(code: string): void {
        if (onPreviewLocaleChange) {
            onPreviewLocaleChange(code);
            return;
        }
        // Soft URL update only — parent should own content swap when possible.
        replaceLangInUrl(code);
    }

    const body = (
        <div
            ref={rootRef}
            className={cn(
                'relative transition-opacity duration-200 ease-out',
                localeFading ? 'opacity-45' : 'opacity-100',
                framed
                    ? 'site-live-preview editor-live-preview flex h-full min-h-0 flex-col'
                    : 'min-h-svh max-w-[100vw] overflow-x-clip',
                !showInvitationCard && '[&_[id$="-card"]]:hidden',
            )}
            data-editor-preview={framed ? '' : undefined}
            data-invitation-card={showInvitationCard ? 'on' : 'off'}
            data-locale={resolvedLocale}
            lang={resolvedLocale}
        >
            {/* Same ambient fall layer as the marketing preview popup (petals, confetti, …).
                Published sites scroll the document — pin particles to the viewport. */}
            <PreviewLeaves eventSlug={resolvedSlug} placement={framed ? 'absolute' : 'fixed'} />
            <PreviewLocaleProvider
                locales={localeOptions}
                active={activeLocale}
                onChange={handleLocaleChange}
            >
                <PreviewInteractionsProvider
                    allowRsvp={
                        (interactive || Boolean(wedding?.slug)) && wedding?.sections?.rsvp !== false
                    }
                >
                    <PreviewLiveProvider value={mergedLive}>{preview}</PreviewLiveProvider>
                </PreviewInteractionsProvider>
            </PreviewLocaleProvider>
        </div>
    );

    if (!intro) {
        return body;
    }

    const resolvedIntroStyle = resolveIntroStyleId(
        introStyle || wedding?.details?.intro_style || DEFAULT_INTRO_STYLE,
    );

    return (
        <InvitationIntroGate
            key={`intro-gate:${resolvedIntroStyle}:${introReplayKey}:${resolvedSlug}`}
            content={introContent}
            style={resolvedIntroStyle}
            sessionKey={`site:${design.id}:${wedding?.id ?? 'sample'}:${framed ? 'framed' : 'live'}:${resolvedIntroStyle}:${introReplayKey}`}
            autoOpen={introAutoOpen}
            showPreparing={introShowPreparing}
            preparingMs={introPreparingMs}
            autoOpenMs={introAutoOpenMs}
            persistSession={introPersistSession}
            className={framed ? 'flex h-full min-h-0 flex-col' : 'relative'}
            fullscreen={!framed}
        >
            {body}
        </InvitationIntroGate>
    );
}
