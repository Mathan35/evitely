import type { EditorSectionId } from '@/components/studio/editor-modules';

/** Feature flags from SiteBillingState.features — false on trial. */
export type SitePremiumFeatures = Record<string, boolean>;

/**
 * Sections gated by paid site features (intro/hero/background are unlocked on trial).
 * Style pickers (intro/hero/etc.) stay open but default-only — see STYLE_OPTIONS_FEATURE.
 */
export const SECTION_PREMIUM_FEATURE: Partial<Record<EditorSectionId, string>> = {
    seo: 'seo',
    security: 'security',
    // Invitation cards stay free. Guest path stays free; custom subdomain is gated in SiteLinkPanel.
};

/** Multi-option style pickers → billing feature. Trial keeps the section open with the default only. */
export const STYLE_OPTIONS_FEATURE = {
    intro: 'intro_styles',
    hero: 'hero_image',
    header: 'hero_image',
    design: 'site_background',
    photos: 'gallery_options',
    timer: 'countdown_timer',
    music: 'custom_music',
} as const;

export type StyleOptionsArea = keyof typeof STYLE_OPTIONS_FEATURE;

export const PREMIUM_FEATURE_LABELS: Record<string, string> = {
    intro_styles: 'Intro animations',
    hero_image: 'Hero & header styling',
    site_background: 'Background colors',
    gallery_options: 'Gallery layouts & styles',
    countdown_timer: 'Countdown designs',
    custom_music: 'Background music',
    premium_templates: 'Invitation card & premium templates',
    seo: 'Share title & SEO',
    security: 'Passcode protection',
    subdomain_custom: 'Custom guest subdomain',
    seating: 'Seating charts',
    vendors: 'Vendors',
    co_hosts: 'Extra co-hosts',
    analytics_advanced: 'Advanced analytics',
    remove_branding: 'Remove branding',
    automated_messaging: 'Automated messaging',
};

export function sectionRequiresPremium(section: EditorSectionId): string | null {
    return SECTION_PREMIUM_FEATURE[section] ?? null;
}

export function isSectionLocked(
    section: EditorSectionId,
    features: SitePremiumFeatures | null | undefined,
    canUsePremium: boolean | null | undefined,
): boolean {
    const key = sectionRequiresPremium(section);
    if (!key) {
        return false;
    }
    if (canUsePremium === true) {
        return false;
    }
    if (features && Object.prototype.hasOwnProperty.call(features, key)) {
        return features[key] === false;
    }
    return canUsePremium === false;
}

/** True when trial / unpaid should hide multi-option pickers and keep the product default. */
export function isStyleOptionsLocked(
    area: StyleOptionsArea,
    features: SitePremiumFeatures | null | undefined,
    canUsePremium: boolean | null | undefined,
): boolean {
    if (canUsePremium === true) {
        return false;
    }
    const key = STYLE_OPTIONS_FEATURE[area];
    if (features && Object.prototype.hasOwnProperty.call(features, key)) {
        return features[key] === false;
    }
    return canUsePremium === false;
}

export function featureLabel(key: string): string {
    return PREMIUM_FEATURE_LABELS[key] ?? key;
}

/** Force product defaults into details when trial style pickers are locked. */
export function applyTrialDefaultDetails(
    details: Record<string, string>,
    features: SitePremiumFeatures | null | undefined,
    canUsePremium: boolean | null | undefined,
    defaults: {
        intro: string;
        hero: string;
        header: string;
        gallery: string;
        timer: string;
    },
): Record<string, string> {
    if (canUsePremium === true) {
        return details;
    }

    let next = details;
    const touch = (key: string, value: string) => {
        if ((next[key] || '') === value) {
            return;
        }
        if (next === details) {
            next = { ...details };
        }
        next[key] = value;
    };

    if (isStyleOptionsLocked('intro', features, canUsePremium)) {
        touch('intro_style', defaults.intro);
    }
    if (isStyleOptionsLocked('hero', features, canUsePremium)) {
        touch('hero_style', defaults.hero);
        touch('header_style', defaults.header);
    }
    if (isStyleOptionsLocked('design', features, canUsePremium)) {
        touch('site_bg_id', '');
        touch('site_bg', '');
        touch('site_surface', '');
    }
    if (isStyleOptionsLocked('photos', features, canUsePremium)) {
        touch('gallery_style', defaults.gallery);
    }
    if (isStyleOptionsLocked('timer', features, canUsePremium)) {
        touch('timer_style', defaults.timer);
    }

    return next;
}
