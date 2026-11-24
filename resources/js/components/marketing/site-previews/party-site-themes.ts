export const PARTY_SAMPLE = {
    kicker: "You're Invited",
    name: 'Jordan',
    eventName: 'Celebration',
    message: 'Join us for cocktails, music, and a night with the people who make this year worth marking.',
    eventLine: 'Cocktails · 21 November 2026',
    date: '2026-11-21',
    dateLabel: 'Saturday, 21 November 2026',
    dateShort: 'Saturday · 21 November 2026',
} as const;

export const PARTY_STYLE_KEYS = [
    'neon-glow',
    'rooftop',
    'campfire',
    'y2k',
    'tropical',
    'velvet',
    'gaming',
    'bbq',
    'art-wine',
    'disco',
    'bass',
    'board-game',
    'hollywood',
    'pool',
    'showcase',
    'fireside',
    'golden-hour',
    'arcade',
    'lounge',
    'potluck',
] as const;

export function partyHeroSrc(styleKey: string, device: 'mobile' | 'desktop'): string {
    const file = device === 'desktop' ? `${styleKey}-hero-desktop.jpg` : `${styleKey}-hero-mobile.jpg`;

    return `/images/gallery/previews/party/${file}?v=1`;
}

/** Card-gallery keys (blank arts), paired to website templates by index. */
const PARTY_CARD_KEYS = [
    'confetti-hats',
    'ribbon-stars',
    'bunting-balloons',
    'sketch-dinner',
    'balloon-blush',
    'disco-sketch',
    'linen-feast',
    'garden-table',
    'classical-arch',
    'navy-icons',
    'gift-cake',
    'rose-gold',
    'watercolor-gifts',
    'blossom-arch',
    'lantern-drape',
    'peach-arch',
    'pink-party',
    'cocktail-spread',
    'feast-lights',
    'confetti-flags',
] as const;

export function partyCardSrc(styleKey: string): string {
    const index = Math.max(0, PARTY_STYLE_KEYS.indexOf(styleKey as (typeof PARTY_STYLE_KEYS)[number]));
    const key = PARTY_CARD_KEYS[index % PARTY_CARD_KEYS.length];

    return `/images/gallery/party/blank/card-${key}.jpg?v=1`;
}

const GALLERY_MOMENTS = [
    { title: 'Golden hour', note: 'When guests arrive' },
    { title: 'The table', note: 'Set for the night' },
    { title: 'Soft light', note: 'Details of the party' },
    { title: 'After dusk', note: 'When the music starts' },
    { title: 'Party glow', note: 'Lanterns and laughter' },
    { title: 'A quiet view', note: 'The place we chose' },
    { title: 'In bloom', note: 'Flowers for the night' },
    { title: 'Make a toast', note: 'A frame from the night' },
] as const;

export type PartyGalleryPhoto = {
    src: string;
    title: string;
    note: string;
    span: 'hero' | 'tall' | 'wide' | 'square';
};

export function partyGalleryPhotos(styleKey: string): PartyGalleryPhoto[] {
    const start = Math.max(0, PARTY_STYLE_KEYS.indexOf(styleKey as (typeof PARTY_STYLE_KEYS)[number]));
    const spans: PartyGalleryPhoto['span'][] = ['hero', 'tall', 'square', 'square', 'wide', 'tall', 'square', 'wide'];

    return GALLERY_MOMENTS.map((moment, index) => {
        const key = PARTY_STYLE_KEYS[(start + index) % PARTY_STYLE_KEYS.length];
        const portrait = spans[index] === 'tall';

        return {
            src: partyHeroSrc(key, portrait ? 'mobile' : 'desktop'),
            title: moment.title,
            note: moment.note,
            span: spans[index],
        };
    });
}

export type PartySiteTheme = {
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

const evening = [
    { time: '8:00 PM', title: 'Cocktails' },
    { time: '9:00 PM', title: 'Dinner' },
    { time: '10:30 PM', title: 'Afterparty' },
];

const themes: Record<string, PartySiteTheme> = {
    'neon-glow': {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#ea580c',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Meadow Terrace',
        city: 'Napa',
        space: 'Sunset Lawn',
        afterparty: 'Lantern Grove',
        schedule: evening,
    },
    rooftop: {
        bg: '#fff1f2',
        surface: '#ffe4e6',
        ink: '#9f1239',
        accent: '#fb7185',
        muted: '#9f7380',
        buttonInk: '#fff1f2',
        button: 'rounded-full',
        venue: 'Arch Studio',
        city: 'Miami',
        space: 'Balloon Lounge',
        afterparty: 'Cake Corner',
        schedule: evening,
    },
    campfire: {
        bg: '#1e1b4b',
        surface: '#312e81',
        ink: '#e0e7ff',
        accent: '#a78bfa',
        muted: '#c4b5fd',
        buttonInk: '#1e1b4b',
        button: 'rounded-full',
        venue: 'Harbor Lights',
        city: 'San Diego',
        space: 'Terrace Deck',
        afterparty: 'Skyline Bar',
        schedule: evening,
    },
    y2k: {
        bg: '#ecfeff',
        surface: '#cffafe',
        ink: '#155e75',
        accent: '#0891b2',
        muted: '#5e8a95',
        buttonInk: '#ecfeff',
        button: 'rounded-full',
        venue: 'Palms Pool',
        city: 'Honolulu',
        space: 'Pool Deck',
        afterparty: 'Cabana Bar',
        schedule: evening,
    },
    tropical: {
        bg: '#18181b',
        surface: '#27272a',
        ink: '#fafafa',
        accent: '#eab308',
        muted: '#a3a3a3',
        buttonInk: '#18181b',
        button: 'rounded-full',
        venue: 'Gilded Hall',
        city: 'Chicago',
        space: 'Gold Room',
        afterparty: 'Velvet Lounge',
        schedule: evening,
    },
    velvet: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#4d7c0f',
        muted: '#5b7a62',
        buttonInk: '#f0fdf4',
        button: 'rounded-full',
        venue: 'Ivy Room',
        city: 'Portland',
        space: 'Hanging Garden',
        afterparty: 'Wine Alcove',
        schedule: evening,
    },
    gaming: {
        bg: '#0f172a',
        surface: '#1e293b',
        ink: '#e0f2fe',
        accent: '#38bdf8',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-full',
        venue: 'Starlight Studio',
        city: 'Brooklyn',
        space: 'Night Hall',
        afterparty: 'Balloon Wall',
        schedule: evening,
    },
    bbq: {
        bg: '#f8fafc',
        surface: '#e2e8f0',
        ink: '#0f172a',
        accent: '#64748b',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-full',
        venue: 'Alpine Patio',
        city: 'Aspen',
        space: 'Mountain Terrace',
        afterparty: 'Lake Lookout',
        schedule: evening,
    },
    'art-wine': {
        bg: '#fdf2f8',
        surface: '#fce7f3',
        ink: '#9d174d',
        accent: '#db2777',
        muted: '#a67a90',
        buttonInk: '#fdf2f8',
        button: 'rounded-full',
        venue: 'Blush Room',
        city: 'Los Angeles',
        space: 'Pink Salon',
        afterparty: 'Dessert Bar',
        schedule: evening,
    },
    disco: {
        bg: '#022c22',
        surface: '#064e3b',
        ink: '#ecfdf5',
        accent: '#34d399',
        muted: '#6ee7b7',
        buttonInk: '#022c22',
        button: 'rounded-full',
        venue: 'Garden Lights',
        city: 'Charleston',
        space: 'Lawn Party',
        afterparty: 'Poolside',
        schedule: evening,
    },
    bass: {
        bg: '#fafafa',
        surface: '#f4f4f5',
        ink: '#171717',
        accent: '#737373',
        muted: '#737373',
        buttonInk: '#fafafa',
        button: 'rounded-full',
        venue: 'Crystal Ballroom',
        city: 'Boston',
        space: 'White Hall',
        afterparty: 'Foyer Bar',
        schedule: evening,
    },
    'board-game': {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#f59e0b',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Shore Picnic',
        city: 'Malibu',
        space: 'Palms Beach',
        afterparty: 'Tide Lights',
        schedule: evening,
    },
    hollywood: {
        bg: '#111827',
        surface: '#1f2937',
        ink: '#fde68a',
        accent: '#fbbf24',
        muted: '#d6c09a',
        buttonInk: '#111827',
        button: 'rounded-full',
        venue: 'Skyline Terrace',
        city: 'Manhattan',
        space: 'Sunset Roof',
        afterparty: 'City Bar',
        schedule: evening,
    },
    pool: {
        bg: '#ecfdf5',
        surface: '#d1fae5',
        ink: '#064e3b',
        accent: '#059669',
        muted: '#047857',
        buttonInk: '#ecfdf5',
        button: 'rounded-full',
        venue: 'Groove Garden',
        city: 'Miami',
        space: 'Neon Lawn',
        afterparty: 'DJ Patio',
        schedule: evening,
    },
    showcase: {
        bg: '#fafaf9',
        surface: '#f5f5f4',
        ink: '#1c1917',
        accent: '#a8a29e',
        muted: '#78716c',
        buttonInk: '#fafaf9',
        button: 'rounded-full',
        venue: 'Candle Hall',
        city: 'Dallas',
        space: 'Black Tie Room',
        afterparty: 'Gold Curtain',
        schedule: evening,
    },
    fireside: {
        bg: '#431407',
        surface: '#7c2d12',
        ink: '#ffedd5',
        accent: '#fb923c',
        muted: '#fdba74',
        buttonInk: '#431407',
        button: 'rounded-full',
        venue: 'Timber Barn',
        city: 'Nashville',
        space: 'String Lights',
        afterparty: 'Hayloft Bar',
        schedule: evening,
    },
    'golden-hour': {
        bg: '#fdf4ff',
        surface: '#fae8ff',
        ink: '#701a75',
        accent: '#c026d3',
        muted: '#d8b4fe',
        buttonInk: '#fdf4ff',
        button: 'rounded-full',
        venue: 'Teepee Meadow',
        city: 'Santa Fe',
        space: 'Boho Lawn',
        afterparty: 'Fire Circle',
        schedule: evening,
    },
    arcade: {
        bg: '#0a0a0a',
        surface: '#171717',
        ink: '#fafafa',
        accent: '#eab308',
        muted: '#a3a3a3',
        buttonInk: '#0a0a0a',
        button: 'rounded-full',
        venue: 'Night Deck',
        city: 'Toronto',
        space: 'City Roof',
        afterparty: 'Lounge Booths',
        schedule: evening,
    },
    lounge: {
        bg: '#ecfeff',
        surface: '#cffafe',
        ink: '#164e63',
        accent: '#22d3ee',
        muted: '#67e8f9',
        buttonInk: '#164e63',
        button: 'rounded-full',
        venue: 'Pastel Arch',
        city: 'Austin',
        space: 'Celebration Studio',
        afterparty: 'Photo Wall',
        schedule: evening,
    },
    potluck: {
        bg: '#eff6ff',
        surface: '#dbeafe',
        ink: '#1e3a8a',
        accent: '#3b82f6',
        muted: '#64748b',
        buttonInk: '#eff6ff',
        button: 'rounded-full',
        venue: 'Lake Terrace',
        city: 'Lake Tahoe',
        space: 'Alpine Shore',
        afterparty: 'Dock Lights',
        schedule: evening,
    },
};

export function partySiteTheme(styleKey: string): PartySiteTheme {
    return themes[styleKey] ?? themes['neon-glow'];
}
