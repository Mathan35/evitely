import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import type { CoreSiteExtrasContent } from '@/lib/core-site-sections';
import type { SectionNote, ToggleableSiteSection } from '@/lib/site-section-visibility';
import type {
    CustomSiteText,
    TemplateGallerySlot,
    TemplateGuestItem,
    TemplateScheduleItem,
    TemplateVenueBlock,
} from '@/lib/template-preview-model';

export type PreviewLiveContent = {
    /** Active UI / content locale (drives invitation-copy chrome). */
    locale?: string;
    bride?: string;
    groom?: string;
    host?: string;
    company?: string;
    kicker?: string;
    message?: string;
    heroMessage?: string;
    eventLine?: string;
    eventName?: string;
    ageLine?: string;
    date?: string;
    dateLabel?: string;
    dateShort?: string;
    venue?: string;
    city?: string;
    storyHeading?: string;
    storyEyebrow?: string;
    storyBody?: string;
    galleryEyebrow?: string;
    galleryTitle?: string;
    galleryIntro?: string;
    guestsIntro?: string;
    contactPhone?: string;
    heroImage?: string;
    heroBlur?: number;
    heroZoom?: number;
    heroPositionX?: number;
    heroPositionY?: number;
    ceremony?: TemplateVenueBlock;
    reception?: TemplateVenueBlock;
    schedule?: TemplateScheduleItem[];
    gallery?: TemplateGallerySlot[];
    guests?: TemplateGuestItem[];
    customTexts?: CustomSiteText[];
    musicUrl?: string | null;
    musicMuted?: boolean;
    /** Wall-clock time (HH:MM) for the countdown — from the Names & date form. */
    time?: string;
    /** IANA timezone for the countdown. */
    timezone?: string;
    /** Soft page background override (hex / CSS color). */
    siteBg?: string;
    /** Matching surface/panel color for the soft background. */
    siteSurface?: string;
    /** Wedding countdown timer design id. */
    timerStyle?: string;
    /** Full-bleed hero section layout id. */
    heroStyle?: string;
    /** Sticky header / nav link layout id. */
    headerStyle?: string;
    /** Photo gallery layout id. */
    galleryStyle?: string;
    /** Site section visibility map (Core 8 extras require explicit true). */
    sections?: Record<string, boolean>;
    /** Optional title + note shown when gallery / venue / guests are turned off. */
    sectionNotes?: Partial<Record<ToggleableSiteSection, SectionNote>>;
    /** Content for Core 8 guest extras. */
    coreExtras?: CoreSiteExtrasContent;
    /** Show the celebrate / confetti control on the guest site. */
    celebrateEnabled?: boolean;
    /** Google Calendar template URL for the primary event (opens in browser). */
    googleCalendarUrl?: string | null;
    /** Approved guestbook / wishes for the live wall. */
    guestbook?: { id: number; name: string; message: string; photo_url: string | null }[];
    /** Public invite slug for guestbook posts. */
    inviteSlug?: string | null;
    /** Invite root domain for subdomain-aware action paths. */
    inviteRootDomain?: string | null;
    /** When true, guests can submit a new wish. */
    allowGuestbook?: boolean;
    /** Prefill name when guest has a personal link. */
    guestName?: string | null;
    /** Claim counts keyed by gift item id (optional registry claims). */
    giftClaimCounts?: Record<string, number>;
};

const PreviewLiveContext = createContext<PreviewLiveContent | null>(null);

export function PreviewLiveProvider({
    value,
    children,
}: {
    value: PreviewLiveContent | null;
    children: ReactNode;
}) {
    return <PreviewLiveContext.Provider value={value}>{children}</PreviewLiveContext.Provider>;
}

export function usePreviewLive(): PreviewLiveContent | null {
    return useContext(PreviewLiveContext);
}

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
] as const;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

function parseIsoDate(iso: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!match) {
        return null;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date;
}

export function formatPreviewDateLabel(iso: string, locale = 'en'): string {
    const date = parseIsoDate(iso);
    if (!date) {
        return iso;
    }
    try {
        return new Intl.DateTimeFormat(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    } catch {
        return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    }
}

export function formatPreviewDateShort(iso: string, locale = 'en'): string {
    const date = parseIsoDate(iso);
    if (!date) {
        return iso;
    }
    try {
        return new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    } catch {
        return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    }
}

function hasLiveValue(value: unknown): boolean {
    if (value === undefined || value === null) {
        return false;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value);
    }
    if (typeof value === 'boolean') {
        return true;
    }
    if (Array.isArray(value)) {
        return true;
    }
    if (typeof value === 'object') {
        return true;
    }
    // Keep empty strings so Content-panel clears still replace template defaults.
    if (typeof value === 'string') {
        return true;
    }
    return String(value).trim() !== '';
}

/** Prefer live gallery slots when present; otherwise fall back to template defaults. */
export function resolveLiveGallery<T extends { src: string }>(
    liveGallery: PreviewLiveContent['gallery'] | null | undefined,
    fallback: T[],
): Array<T & Partial<NonNullable<PreviewLiveContent['gallery']>[number]>> {
    if (liveGallery && liveGallery.length > 0) {
        return liveGallery as Array<T & Partial<NonNullable<PreviewLiveContent['gallery']>[number]>>;
    }
    return fallback as Array<T & Partial<NonNullable<PreviewLiveContent['gallery']>[number]>>;
}

export function resolveLiveHeroSrc(
    liveHero: string | null | undefined,
    fallback: string,
): string {
    const next = (liveHero || '').trim();
    return next || fallback;
}

export function liveHeroMediaStyle(live: PreviewLiveContent | null | undefined): CSSProperties {
    return {
        objectPosition: `${live?.heroPositionX ?? 50}% ${live?.heroPositionY ?? 50}%`,
        transform: `scale(${Math.max(1, live?.heroZoom ?? 1)})`,
        filter: `blur(${Math.max(0, live?.heroBlur ?? 0)}px)`,
        transformOrigin: `${live?.heroPositionX ?? 50}% ${live?.heroPositionY ?? 50}%`,
    };
}

/** Crop/zoom for a gallery tile — shared by every occasion site mosaic. */
export function liveGalleryMediaStyle(
    photo: Pick<TemplateGallerySlot, 'zoom' | 'position_x' | 'position_y'> | null | undefined,
): CSSProperties {
    const zoom = Math.max(1, photo?.zoom ?? 1);
    const x = Number.isFinite(photo?.position_x) ? Number(photo?.position_x) : 50;
    const y = Number.isFinite(photo?.position_y) ? Number(photo?.position_y) : 50;

    // Use a CSS var for crop zoom so hover scale (preview-zoom-media) can multiply on top.
    // Inline `transform` would override the hover rule and kill the effect.
    return {
        objectPosition: `${x}% ${y}%`,
        transformOrigin: `${x}% ${y}%`,
        ['--preview-zoom-base' as string]: String(zoom),
    };
}

/** Fingerprint so zoom/crop/src changes always rebuild mosaic memos. */
export function gallerySlotsFingerprint(
    gallery: PreviewLiveContent['gallery'] | null | undefined,
): string {
    if (!Array.isArray(gallery)) {
        return '';
    }

    return gallery
        .map((slot) => `${slot.id}|${slot.src}|${slot.zoom ?? 1}|${slot.position_x ?? 50}|${slot.position_y ?? 50}`)
        .join('||');
}

export function mergePreviewLive(
    base: PreviewLiveContent | null | undefined,
    overlay: PreviewLiveContent | null | undefined,
): PreviewLiveContent | null {
    if (!base && !overlay) {
        return null;
    }

    const next: PreviewLiveContent = { ...(base ?? {}) };

    if (overlay) {
        (Object.keys(overlay) as (keyof PreviewLiveContent)[]).forEach((key) => {
            const value = overlay[key];
            if (hasLiveValue(value)) {
                (next as Record<string, unknown>)[key] = value;
            }
        });
    }

    return next;
}

export function buildPreviewLiveFromForm(input: {
    locale?: string | null;
    bride_name: string;
    groom_name: string;
    bride_display_name?: string | null;
    groom_display_name?: string | null;
    headline?: string | null;
    story?: string | null;
    host_message?: string | null;
    wedding_date?: string | null;
    venue_name?: string | null;
    city?: string | null;
    occasion?: string | null;
    heroMessage?: string | null;
    eventLine?: string | null;
    storyHeading?: string | null;
    storyEyebrow?: string | null;
    storyBody?: string | null;
    galleryEyebrow?: string | null;
    galleryTitle?: string | null;
    galleryIntro?: string | null;
    guestsIntro?: string | null;
    contactPhone?: string | null;
    heroImage?: string | null;
    heroBlur?: number | null;
    heroZoom?: number | null;
    heroPositionX?: number | null;
    heroPositionY?: number | null;
    ceremony?: TemplateVenueBlock | null;
    reception?: TemplateVenueBlock | null;
    schedule?: TemplateScheduleItem[] | null;
    gallery?: TemplateGallerySlot[] | null;
    guests?: TemplateGuestItem[] | null;
    customTexts?: CustomSiteText[] | null;
    musicUrl?: string | null;
    wedding_time?: string | null;
    timezone?: string | null;
    siteBg?: string | null;
    siteSurface?: string | null;
    timerStyle?: string | null;
    heroStyle?: string | null;
    headerStyle?: string | null;
    galleryStyle?: string | null;
    sections?: Record<string, boolean> | null;
    sectionNotes?: Partial<Record<ToggleableSiteSection, SectionNote>> | null;
    coreExtras?: CoreSiteExtrasContent | null;
    celebrateEnabled?: boolean | null;
    googleCalendarUrl?: string | null;
}): PreviewLiveContent {
    // Optional display lines only override when they differ from the primary name.
    const bridePrimary = (input.bride_name || '').trim();
    const groomPrimary = (input.groom_name || '').trim();
    const brideDisplay = (input.bride_display_name || '').trim();
    const groomDisplay = (input.groom_display_name || '').trim();
    const occasion = (input.occasion || 'wedding').toLowerCase();
    // Baby name / corporate title live in display fields but are not co-hosts.
    const displayIsNotHost = [
        'baby-shower',
        'baby-naming',
        'naming-ceremony',
        'baby',
        'corporate',
        'corporate-event',
        'business-event',
        'conference',
        'seminar',
        'workshop',
        'product-launch',
    ].includes(occasion);
    const bride = displayIsNotHost
        ? bridePrimary
        : (brideDisplay && brideDisplay !== bridePrimary ? brideDisplay : bridePrimary) || brideDisplay;
    const groom = displayIsNotHost
        ? groomPrimary
        : (groomDisplay && groomDisplay !== groomPrimary ? groomDisplay : groomPrimary) || groomDisplay;
    const host = bride || groom;
    // Empty strings must win over gallery sample names in mergePreviewLive
    // (cleared partner / co-host should not reappear on the intro).
    const date = input.wedding_date?.trim() || undefined;
    const locale = (input.locale || 'en').trim() || 'en';
    const dateLabel = date ? formatPreviewDateLabel(date, locale) : undefined;
    const short = date ? formatPreviewDateShort(date, locale) : undefined;
    // Localized prefix via invitation-copy (imported lazily through require-free copyFor).
    let derivedEventLine: string | undefined;
    if (short) {
        // Inline labels keep this helper free of React hooks; chrome dict handles the rest of UI.
        const receptionLabel =
            locale === 'ta' ? 'வரவேற்பு' : locale === 'hi' ? 'रिसेप्शन' : 'Reception';
        const celebrationLabel =
            locale === 'ta' ? 'கொண்டாட்டம்' : locale === 'hi' ? 'उत्सव' : 'Celebration';
        derivedEventLine =
            occasion === 'wedding' ? `${receptionLabel} · ${short}` : `${celebrationLabel} · ${short}`;
    }
    // Content-panel fields stay independent — empty string still wins over template defaults.
    const time = input.wedding_time?.trim() || undefined;
    const timezone = input.timezone?.trim() || undefined;
    const eventLine = (input.eventLine ?? '').trim() || derivedEventLine;
    /** Keep empty strings so Content clears still override template defaults. */
    const present = (value: string | null | undefined): string | undefined => {
        if (value === undefined || value === null) {
            return undefined;
        }
        return value.trim();
    };
    // Shared `message` is story/host copy only — never mirror hero into story.
    const sharedMessage = (
        input.storyBody ||
        input.story ||
        input.host_message ||
        ''
    ).trim();

    return {
        locale: present(input.locale) || undefined,
        bride,
        groom,
        host,
        company: groom || bride,
        kicker: present(input.headline),
        message: sharedMessage || undefined,
        heroMessage: present(input.heroMessage),
        eventLine,
        date,
        dateLabel,
        dateShort: eventLine,
        time,
        timezone,
        venue: input.venue_name?.trim() || undefined,
        city: input.city?.trim() || undefined,
        storyHeading: present(input.storyHeading),
        storyEyebrow: present(input.storyEyebrow),
        storyBody: present(input.storyBody),
        galleryEyebrow: present(input.galleryEyebrow),
        galleryTitle: present(input.galleryTitle),
        galleryIntro: present(input.galleryIntro),
        guestsIntro: present(input.guestsIntro),
        contactPhone: present(input.contactPhone),
        heroImage: input.heroImage?.trim() || undefined,
        heroBlur: input.heroBlur ?? undefined,
        heroZoom: input.heroZoom ?? undefined,
        heroPositionX: input.heroPositionX ?? undefined,
        heroPositionY: input.heroPositionY ?? undefined,
        ceremony: input.ceremony ?? undefined,
        reception: input.reception ?? undefined,
        schedule: input.schedule ?? undefined,
        gallery: input.gallery ?? undefined,
        guests: input.guests ?? undefined,
        customTexts: input.customTexts?.length ? input.customTexts : undefined,
        musicUrl: input.musicUrl ?? undefined,
        siteBg: present(input.siteBg),
        siteSurface: present(input.siteSurface),
        timerStyle: present(input.timerStyle),
        heroStyle: present(input.heroStyle),
        headerStyle: present(input.headerStyle),
        galleryStyle: present(input.galleryStyle),
        sections: input.sections ?? undefined,
        sectionNotes: input.sectionNotes ?? undefined,
        coreExtras: input.coreExtras ?? undefined,
        celebrateEnabled: input.celebrateEnabled ?? undefined,
        googleCalendarUrl: input.googleCalendarUrl?.trim() || undefined,
    };
}
