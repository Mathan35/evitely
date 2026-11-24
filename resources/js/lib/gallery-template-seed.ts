import {
    mergePreviewLive as mergePreviewLiveValues,
    type PreviewLiveContent,
} from '@/components/marketing/site-previews/preview-live';
import type { GalleryDesign, GallerySample } from '@/types/gallery';

export { mergePreviewLiveValues as mergePreviewLive };

export type TemplateSeed = {
    bride_name: string;
    groom_name: string;
    headline: string;
    story: string;
    host_message: string;
    venue_name: string;
    city: string;
    request_line: string;
    rsvp_line: string;
    dress_code: string;
    event_name: string;
    message: string;
};

function parseHosts(sample?: GallerySample | null): { bride: string; groom: string } {
    const fromBride = sample?.bride?.trim();
    const fromGroom = sample?.groom?.trim();
    if (fromBride || fromGroom) {
        return {
            bride: fromBride || fromGroom || '',
            groom: fromGroom || fromBride || '',
        };
    }

    const hosts = sample?.hosts?.trim() ?? '';
    if (!hosts) {
        return { bride: '', groom: '' };
    }

    if (hosts.includes('&')) {
        const [left, right] = hosts.split('&', 2).map((part) => part.trim());
        return { groom: left || '', bride: right || left || '' };
    }

    return { bride: hosts, groom: hosts };
}

function parseWhere(where?: string | null): { venue: string; city: string } {
    const value = where?.trim() ?? '';
    if (!value) {
        return { venue: '', city: '' };
    }
    if (value.includes(',')) {
        const [venue, city] = value.split(',', 2).map((part) => part.trim());
        return { venue: venue || '', city: city || '' };
    }
    return { venue: value, city: '' };
}

export function seedFromGallerySample(sample?: GallerySample | null): TemplateSeed {
    const hosts = parseHosts(sample);
    const place = parseWhere(sample?.where ?? sample?.venue_name);
    const requestLine = (sample?.request_line || '').trim();
    const message = (sample?.message || sample?.headline_sub || requestLine || '').trim();

    return {
        bride_name: hosts.bride,
        groom_name: hosts.groom,
        headline: (sample?.kicker || sample?.headline || sample?.blessing || '').trim(),
        story: message,
        host_message: (requestLine || sample?.compliments || '').trim(),
        venue_name: (sample?.venue_name || place.venue).trim(),
        city: place.city,
        request_line: requestLine,
        rsvp_line: (sample?.rsvp_line || '').trim(),
        dress_code: (sample?.dress_code || '').trim(),
        event_name: (sample?.event_name || '').trim(),
        message,
    };
}

export const EDITOR_TO_PREVIEW_SECTION: Record<string, string> = {
    names: 'home',
    content: 'story',
    hero: 'home',
    design: 'home',
    intro: 'home',
    invitation: 'card',
    timer: 'countdown',
    guide: 'faq',
    location: 'itinerary',
    photos: 'gallery',
    guests: 'guests',
    music: 'home',
    preferences: 'home',
    security: 'home',
    site: 'home',
};

/** Content panel field → preview section anchor (gh-/hw-/cu-*-{anchor}). */
export const CONTENT_FIELD_TO_PREVIEW_ANCHOR: Record<string, string> = {
    kicker: 'home',
    hero_message: 'home',
    event_line: 'home',
    story_eyebrow: 'story',
    story_heading: 'story',
    story_body: 'story',
    gallery_eyebrow: 'gallery',
    gallery_title: 'gallery',
    gallery_intro: 'gallery',
    guests_intro: 'guests',
    contact_phone: 'guests',
};

export function templateGalleryPhotos(
    slug: string,
    styleKey: string,
): { label: string; src: string; note?: string }[] {
    const bust = slug === 'wedding' ? '?v=11' : '?v=1';
    const root = `/images/gallery/previews/${slug}`;
    const moments = [
        { title: 'Hero moment', note: 'Main website image' },
        { title: 'Gallery 1', note: 'Preview mosaic' },
        { title: 'Gallery 2', note: 'Preview mosaic' },
        { title: 'Gallery 3', note: 'Preview mosaic' },
        { title: 'Gallery 4', note: 'Preview mosaic' },
        { title: 'Venue', note: 'Location atmosphere' },
    ];

    // Prefer the selected style as the first tile, then rotate sibling heroes for mosaic parity with website previews.
    const stylePool =
        slug === 'wedding'
            ? [
                  'glasshouse',
                  'eucalyptus',
                  'black-tie',
                  'tropical',
                  'vintage-botanical',
                  'estate',
                  'monochrome',
                  'golden-hour',
              ]
            : [styleKey];

    const start = Math.max(0, stylePool.indexOf(styleKey));

    return moments.map((moment, index) => {
        const key = stylePool[(start + index) % stylePool.length] || styleKey;
        const device = index % 2 === 0 ? 'desktop' : 'mobile';

        return {
            label: moment.title,
            note: moment.note,
            src: `${root}/${key}-hero-${device}.jpg${bust}`,
        };
    });
}

/** Map gallery sample hosts into website-preview bride/groom fields. */
export function previewHostsFromSample(sample?: GallerySample | null): { bride: string; groom: string } {
    return parseHosts(sample);
}

/** Baseline live overlay from the selected gallery template sample. */
export function liveContentFromGalleryDesign(design?: GalleryDesign | null): PreviewLiveContent | null {
    if (!design?.sample) {
        return null;
    }

    const sample = design.sample;
    const hosts = parseHosts(sample);
    const place = parseWhere(sample.where ?? sample.venue_name);
    const kicker = (sample.kicker || sample.headline || sample.blessing || '').trim();
    const message = (sample.message || sample.headline_sub || sample.request_line || '').trim();
    const venue = (sample.venue_name || place.venue).trim();
    const city = place.city.trim();
    const eventName = (sample.event_name || '').trim();
    const dateLabel = (sample.date_label || sample.when || '').trim();

    return {
        ...(hosts.bride ? { bride: hosts.bride } : {}),
        ...(hosts.groom ? { groom: hosts.groom } : {}),
        ...(hosts.bride || hosts.groom ? { host: hosts.bride || hosts.groom } : {}),
        ...(hosts.groom || hosts.bride ? { company: hosts.groom || hosts.bride } : {}),
        ...(kicker ? { kicker } : {}),
        ...(message ? { message } : {}),
        ...(eventName ? { eventName } : {}),
        ...(dateLabel ? { dateLabel } : {}),
        ...(venue ? { venue } : {}),
        ...(city ? { city } : {}),
    };
}

export function mergeWeddingWithTemplateSeed<T extends Record<string, unknown>>(
    current: T,
    seed: TemplateSeed,
    emptyValues: string[] = ['', 'Sophia', 'Daniel', 'Guest', 'Host', 'Partner'],
): T {
    const next = { ...current };

    const fill = (key: keyof T & string, value: string) => {
        const existing = String(next[key] ?? '').trim();
        if ((!existing || emptyValues.includes(existing)) && value) {
            (next as Record<string, unknown>)[key] = value;
        }
    };

    fill('bride_name', seed.bride_name);
    fill('groom_name', seed.groom_name);
    fill('headline', seed.headline);
    fill('story', seed.story);
    fill('host_message', seed.host_message);
    fill('venue_name', seed.venue_name);
    fill('city', seed.city);

    return next;
}

export function templateAssetUrls(
    design: GalleryDesign,
    slug: string,
    invitationCard?: GalleryDesign | null,
): { label: string; src: string }[] {
    const style = design.style_key;
    const assets: { label: string; src: string }[] = [];

    if (design.image_desktop || design.image) {
        assets.push({ label: 'Template cover', src: design.image_desktop || design.image || '' });
    }
    if (design.image_mobile && design.image_mobile !== design.image) {
        assets.push({ label: 'Mobile art', src: design.image_mobile });
    }

    const previewRoot = `/images/gallery/previews/${slug}/${style}`;
    const bust = slug === 'wedding' ? '?v=11' : '?v=1';

    assets.push(
        { label: 'Hero · desktop', src: `${previewRoot}-hero-desktop.jpg${bust}` },
        { label: 'Hero · mobile', src: `${previewRoot}-hero-mobile.jpg${bust}` },
    );

    const cardSrc = invitationCard?.image_mobile || invitationCard?.image;
    if (cardSrc) {
        assets.push({ label: 'Matched card', src: cardSrc });
    }

    return assets.filter((item) => Boolean(item.src));
}
