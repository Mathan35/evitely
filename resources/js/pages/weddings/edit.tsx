import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PostPublishGrowthDialog } from '@/components/studio/post-publish-growth-dialog';
import { TrialWelcomeDialog } from '@/components/studio/trial-welcome-dialog';
import { buildPreviewLiveFromForm } from '@/components/marketing/site-previews/preview-live';
import { sectionNotesFromDetails } from '@/lib/site-section-visibility';
import { WeddingExperience } from '@/components/wedding/wedding-experience';
import { EditorShell } from '@/components/studio/editor-shell';
import { EditorTopBar } from '@/components/studio/editor-top-bar';
import { EditorSectionNav } from '@/components/studio/editor-section-nav';
import { EditorCanvas } from '@/components/studio/editor-canvas';
import { EditorInspector } from '@/components/studio/editor-inspector';
import { GalleryWebsiteCanvas } from '@/components/studio/gallery-website-canvas';
import {
    EditorField,
    EditorNotice,
    EditorTextInput,
} from '@/components/studio/editor-fields';
import {
    editorSectionsForOccasion,
    type EditorDevice,
    type EditorSectionId,
} from '@/components/studio/editor-modules';
import {
    ContentTemplatePanel,
    GuestsTemplatePanel,
    HeroImagePanel,
    HeroStylePanel,
    HeaderStylePanel,
    GalleryStylePanel,
    InvitationCardPanel,
    LocationTemplatePanel,
    MusicTemplatePanel,
    PhotosTemplatePanel,
    IntroStylePanel,
    TimerStylePanel,
    SiteBackgroundPanel,
    SiteLinkPanel,
    type LibraryImage,
    type UserCardOption,
} from '@/components/studio/editor-template-panels';
import { CoreExtrasPanel } from '@/components/studio/core-extras-panel';
import {
    isCelebrateEnabled,
    isRsvpRemindersEnabled,
    PreferencesPanel,
} from '@/components/studio/preferences-panel';
import { isSitePasscodeEnabled, SecurityPanel } from '@/components/studio/security-panel';
import { SeoPanel } from '@/components/studio/seo-panel';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { publishBlocking, publishChecks } from '@/lib/publish-readiness';
import {
    applyTrialDefaultDetails,
    featureLabel,
    isSectionLocked,
    isStyleOptionsLocked,
    SECTION_PREMIUM_FEATURE,
    sectionRequiresPremium,
} from '@/lib/editor-premium';
import { DEFAULT_INTRO_STYLE, resolveIntroStyleId } from '@/lib/invitation-intro-styles';
import { DEFAULT_HERO_STYLE } from '@/lib/hero-section-styles';
import { DEFAULT_HEADER_STYLE } from '@/lib/header-nav-styles';
import { DEFAULT_GALLERY_STYLE } from '@/lib/gallery-section-styles';
import { DEFAULT_COUNTDOWN_TIMER_STYLE } from '@/lib/countdown-timer-styles';
import { MUSIC_LIBRARY } from '@/lib/template-preview-model';
import { CORE_SITE_SECTION_KEYS, coreExtrasFromDetails } from '@/lib/core-site-sections';
import { acquireDocumentScrollLock } from '@/lib/document-scroll-lock';
import { resolveSiteBackgroundOverride } from '@/lib/site-backgrounds';
import {
    CONTENT_FIELD_TO_PREVIEW_ANCHOR,
    EDITOR_TO_PREVIEW_SECTION,
    mergeWeddingWithTemplateSeed,
    seedFromGallerySample,
} from '@/lib/gallery-template-seed';
import { nameFieldsForEvent } from '@/lib/event-name-fields';
import {
    buildTemplatePreviewModel,
    sanitizeDetailsForPersistence,
    syncDetailsFromModel,
    type TemplatePreviewModel,
} from '@/lib/template-preview-model';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { GalleryDesign } from '@/types/gallery';
import type { WeddingPage } from '@/types/wedding';

function buildInitialForm(
    wedding: WeddingPage,
    galleryDesign: GalleryDesign | null,
    gallerySlug?: string | null,
): FormState {
    const owner = wedding.owner;
    const seed = seedFromGallerySample(galleryDesign?.sample);
    const base = {
        bride_name: wedding.bride_name,
        groom_name: wedding.groom_name,
        bride_display_name: wedding.bride_display_name ?? '',
        groom_display_name: wedding.groom_display_name ?? '',
        headline: wedding.headline ?? '',
        story: wedding.story ?? '',
        host_message: wedding.host_message ?? '',
        wedding_date: wedding.wedding_date ?? '',
        wedding_time: wedding.wedding_time ?? '',
        timezone: wedding.timezone,
        venue_name: wedding.venue_name ?? '',
        venue_address: wedding.venue_address || galleryDesign?.sample?.venue_address || '',
        city: wedding.city ?? '',
        state: wedding.state ?? '',
        country: wedding.country ?? '',
        latitude: wedding.latitude ?? '',
        longitude: wedding.longitude ?? '',
        theme: wedding.theme_key,
        style: wedding.style,
        cultural_template: wedding.cultural_template ?? '',
        language: wedding.language,
        secondary_language: wedding.secondary_language ?? '',
        music_url: owner?.music_url ?? '',
        music_enabled: wedding.music_enabled,
        slug: wedding.slug,
        occasion: wedding.occasion,
        seo_title: wedding.seo.title,
        seo_description: wedding.seo.description,
        sections: {
            ...Object.fromEntries(CORE_SITE_SECTION_KEYS.map((key) => [key, false])),
            ...(wedding.sections ?? {}),
        },
        translation_locale: wedding.secondary_language ?? '',
        translation: {
            headline: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.headline ?? '',
            story: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.story ?? '',
            host_message: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.host_message ?? '',
            hero_message: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.hero_message ?? '',
            story_heading: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.story_heading ?? '',
            story_eyebrow: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.story_eyebrow ?? '',
            gallery_eyebrow: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.gallery_eyebrow ?? '',
            gallery_title: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.gallery_title ?? '',
            gallery_intro: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.gallery_intro ?? '',
            guests_intro: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.guests_intro ?? '',
            event_line: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.event_line ?? '',
            bride_display_name: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.bride_display_name ?? '',
            groom_display_name: owner?.translations.find((item) => item.locale === wedding.secondary_language)?.content?.groom_display_name ?? '',
        },
        details: {
            // Keep every saved template detail (gallery_json, hero_*, ceremony_json, …)
            // so editor panels and live preview restore prior media/edits.
            ...Object.fromEntries(
                Object.entries(wedding.details ?? {}).map(([key, value]) => [
                    key,
                    value == null ? '' : String(value),
                ]),
            ),
            gallery_template: wedding.details?.gallery_template ?? galleryDesign?.id ?? '',
            card_template: wedding.details?.card_template || '',
            user_card_event_id: wedding.details?.user_card_event_id || '',
            blessing: wedding.details?.blessing || galleryDesign?.sample?.blessing || '',
            request_line: wedding.details?.request_line || seed.request_line,
            message: wedding.details?.message || seed.message,
            event_name: wedding.details?.event_name || seed.event_name,
            ceremony_time: wedding.details?.ceremony_time || galleryDesign?.sample?.ceremony_time || '',
            reception_time: wedding.details?.reception_time || galleryDesign?.sample?.reception_time || '',
            puja_time: wedding.details?.puja_time || galleryDesign?.sample?.puja_time || '',
            meal_time: wedding.details?.meal_time || galleryDesign?.sample?.meal_time || '',
            rsvp_line: wedding.details?.rsvp_line || seed.rsvp_line,
            dress_code: wedding.details?.dress_code || seed.dress_code,
            hashtag: wedding.details?.hashtag || galleryDesign?.sample?.hashtag || '',
            gift_note: wedding.details?.gift_note || galleryDesign?.sample?.gift_note || '',
            compliments: wedding.details?.compliments || galleryDesign?.sample?.compliments || '',
            hosted_by: wedding.details?.hosted_by || galleryDesign?.sample?.hosted_by || '',
            contact: wedding.details?.contact || galleryDesign?.sample?.contact || '',
        },
        heading_font: wedding.theme.headingFont,
        body_font: wedding.theme.bodyFont,
    } satisfies FormState;

    const merged = mergeWeddingWithTemplateSeed(base, seed) as FormState;
    const model = buildTemplatePreviewModel(
        galleryDesign,
        {
            ...merged.details,
            venue_name: merged.venue_name,
            city_override: merged.city,
            venue_address: merged.venue_address,
        },
        gallerySlug || wedding.occasion,
    );

    if (!merged.story.trim() && model.story_body) {
        merged.story = model.story_body;
    }
    if (!merged.headline.trim() && model.kicker) {
        merged.headline = model.kicker;
    }
    if (!merged.venue_name.trim() && model.venue_name) {
        merged.venue_name = model.venue_name;
    }
    if (!merged.city.trim() && model.city) {
        merged.city = model.city;
    }
    if (!merged.venue_address.trim() && model.venue_address) {
        merged.venue_address = model.venue_address;
    }
    if (!merged.wedding_date.trim() && model.wedding_date) {
        merged.wedding_date = model.wedding_date;
    }

    merged.details = syncDetailsFromModel(merged.details, model);

    return merged;
}

type FormState = {
    bride_name: string;
    groom_name: string;
    bride_display_name: string;
    groom_display_name: string;
    headline: string;
    story: string;
    host_message: string;
    wedding_date: string;
    wedding_time: string;
    timezone: string;
    venue_name: string;
    venue_address: string;
    city: string;
    state: string;
    country: string;
    latitude: string;
    longitude: string;
    theme: string;
    style: string;
    cultural_template: string;
    language: string;
    secondary_language: string;
    music_url: string;
    music_enabled: boolean;
    slug: string;
    occasion: string;
    seo_title: string;
    seo_description: string;
    sections: Record<string, boolean>;
    translation_locale: string;
    translation: Record<string, string>;
    details: Record<string, string>;
    heading_font: string;
    body_font: string;
};

function withoutEditorOnly(data: FormState) {
    const { heading_font: _heading, body_font: _body, ...payload } = data;
    return {
        ...payload,
        details: sanitizeDetailsForPersistence(payload.details),
    };
}

const SECTION_COPY: Record<EditorSectionId, { title: string; description: string }> = {
    names: { title: 'Names & date', description: 'These update the live invitation as you type.' },
    content: { title: 'Content', description: 'Hero, story, gallery, and RSVP copy on the template.' },
    hero: { title: 'Hero image', description: 'Background image for the top of the website.' },
    design: { title: 'Background', description: 'Soft page colors that work on every event website.' },
    intro: {
        title: 'Intro',
        description: 'Pick how guests open the invitation — preview plays on the template instantly.',
    },
    invitation: { title: 'Invitation card', description: 'Optional — use a card you already created.' },
    timer: {
        title: 'Countdown',
        description: 'Pick a live timer design — couples, rings, and more update in real time on the site.',
    },
    guide: {
        title: 'Custom sections',
        description: 'Optional pages for guests — FAQ, attire, gifts, travel, and more. All off until you enable them.',
    },
    location: { title: 'Location', description: 'Itinerary and event venues for this invitation.' },
    photos: { title: 'Photos', description: 'Every gallery tile from the template — replace each one.' },
    guests: {
        title: 'Guests',
        description: 'Public “Who is coming” showcase on your site — separate from private Guests & RSVPs.',
    },
    music: { title: 'Music', description: 'Library tracks, upload, or URL for the mute control.' },
    preferences: {
        title: 'Preferences',
        description: 'Language, culture, celebrate button, and RSVP reminder options.',
    },
    seo: {
        title: 'Share & SEO',
        description: 'How your invite appears when shared in chat apps and search results.',
    },
    security: {
        title: 'Security',
        description: 'Optional passcode gate for the public invitation and personal guest links.',
    },
    site: { title: 'Guest link', description: 'Public URL for this invitation — not a template page section.' },
};

export default function EditWedding({
    wedding,
    gallerySlug = null,
    galleryDesign = null,
    userCards = [],
    selectedUserCard = null,
    libraryImages = [],
    createCardUrl = '',
}: {
    wedding: WeddingPage;
    gallerySlug?: string | null;
    galleryDesign?: GalleryDesign | null;
    invitationCard?: GalleryDesign | null;
    userCards?: UserCardOption[];
    selectedUserCard?: UserCardOption | null;
    libraryImages?: LibraryImage[];
    createCardUrl?: string;
}) {
    const page = usePage<{
        flash?: {
            trial_welcome?: boolean;
            publish_growth?: {
                open?: boolean;
                share_url?: string;
                title?: string;
                growth?: {
                    share_count?: number;
                    share_goal?: number;
                    has_shared?: boolean;
                    defer_paywall?: boolean;
                };
            };
        };
        growth?: { trial_days?: number; guest_limit?: number };
        billing?: {
            is_pro?: boolean;
            upgrade_url?: string;
            event_limit?: number | null;
            can_create_event?: boolean;
        } | null;
    }>();
    const useGalleryPreview =
        wedding.invitation_mode !== 'card' && Boolean(galleryDesign && galleryDesign.kind === 'link');
    const isFreePlan = !page.props.billing?.is_pro;
    const trialDays = page.props.growth?.trial_days ?? 30;

    const [trialWelcomeOpen, setTrialWelcomeOpen] = useState(
        () => Boolean(page.props.flash?.trial_welcome) && isFreePlan,
    );
    const [growthOpen, setGrowthOpen] = useState(
        () => Boolean(page.props.flash?.publish_growth?.open),
    );
    const [section, setSection] = useState<EditorSectionId>('names');
    /** Bump to remount / replay the invitation intro on the template canvas. */
    const [introReplayKey, setIntroReplayKey] = useState(0);
    /** Live-preview scroll target — bumped on every content-layer / section click. */
    const [previewFocus, setPreviewFocus] = useState<{ anchor: string; key: number }>({
        anchor: 'home',
        key: 0,
    });
    const [device, setDevice] = useState<EditorDevice>(() =>
        typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
    );
    const [navOpen, setNavOpen] = useState(true);
    const [inspectorOpen, setInspectorOpen] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false,
    );
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [dirty, setDirty] = useState(false);
    const [past, setPast] = useState<string[]>([]);
    const [future, setFuture] = useState<string[]>([]);
    const [publishing, setPublishing] = useState(false);
    const [publishGateOpen, setPublishGateOpen] = useState(false);
    const [publishChooserOpen, setPublishChooserOpen] = useState(false);
    const [trialConfirmOpen, setTrialConfirmOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(wedding.status);
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [previewLocale, setPreviewLocale] = useState(() => wedding.language || 'en');
    const [listed, setListed] = useState(() => {
        if (wedding.status === 'published') {
            return true;
        }
        const flag = wedding.details?.editor_saved;
        if (flag == null || flag === '') {
            return true; // legacy events
        }
        return String(flag) === '1' || String(flag).toLowerCase() === 'true';
    });
    const skippingHistory = useRef(false);
    const dirtyRef = useRef(false);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        let wasDesktop = mq.matches;
        const sync = (): void => {
            const desktop = mq.matches;
            setDevice(desktop ? 'desktop' : 'mobile');
            if (desktop && !wasDesktop) {
                setInspectorOpen(true);
                setNavOpen(true);
            } else if (!desktop && wasDesktop) {
                // Only auto-close when crossing down to mobile — never while editing on phone.
                setInspectorOpen(false);
            }
            wasDesktop = desktop;
        };
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    // Lock page scroll so dock taps never jump the page (parity with card editor).
    useEffect(() => acquireDocumentScrollLock(), []);

    const form = useForm<FormState>(buildInitialForm(wedding, galleryDesign, gallerySlug));
    const selectedUserCardEventId = form.data.details.user_card_event_id || (selectedUserCard ? String(selectedUserCard.event_id) : '');
    const activeUserCard = useMemo(() => {
        if (form.data.details.card_template === 'none') {
            return null;
        }
        if (selectedUserCardEventId) {
            return userCards.find((card) => String(card.event_id) === selectedUserCardEventId) ?? selectedUserCard;
        }
        return userCards.find((card) => card.is_current) ?? selectedUserCard ?? null;
    }, [form.data.details.card_template, selectedUserCard, selectedUserCardEventId, userCards]);

    const templateModel = useMemo(
        () =>
            buildTemplatePreviewModel(
                galleryDesign,
                {
                    ...form.data.details,
                    venue_name: form.data.venue_name,
                    city_override: form.data.city,
                    venue_address: form.data.venue_address,
                },
                gallerySlug || wedding.occasion,
            ),
        [form.data.city, form.data.details, form.data.venue_address, form.data.venue_name, galleryDesign, gallerySlug, wedding.occasion],
    );

    useEffect(() => {
        dirtyRef.current = dirty;
    }, [dirty]);

    useEffect(() => {
        const onLeave = (event: BeforeUnloadEvent): void => {
            if (dirtyRef.current) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', onLeave);
        return () => window.removeEventListener('beforeunload', onLeave);
    }, []);

    const live = useMemo<WeddingPage>(() => {
        const theme = wedding.options.themes.find((item) => item.id === form.data.theme) ?? wedding.theme;
        return {
            ...wedding,
            ...form.data,
            latitude: form.data.latitude || null,
            longitude: form.data.longitude || null,
            bride_display_name: form.data.bride_display_name || null,
            groom_display_name: form.data.groom_display_name || null,
            cultural_template: form.data.cultural_template || null,
            secondary_language: form.data.secondary_language || null,
            wedding_date: form.data.wedding_date || null,
            wedding_time: form.data.wedding_time || null,
            details: {
                ...wedding.details,
                ...form.data.details,
            },
            display: {
                bride: form.data.bride_display_name || form.data.bride_name,
                groom: form.data.groom_display_name || form.data.groom_name,
            },
            theme: {
                ...theme,
                headingFont: form.data.heading_font || theme.headingFont,
                bodyFont: form.data.body_font || theme.bodyFont,
            },
            theme_key: form.data.theme,
            music_url: form.data.music_enabled ? form.data.music_url || null : null,
            music_enabled: form.data.music_enabled,
            story: form.data.story,
            headline: form.data.headline,
            host_message: form.data.host_message,
            sections: form.data.sections,
            photos: wedding.photos,
            cover_url: wedding.cover_url,
            events: wedding.events,
            travel: wedding.travel,
            accommodations: wedding.accommodations,
        };
    }, [form.data, wedding]);

    // Language switch is live-only: editing always stays in the primary language.
    // Guests see the bilingual switch (and translated copy) after publish.
    const previewLocaleOptions = useMemo(() => {
        if (status !== 'published') {
            return [];
        }
        const codes = [form.data.language, form.data.secondary_language].filter(
            (code, index, all): code is string => Boolean(code?.trim()) && all.indexOf(code) === index,
        );
        if (codes.length < 2) {
            return [];
        }
        return codes.map((code) => ({
            code,
            label: wedding.options?.locales?.[code]?.native ?? code.toUpperCase(),
        }));
    }, [form.data.language, form.data.secondary_language, status, wedding.options?.locales]);

    useEffect(() => {
        const primary = form.data.language || 'en';
        if (status !== 'published') {
            if (previewLocale !== primary) {
                setPreviewLocale(primary);
            }
            return;
        }
        const codes = previewLocaleOptions.map((item) => item.code);
        if (codes.length === 0) {
            if (previewLocale !== primary) {
                setPreviewLocale(primary);
            }
            return;
        }
        if (!codes.includes(previewLocale)) {
            setPreviewLocale(codes[0]);
        }
    }, [form.data.language, previewLocale, previewLocaleOptions, status]);

    const previewLive = useMemo(() => {
        const bgOverride = resolveSiteBackgroundOverride(
            form.data.details.site_bg_id,
            form.data.details.site_bg,
            form.data.details.site_surface,
        );

        const useSecondary =
            Boolean(form.data.secondary_language) &&
            previewLocale === form.data.secondary_language &&
            form.data.secondary_language !== form.data.language;
        const translation = form.data.translation || {};
        const primaryHeadline = form.data.headline || templateModel.kicker;
        const primaryStory = form.data.story || templateModel.story_body;
        const primaryHero = templateModel.hero_message || form.data.host_message || primaryHeadline;

        return buildPreviewLiveFromForm({
            locale: previewLocale || form.data.language || 'en',
            bride_name: useSecondary
                ? translation.bride_display_name || form.data.bride_name
                : form.data.bride_name,
            groom_name: useSecondary
                ? translation.groom_display_name || form.data.groom_name
                : form.data.groom_name,
            bride_display_name: useSecondary
                ? translation.bride_display_name || form.data.bride_display_name
                : form.data.bride_display_name,
            groom_display_name: useSecondary
                ? translation.groom_display_name || form.data.groom_display_name
                : form.data.groom_display_name,
            headline: useSecondary
                ? translation.headline || primaryHeadline
                : primaryHeadline,
            story: useSecondary ? translation.story || primaryStory : primaryStory,
            host_message: useSecondary
                ? translation.host_message || form.data.host_message
                : form.data.host_message,
            wedding_date: form.data.wedding_date || templateModel.wedding_date,
            wedding_time: form.data.wedding_time,
            timezone: form.data.timezone,
            venue_name: form.data.venue_name || templateModel.venue_name,
            city: form.data.city || templateModel.city,
            occasion: form.data.occasion || wedding.occasion,
            heroMessage: useSecondary
                ? translation.hero_message ||
                  translation.host_message ||
                  translation.headline ||
                  primaryHero
                : primaryHero,
            storyHeading: useSecondary
                ? translation.story_heading || templateModel.story_heading
                : templateModel.story_heading,
            storyEyebrow: useSecondary
                ? translation.story_eyebrow || templateModel.story_eyebrow
                : templateModel.story_eyebrow,
            storyBody: useSecondary ? translation.story || primaryStory : primaryStory,
            galleryEyebrow: useSecondary
                ? translation.gallery_eyebrow || templateModel.gallery_eyebrow
                : templateModel.gallery_eyebrow,
            galleryTitle: useSecondary
                ? translation.gallery_title || templateModel.gallery_title
                : templateModel.gallery_title,
            galleryIntro: useSecondary
                ? translation.gallery_intro || templateModel.gallery_intro
                : templateModel.gallery_intro,
            guestsIntro: useSecondary
                ? translation.guests_intro || templateModel.guests_intro
                : templateModel.guests_intro,
            eventLine: useSecondary
                ? translation.event_line || templateModel.event_line
                : templateModel.event_line,
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
            musicUrl: form.data.music_enabled ? form.data.music_url || null : null,
            siteBg: bgOverride?.bg ?? null,
            siteSurface: bgOverride?.surface ?? null,
            timerStyle: form.data.details.timer_style || null,
            heroStyle: form.data.details.hero_style || null,
            headerStyle: form.data.details.header_style || null,
            galleryStyle: form.data.details.gallery_style || null,
            sections: form.data.sections,
            sectionNotes: sectionNotesFromDetails(form.data.details),
            coreExtras: coreExtrasFromDetails(form.data.details, form.data.occasion || wedding.occasion),
            celebrateEnabled: isCelebrateEnabled(form.data.details),
            googleCalendarUrl: wedding.google_calendar_url || wedding.events?.[0]?.google_calendar_url || null,
        });
    }, [form.data, previewLocale, templateModel, wedding.occasion, wedding.google_calendar_url, wedding.events]);

    function selectSection(id: EditorSectionId): void {
        setSection(id);
        if (id === 'intro') {
            setIntroReplayKey((value) => value + 1);
        }
        setPreviewFocus((prev) => ({
            anchor: EDITOR_TO_PREVIEW_SECTION[id] ?? 'home',
            key: prev.key + 1,
        }));

        const mobile = device === 'mobile' || window.matchMedia('(max-width: 767px)').matches;
        if (!mobile) {
            return;
        }

        setInspectorOpen(true);

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                const sheet = window.document.querySelector<HTMLElement>('[data-mobile-editor-sheet]');
                sheet
                    ?.querySelector<HTMLElement>('[data-editor-inspector-scroll]')
                    ?.scrollTo({ top: 0, behavior: 'smooth' });
                window.document
                    .querySelector<HTMLElement>('[data-mobile-editor-dock] [aria-current="true"]')
                    ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            });
        });
    }

    function focusContentField(fieldId: string): void {
        setPreviewFocus((prev) => ({
            anchor: CONTENT_FIELD_TO_PREVIEW_ANCHOR[fieldId] ?? 'home',
            key: prev.key + 1,
        }));
    }

    function patchTemplateModel(patch: Partial<TemplatePreviewModel>): void {
        const nextModel = { ...templateModel, ...patch };
        const nextData: FormState = {
            ...form.data,
            details: syncDetailsFromModel(form.data.details, nextModel),
            ...(patch.story_body !== undefined ? { story: patch.story_body } : {}),
            ...(patch.kicker !== undefined ? { headline: patch.kicker } : {}),
        };

        if (!skippingHistory.current) {
            setPast((stack) => [...stack.slice(-39), JSON.stringify(form.data)]);
            setFuture([]);
        }
        form.setData(nextData);
        setDirty(true);
        setSavedAt('Unsaved changes');
    }

    function change<K extends keyof FormState>(key: K, value: FormState[K]): void {
        if (!skippingHistory.current) {
            setPast((stack) => [...stack.slice(-39), JSON.stringify(form.data)]);
            setFuture([]);
        }
        form.setData(key as never, value as never);
        setDirty(true);
        setSavedAt('Unsaved changes');
    }

    function persistPayload(markListed = true) {
        const details = {
            ...form.data.details,
            ...(markListed ? { editor_saved: '1' } : {}),
        };
        return withoutEditorOnly({ ...form.data, details });
    }

    function saveChanges(then?: () => void, onFail?: () => void): void {
        setSaving(true);
        setSavedAt('Saving…');
        router.put(`/events/${wedding.id}`, persistPayload(true), {
            preserveScroll: true,
            preserveState: true,
            only: ['wedding', 'flash'],
            showProgress: false,
            onSuccess: (page) => {
                setDirty(false);
                setListed(true);
                setSavedAt('Saved');
                const nextDetails = (page.props as { wedding?: { details?: Record<string, string> } })
                    ?.wedding?.details;
                if (nextDetails) {
                    form.setData('details', {
                        ...form.data.details,
                        ...nextDetails,
                        site_passcode: '',
                        site_passcode_clear: '',
                    });
                } else if ((form.data.details.site_passcode || '').trim().length >= 4) {
                    form.setData('details', {
                        ...form.data.details,
                        site_passcode: '',
                        site_passcode_clear: '',
                        site_passcode_set: '1',
                        site_passcode_enabled: form.data.details.site_passcode_enabled || '1',
                    });
                }
                then?.();
            },
            onError: () => {
                setSavedAt('Save failed');
                onFail?.();
            },
            onFinish: () => setSaving(false),
        });
    }

    function requestLeave(): void {
        if (!dirty) {
            router.visit('/events');
            return;
        }
        setLeaveOpen(true);
    }

    function discardAndLeave(): void {
        setLeaving(true);
        setDirty(false);
        if (!listed) {
            router.delete(`/events/${wedding.id}`, {
                onFinish: () => setLeaving(false),
            });
            return;
        }
        router.visit('/events', {
            onFinish: () => setLeaving(false),
        });
    }

    function saveAndLeave(): void {
        setLeaving(true);
        saveChanges(
            () => router.visit('/events', { onFinish: () => setLeaving(false) }),
            () => setLeaving(false),
        );
    }

    function undo(): void {
        const previous = past[past.length - 1];
        if (!previous) {
            return;
        }
        skippingHistory.current = true;
        setFuture((stack) => [JSON.stringify(form.data), ...stack]);
        setPast((stack) => stack.slice(0, -1));
        form.setData(JSON.parse(previous) as FormState);
        setDirty(true);
        setSavedAt('Unsaved changes');
        queueMicrotask(() => {
            skippingHistory.current = false;
        });
    }

    function redo(): void {
        const next = future[0];
        if (!next) {
            return;
        }
        skippingHistory.current = true;
        setPast((stack) => [...stack, JSON.stringify(form.data)]);
        setFuture((stack) => stack.slice(1));
        form.setData(JSON.parse(next) as FormState);
        setDirty(true);
        setSavedAt('Unsaved changes');
        queueMicrotask(() => {
            skippingHistory.current = false;
        });
    }

    useEffect(() => {
        setStatus(wedding.status);
    }, [wedding.status]);

    function readinessChecks() {
        return publishChecks({
            brideName: form.data.bride_display_name || form.data.bride_name,
            groomName: form.data.groom_display_name || form.data.groom_name,
            title: form.data.title,
            weddingDate: form.data.wedding_date,
            slug: form.data.slug,
            venueName: form.data.venue_name,
            city: form.data.city,
            coverUrl: wedding.cover_url,
            listed,
        });
    }

    function runPublish(paid = false): void {
        setPublishing(true);
        router.post(`/events/${wedding.id}/publish`, paid ? { paid: 1 } : {}, {
            preserveScroll: true,
            preserveState: true,
            showProgress: false,
            onSuccess: (pageResult) => {
                setStatus('published');
                setListed(true);
                setSavedAt(isLivePaused ? 'Live again' : 'Published');
                const flash = (pageResult.props as typeof page.props).flash?.publish_growth;
                if (flash?.open) {
                    setGrowthOpen(true);
                }
            },
            onFinish: () => setPublishing(false),
        });
    }

    function stopLive(): void {
        setPublishing(true);
        router.delete(`/events/${wedding.id}/publish`, {
            preserveScroll: true,
            preserveState: true,
            showProgress: false,
            onSuccess: () => setSavedAt('Live stopped'),
            onFinish: () => setPublishing(false),
        });
    }

    const siteBilling = wedding.owner?.messaging?.billing?.site
        ?? (wedding as { site_billing?: {
            status: string;
            can_schedule_publish: boolean;
            has_paid_pack: boolean;
            is_view_only: boolean;
            legacy_account_pro?: boolean;
            upgrade_url: string;
            is_site?: boolean;
            is_card_only?: boolean;
            can_use_premium?: boolean;
            features?: Record<string, boolean>;
            trial_available?: boolean;
            trial_used_on?: { id: number; title: string; status: string } | null;
            is_live_paused?: boolean;
            is_public_live?: boolean;
        } }).site_billing;
    const trialAvailable = siteBilling?.trial_available !== false;
    const trialUsedOn = siteBilling?.trial_used_on ?? null;
    const isLivePaused = Boolean(siteBilling?.is_live_paused);

    const premiumFeatures = siteBilling?.features ?? null;
    const canUsePremium = Boolean(siteBilling?.can_use_premium);
    const lockedSectionIds = (Object.keys(SECTION_PREMIUM_FEATURE) as EditorSectionId[]).filter((id) =>
        isSectionLocked(id, premiumFeatures, canUsePremium),
    );
    const sectionLocked = isSectionLocked(section, premiumFeatures, canUsePremium);
    const lockedFeatureKey = sectionRequiresPremium(section);
    const billingUpgradeUrl = siteBilling?.upgrade_url || `/events/${wedding.id}/billing`;
    const subdomainLocked =
        !canUsePremium
        && (premiumFeatures?.subdomain_custom === false
            || (premiumFeatures == null && siteBilling?.status === 'trial'));
    const introOptionsLocked = isStyleOptionsLocked('intro', premiumFeatures, canUsePremium);
    const heroOptionsLocked = isStyleOptionsLocked('hero', premiumFeatures, canUsePremium);
    const designOptionsLocked = isStyleOptionsLocked('design', premiumFeatures, canUsePremium);
    const photosOptionsLocked = isStyleOptionsLocked('photos', premiumFeatures, canUsePremium);
    const timerOptionsLocked = isStyleOptionsLocked('timer', premiumFeatures, canUsePremium);
    const musicOptionsLocked = isStyleOptionsLocked('music', premiumFeatures, canUsePremium);

    useEffect(() => {
        const nextDetails = applyTrialDefaultDetails(form.data.details, premiumFeatures, canUsePremium, {
            intro: DEFAULT_INTRO_STYLE,
            hero: DEFAULT_HERO_STYLE,
            header: DEFAULT_HEADER_STYLE,
            gallery: DEFAULT_GALLERY_STYLE,
            timer: DEFAULT_COUNTDOWN_TIMER_STYLE,
        });
        if (nextDetails !== form.data.details) {
            change('details', nextDetails);
        }
        const defaultMusic = MUSIC_LIBRARY[0]?.url;
        if (
            musicOptionsLocked
            && defaultMusic
            && form.data.music_url
            && form.data.music_url !== defaultMusic
        ) {
            change('music_url', defaultMusic);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- normalize once when trial entitlements change
    }, [canUsePremium, premiumFeatures, musicOptionsLocked]);

    const isSiteInvitation = wedding.invitation_mode !== 'card'
        && (siteBilling?.is_site !== false)
        && siteBilling?.is_card_only !== true;

    function publish(): void {
        if (status === 'published' && isLivePaused) {
            if (dirty) {
                saveChanges(() => runPublish());
                return;
            }
            runPublish();
            return;
        }
        if (status === 'published') {
            window.open(wedding.share_url, '_blank', 'noopener,noreferrer');
            return;
        }
        if (siteBilling?.is_view_only) {
            window.location.assign(siteBilling.upgrade_url || `/events/${wedding.id}/billing`);
            return;
        }
        const blocking = publishBlocking(readinessChecks());
        if (blocking.length > 0) {
            setPublishGateOpen(true);
            return;
        }
        if (isSiteInvitation) {
            // Trial publish must confirm first — show ConfirmDialog immediately.
            if (trialAvailable) {
                setTrialConfirmOpen(true);
                return;
            }
            setPublishChooserOpen(true);
            return;
        }
        if (dirty) {
            saveChanges(() => runPublish());
            return;
        }
        runPublish();
    }

    function proceedTrialPublish(): void {
        setTrialConfirmOpen(false);
        if (dirty) {
            saveChanges(() => runPublish(false));
            return;
        }
        runPublish(false);
    }

    function openPaidPublishOptions(): void {
        setTrialConfirmOpen(false);
        setPublishChooserOpen(true);
    }

    function confirmPublishPaid(): void {
        setPublishChooserOpen(false);
        const billingUrl = siteBilling?.upgrade_url || `/events/${wedding.id}/billing`;
        if (siteBilling?.has_paid_pack || siteBilling?.legacy_account_pro) {
            if (dirty) {
                saveChanges(() => runPublish(true));
                return;
            }
            runPublish(true);
            return;
        }
        window.location.assign(`${billingUrl}?intent=publish`);
    }

    function confirmSchedulePublish(): void {
        setPublishChooserOpen(false);
        const billingUrl = siteBilling?.upgrade_url || `/events/${wedding.id}/billing`;
        window.location.assign(`${billingUrl}?intent=schedule`);
    }

    function openPreview(): void {
        const href = `/events/${wedding.id}/preview?from=edit`;
        // Open synchronously so the browser treats it as a user gesture (async save would be blocked).
        const tab = window.open('about:blank', '_blank');

        const go = () => {
            if (tab && !tab.closed) {
                tab.location.href = href;
                return;
            }
            window.location.assign(href);
        };

        if (!dirty) {
            go();
            return;
        }

        saveChanges(go, () => tab?.close());
    }

    const primaryName = form.data.bride_display_name || form.data.bride_name || 'Host';
    const secondaryName = form.data.groom_display_name || form.data.groom_name || '';
    const projectName = secondaryName && secondaryName !== primaryName
        ? `${primaryName} & ${secondaryName}`
        : primaryName;
    const meta = SECTION_COPY[section];

    return (
        <>
            <Head title={`Edit ${projectName}`} />
            {siteBilling?.is_view_only ? (
                <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-3 bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-zinc-50 shadow-md">
                    <span>Site plan ended — public view stays live; editing is locked until you extend.</span>
                    <a
                        href={siteBilling.upgrade_url || `/events/${wedding.id}/billing`}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                    >
                        Extend plan
                    </a>
                </div>
            ) : null}
            <EditorShell
                navOpen={navOpen}
                inspectorOpen={inspectorOpen}
                onToggleNav={() => setNavOpen((open) => !open)}
                onToggleInspector={() => setInspectorOpen((open) => !open)}
                topBar={
                    <EditorTopBar
                        projectName={projectName}
                        savedAt={savedAt}
                        centerNote={
                            !listed
                                ? 'Draft — Save to add this invitation to My Events.'
                                : null
                        }
                        canUndo={past.length > 0}
                        canRedo={future.length > 0}
                        onUndo={undo}
                        onRedo={redo}
                        onSave={() => saveChanges()}
                        saving={saving}
                        onPublish={publish}
                        publishing={publishing}
                        publishLabel={
                            publishing
                                ? 'Working…'
                                : siteBilling?.is_view_only
                                  ? 'Upgrade'
                                  : status === 'published'
                                    ? isLivePaused
                                        ? 'Go live'
                                        : 'View site'
                                    : 'Publish'
                        }
                        onStopLive={status === 'published' && !isLivePaused ? stopLive : undefined}
                        onPreview={openPreview}
                        previewHref={`/events/${wedding.id}/preview?from=edit`}
                        onBack={requestLeave}
                    />
                }
                nav={
                    <EditorSectionNav
                        active={section}
                        onSelect={selectSection}
                        sections={editorSectionsForOccasion(form.data.occasion || wedding.occasion || wedding.event_type)}
                        lockedSectionIds={lockedSectionIds}
                    />
                }
                canvas={
                    <EditorCanvas device={device}>
                        {useGalleryPreview && galleryDesign ? (
                            <GalleryWebsiteCanvas
                                slug={gallerySlug}
                                design={galleryDesign}
                                invitationCard={null}
                                userCard={
                                    activeUserCard?.document
                                        ? {
                                              event_id: activeUserCard.event_id,
                                              document: activeUserCard.document,
                                              width: activeUserCard.width,
                                              height: activeUserCard.height,
                                          }
                                        : null
                                }
                                device={device}
                                live={previewLive}
                                focusSection={section}
                                focusAnchor={previewFocus.anchor}
                                focusKey={previewFocus.key}
                                showInvitationCard={form.data.details.card_template !== 'none'}
                                intro
                                introStyle={resolveIntroStyleId(form.data.details.intro_style)}
                                introReplayKey={introReplayKey}
                                introAutoOpen={section !== 'intro'}
                                introPersistSession={section !== 'intro'}
                                introShowPreparing={section === 'intro'}
                                introPreparingMs={section === 'intro' ? 280 : 0}
                                introAutoOpenMs={section === 'intro' ? 420 : 0}
                                previewLocales={status === 'published' ? previewLocaleOptions : []}
                                previewLocale={
                                    status === 'published'
                                        ? previewLocale
                                        : form.data.language || 'en'
                                }
                                onPreviewLocaleChange={
                                    status === 'published' ? setPreviewLocale : null
                                }
                            />
                        ) : (
                            <div
                                data-editor-preview
                                className={cn(
                                    'editor-live-preview relative flex min-h-0 flex-1 flex-col overflow-hidden',
                                    device === 'mobile' && 'mx-auto w-full max-w-[390px]',
                                )}
                            >
                                <WeddingExperience wedding={live} preview interactive={false} />
                            </div>
                        )}
                    </EditorCanvas>
                }
                inspector={
                    <EditorInspector title={meta.title} description={meta.description} panelKey={section}>
                        {galleryDesign ? (
                            <EditorNotice className="mb-4">
                                <div className="flex items-start gap-3">
                                    {(galleryDesign.image_mobile || galleryDesign.image) && (
                                        <img
                                            src={galleryDesign.image_mobile || galleryDesign.image || ''}
                                            alt=""
                                            className="size-12 rounded-xl object-cover ring-1 ring-zinc-950/10"
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Selected template</p>
                                        <p className="mt-0.5 text-[13px] font-semibold text-zinc-900">{galleryDesign.name}</p>
                                        <p className="mt-0.5 text-[11px] text-zinc-500">
                                            {galleryDesign.style}
                                            {useGalleryPreview ? ' · live preview syncs with these fields' : ''}
                                        </p>
                                    </div>
                                </div>
                            </EditorNotice>
                        ) : null}

                        {sectionLocked && lockedFeatureKey ? (
                            <div className="mt-4 rounded-[1.35rem] border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5 dark:border-amber-500/20 dark:from-amber-950/40 dark:to-zinc-950">
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-amber-800/80 uppercase dark:text-amber-200/80">
                                    Site plan
                                </p>
                                <h3 className="mt-2 font-serif text-xl tracking-tight text-zinc-950 dark:text-white">
                                    {featureLabel(lockedFeatureKey)} is on paid plans
                                </h3>
                                <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                                    Invitation cards, SEO, and passcode protection unlock with a site pack. Style
                                    pickers on trial stay on the default look.
                                </p>
                                <Button
                                    type="button"
                                    className="mt-4 h-11 w-full rounded-xl"
                                    onClick={() => {
                                        window.location.assign(billingUpgradeUrl);
                                    }}
                                >
                                    <Sparkles className="size-4" />
                                    View site plans
                                </Button>
                            </div>
                        ) : null}

                        {!sectionLocked && section === 'names' && (
                            <div className="mt-4 grid gap-3.5">
                                {galleryDesign?.sample?.modules?.length ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {galleryDesign.sample.modules.slice(0, 6).map((module) => (
                                            <span
                                                key={module}
                                                className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-zinc-500 ring-1 ring-zinc-950/5"
                                            >
                                                {module}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}
                                <EditorNotice>
                                    Fields match this {(form.data.occasion || wedding.occasion || wedding.event_type || 'event').replaceAll('-', ' ')} invitation.
                                </EditorNotice>
                                {nameFieldsForEvent(form.data.occasion || wedding.occasion || wedding.event_type).map((field) => (
                                    <EditorField key={field.key} label={field.label}>
                                        <EditorTextInput
                                            value={String(form.data[field.key] ?? '')}
                                            placeholder={field.placeholder}
                                            onChange={(event) => change(field.key, event.target.value)}
                                        />
                                    </EditorField>
                                ))}
                                <div className="grid grid-cols-2 gap-3">
                                    <EditorField label="Date">
                                        <EditorTextInput type="date" value={form.data.wedding_date} onChange={(event) => change('wedding_date', event.target.value)} />
                                    </EditorField>
                                    <EditorField label="Time">
                                        <EditorTextInput type="time" value={form.data.wedding_time} onChange={(event) => change('wedding_time', event.target.value)} />
                                    </EditorField>
                                </div>
                                <EditorField label="Timezone">
                                    <EditorTextInput value={form.data.timezone} onChange={(event) => change('timezone', event.target.value)} />
                                </EditorField>
                            </div>
                        )}

                        {!sectionLocked && section === 'content' && (
                            <ContentTemplatePanel
                                model={templateModel}
                                headline={form.data.headline}
                                onHeadline={(value) => change('headline', value)}
                                onModel={patchTemplateModel}
                                onSelectField={focusContentField}
                                sections={form.data.sections}
                                details={form.data.details}
                                onSectionsChange={(next) => change('sections', next)}
                                onDetailsChange={(next) => change('details', next)}
                            />
                        )}

                        {section === 'hero' && (
                            <>
                                <HeroStylePanel
                                    heroStyle={form.data.details.hero_style || ''}
                                    optionsLocked={heroOptionsLocked}
                                    upgradeUrl={billingUpgradeUrl}
                                    onChange={(next) => {
                                        change('details', {
                                            ...form.data.details,
                                            hero_style: next,
                                        });
                                    }}
                                />
                                <HeaderStylePanel
                                    headerStyle={form.data.details.header_style || ''}
                                    optionsLocked={heroOptionsLocked}
                                    upgradeUrl={billingUpgradeUrl}
                                    onChange={(next) => {
                                        change('details', {
                                            ...form.data.details,
                                            header_style: next,
                                        });
                                    }}
                                />
                                <HeroImagePanel
                                    weddingId={wedding.id}
                                    model={templateModel}
                                    libraryImages={libraryImages}
                                    onModel={patchTemplateModel}
                                    optionsLocked={heroOptionsLocked}
                                    upgradeUrl={billingUpgradeUrl}
                                />
                            </>
                        )}

                        {section === 'design' && (
                            <SiteBackgroundPanel
                                siteBgId={form.data.details.site_bg_id || ''}
                                siteBg={form.data.details.site_bg || ''}
                                siteSurface={form.data.details.site_surface || ''}
                                optionsLocked={designOptionsLocked}
                                upgradeUrl={billingUpgradeUrl}
                                onChange={(next) =>
                                    change('details', {
                                        ...form.data.details,
                                        ...next,
                                    })
                                }
                            />
                        )}

                        {section === 'intro' && (
                            <IntroStylePanel
                                introStyle={form.data.details.intro_style || ''}
                                optionsLocked={introOptionsLocked}
                                upgradeUrl={billingUpgradeUrl}
                                hosts={[form.data.groom_name, form.data.bride_name]
                                    .map((part) => (part || '').trim())
                                    .filter(Boolean)
                                    .join(' & ')}
                                paper={
                                    form.data.details.site_bg ||
                                    wedding.theme?.backgroundColor ||
                                    '#f9ebe7'
                                }
                                ink={wedding.theme?.textColor || '#7a514d'}
                                seal={wedding.theme?.primaryColor || '#a67068'}
                                onChange={(next) => {
                                    change('details', {
                                        ...form.data.details,
                                        intro_style: next,
                                    });
                                    setIntroReplayKey((value) => value + 1);
                                }}
                            />
                        )}

                        {section === 'invitation' && (
                            <InvitationCardPanel
                                userCards={userCards}
                                selectedUserCardEventId={selectedUserCardEventId}
                                createCardUrl={
                                    createCardUrl ||
                                    `/designs/${wedding.occasion || wedding.event_type || 'wedding'}?tab=cards`
                                }
                                cardVisible={form.data.details.card_template !== 'none'}
                                onSelectUserCard={(eventId) =>
                                    change('details', {
                                        ...form.data.details,
                                        user_card_event_id: eventId,
                                        card_template: '',
                                    })
                                }
                                onToggleVisible={(visible) =>
                                    change('details', {
                                        ...form.data.details,
                                        card_template: visible ? '' : 'none',
                                        ...(visible && !form.data.details.user_card_event_id && selectedUserCardEventId
                                            ? { user_card_event_id: selectedUserCardEventId }
                                            : {}),
                                    })
                                }
                                onRefresh={() =>
                                    router.reload({
                                        only: ['userCards', 'selectedUserCard'],
                                    })
                                }
                            />
                        )}

                        {section === 'timer' && (
                            <TimerStylePanel
                                timerStyle={form.data.details.timer_style || ''}
                                weddingDate={form.data.wedding_date}
                                weddingTime={form.data.wedding_time}
                                timezone={form.data.timezone}
                                groom={form.data.groom_display_name || form.data.groom_name}
                                bride={form.data.bride_display_name || form.data.bride_name}
                                host={
                                    form.data.bride_display_name ||
                                    form.data.bride_name ||
                                    form.data.groom_display_name ||
                                    form.data.groom_name
                                }
                                occasion={form.data.occasion || wedding.occasion || wedding.event_type}
                                optionsLocked={timerOptionsLocked}
                                upgradeUrl={billingUpgradeUrl}
                                onChange={(next) =>
                                    change('details', {
                                        ...form.data.details,
                                        timer_style: next,
                                    })
                                }
                                sections={form.data.sections}
                                details={form.data.details}
                                onSectionsChange={(next) => change('sections', next)}
                                onDetailsChange={(next) => change('details', next)}
                            />
                        )}

                        {section === 'guide' && (
                            <CoreExtrasPanel
                                occasion={form.data.occasion || wedding.occasion || wedding.event_type}
                                sections={form.data.sections}
                                details={form.data.details}
                                onSectionsChange={(next) => change('sections', next)}
                                onDetailsChange={(next) => change('details', next)}
                            />
                        )}

                        {section === 'location' && (
                            <LocationTemplatePanel
                                weddingId={wedding.id}
                                model={templateModel}
                                venueName={form.data.venue_name}
                                venueAddress={form.data.venue_address}
                                city={form.data.city}
                                sections={form.data.sections}
                                details={form.data.details}
                                onVenueName={(value) => change('venue_name', value)}
                                onVenueAddress={(value) => change('venue_address', value)}
                                onCity={(value) => change('city', value)}
                                onModel={patchTemplateModel}
                                onSectionsChange={(next) => change('sections', next)}
                                onDetailsChange={(next) => change('details', next)}
                            />
                        )}

                        {section === 'photos' && (
                            <>
                                <PhotosTemplatePanel
                                    weddingId={wedding.id}
                                    gallery={templateModel.gallery}
                                    sections={form.data.sections}
                                    details={form.data.details}
                                    onChange={(gallery) => patchTemplateModel({ gallery })}
                                    onSectionsChange={(next) => change('sections', next)}
                                    onDetailsChange={(next) => change('details', next)}
                                />
                                {form.data.sections.gallery !== false ? (
                                    <GalleryStylePanel
                                        galleryStyle={form.data.details.gallery_style || ''}
                                        optionsLocked={photosOptionsLocked}
                                        upgradeUrl={billingUpgradeUrl}
                                        onChange={(next) =>
                                            change('details', {
                                                ...form.data.details,
                                                gallery_style: next,
                                            })
                                        }
                                    />
                                ) : null}
                            </>
                        )}

                        {section === 'guests' && (
                            <GuestsTemplatePanel
                                guests={templateModel.guests}
                                guestsIntro={templateModel.guests_intro}
                                sections={form.data.sections}
                                details={form.data.details}
                                onChange={(guests) => patchTemplateModel({ guests })}
                                onIntroChange={(guests_intro) => patchTemplateModel({ guests_intro })}
                                onSectionsChange={(next) => change('sections', next)}
                                onDetailsChange={(next) => change('details', next)}
                                guestsStudioHref="/guests"
                                manageRsvpsHref={`/events/${wedding.id}#rsvps`}
                            />
                        )}

                        {section === 'music' && (
                            <MusicTemplatePanel
                                weddingId={wedding.id}
                                musicUrl={form.data.music_url}
                                musicEnabled={form.data.music_enabled}
                                optionsLocked={musicOptionsLocked}
                                upgradeUrl={billingUpgradeUrl}
                                onUrl={(value) => change('music_url', value)}
                                onEnabled={(value) => change('music_enabled', value)}
                            />
                        )}

                        {section === 'preferences' && (
                            <PreferencesPanel
                                eventId={wedding.id}
                                celebrateEnabled={isCelebrateEnabled(form.data.details)}
                                onCelebrateEnabledChange={(enabled) =>
                                    change('details', {
                                        ...form.data.details,
                                        celebrate_enabled: enabled ? '1' : '0',
                                    })
                                }
                                inviteDeliveryModeValue={
                                    form.data.details.invite_delivery_mode === 'automated'
                                        ? 'automated'
                                        : 'manual'
                                }
                                onInviteDeliveryModeChange={(mode) =>
                                    change('details', {
                                        ...form.data.details,
                                        invite_delivery_mode: mode,
                                    })
                                }
                                rsvpRemindersEnabled={isRsvpRemindersEnabled(form.data.details)}
                                onRsvpRemindersEnabledChange={(enabled) =>
                                    change('details', {
                                        ...form.data.details,
                                        rsvp_reminders_enabled: enabled ? '1' : '0',
                                    })
                                }
                                rsvpReminderCooldownDays={form.data.details.rsvp_reminder_cooldown_days || '3'}
                                onRsvpReminderCooldownDaysChange={(value) =>
                                    change('details', {
                                        ...form.data.details,
                                        rsvp_reminder_cooldown_days: value,
                                    })
                                }
                                rsvpReminderMax={form.data.details.rsvp_reminder_max || '2'}
                                onRsvpReminderMaxChange={(value) =>
                                    change('details', {
                                        ...form.data.details,
                                        rsvp_reminder_max: value,
                                    })
                                }
                                rsvpDeadline={form.data.details.rsvp_deadline || ''}
                                onRsvpDeadlineChange={(value) =>
                                    change('details', {
                                        ...form.data.details,
                                        rsvp_deadline: value,
                                    })
                                }
                                rsvpSoftClose={
                                    (form.data.details.rsvp_soft_close ?? '1') !== '0' &&
                                    (form.data.details.rsvp_soft_close ?? '1') !== 'false'
                                }
                                onRsvpSoftCloseChange={(enabled) =>
                                    change('details', {
                                        ...form.data.details,
                                        rsvp_soft_close: enabled ? '1' : '0',
                                    })
                                }
                                rsvpThankYouEnabled={['1', 'true', 'yes', 'on'].includes(
                                    String(form.data.details.rsvp_thank_you_enabled ?? '').toLowerCase(),
                                )}
                                onRsvpThankYouEnabledChange={(enabled) =>
                                    change('details', {
                                        ...form.data.details,
                                        rsvp_thank_you_enabled: enabled ? '1' : '0',
                                    })
                                }
                                photoWallEnabled={['1', 'true', 'yes', 'on'].includes(
                                    String(form.data.details.photo_wall_enabled ?? '').toLowerCase(),
                                )}
                                onPhotoWallEnabledChange={(enabled) =>
                                    change('details', {
                                        ...form.data.details,
                                        photo_wall_enabled: enabled ? '1' : '0',
                                    })
                                }
                                language={form.data.language || 'en'}
                                secondaryLanguage={form.data.secondary_language || ''}
                                culturalTemplate={form.data.cultural_template || ''}
                                translationLocale={form.data.translation_locale || form.data.secondary_language || ''}
                                translation={form.data.translation}
                                sourceContent={{
                                    bride_display_name:
                                        form.data.bride_display_name || form.data.bride_name || '',
                                    groom_display_name:
                                        form.data.groom_display_name || form.data.groom_name || '',
                                    headline: form.data.headline || templateModel.kicker || '',
                                    hero_message:
                                        form.data.details.hero_message ||
                                        form.data.host_message ||
                                        form.data.headline ||
                                        '',
                                    story_eyebrow: form.data.details.story_eyebrow || '',
                                    story_heading: form.data.details.story_heading || '',
                                    story: form.data.story || templateModel.story_body || '',
                                    host_message: form.data.host_message || '',
                                    gallery_eyebrow: form.data.details.gallery_eyebrow || '',
                                    gallery_title: form.data.details.gallery_title || '',
                                    gallery_intro: form.data.details.gallery_intro || '',
                                    guests_intro: form.data.details.guests_intro || '',
                                    event_line: form.data.details.event_line || '',
                                }}
                                locales={wedding.options?.locales}
                                cultures={wedding.options?.cultures}
                                onLanguageChange={(value) => change('language', value)}
                                onSecondaryLanguageChange={(value) => change('secondary_language', value)}
                                onCulturalTemplateChange={(value) => change('cultural_template', value)}
                                onTranslationLocaleChange={(value) => change('translation_locale', value)}
                                onTranslationChange={(next) => change('translation', next)}
                            />
                        )}

                        {!sectionLocked && section === 'seo' && (
                            <SeoPanel
                                title={form.data.seo_title || ''}
                                description={form.data.seo_description || ''}
                                fallbackTitle={
                                    wedding.title
                                    || [form.data.bride_display_name || form.data.bride_name, form.data.groom_display_name || form.data.groom_name]
                                        .filter(Boolean)
                                        .join(' & ')
                                }
                                fallbackDescription={[form.data.headline, form.data.city].filter(Boolean).join(' · ')}
                                onTitle={(value) => change('seo_title', value)}
                                onDescription={(value) => change('seo_description', value)}
                            />
                        )}

                        {!sectionLocked && section === 'security' && (
                            <SecurityPanel
                                passcodeEnabled={isSitePasscodeEnabled(form.data.details)}
                                passcodeSet={(form.data.details.site_passcode_set || '') === '1'}
                                onPasscodeEnabledChange={(enabled) => {
                                    const next = {
                                        ...form.data.details,
                                        site_passcode_enabled: enabled ? '1' : '0',
                                    };
                                    if (enabled) {
                                        delete next.site_passcode_clear;
                                    }
                                    change('details', next);
                                }}
                                onPasscodeChange={(passcode) => {
                                    const next = {
                                        ...form.data.details,
                                        site_passcode: passcode,
                                    };
                                    if (passcode) {
                                        next.site_passcode_enabled = '1';
                                        delete next.site_passcode_clear;
                                    }
                                    change('details', next);
                                }}
                                onPasscodeClear={() =>
                                    change('details', {
                                        ...form.data.details,
                                        site_passcode: '',
                                        site_passcode_enabled: '0',
                                        site_passcode_hint: '',
                                        site_passcode_set: '0',
                                        site_passcode_clear: '1',
                                    })
                                }
                            />
                        )}

                        {section === 'site' && (
                            <SiteLinkPanel
                                slug={form.data.slug}
                                shareUrl={wedding.share_url}
                                pathUrl={wedding.path_url}
                                subdomainUrl={wedding.subdomain_url}
                                subdomainHost={wedding.subdomain_host}
                                subdomainsEnabled={wedding.subdomains_enabled}
                                inviteRootDomain={wedding.invite_root_domain}
                                customSubdomainLocked={subdomainLocked}
                                upgradeUrl={billingUpgradeUrl}
                                onSlug={(value) => change('slug', value)}
                            />
                        )}
                    </EditorInspector>
                }
            />

            <TrialWelcomeDialog
                open={trialWelcomeOpen}
                onOpenChange={setTrialWelcomeOpen}
                upgradeUrl={billingUpgradeUrl}
                trialDays={trialDays}
                guestLimit={page.props.growth?.guest_limit ?? 100}
                eventLabel={
                    (form.data.occasion || wedding.occasion || wedding.event_type || 'event').replaceAll('-', ' ')
                }
            />

            <PostPublishGrowthDialog
                open={growthOpen}
                onOpenChange={setGrowthOpen}
                eventId={wedding.id}
                shareUrl={
                    page.props.flash?.publish_growth?.share_url
                    || wedding.share_url
                    || ''
                }
                title={page.props.flash?.publish_growth?.title || wedding.title}
                growth={page.props.flash?.publish_growth?.growth || wedding.growth}
                billingUrl={billingUpgradeUrl}
            />

            <ConfirmDialog
                open={publishGateOpen}
                onOpenChange={setPublishGateOpen}
                title="Finish these before publishing"
                description={
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                        {publishBlocking(readinessChecks()).map((check) => (
                            <li key={check.id}>{check.label}</li>
                        ))}
                    </ul>
                }
                confirmLabel="Review details"
                cancelLabel="Close"
                tone="default"
                onConfirm={() => {
                    setPublishGateOpen(false);
                    setSection('names');
                    setInspectorOpen(true);
                }}
            />

            <ConfirmDialog
                open={trialConfirmOpen}
                onOpenChange={setTrialConfirmOpen}
                title="Use your one free trial publish?"
                description={
                    <>
                        Free accounts can publish only one guest site with the {trialDays}-day trial. Other events will
                        need a paid pack. Are you sure you want to publish this invitation with your free try?
                        <button
                            type="button"
                            className="mt-3 block text-left text-[13px] font-medium text-zinc-700 underline-offset-2 hover:underline"
                            onClick={openPaidPublishOptions}
                        >
                            Prefer a paid pack instead…
                        </button>
                    </>
                }
                confirmLabel="Yes, publish with free try"
                cancelLabel="Not now"
                tone="default"
                loading={publishing}
                onConfirm={proceedTrialPublish}
            />

            <Dialog open={publishChooserOpen} onOpenChange={setPublishChooserOpen}>
                <DialogContent className="gap-5 rounded-[1.35rem] border-zinc-200/80 p-6 shadow-2xl shadow-zinc-950/15 sm:max-w-md">
                    <DialogHeader className="gap-2 text-left">
                        <DialogTitle className="text-[17px] font-semibold tracking-tight text-zinc-900">
                            Go live
                        </DialogTitle>
                        <DialogDescription className="text-[13px] leading-relaxed text-zinc-500">
                            {trialAvailable
                                ? `Choose how to publish. One free ${trialDays}-day try per account.`
                                : trialUsedOn
                                  ? `Your free ${trialDays}-day try is already used on “${trialUsedOn.title}”. Buy a site pack to publish this invitation.`
                                  : `Your free ${trialDays}-day try was already used. Buy a site pack to publish this invitation.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <Button
                            type="button"
                            className="h-11 rounded-full"
                            disabled={publishing}
                            onClick={confirmPublishPaid}
                        >
                            {siteBilling?.has_paid_pack || siteBilling?.legacy_account_pro
                                ? 'Publish with paid plan'
                                : 'Publish with paid pack…'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-full"
                            disabled={publishing}
                            onClick={confirmSchedulePublish}
                        >
                            {siteBilling?.has_paid_pack || siteBilling?.legacy_account_pro || siteBilling?.can_schedule_publish
                                ? 'Schedule publish…'
                                : 'Schedule publish (pay first)…'}
                        </Button>
                        {!trialAvailable && trialUsedOn ? (
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-10 rounded-full text-zinc-600"
                                onClick={() => {
                                    setPublishChooserOpen(false);
                                    window.location.assign(`/events/${trialUsedOn.id}`);
                                }}
                            >
                                Open “{trialUsedOn.title}”
                            </Button>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                <DialogContent className="gap-5 rounded-[1.35rem] border-zinc-200/80 p-6 shadow-2xl shadow-zinc-950/15 sm:max-w-md">
                    <DialogHeader className="gap-2 text-left">
                        <DialogTitle className="text-[17px] font-semibold tracking-tight text-zinc-900">
                            Leave editor?
                        </DialogTitle>
                        <DialogDescription className="text-[13px] leading-relaxed text-zinc-500">
                            {listed
                                ? 'You have unsaved changes. Save them before returning to My Events, or discard and leave.'
                                : 'This invitation is not in My Events yet. Save to keep it, or discard to delete this draft.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-full px-5"
                            disabled={leaving}
                            onClick={() => setLeaveOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-full px-5 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            disabled={leaving}
                            onClick={discardAndLeave}
                        >
                            {listed ? 'Discard' : 'Discard draft'}
                        </Button>
                        <Button
                            type="button"
                            className="h-10 rounded-full px-5"
                            disabled={leaving || saving}
                            onClick={saveAndLeave}
                        >
                            Save & leave
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
