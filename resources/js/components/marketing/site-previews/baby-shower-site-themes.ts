export const BABY_SHOWER_SAMPLE = {
    kicker: "You're Invited",
    name: 'Maya',
    eventName: 'Baby Shower',
    message: 'Join us to celebrate a new little life, brunch, and the people who will love this baby first.',
    eventLine: 'Brunch · 14 June 2026',
    date: '2026-06-14',
    dateLabel: 'Sunday, 14 June 2026',
    dateShort: 'Sunday · 14 June 2026',
} as const;

export const BABY_SHOWER_STYLE_KEYS = [
    'woodland',
    'cloudland',
    'olive',
    'terracotta',
    'safari',
    'celestial',
    'minimal-teddy',
    'balloon',
    'eucalyptus',
    'stars',
    'jungle',
    'retro-love',
    'picnic',
    'giraffe',
    'floral-bloom',
    'geometric',
    'ocean',
    'forest',
    'sage',
    'watercolor',
] as const;

export function babyShowerHeroSrc(styleKey: string, device: 'mobile' | 'desktop'): string {
    const file = device === 'desktop' ? `${styleKey}-hero-desktop.jpg` : `${styleKey}-hero-mobile.jpg`;

    return `/images/gallery/previews/baby-shower/${file}?v=1`;
}

export function babyShowerCardSrc(styleKey: string): string {
    return `/images/gallery/baby-shower/blank/card-${styleKey}.jpg?v=1`;
}

const GALLERY_MOMENTS = [
    { title: 'The arch', note: 'Where guests arrive' },
    { title: 'Soft light', note: 'Details of the brunch' },
    { title: 'In bloom', note: 'Flowers for Maya' },
    { title: 'Golden hour', note: 'A quiet table' },
    { title: 'Nursery glow', note: 'Teddy and tulle' },
    { title: 'After brunch', note: 'When the games start' },
    { title: 'A quiet view', note: 'The place we chose' },
    { title: 'Welcome baby', note: 'A frame from the day' },
] as const;

export type BabyShowerGalleryPhoto = {
    src: string;
    title: string;
    note: string;
    span: 'hero' | 'tall' | 'wide' | 'square';
};

export function babyShowerGalleryPhotos(styleKey: string): BabyShowerGalleryPhoto[] {
    const start = Math.max(0, BABY_SHOWER_STYLE_KEYS.indexOf(styleKey as (typeof BABY_SHOWER_STYLE_KEYS)[number]));
    const spans: BabyShowerGalleryPhoto['span'][] = ['hero', 'tall', 'square', 'square', 'wide', 'tall', 'square', 'wide'];

    return GALLERY_MOMENTS.map((moment, index) => {
        const key = BABY_SHOWER_STYLE_KEYS[(start + index) % BABY_SHOWER_STYLE_KEYS.length];
        const portrait = spans[index] === 'tall';

        return {
            src: babyShowerHeroSrc(key, portrait ? 'mobile' : 'desktop'),
            title: moment.title,
            note: moment.note,
            span: spans[index],
        };
    });
}

export type BabyShowerSiteTheme = {
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

const themes: Record<string, BabyShowerSiteTheme> = {
    woodland: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#4d7c0f',
        muted: '#5b7a62',
        buttonInk: '#f0fdf4',
        button: 'rounded-full',
        venue: 'Garden Arch',
        city: 'Charleston',
        space: 'Floral Lawn',
        afterparty: 'Rose Walk',
        schedule: [
            { time: '11:00 AM', title: 'Welcome brunch' },
            { time: '12:30 PM', title: 'Games' },
            { time: '2:00 PM', title: 'Gifts' },
        ],
    },
    cloudland: {
        bg: '#fff1f2',
        surface: '#ffe4e6',
        ink: '#9f1239',
        accent: '#fb7185',
        muted: '#9f7380',
        buttonInk: '#fff1f2',
        button: 'rounded-full',
        venue: 'Balloon Atelier',
        city: 'Austin',
        space: 'Arch Studio',
        afterparty: 'Gift Corner',
        schedule: [
            { time: '11:00 AM', title: 'Doors' },
            { time: '12:00 PM', title: 'Brunch' },
            { time: '2:00 PM', title: 'Photos' },
        ],
    },
    olive: {
        bg: '#ecfeff',
        surface: '#cffafe',
        ink: '#155e75',
        accent: '#0891b2',
        muted: '#5e8a95',
        buttonInk: '#ecfeff',
        button: 'rounded-full',
        venue: 'Shore Canopy',
        city: 'Malibu',
        space: 'Beach Picnic',
        afterparty: 'Tide Table',
        schedule: [
            { time: '10:30 AM', title: 'Beach welcome' },
            { time: '12:00 PM', title: 'Brunch' },
            { time: '2:00 PM', title: 'Toasts' },
        ],
    },
    terracotta: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#65a30d',
        muted: '#4d7c5a',
        buttonInk: '#f0fdf4',
        button: 'rounded-full',
        venue: 'Moss Garden',
        city: 'Portland',
        space: 'Woodland Bench',
        afterparty: 'Lantern Grove',
        schedule: [
            { time: '11:00 AM', title: 'Arrival' },
            { time: '12:30 PM', title: 'Picnic' },
            { time: '2:30 PM', title: 'Stories' },
        ],
    },
    safari: {
        bg: '#faf7f2',
        surface: '#f3eee6',
        ink: '#3b2414',
        accent: '#c6a36a',
        muted: '#8a7d6e',
        buttonInk: '#241c16',
        button: 'rounded-full',
        venue: 'Light House',
        city: 'Savannah',
        space: 'Window Table',
        afterparty: 'Nursery Salon',
        schedule: [
            { time: '11:00 AM', title: 'Brunch' },
            { time: '1:00 PM', title: 'Games' },
            { time: '3:00 PM', title: 'Gifts' },
        ],
    },
    celestial: {
        bg: '#fffbeb',
        surface: '#fef3c7',
        ink: '#78350f',
        accent: '#d97706',
        muted: '#a16207',
        buttonInk: '#fffbeb',
        button: 'rounded-full',
        venue: 'Vintage Nursery',
        city: 'Nashville',
        space: 'Rocking Room',
        afterparty: 'Dresser Nook',
        schedule: [
            { time: '10:00 AM', title: 'Open house' },
            { time: '11:30 AM', title: 'Brunch' },
            { time: '1:30 PM', title: 'Keepsakes' },
        ],
    },
    'minimal-teddy': {
        bg: '#eff6ff',
        surface: '#dbeafe',
        ink: '#1e3a8a',
        accent: '#60a5fa',
        muted: '#64748b',
        buttonInk: '#eff6ff',
        button: 'rounded-full',
        venue: 'Cloud Studio',
        city: 'Copenhagen',
        space: 'Sky Room',
        afterparty: 'Soft Corner',
        schedule: [
            { time: '11:00 AM', title: 'Welcome' },
            { time: '12:30 PM', title: 'Brunch' },
            { time: '2:00 PM', title: 'Photos' },
        ],
    },
    balloon: {
        bg: '#fdf2f8',
        surface: '#fce7f3',
        ink: '#9d174d',
        accent: '#f9a8d4',
        muted: '#a67a90',
        buttonInk: '#9d174d',
        button: 'rounded-full',
        venue: 'Bloom Wall',
        city: 'Los Angeles',
        space: 'Floral Sofa',
        afterparty: 'Petal Hall',
        schedule: [
            { time: '11:00 AM', title: 'Arrival' },
            { time: '12:00 PM', title: 'Brunch' },
            { time: '2:00 PM', title: 'Gifts' },
        ],
    },
    eucalyptus: {
        bg: '#f8f0e3',
        surface: '#efe4d0',
        ink: '#3b2414',
        accent: '#b45309',
        muted: '#8a6440',
        buttonInk: '#fff8ef',
        button: 'rounded-full',
        venue: 'Boho Tent',
        city: 'Santa Fe',
        space: 'Teepee Nook',
        afterparty: 'Dried Garden',
        schedule: [
            { time: '11:00 AM', title: 'Circle' },
            { time: '12:30 PM', title: 'Brunch' },
            { time: '2:30 PM', title: 'Blessing' },
        ],
    },
    stars: {
        bg: '#1e1b4b',
        surface: '#312e81',
        ink: '#e0e7ff',
        accent: '#fbbf24',
        muted: '#a5b4fc',
        buttonInk: '#1e1b4b',
        button: 'rounded-full',
        venue: 'Night Nursery',
        city: 'Seattle',
        space: 'Moon Room',
        afterparty: 'Star Deck',
        schedule: [
            { time: '4:00 PM', title: 'Welcome' },
            { time: '5:30 PM', title: 'Cake' },
            { time: '7:00 PM', title: 'Wishes' },
        ],
    },
    jungle: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#7c2d12',
        accent: '#c2410c',
        muted: '#9a6b4a',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Barn Loft',
        city: 'Hudson Valley',
        space: 'Bunting Hall',
        afterparty: 'Porch Table',
        schedule: [
            { time: '11:00 AM', title: 'Brunch' },
            { time: '1:00 PM', title: 'Games' },
            { time: '3:00 PM', title: 'Gifts' },
        ],
    },
    'retro-love': {
        bg: '#fff1f2',
        surface: '#ffe4e6',
        ink: '#9f1239',
        accent: '#f472b6',
        muted: '#9f7380',
        buttonInk: '#fff1f2',
        button: 'rounded-full',
        venue: 'Blush Studio',
        city: 'Miami',
        space: 'Gold Sofa',
        afterparty: 'Curtain Room',
        schedule: [
            { time: '11:00 AM', title: 'Open studio' },
            { time: '12:30 PM', title: 'Brunch' },
            { time: '2:00 PM', title: 'Photos' },
        ],
    },
    picnic: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#86efac',
        muted: '#4d7c5a',
        buttonInk: '#14532d',
        button: 'rounded-full',
        venue: 'Forest Picnic',
        city: 'Asheville',
        space: 'String-light Grove',
        afterparty: 'Blanket Lawn',
        schedule: [
            { time: '11:00 AM', title: 'Picnic' },
            { time: '1:00 PM', title: 'Games' },
            { time: '3:00 PM', title: 'Cake' },
        ],
    },
    giraffe: {
        bg: '#fafafa',
        surface: '#f4f4f5',
        ink: '#171717',
        accent: '#a3a3a3',
        muted: '#737373',
        buttonInk: '#171717',
        button: 'rounded-md',
        venue: 'White Atelier',
        city: 'Paris',
        space: 'Quiet Sofa',
        afterparty: 'Dried Bloom',
        schedule: [
            { time: '11:00 AM', title: 'Tea' },
            { time: '12:30 PM', title: 'Brunch' },
            { time: '2:00 PM', title: 'Gifts' },
        ],
    },
    'floral-bloom': {
        bg: '#ecfdf3',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#15803d',
        muted: '#4d7c5a',
        buttonInk: '#ecfdf3',
        button: 'rounded-full',
        venue: 'Oak Garden',
        city: 'Napa',
        space: 'Tree Table',
        afterparty: 'Lantern Path',
        schedule: [
            { time: '4:00 PM', title: 'Golden hour' },
            { time: '5:30 PM', title: 'Brunch' },
            { time: '7:00 PM', title: 'Lights' },
        ],
    },
    geometric: {
        bg: '#fdf2f8',
        surface: '#fce7f3',
        ink: '#831843',
        accent: '#db2777',
        muted: '#a67a90',
        buttonInk: '#fdf2f8',
        button: 'rounded-full',
        venue: 'Royal Salon',
        city: 'London',
        space: 'Chandelier Room',
        afterparty: 'Peony Hall',
        schedule: [
            { time: '11:00 AM', title: 'Arrival' },
            { time: '12:30 PM', title: 'Brunch' },
            { time: '2:30 PM', title: 'Toasts' },
        ],
    },
    ocean: {
        bg: '#eff6ff',
        surface: '#dbeafe',
        ink: '#1e3a8a',
        accent: '#38bdf8',
        muted: '#64748b',
        buttonInk: '#eff6ff',
        button: 'rounded-full',
        venue: 'Sky Lawn',
        city: 'Lisbon',
        space: 'Balloon Field',
        afterparty: 'Horizon Table',
        schedule: [
            { time: '11:00 AM', title: 'Welcome' },
            { time: '12:30 PM', title: 'Picnic' },
            { time: '2:30 PM', title: 'Gifts' },
        ],
    },
    forest: {
        bg: '#f8fafc',
        surface: '#f1f5f9',
        ink: '#0f172a',
        accent: '#64748b',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-md',
        venue: 'Atrium House',
        city: 'Brooklyn',
        space: 'Plant Salon',
        afterparty: 'Window Nook',
        schedule: [
            { time: '11:00 AM', title: 'Open house' },
            { time: '12:30 PM', title: 'Brunch' },
            { time: '2:00 PM', title: 'Playlist' },
        ],
    },
    sage: {
        bg: '#eef2ff',
        surface: '#e0e7ff',
        ink: '#312e81',
        accent: '#818cf8',
        muted: '#6366f1',
        buttonInk: '#eef2ff',
        button: 'rounded-full',
        venue: 'Moon Room',
        city: 'Montreal',
        space: 'Crescent Nook',
        afterparty: 'Star Wall',
        schedule: [
            { time: '3:00 PM', title: 'Welcome' },
            { time: '4:30 PM', title: 'Cake' },
            { time: '6:00 PM', title: 'Wishes' },
        ],
    },
    watercolor: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#ea580c',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Sunset Shore',
        city: 'San Diego',
        space: 'Lantern Deck',
        afterparty: 'Tide Lights',
        schedule: [
            { time: '5:00 PM', title: 'Golden hour' },
            { time: '6:30 PM', title: 'Dinner' },
            { time: '8:00 PM', title: 'Toasts' },
        ],
    },
};

export function babyShowerSiteTheme(styleKey: string): BabyShowerSiteTheme {
    return themes[styleKey] ?? themes.woodland;
}
