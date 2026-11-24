export const BRIDAL_SHOWER_SAMPLE = {
    kicker: "You're Invited",
    name: 'Claire',
    eventName: 'Bridal Shower',
    message: 'Join us for brunch, flowers, and a morning with the people who love Claire before the wedding day.',
    eventLine: 'Brunch · 12 September 2026',
    date: '2026-09-12',
    dateLabel: 'Saturday, 12 September 2026',
    dateShort: 'Saturday · 12 September 2026',
} as const;

export const BRIDAL_SHOWER_STYLE_KEYS = [
    'pre-wedding',
    'miss-to-mrs',
    'brunch-bloom',
    'tropical-bach',
    'gilded-gala',
    'wildflower',
    'desert',
    'pajama',
    'minimal-rose',
    'girls-night',
    'spa',
    'hen',
    'yacht',
    'tea',
    'lounge',
    'sparkles',
    'next-journey',
    'registry',
    'confetti',
    'feast',
] as const;

export function bridalShowerHeroSrc(styleKey: string, device: 'mobile' | 'desktop'): string {
    const file = device === 'desktop' ? `${styleKey}-hero-desktop.jpg` : `${styleKey}-hero-mobile.jpg`;

    return `/images/gallery/previews/bridal-shower/${file}?v=1`;
}

const BRIDAL_SHOWER_CARD_KEYS = [
    'blush-filigree',
    'gold-crystal-oval',
    'pink-oval-rose',
    'pearl-vine',
    'emboss-gold-panel',
    'cream-oval-sculpt',
    'ivory-capsule',
    'anime-bride',
    'tulip-bride',
    'pearl-couple',
    'pearl-gold-frame',
    'veil-roses',
    'pajama-blush',
    'pearl-bow',
    'ribbon-right',
    'cream-panel',
    'left-ribbon',
    'rose-pearl',
    'pajama-burgundy',
    'marble-ribbon',
] as const;

export function bridalShowerCardSrc(styleKey: string): string {
    const index = Math.max(0, BRIDAL_SHOWER_STYLE_KEYS.indexOf(styleKey as (typeof BRIDAL_SHOWER_STYLE_KEYS)[number]));
    const key = BRIDAL_SHOWER_CARD_KEYS[index % BRIDAL_SHOWER_CARD_KEYS.length];

    return `/images/gallery/bridal-shower/blank/card-${key}.jpg?v=1`;
}

const GALLERY_MOMENTS = [
    { title: 'The arch', note: 'Where guests arrive' },
    { title: 'Soft light', note: 'Details of the brunch' },
    { title: 'In bloom', note: 'Flowers for Claire' },
    { title: 'Golden hour', note: 'A quiet table' },
    { title: 'Petal path', note: 'The aisle we chose' },
    { title: 'After brunch', note: 'When the toasts begin' },
    { title: 'A quiet view', note: 'The place we chose' },
    { title: 'For the bride', note: 'A frame from the day' },
] as const;

export type BridalShowerGalleryPhoto = {
    src: string;
    title: string;
    note: string;
    span: 'hero' | 'tall' | 'wide' | 'square';
};

export function bridalShowerGalleryPhotos(styleKey: string): BridalShowerGalleryPhoto[] {
    const start = Math.max(0, BRIDAL_SHOWER_STYLE_KEYS.indexOf(styleKey as (typeof BRIDAL_SHOWER_STYLE_KEYS)[number]));
    const spans: BridalShowerGalleryPhoto['span'][] = ['hero', 'tall', 'square', 'square', 'wide', 'tall', 'square', 'wide'];

    return GALLERY_MOMENTS.map((moment, index) => {
        const key = BRIDAL_SHOWER_STYLE_KEYS[(start + index) % BRIDAL_SHOWER_STYLE_KEYS.length];
        const portrait = spans[index] === 'tall';

        return {
            src: bridalShowerHeroSrc(key, portrait ? 'mobile' : 'desktop'),
            title: moment.title,
            note: moment.note,
            span: spans[index],
        };
    });
}

export type BridalShowerSiteTheme = {
    bg: string;
    surface: string;
    ink: string;
    accent: string;
    muted: string;
    buttonInk: string;
    button: 'rounded-md' | 'rounded-full';
    venue: string;
    city: string;
    space: string;
    afterparty: string;
    schedule: { time: string; title: string }[];
};

const brunch = [
    { time: '11:00 AM', title: 'Welcome' },
    { time: '12:30 PM', title: 'Brunch' },
    { time: '2:30 PM', title: 'Toasts' },
];

const themes: Record<string, BridalShowerSiteTheme> = {
    'pre-wedding': {
        bg: '#fff1f2',
        surface: '#ffe4e6',
        ink: '#9f1239',
        accent: '#e11d48',
        muted: '#a37a84',
        buttonInk: '#fff1f2',
        button: 'rounded-full',
        venue: 'Ocean Mandap',
        city: 'Santorini',
        space: 'Sunset Deck',
        afterparty: 'Tide Walk',
        schedule: brunch,
    },
    'miss-to-mrs': {
        bg: '#faf8f5',
        surface: '#f3eee6',
        ink: '#44403c',
        accent: '#c6a36a',
        muted: '#8a7d6e',
        buttonInk: '#241c16',
        button: 'rounded-full',
        venue: 'Ivory Salon',
        city: 'Charleston',
        space: 'Rose Arch',
        afterparty: 'Gift Corner',
        schedule: brunch,
    },
    'brunch-bloom': {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#4d7c0f',
        muted: '#5b7a62',
        buttonInk: '#f0fdf4',
        button: 'rounded-full',
        venue: 'Rose Aisle',
        city: 'Napa',
        space: 'Garden Arch',
        afterparty: 'Petal Lawn',
        schedule: brunch,
    },
    'tropical-bach': {
        bg: '#ecfeff',
        surface: '#cffafe',
        ink: '#155e75',
        accent: '#0891b2',
        muted: '#5e8a95',
        buttonInk: '#ecfeff',
        button: 'rounded-full',
        venue: 'Shore Canopy',
        city: 'Malibu',
        space: 'Beach Lounge',
        afterparty: 'Tide Table',
        schedule: brunch,
    },
    'gilded-gala': {
        bg: '#faf8f5',
        surface: '#f3eee6',
        ink: '#44403c',
        accent: '#c6a36a',
        muted: '#8a7d6e',
        buttonInk: '#241c16',
        button: 'rounded-full',
        venue: 'Crystal Ballroom',
        city: 'Paris',
        space: 'Chandelier Hall',
        afterparty: 'Peony Salon',
        schedule: brunch,
    },
    wildflower: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#c2410c',
        muted: '#9a6b4a',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Garden Pergola',
        city: 'Austin',
        space: 'Lantern Lounge',
        afterparty: 'Grove Walk',
        schedule: brunch,
    },
    desert: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#ea580c',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Sunset Terrace',
        city: 'Monterey',
        space: 'Lantern Deck',
        afterparty: 'Horizon Table',
        schedule: brunch,
    },
    pajama: {
        bg: '#fdf2f8',
        surface: '#fce7f3',
        ink: '#9d174d',
        accent: '#f9a8d4',
        muted: '#a67a90',
        buttonInk: '#9d174d',
        button: 'rounded-full',
        venue: 'Blush Atelier',
        city: 'Los Angeles',
        space: 'Rose Sofa',
        afterparty: 'Petal Hall',
        schedule: brunch,
    },
    'minimal-rose': {
        bg: '#fafafa',
        surface: '#f4f4f5',
        ink: '#171717',
        accent: '#a3a3a3',
        muted: '#737373',
        buttonInk: '#171717',
        button: 'rounded-md',
        venue: 'Light House',
        city: 'Copenhagen',
        space: 'Window Table',
        afterparty: 'Cake Salon',
        schedule: brunch,
    },
    'girls-night': {
        bg: '#fff1f2',
        surface: '#ffe4e6',
        ink: '#9f1239',
        accent: '#fb7185',
        muted: '#9f7380',
        buttonInk: '#fff1f2',
        button: 'rounded-full',
        venue: 'Lantern Walk',
        city: 'Savannah',
        space: 'Petal Aisle',
        afterparty: 'String-light Grove',
        schedule: brunch,
    },
    spa: {
        bg: '#fff1f2',
        surface: '#ffe4e6',
        ink: '#9f1239',
        accent: '#e11d48',
        muted: '#a37a84',
        buttonInk: '#fff1f2',
        button: 'rounded-full',
        venue: 'Horizon Table',
        city: 'Positano',
        space: 'Sea Terrace',
        afterparty: 'Cliff Walk',
        schedule: brunch,
    },
    hen: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#65a30d',
        muted: '#4d7c5a',
        buttonInk: '#f0fdf4',
        button: 'rounded-full',
        venue: 'Grove Dinner',
        city: 'Charleston',
        space: 'Garden Tables',
        afterparty: 'Oak Path',
        schedule: brunch,
    },
    yacht: {
        bg: '#ecfeff',
        surface: '#cffafe',
        ink: '#155e75',
        accent: '#0891b2',
        muted: '#5e8a95',
        buttonInk: '#ecfeff',
        button: 'rounded-full',
        venue: 'Beach Cabana',
        city: 'Maui',
        space: 'Shore Lounge',
        afterparty: 'Tide Canopy',
        schedule: brunch,
    },
    tea: {
        bg: '#fff1f2',
        surface: '#ffe4e6',
        ink: '#9f1239',
        accent: '#be185d',
        muted: '#a67a90',
        buttonInk: '#fff1f2',
        button: 'rounded-full',
        venue: 'Ruby Arch',
        city: 'London',
        space: 'Crimson Salon',
        afterparty: 'Lantern Room',
        schedule: brunch,
    },
    lounge: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#4d7c0f',
        muted: '#5b7a62',
        buttonInk: '#f0fdf4',
        button: 'rounded-full',
        venue: 'Alpine Garden',
        city: 'Banff',
        space: 'Peak Arch',
        afterparty: 'Meadow Walk',
        schedule: brunch,
    },
    sparkles: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#ea580c',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Firelight Lounge',
        city: 'Napa',
        space: 'Hillside Pit',
        afterparty: 'Lantern Deck',
        schedule: brunch,
    },
    'next-journey': {
        bg: '#faf8f5',
        surface: '#f3eee6',
        ink: '#44403c',
        accent: '#c6a36a',
        muted: '#8a7d6e',
        buttonInk: '#241c16',
        button: 'rounded-full',
        venue: 'White Arch',
        city: 'Brooklyn',
        space: 'Ivory Sofa',
        afterparty: 'Quiet Nook',
        schedule: brunch,
    },
    registry: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#c2410c',
        muted: '#9a6b4a',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Tide Terrace',
        city: 'Lake Como',
        space: 'Sunset Table',
        afterparty: 'Lakeside Walk',
        schedule: brunch,
    },
    confetti: {
        bg: '#fdf2f8',
        surface: '#fce7f3',
        ink: '#9d174d',
        accent: '#fb7185',
        muted: '#a67a90',
        buttonInk: '#fff1f2',
        button: 'rounded-full',
        venue: 'Rose Pergola',
        city: 'Provence',
        space: 'Climbing Garden',
        afterparty: 'Lantern Court',
        schedule: brunch,
    },
    feast: {
        bg: '#ecfeff',
        surface: '#cffafe',
        ink: '#155e75',
        accent: '#0891b2',
        muted: '#5e8a95',
        buttonInk: '#ecfeff',
        button: 'rounded-full',
        venue: 'Palm Court',
        city: 'Honolulu',
        space: 'Beach Arch',
        afterparty: 'Palm Walk',
        schedule: brunch,
    },
};

export function bridalShowerSiteTheme(styleKey: string): BridalShowerSiteTheme {
    return themes[styleKey] ?? themes['pre-wedding'];
}
