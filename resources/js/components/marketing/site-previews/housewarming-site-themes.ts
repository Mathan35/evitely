export const HOUSEWARMING_SAMPLE = {
    kicker: 'Our door is open',
    name: 'Riley',
    eventName: 'Open House',
    message: 'Come tour the new rooms, stay for dinner, and help us make this house feel like home.',
    eventLine: 'Tour · 18 October 2026',
    date: '2026-10-18',
    dateLabel: 'Sunday, 18 October 2026',
    dateShort: 'Sunday · 18 October 2026',
} as const;

export const HOUSEWARMING_STYLE_KEYS = [
    'hearth',
    'architecture',
    'sweet-home',
    'bungalow',
    'gilded',
    'foliage',
    'urban-flat',
    'welcome-bbq',
    'ivy',
    'midnight-gala',
    'suburban',
    'creative-house',
    'seaside',
    'industrial',
    'garden',
    'sunset-roof',
    'neighborhood',
    'ivy-brick',
    'whimsical-move',
    'hearth-dinner',
] as const;

export function housewarmingHeroSrc(styleKey: string, device: 'mobile' | 'desktop'): string {
    const file = device === 'desktop' ? `${styleKey}-hero-desktop.jpg` : `${styleKey}-hero-mobile.jpg`;

    return `/images/gallery/previews/housewarming/${file}?v=1`;
}

const HOUSEWARMING_CARD_KEYS = [
    'key-corner-filigree',
    'split-peach-cottage',
    'keys-gold-frame',
    'top-cottage-watercolor',
    'palm-villa',
    'pink-floral-cottage',
    'linen-modern-house',
    'linen-sketch-house',
    'mandala-garden-home',
    'foliage-gold-outline',
    'parchment-family-hearth',
    'navy-rose-bluehouse',
    'blush-heart-cottage',
    'ink-line-cottage',
    'country-cottage-gold',
    'mediterranean-blue-door',
    'mint-arch-cottage',
    'night-moon-cottage',
    'chimney-cloud-cottage',
    'peach-bloom-cottage',
] as const;

export function housewarmingCardSrc(styleKey: string): string {
    const index = Math.max(0, HOUSEWARMING_STYLE_KEYS.indexOf(styleKey as (typeof HOUSEWARMING_STYLE_KEYS)[number]));
    const key = HOUSEWARMING_CARD_KEYS[index % HOUSEWARMING_CARD_KEYS.length];

    return `/images/gallery/housewarming/blank/card-${key}-mobile.jpg?v=5`;
}

const GALLERY_MOMENTS = [
    { title: 'The door', note: 'Where guests arrive' },
    { title: 'The rooms', note: 'A first look around' },
    { title: 'Soft light', note: 'Details of the house' },
    { title: 'Golden hour', note: 'A quiet table' },
    { title: 'In bloom', note: 'Flowers for the home' },
    { title: 'After the tour', note: 'When dinner begins' },
    { title: 'A quiet view', note: 'The place we chose' },
    { title: 'The keys', note: 'A frame from the day' },
] as const;

export type HousewarmingGalleryPhoto = {
    src: string;
    title: string;
    note: string;
    span: 'hero' | 'tall' | 'wide' | 'square';
};

export function housewarmingGalleryPhotos(styleKey: string): HousewarmingGalleryPhoto[] {
    const start = Math.max(0, HOUSEWARMING_STYLE_KEYS.indexOf(styleKey as (typeof HOUSEWARMING_STYLE_KEYS)[number]));
    const spans: HousewarmingGalleryPhoto['span'][] = ['hero', 'tall', 'square', 'square', 'wide', 'tall', 'square', 'wide'];

    return GALLERY_MOMENTS.map((moment, index) => {
        const key = HOUSEWARMING_STYLE_KEYS[(start + index) % HOUSEWARMING_STYLE_KEYS.length];
        const portrait = spans[index] === 'tall';

        return {
            src: housewarmingHeroSrc(key, portrait ? 'mobile' : 'desktop'),
            title: moment.title,
            note: moment.note,
            span: spans[index],
        };
    });
}

export type HousewarmingSiteTheme = {
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

const openHouse = [
    { time: '5:00 PM', title: 'Tour' },
    { time: '6:00 PM', title: 'Blessing' },
    { time: '7:00 PM', title: 'Dinner' },
];

const themes: Record<string, HousewarmingSiteTheme> = {
    hearth: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#7c2d12',
        accent: '#c2410c',
        muted: '#9a6b4a',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Willow Porch',
        city: 'Portland',
        space: 'Front Door',
        afterparty: 'Porch Dinner',
        schedule: openHouse,
    },
    architecture: {
        bg: '#f8fafc',
        surface: '#e2e8f0',
        ink: '#1e293b',
        accent: '#334155',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-md',
        venue: 'Light Loft',
        city: 'Seattle',
        space: 'Box Room',
        afterparty: 'Kitchen Toast',
        schedule: openHouse,
    },
    'sweet-home': {
        bg: '#fffbeb',
        surface: '#fef3c7',
        ink: '#422006',
        accent: '#d97706',
        muted: '#a16207',
        buttonInk: '#fffbeb',
        button: 'rounded-full',
        venue: 'Lamp Table',
        city: 'Austin',
        space: 'Blessing Nook',
        afterparty: 'Flower Table',
        schedule: openHouse,
    },
    bungalow: {
        bg: '#faf8f5',
        surface: '#f3eee6',
        ink: '#3b2414',
        accent: '#c6a36a',
        muted: '#8a7d6e',
        buttonInk: '#241c16',
        button: 'rounded-full',
        venue: 'Sage Salon',
        city: 'Charleston',
        space: 'Home Room',
        afterparty: 'Plant Corner',
        schedule: openHouse,
    },
    gilded: {
        bg: '#1c1917',
        surface: '#292524',
        ink: '#fafaf9',
        accent: '#facc15',
        muted: '#a8a29e',
        buttonInk: '#1c1917',
        button: 'rounded-full',
        venue: 'Marigold Door',
        city: 'Savannah',
        space: 'Rangoli Step',
        afterparty: 'Porch Blessing',
        schedule: openHouse,
    },
    foliage: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#3f6212',
        muted: '#5b7a62',
        buttonInk: '#f0fdf4',
        button: 'rounded-md',
        venue: 'Open Plan',
        city: 'Denver',
        space: 'Living Hall',
        afterparty: 'Kitchen Island',
        schedule: openHouse,
    },
    'urban-flat': {
        bg: '#fafaf9',
        surface: '#f5f5f4',
        ink: '#1c1917',
        accent: '#78716c',
        muted: '#78716c',
        buttonInk: '#fafaf9',
        button: 'rounded-md',
        venue: 'Welcome Table',
        city: 'Brooklyn',
        space: 'Sign Table',
        afterparty: 'Studio Toast',
        schedule: openHouse,
    },
    'welcome-bbq': {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#ea580c',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Skyline Terrace',
        city: 'Chicago',
        space: 'Sunset Deck',
        afterparty: 'Grill Table',
        schedule: openHouse,
    },
    ivy: {
        bg: '#faf8f5',
        surface: '#f3eee6',
        ink: '#3b2414',
        accent: '#c2410c',
        muted: '#8a7d6e',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Dining Hall',
        city: 'Napa',
        space: 'Long Table',
        afterparty: 'Kitchen',
        schedule: openHouse,
    },
    'midnight-gala': {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#7c2d12',
        accent: '#c2410c',
        muted: '#9a6b4a',
        buttonInk: '#fff7ed',
        button: 'rounded-md',
        venue: 'Box Stack',
        city: 'Los Angeles',
        space: 'Move Room',
        afterparty: 'Key Table',
        schedule: openHouse,
    },
    suburban: {
        bg: '#0f172a',
        surface: '#1e293b',
        ink: '#e2e8f0',
        accent: '#fbbf24',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-md',
        venue: 'Night Estate',
        city: 'Palo Alto',
        space: 'Driveway',
        afterparty: 'Garden',
        schedule: openHouse,
    },
    'creative-house': {
        bg: '#faf8f5',
        surface: '#f3eee6',
        ink: '#3b2414',
        accent: '#c6a36a',
        muted: '#8a7d6e',
        buttonInk: '#241c16',
        button: 'rounded-full',
        venue: 'Key Desk',
        city: 'Portland',
        space: 'Study Table',
        afterparty: 'Hall',
        schedule: openHouse,
    },
    seaside: {
        bg: '#f8fafc',
        surface: '#e2e8f0',
        ink: '#1e293b',
        accent: '#64748b',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-md',
        venue: 'Soft Salon',
        city: 'Cape May',
        space: 'Living Room',
        afterparty: 'Frame Wall',
        schedule: openHouse,
    },
    industrial: {
        bg: '#1c1917',
        surface: '#292524',
        ink: '#fafaf9',
        accent: '#facc15',
        muted: '#a8a29e',
        buttonInk: '#1c1917',
        button: 'rounded-full',
        venue: 'Blessing Floor',
        city: 'Austin',
        space: 'Kalash Nook',
        afterparty: 'Candle Table',
        schedule: openHouse,
    },
    garden: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#ea580c',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'String Terrace',
        city: 'San Diego',
        space: 'Roof Deck',
        afterparty: 'Lounge',
        schedule: openHouse,
    },
    'sunset-roof': {
        bg: '#f8fafc',
        surface: '#e2e8f0',
        ink: '#1e293b',
        accent: '#94a3b8',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-md',
        venue: 'Sun Loft',
        city: 'Seattle',
        space: 'Window Room',
        afterparty: 'Box Corner',
        schedule: openHouse,
    },
    neighborhood: {
        bg: '#fffbeb',
        surface: '#fef3c7',
        ink: '#422006',
        accent: '#d97706',
        muted: '#a16207',
        buttonInk: '#fffbeb',
        button: 'rounded-full',
        venue: 'Petal Bowl',
        city: 'Charleston',
        space: 'Candle Table',
        afterparty: 'Quiet Room',
        schedule: openHouse,
    },
    'ivy-brick': {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#3f6212',
        muted: '#5b7a62',
        buttonInk: '#f0fdf4',
        button: 'rounded-md',
        venue: 'Brick Door',
        city: 'Savannah',
        space: 'Entry Hall',
        afterparty: 'Plant Path',
        schedule: openHouse,
    },
    'whimsical-move': {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#4d7c0f',
        muted: '#5b7a62',
        buttonInk: '#f0fdf4',
        button: 'rounded-full',
        venue: 'Green Salon',
        city: 'Portland',
        space: 'Sofa Room',
        afterparty: 'Lamp Corner',
        schedule: openHouse,
    },
    'hearth-dinner': {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#c2410c',
        muted: '#9a6b4a',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Sunset Balcony',
        city: 'San Diego',
        space: 'Lounge Deck',
        afterparty: 'Lantern Table',
        schedule: openHouse,
    },
};

export function housewarmingSiteTheme(styleKey: string): HousewarmingSiteTheme {
    return themes[styleKey] ?? themes.hearth;
}
