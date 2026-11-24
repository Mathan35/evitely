import type { PreviewLiveContent } from '@/components/marketing/site-previews/preview-live';
import { copyFor } from '@/lib/invitation-copy';

/** Editable copy blocks that appear on every occasion website template. */
export type LiveSiteCopy = {
    kicker: string;
    heroMessage: string;
    eventLine: string;
    storyEyebrow: string;
    storyHeading: string;
    storyBody: string;
    galleryEyebrow: string;
    galleryTitle: string;
    galleryIntro: string;
    guestsIntro: string;
    contactPhone: string;
};

const DEFAULTS: LiveSiteCopy = {
    kicker: '',
    heroMessage: '',
    eventLine: '',
    storyEyebrow: 'Our Story',
    storyHeading: 'With Our\nFamilies',
    storyBody: '',
    galleryEyebrow: 'Gallery',
    galleryTitle: 'Our Moments',
    galleryIntro: 'A sample of the weekend — tap any frame to open it.',
    guestsIntro: 'Friends and family joining the celebration.',
    contactPhone: '+1 (555) 014-2218',
};

function pick(live: string | undefined | null, fallback: string): string {
    if (live === undefined || live === null) {
        return fallback;
    }
    return live;
}

/**
 * Merge PreviewLiveContent copy onto occasion defaults so Content-panel edits
 * always show on the framed editor preview (and published site).
 * When a locale is set, empty chrome defaults follow invitation-copy.
 */
export function resolveLiveSiteCopy(
    live: PreviewLiveContent | null | undefined,
    defaults: Partial<LiveSiteCopy> = {},
): LiveSiteCopy {
    const ui = copyFor(live?.locale || 'en');
    const localeDefaults: Partial<LiveSiteCopy> = {
        storyEyebrow: ui.navStory,
        storyHeading: ui.withFamilies,
        galleryEyebrow: ui.navGallery,
        galleryTitle: ui.ourMoments,
        guestsIntro: ui.whoIsComing,
    };
    const base: LiveSiteCopy = { ...DEFAULTS, ...localeDefaults, ...defaults };
    const shared = (live?.message || '').trim();

    return {
        kicker: pick(live?.kicker, base.kicker),
        // Hero and story stay independent — only fall back to shared message when unset.
        heroMessage: pick(live?.heroMessage, base.heroMessage || shared),
        eventLine: pick(live?.eventLine, base.eventLine),
        storyEyebrow: pick(live?.storyEyebrow, base.storyEyebrow),
        storyHeading: pick(live?.storyHeading, base.storyHeading),
        storyBody: pick(live?.storyBody, base.storyBody || shared),
        galleryEyebrow: pick(live?.galleryEyebrow, base.galleryEyebrow),
        galleryTitle: pick(live?.galleryTitle, base.galleryTitle),
        galleryIntro: pick(live?.galleryIntro, base.galleryIntro),
        guestsIntro: pick(live?.guestsIntro, base.guestsIntro),
        contactPhone: pick(live?.contactPhone, base.contactPhone),
    };
}

/** Split a heading that may contain intentional line breaks. */
export function splitHeadingLines(heading: string): string[] {
    const lines = heading.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    return lines.length > 0 ? lines : [heading];
}
