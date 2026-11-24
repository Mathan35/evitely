import type { WeddingGalleryPhoto } from '@/components/marketing/site-previews/wedding-site-themes';
import type { GalleryDesign, GallerySample } from '@/types/gallery';
import { seedFromGallerySample } from '@/lib/gallery-template-seed';
import {
    isForeignOccasionStockUrl,
    occasionGalleryPhotos,
    occasionHeroSrc,
    occasionStyleKeys,
    occasionThemeSlice,
    resolveOccasionSlugFromDesign,
    type OccasionSlug,
} from '@/lib/occasion-template-assets';
import { scheduleFromEvents } from '@/lib/schedule-from-events';

export type TemplateScheduleItem = {
    time: string;
    title: string;
    map_url?: string | null;
    google_calendar_url?: string | null;
    ics_url?: string | null;
    event_id?: number | null;
};

export type TemplateGuestItem = { id: string; name: string; party: string; status: string };

export type TemplateGallerySlot = {
    id: string;
    title: string;
    note: string;
    src: string;
    span: WeddingGalleryPhoto['span'];
    zoom?: number;
    position_x?: number;
    position_y?: number;
};

export type TemplateVenueBlock = {
    title: string;
    name: string;
    time: string;
    address: string;
    image: string;
    map_image: string;
    maps_url: string;
};

export type CustomSitePlacement = 'hero' | 'story' | 'gallery' | 'notes' | 'floating';

export type CustomSiteText = {
    id: string;
    label: string;
    text: string;
    kind?: 'text' | 'icon';
    icon?: string;
    placement?: CustomSitePlacement;
    x?: number;
    y?: number;
};

export type TemplatePreviewModel = {
    kicker: string;
    hero_message: string;
    event_line: string;
    story_eyebrow: string;
    story_heading: string;
    story_body: string;
    gallery_eyebrow: string;
    gallery_title: string;
    gallery_intro: string;
    guests_intro: string;
    contact_phone: string;
    hero_image: string;
    hero_blur: number;
    hero_zoom: number;
    hero_position_x: number;
    hero_position_y: number;
    venue_name: string;
    venue_address: string;
    city: string;
    ceremony: TemplateVenueBlock;
    reception: TemplateVenueBlock;
    schedule: TemplateScheduleItem[];
    gallery: TemplateGallerySlot[];
    guests: TemplateGuestItem[];
    custom_texts: CustomSiteText[];
    wedding_date: string;
    date_label: string;
};

export const DEFAULT_TEMPLATE_GUESTS: TemplateGuestItem[] = [
    { id: 'g1', name: 'Amira Shah', party: '2 guests', status: 'Attending' },
    { id: 'g2', name: 'Rohan Iyer', party: '1 guest', status: 'Attending' },
    { id: 'g3', name: 'Elena & Mark', party: '2 guests', status: 'Attending' },
    { id: 'g4', name: 'Claire Hale', party: '3 guests', status: 'Regrets' },
];

export const MUSIC_LIBRARY = [
    { id: 'ceremony-ambient', label: 'Ceremony ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'reception-glow', label: 'Reception glow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'evening-soft', label: 'Evening soft', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'garden-walk', label: 'Garden walk', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'golden-hour', label: 'Golden hour', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { id: 'candlelight', label: 'Candlelight', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    { id: 'first-dance', label: 'First dance', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
    { id: 'afterparty', label: 'Afterparty pulse', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
    { id: 'sunrise', label: 'Sunrise welcome', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
    { id: 'velvet-night', label: 'Velvet night', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
    { id: 'coastal-breeze', label: 'Coastal breeze', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
    { id: 'string-quartet', label: 'String quartet mood', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' },
    { id: 'champagne-toast', label: 'Champagne toast', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
    { id: 'midnight-spark', label: 'Midnight spark', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3' },
    { id: 'processional', label: 'Processional calm', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' },
    { id: 'farewell-glow', label: 'Farewell glow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' },
] as const;

function parseJson<T>(value: unknown, fallback: T): T {
    if (typeof value !== 'string' || value.trim() === '') {
        return fallback;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

function withGuestIds(guests: TemplateGuestItem[]): TemplateGuestItem[] {
    return guests.map((guest, index) => ({
        ...guest,
        id: guest.id || `guest-${index}-${guest.name}`,
    }));
}

function mapsUrlFor(query: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function looksLikeClockTime(value: string): boolean {
    return /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(value.trim());
}

function normalizeVenueTime(value: string | null | undefined, fallback: string): string {
    const trimmed = (value || '').trim();
    if (looksLikeClockTime(trimmed)) {
        return trimmed.replace(/\s?(AM|PM)$/i, (_, meridiem: string) => ` ${meridiem.toUpperCase()}`);
    }
    return fallback;
}

function pickMediaUrl(src: string | null | undefined, slug: OccasionSlug, fallback: string): string {
    const value = (src || '').trim();
    if (!value || isForeignOccasionStockUrl(value, slug)) {
        return fallback;
    }
    return value;
}

export function buildTemplatePreviewModel(
    design: GalleryDesign | null | undefined,
    details: Record<string, string | null | undefined> = {},
    occasionSlug?: string | null,
    /** Relational event_schedules — preferred source for itinerary when present. */
    scheduleEvents?: Array<{
        title?: string | null;
        start_time?: string | null;
        is_public?: boolean | null;
        sort_order?: number | null;
    }> | null,
    /**
     * When false (live published site), never invent sample guests, phone, or schedule.
     * Editor / marketing previews keep fillSamples true so empty templates still look designed.
     */
    options?: { fillSamples?: boolean },
): TemplatePreviewModel {
    const fillSamples = options?.fillSamples !== false;
    const slug = resolveOccasionSlugFromDesign(design, occasionSlug);
    const styleKey = design?.style_key || occasionStyleKeys(slug)[0] || 'glasshouse';
    const theme = occasionThemeSlice(slug, styleKey);
    const sample = design?.sample as GallerySample | undefined;
    const seed = seedFromGallerySample(sample);
    const defaultHero = occasionHeroSrc(slug, styleKey, 'desktop');
    const galleryDefaults = occasionGalleryPhotos(slug, styleKey).map((photo, index) => ({
        id: `slot-${index}`,
        title: photo.title,
        note: photo.note,
        src: photo.src,
        span: photo.span,
    }));

    const rawGallery = parseJson<TemplateGallerySlot[]>(details.gallery_json, galleryDefaults);
    const savedGallery: TemplateGallerySlot[] = (Array.isArray(rawGallery) ? rawGallery : galleryDefaults)
        .map((slot, index): TemplateGallerySlot => {
            const fallback = galleryDefaults[index % galleryDefaults.length];
            const item = (slot ?? {}) as Partial<TemplateGallerySlot>;
            const src = typeof item.src === 'string' ? item.src.trim() : '';
            const next: TemplateGallerySlot = {
                id: item.id || fallback?.id || `slot-${index}`,
                title: (item.title || fallback?.title || `Photo ${index + 1}`).trim(),
                note: (item.note || fallback?.note || '').trim(),
                src: pickMediaUrl(src, slug, fallback?.src || ''),
                span: item.span || fallback?.span || 'square',
            };
            if (item.zoom != null) {
                const zoom = Number(item.zoom);
                next.zoom = Number.isFinite(zoom) ? zoom : 1;
            }
            if (item.position_x != null) {
                const x = Number(item.position_x);
                // Keep 0 — `Number(x) || 50` wrongly coerced left/top crop to center.
                next.position_x = Number.isFinite(x) ? x : 50;
            }
            if (item.position_y != null) {
                const y = Number(item.position_y);
                next.position_y = Number.isFinite(y) ? y : 50;
            }
            return next;
        })
        .filter((slot) => Boolean(slot.src));
    // Live site: prefer relational events. Editor keeps editing schedule_json until save
    // mirrors it into event_schedules (passing stale events would clobber in-progress edits).
    const explicitJson =
        typeof details.schedule_json === 'string' && details.schedule_json.trim() !== '';
    const fromEvents = scheduleFromEvents(scheduleEvents);
    const savedSchedule = explicitJson
        ? parseJson<TemplateScheduleItem[]>(details.schedule_json, theme.schedule)
        : fromEvents.length > 0
          ? fromEvents
          : parseJson<TemplateScheduleItem[]>(details.schedule_json, theme.schedule);
    // Empty array is intentional (hide showcase). Only fall back to samples when unset.
    const guestsJsonRaw = typeof details.guests_json === 'string' ? details.guests_json.trim() : '';
    const savedGuests = guestsJsonRaw
        ? withGuestIds(parseJson<TemplateGuestItem[]>(guestsJsonRaw, []))
        : null;

    const venue = (details.venue_name || seed.venue_name || theme.venue || '').trim();
    const city = (details.city_override || seed.city || theme.city || '').trim();
    const address = (details.venue_address || sample?.venue_address || `${venue}, ${city}`).trim();
    const seedMessage = (seed.message || seed.story || '').trim();
    const savedHero = details.hero_message != null ? String(details.hero_message) : null;
    const savedStory = details.story_body != null ? String(details.story_body) : null;
    const message = (savedHero || savedStory || details.message || seedMessage).trim();

    const ceremonyDefaults: TemplateVenueBlock = {
        title: theme.primaryVenueTitle,
        name: theme.space,
        time: theme.schedule[0]?.time || '4:00 PM',
        address,
        image: occasionHeroSrc(slug, styleKey, 'desktop'),
        map_image: occasionHeroSrc(slug, styleKey, 'mobile'),
        maps_url: mapsUrlFor(`${theme.space} ${address}`),
    };
    const receptionDefaults: TemplateVenueBlock = {
        title: theme.secondaryVenueTitle,
        name: theme.secondarySpace,
        time: theme.schedule[theme.schedule.length - 1]?.time || '7:00 PM',
        address,
        image: occasionHeroSrc(slug, styleKey, 'desktop'),
        map_image: occasionHeroSrc(slug, styleKey, 'mobile'),
        maps_url: mapsUrlFor(`${theme.secondarySpace} ${address}`),
    };

    const ceremonySaved = parseJson<Partial<TemplateVenueBlock>>(details.ceremony_json, {});
    const receptionSaved = parseJson<Partial<TemplateVenueBlock>>(details.reception_json, {});
    const ceremony = {
        ...ceremonyDefaults,
        ...(details.ceremony_name ? { name: details.ceremony_name } : {}),
        ...(details.ceremony_address ? { address: details.ceremony_address } : {}),
        ...ceremonySaved,
        image: pickMediaUrl(ceremonySaved.image, slug, ceremonyDefaults.image),
        map_image: pickMediaUrl(ceremonySaved.map_image, slug, ceremonyDefaults.map_image),
        time: normalizeVenueTime(
            ceremonySaved.time || details.ceremony_time,
            ceremonyDefaults.time,
        ),
    };
    const reception = {
        ...receptionDefaults,
        ...(details.reception_name ? { name: details.reception_name } : {}),
        ...(details.reception_address ? { address: details.reception_address } : {}),
        ...receptionSaved,
        image: pickMediaUrl(receptionSaved.image, slug, receptionDefaults.image),
        map_image: pickMediaUrl(receptionSaved.map_image, slug, receptionDefaults.map_image),
        time: normalizeVenueTime(
            receptionSaved.time || details.reception_time,
            receptionDefaults.time,
        ),
    };

    return {
        kicker: (details.kicker_override || seed.headline || sample?.kicker || '').trim(),
        hero_message: (savedHero ?? message).trim(),
        event_line: (details.event_line || sample?.date_label || theme.dateLabel || '').trim(),
        story_eyebrow: (details.story_eyebrow || theme.storyEyebrow).trim(),
        story_heading: (details.story_heading || theme.storyHeading).trim(),
        story_body: (savedStory ?? message).trim(),
        gallery_eyebrow: (details.gallery_eyebrow || 'Gallery').trim(),
        gallery_title: (details.gallery_title || theme.galleryTitle).trim(),
        gallery_intro: (details.gallery_intro || theme.galleryIntro).trim(),
        guests_intro: (
            details.guests_intro ||
            'Friends and family joining the celebration — edit this showcase anytime in Site editing.'
        ).trim(),
        contact_phone: (() => {
            const raw = (details.contact || details.contact_phone || details.rsvp_phone || '').trim();
            if (!raw || raw.includes('@')) {
                return fillSamples ? '+1 (555) 014-2218' : '';
            }
            return raw;
        })(),
        hero_image: pickMediaUrl(details.hero_image, slug, defaultHero),
        hero_blur: (() => {
            const n = Number(details.hero_blur ?? 0);
            return Number.isFinite(n) ? n : 0;
        })(),
        hero_zoom: (() => {
            const n = Number(details.hero_zoom ?? 1);
            return Number.isFinite(n) ? n : 1;
        })(),
        hero_position_x: (() => {
            const n = Number(details.hero_position_x ?? 50);
            return Number.isFinite(n) ? n : 50;
        })(),
        hero_position_y: (() => {
            const n = Number(details.hero_position_y ?? 50);
            return Number.isFinite(n) ? n : 50;
        })(),
        venue_name: venue,
        venue_address: address,
        city,
        ceremony,
        reception,
        schedule:
            savedSchedule.length > 0 ? savedSchedule : fillSamples ? theme.schedule : [],
        gallery: savedGallery.length > 0 ? savedGallery : fillSamples ? galleryDefaults : [],
        guests: savedGuests ?? (fillSamples ? DEFAULT_TEMPLATE_GUESTS : []),
        custom_texts: parseJson<CustomSiteText[]>(details.custom_texts_json, []).filter(
            (item) => item && typeof item.id === 'string' && typeof item.text === 'string',
        ),
        wedding_date: (details.wedding_date_override || theme.date || '').trim(),
        date_label: (details.date_label || sample?.date_label || theme.dateLabel || '').trim(),
    };
}

function isEphemeralMediaUrl(src: string): boolean {
    const value = (src || '').trim();
    return value.startsWith('blob:') || value.startsWith('data:');
}

function persistableMediaUrl(src: string, fallback = ''): string {
    const value = (src || '').trim();
    if (!value || isEphemeralMediaUrl(value)) {
        return fallback;
    }
    return value;
}

/** Strip blob/data URLs before persisting so autosave never stores ephemeral preview URLs. */
export function sanitizeDetailsForPersistence(
    details: Record<string, string>,
): Record<string, string> {
    const next = { ...details };
    const gallery = parseJson<TemplateGallerySlot[]>(details.gallery_json, []);
    if (gallery.length > 0) {
        next.gallery_json = JSON.stringify(
            gallery.map((slot) => ({
                ...slot,
                src: persistableMediaUrl(slot.src),
            })),
        );
    }

    if (isEphemeralMediaUrl(details.hero_image || '')) {
        next.hero_image = '';
    }

    for (const key of ['ceremony_json', 'reception_json'] as const) {
        const block = parseJson<Partial<TemplateVenueBlock>>(details[key], {});
        if (!block || typeof block !== 'object') {
            continue;
        }
        next[key] = JSON.stringify({
            ...block,
            image: persistableMediaUrl(block.image || ''),
            map_image: persistableMediaUrl(block.map_image || ''),
        });
    }

    return next;
}

export function syncDetailsFromModel(
    details: Record<string, string>,
    model: TemplatePreviewModel,
): Record<string, string> {
    return {
        ...details,
        kicker_override: model.kicker,
        hero_message: model.hero_message,
        event_line: model.event_line,
        story_eyebrow: model.story_eyebrow,
        story_heading: model.story_heading,
        story_body: model.story_body,
        message: model.story_body || model.hero_message,
        gallery_eyebrow: model.gallery_eyebrow,
        gallery_title: model.gallery_title,
        gallery_intro: model.gallery_intro,
        guests_intro: model.guests_intro,
        contact: model.contact_phone,
        hero_image: model.hero_image,
        hero_blur: String(model.hero_blur ?? 0),
        hero_zoom: String(model.hero_zoom ?? 1),
        hero_position_x: String(model.hero_position_x ?? 50),
        hero_position_y: String(model.hero_position_y ?? 50),
        ceremony_name: model.ceremony.name,
        ceremony_time: model.ceremony.time,
        ceremony_address: model.ceremony.address,
        reception_name: model.reception.name,
        reception_time: model.reception.time,
        reception_address: model.reception.address,
        ceremony_json: JSON.stringify(model.ceremony),
        reception_json: JSON.stringify(model.reception),
        schedule_json: JSON.stringify(model.schedule),
        gallery_json: JSON.stringify(model.gallery),
        guests_json: JSON.stringify(withGuestIds(model.guests)),
        custom_texts_json: JSON.stringify(model.custom_texts ?? []),
    };
}
