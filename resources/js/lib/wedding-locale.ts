import type { WeddingPage } from '@/types/wedding';

export type WeddingLocaleContent = {
    bride_name: string;
    groom_name: string;
    headline: string | null;
    story: string | null;
    host_message: string | null;
    title: string | null;
    details: Record<string, string | null>;
};

export type WeddingTranslationRow = {
    locale: string;
    content: Record<string, string | null>;
};

/** Overlay translation keys onto primary details for gallery templates. */
export function detailsForLocale(
    details: Record<string, string | null>,
    translation: Record<string, string | null>,
    locale: string,
    primaryLanguage: string,
): Record<string, string | null> {
    if (!translation || locale === primaryLanguage) {
        return { ...details };
    }

    const next = { ...details };
    const overlays: Record<string, string | null | undefined> = {
        hero_message: translation.hero_message || translation.host_message || null,
        story_body: translation.story_body || translation.story || null,
        story_heading: translation.story_heading || null,
        story_eyebrow: translation.story_eyebrow || null,
        kicker: translation.kicker || translation.headline || null,
        event_line: translation.event_line || null,
        gallery_eyebrow: translation.gallery_eyebrow || null,
        gallery_title: translation.gallery_title || null,
        gallery_intro: translation.gallery_intro || null,
        guests_intro: translation.guests_intro || null,
        attire_title: translation.attire_title || null,
        attire_body: translation.attire_body || null,
        gifts_intro: translation.gifts_intro || null,
        travel_stays_notes: translation.travel_stays_notes || null,
        livestream_label: translation.livestream_label || null,
        livestream_note: translation.livestream_note || null,
        wishes_intro: translation.wishes_intro || null,
        ceremony_name: translation.ceremony_name || null,
        reception_name: translation.reception_name || null,
        ceremony_address: translation.ceremony_address || null,
        reception_address: translation.reception_address || null,
        dress_code: translation.dress_code || null,
        gift_note: translation.gift_note || null,
        rsvp_line: translation.rsvp_line || null,
        schedule_json: translation.schedule_json || null,
        faq_json: translation.faq_json || null,
        gifts_json: translation.gifts_json || null,
        travel_stays_json: translation.travel_stays_json || null,
        explore_json: translation.explore_json || null,
        lineup_json: translation.lineup_json || null,
    };

    Object.entries(overlays).forEach(([key, value]) => {
        if (typeof value !== 'string') {
            return;
        }
        const trimmed = value.trim();
        if (!trimmed) {
            return;
        }
        next[key] = trimmed;
    });

    return next;
}

/**
 * Resolve guest-facing copy for a locale without a server round-trip.
 * Uses `wedding.primary` + `wedding.translations` when present; falls back to baked fields.
 */
export function resolveLocalizedWedding(
    wedding: WeddingPage,
    locale: string,
): {
    locale: string;
    bride_name: string;
    groom_name: string;
    bride_display_name: string | null;
    groom_display_name: string | null;
    headline: string | null;
    story: string | null;
    host_message: string | null;
    title: string | null;
    details: Record<string, string | null>;
} {
    const primaryLanguage = (wedding.language || 'en').trim() || 'en';
    const primary = wedding.primary;
    const translations = wedding.translations ?? wedding.owner?.translations ?? [];
    const row = translations.find((item) => item.locale === locale);
    const content = (row?.content ?? {}) as Record<string, string | null>;

    const baseDetails: Record<string, string | null> = {
        ...(primary?.details ?? wedding.details ?? {}),
    };

    if (!primary) {
        // Legacy payload: fields already locale-baked for wedding.locale.
        if (locale === (wedding.locale || primaryLanguage)) {
            return {
                locale,
                bride_name: wedding.bride_name,
                groom_name: wedding.groom_name,
                bride_display_name: wedding.bride_display_name,
                groom_display_name: wedding.groom_display_name,
                headline: wedding.headline,
                story: wedding.story,
                host_message: wedding.host_message,
                title: wedding.title ?? null,
                details: detailsForLocale(baseDetails, content, locale, primaryLanguage),
            };
        }
    }

    const source = primary ?? {
        bride_name: wedding.bride_name,
        groom_name: wedding.groom_name,
        headline: wedding.headline,
        story: wedding.story,
        host_message: wedding.host_message,
        title: wedding.title ?? null,
        details: baseDetails,
    };

    const useSecondary = Boolean(locale) && locale !== primaryLanguage && Object.keys(content).length > 0;
    const pick = (key: string, fallback: string | null): string | null => {
        if (!useSecondary) {
            return fallback;
        }
        const translated = content[key];
        if (typeof translated === 'string' && translated.trim()) {
            return translated.trim();
        }
        return fallback;
    };

    const bride =
        pick('bride_display_name', source.bride_name)?.trim() || source.bride_name;
    const groom =
        pick('groom_display_name', source.groom_name)?.trim() || source.groom_name;

    return {
        locale,
        bride_name: bride,
        groom_name: groom,
        bride_display_name: useSecondary
            ? pick('bride_display_name', null)
            : null,
        groom_display_name: useSecondary
            ? pick('groom_display_name', null)
            : null,
        headline: pick('headline', source.headline),
        story: pick('story', source.story),
        host_message: pick('host_message', source.host_message),
        title: pick('title', source.title),
        details: detailsForLocale(
            { ...(source.details ?? {}) },
            content,
            locale,
            primaryLanguage,
        ),
    };
}

export function weddingLocaleOptions(wedding: WeddingPage): { code: string; label: string }[] {
    const codes = [wedding.language, wedding.secondary_language].filter(
        (code, index, all): code is string =>
            Boolean(code?.trim()) && all.indexOf(code) === index,
    );

    if (codes.length < 2) {
        return [];
    }

    return codes.map((code) => ({
        code,
        label: wedding.options?.locales?.[code]?.native ?? code.toUpperCase(),
    }));
}

/** Update ?lang= without an Inertia visit / full refresh. */
export function replaceLangInUrl(code: string): void {
    if (typeof window === 'undefined') {
        return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('lang', code);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}
