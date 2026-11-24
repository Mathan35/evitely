import {
    BABY_SHOWER_STYLE_KEYS,
    babyShowerGalleryPhotos,
    babyShowerHeroSrc,
    babyShowerSiteTheme,
} from '@/components/marketing/site-previews/baby-shower-site-themes';
import {
    BIRTHDAY_SAMPLE,
    BIRTHDAY_STYLE_KEYS,
    birthdayGalleryPhotos,
    birthdayHeroSrc,
    birthdaySiteTheme,
} from '@/components/marketing/site-previews/birthday-site-themes';
import {
    BRIDAL_SHOWER_STYLE_KEYS,
    bridalShowerGalleryPhotos,
    bridalShowerHeroSrc,
    bridalShowerSiteTheme,
} from '@/components/marketing/site-previews/bridal-shower-site-themes';
import {
    CORPORATE_STYLE_KEYS,
    corporateGalleryPhotos,
    corporateHeroSrc,
    corporateSiteTheme,
} from '@/components/marketing/site-previews/corporate-site-themes';
import {
    CUSTOM_STYLE_KEYS,
    customGalleryPhotos,
    customHeroSrc,
    customSiteTheme,
} from '@/components/marketing/site-previews/custom-site-themes';
import {
    GRADUATION_STYLE_KEYS,
    graduationGalleryPhotos,
    graduationHeroSrc,
    graduationSiteTheme,
} from '@/components/marketing/site-previews/graduation-site-themes';
import {
    HOUSEWARMING_STYLE_KEYS,
    housewarmingGalleryPhotos,
    housewarmingHeroSrc,
    housewarmingSiteTheme,
} from '@/components/marketing/site-previews/housewarming-site-themes';
import {
    PARTY_STYLE_KEYS,
    partyGalleryPhotos,
    partyHeroSrc,
    partySiteTheme,
} from '@/components/marketing/site-previews/party-site-themes';
import {
    WEDDING_STYLE_KEYS,
    weddingGalleryPhotos,
    weddingHeroSrc,
    weddingSiteTheme,
} from '@/components/marketing/site-previews/wedding-site-themes';

export type OccasionSlug =
    | 'wedding'
    | 'birthday'
    | 'corporate'
    | 'baby-shower'
    | 'party'
    | 'graduation'
    | 'bridal-shower'
    | 'housewarming'
    | 'custom';

export type OccasionGalleryPhoto = {
    src: string;
    title: string;
    note: string;
    span: 'hero' | 'tall' | 'wide' | 'square';
};

export type OccasionThemeSlice = {
    venue: string;
    city: string;
    space: string;
    secondarySpace: string;
    schedule: { time: string; title: string }[];
    date?: string;
    dateLabel?: string;
    storyEyebrow: string;
    storyHeading: string;
    galleryTitle: string;
    galleryIntro: string;
    primaryVenueTitle: string;
    secondaryVenueTitle: string;
};

const SLUG_ALIASES: Record<string, OccasionSlug> = {
    wedding: 'wedding',
    weddings: 'wedding',
    birthday: 'birthday',
    birthdays: 'birthday',
    corporate: 'corporate',
    'corporate-event': 'corporate',
    'corporate-events': 'corporate',
    'baby-shower': 'baby-shower',
    baby: 'baby-shower',
    babies: 'baby-shower',
    party: 'party',
    parties: 'party',
    graduation: 'graduation',
    'bridal-shower': 'bridal-shower',
    bridal: 'bridal-shower',
    housewarming: 'housewarming',
    custom: 'custom',
};

export function normalizeOccasionSlug(value?: string | null): OccasionSlug {
    const key = (value || 'wedding').trim().toLowerCase();
    return SLUG_ALIASES[key] || 'wedding';
}

export function occasionStyleKeys(slug: OccasionSlug): readonly string[] {
    switch (slug) {
        case 'birthday':
            return BIRTHDAY_STYLE_KEYS;
        case 'corporate':
            return CORPORATE_STYLE_KEYS;
        case 'baby-shower':
            return BABY_SHOWER_STYLE_KEYS;
        case 'party':
            return PARTY_STYLE_KEYS;
        case 'graduation':
            return GRADUATION_STYLE_KEYS;
        case 'bridal-shower':
            return BRIDAL_SHOWER_STYLE_KEYS;
        case 'housewarming':
            return HOUSEWARMING_STYLE_KEYS;
        case 'custom':
            return CUSTOM_STYLE_KEYS;
        default:
            return WEDDING_STYLE_KEYS;
    }
}

export function occasionHeroSrc(slug: OccasionSlug, styleKey: string, device: 'mobile' | 'desktop'): string {
    switch (slug) {
        case 'birthday':
            return birthdayHeroSrc(styleKey, device);
        case 'corporate':
            return corporateHeroSrc(styleKey, device);
        case 'baby-shower':
            return babyShowerHeroSrc(styleKey, device);
        case 'party':
            return partyHeroSrc(styleKey, device);
        case 'graduation':
            return graduationHeroSrc(styleKey, device);
        case 'bridal-shower':
            return bridalShowerHeroSrc(styleKey, device);
        case 'housewarming':
            return housewarmingHeroSrc(styleKey, device);
        case 'custom':
            return customHeroSrc(styleKey, device);
        default:
            return weddingHeroSrc(styleKey, device);
    }
}

export function occasionGalleryPhotos(slug: OccasionSlug, styleKey: string): OccasionGalleryPhoto[] {
    switch (slug) {
        case 'birthday':
            return birthdayGalleryPhotos(styleKey);
        case 'corporate':
            return corporateGalleryPhotos(styleKey);
        case 'baby-shower':
            return babyShowerGalleryPhotos(styleKey);
        case 'party':
            return partyGalleryPhotos(styleKey);
        case 'graduation':
            return graduationGalleryPhotos(styleKey);
        case 'bridal-shower':
            return bridalShowerGalleryPhotos(styleKey);
        case 'housewarming':
            return housewarmingGalleryPhotos(styleKey);
        case 'custom':
            return customGalleryPhotos(styleKey);
        default:
            return weddingGalleryPhotos(styleKey);
    }
}

function copyFor(slug: OccasionSlug): Pick<
    OccasionThemeSlice,
    'storyEyebrow' | 'storyHeading' | 'galleryTitle' | 'galleryIntro' | 'primaryVenueTitle' | 'secondaryVenueTitle'
> {
    switch (slug) {
        case 'birthday':
            return {
                storyEyebrow: 'The Night',
                storyHeading: 'Celebrate\nTogether',
                galleryTitle: 'Party Moments',
                galleryIntro: 'A sample of the night — tap any frame to open it.',
                primaryVenueTitle: 'The Party',
                secondaryVenueTitle: 'Afterparty',
            };
        case 'corporate':
            return {
                storyEyebrow: 'Agenda',
                storyHeading: 'Join\nThe Day',
                galleryTitle: 'Event Moments',
                galleryIntro: 'A sample of the program — tap any frame to open it.',
                primaryVenueTitle: 'Keynote',
                secondaryVenueTitle: 'Reception',
            };
        case 'baby-shower':
            return {
                storyEyebrow: 'Baby Shower',
                storyHeading: 'Welcome\nLittle One',
                galleryTitle: 'Shower Moments',
                galleryIntro: 'A sample of the shower — tap any frame to open it.',
                primaryVenueTitle: 'Shower',
                secondaryVenueTitle: 'Brunch',
            };
        case 'party':
            return {
                storyEyebrow: 'The Party',
                storyHeading: 'Come\nCelebrate',
                galleryTitle: 'Party Moments',
                galleryIntro: 'A sample of the celebration — tap any frame to open it.',
                primaryVenueTitle: 'Main event',
                secondaryVenueTitle: 'Afterparty',
            };
        case 'graduation':
            return {
                storyEyebrow: 'Graduation',
                storyHeading: 'Caps\nUp',
                galleryTitle: 'Grad Moments',
                galleryIntro: 'A sample of the day — tap any frame to open it.',
                primaryVenueTitle: 'Ceremony',
                secondaryVenueTitle: 'Reception',
            };
        case 'bridal-shower':
            return {
                storyEyebrow: 'Bridal Shower',
                storyHeading: 'For\nThe Bride',
                galleryTitle: 'Shower Moments',
                galleryIntro: 'A sample of the shower — tap any frame to open it.',
                primaryVenueTitle: 'Shower',
                secondaryVenueTitle: 'Brunch',
            };
        case 'housewarming':
            return {
                storyEyebrow: 'Housewarming',
                storyHeading: 'Our\nNew Home',
                galleryTitle: 'Home Moments',
                galleryIntro: 'A sample of the day — tap any frame to open it.',
                primaryVenueTitle: 'Puja',
                secondaryVenueTitle: 'Lunch',
            };
        case 'custom':
            return {
                storyEyebrow: 'The Event',
                storyHeading: 'Join\nUs',
                galleryTitle: 'Moments',
                galleryIntro: 'A sample of the day — tap any frame to open it.',
                primaryVenueTitle: 'Main venue',
                secondaryVenueTitle: 'Second venue',
            };
        default:
            return {
                storyEyebrow: 'Our Story',
                storyHeading: 'With Our\nFamilies',
                galleryTitle: 'Our Moments',
                galleryIntro: 'A sample of the weekend — tap any frame to open it.',
                primaryVenueTitle: 'Ceremony',
                secondaryVenueTitle: 'Reception',
            };
    }
}

export function occasionThemeSlice(slug: OccasionSlug, styleKey: string): OccasionThemeSlice {
    const copy = copyFor(slug);

    if (slug === 'birthday') {
        const theme = birthdaySiteTheme(styleKey);
        return {
            venue: theme.venue,
            city: theme.city,
            space: theme.space,
            secondarySpace: theme.afterparty,
            schedule: theme.schedule,
            date: BIRTHDAY_SAMPLE.date,
            dateLabel: BIRTHDAY_SAMPLE.dateLabel,
            ...copy,
        };
    }

    if (slug === 'corporate') {
        const theme = corporateSiteTheme(styleKey);
        return {
            venue: theme.venue,
            city: theme.city,
            space: theme.space,
            secondarySpace: theme.reception,
            schedule: theme.schedule,
            ...copy,
        };
    }

    if (slug === 'baby-shower') {
        const theme = babyShowerSiteTheme(styleKey);
        return {
            venue: theme.venue,
            city: theme.city,
            space: theme.space,
            secondarySpace: theme.afterparty,
            schedule: theme.schedule,
            ...copy,
        };
    }

    if (slug === 'party') {
        const theme = partySiteTheme(styleKey);
        return {
            venue: theme.venue,
            city: theme.city,
            space: theme.space,
            secondarySpace: theme.afterparty,
            schedule: theme.schedule,
            ...copy,
        };
    }

    if (slug === 'graduation') {
        const theme = graduationSiteTheme(styleKey);
        return {
            venue: theme.venue,
            city: theme.city,
            space: theme.space,
            secondarySpace: theme.afterparty,
            schedule: theme.schedule,
            ...copy,
        };
    }

    if (slug === 'bridal-shower') {
        const theme = bridalShowerSiteTheme(styleKey);
        return {
            venue: theme.venue,
            city: theme.city,
            space: theme.space,
            secondarySpace: theme.afterparty,
            schedule: theme.schedule,
            ...copy,
        };
    }

    if (slug === 'housewarming') {
        const theme = housewarmingSiteTheme(styleKey);
        return {
            venue: theme.venue,
            city: theme.city,
            space: theme.space,
            secondarySpace: theme.afterparty,
            schedule: theme.schedule,
            ...copy,
        };
    }

    if (slug === 'custom') {
        const theme = customSiteTheme(styleKey);
        return {
            venue: theme.venue,
            city: theme.city,
            space: theme.space,
            secondarySpace: theme.afterparty,
            schedule: theme.schedule,
            ...copy,
        };
    }

    const theme = weddingSiteTheme(styleKey);
    return {
        venue: theme.venue,
        city: theme.city,
        space: theme.ceremony,
        secondarySpace: theme.reception,
        schedule: theme.schedule,
        date: theme.date,
        dateLabel: theme.dateLabel,
        ...copy,
    };
}

/** True when a saved media URL is stock art from a different occasion (stale wedding defaults). */
export function isForeignOccasionStockUrl(src: string, slug: OccasionSlug): boolean {
    const value = src.trim();
    if (!value.includes('/images/gallery/previews/')) {
        return false;
    }
    if (slug === 'wedding') {
        return false;
    }
    // Glasshouse venue maps are wedding-only stock used as wrong defaults.
    if (value.includes('/images/gallery/previews/glasshouse/')) {
        return true;
    }
    return value.includes('/images/gallery/previews/wedding/');
}

export function resolveOccasionSlugFromDesign(
    design?: { id?: string; event_type?: string | null } | null,
    fallback?: string | null,
): OccasionSlug {
    if (design?.event_type) {
        return normalizeOccasionSlug(design.event_type);
    }
    const fromId = (design?.id || '').split('-')[0];
    if (fromId) {
        return normalizeOccasionSlug(fromId);
    }
    return normalizeOccasionSlug(fallback);
}
