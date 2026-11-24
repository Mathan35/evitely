export const BIRTHDAY_SAMPLE = {
    kicker: "You're Invited",
    name: 'Leo',
    ageLine: 'turns 30',
    message: 'Join us to celebrate a year of stories, cake, and the people who make it matter.',
    eventLine: 'Birthday Party · 8 May 2026',
    date: '2026-05-08',
    dateLabel: 'Friday, 8 May 2026',
    dateShort: 'Friday · 8 May 2026',
} as const;

export const BIRTHDAY_STYLE_KEYS = [
    'neon-glow',
    'midnight-velvet',
    'boho-sunset',
    'y2k-disco',
    'english-garden',
    'gold-leaf-40',
    'comic',
    'safari',
    'typographic',
    'balloon',
    'galaxy',
    'campfire',
    'brunch',
    'carnival',
    'cyberpunk',
    'jubilee',
    'pastel',
    'sea',
    'artsy',
    'ticket',
] as const;

export function birthdayHeroSrc(styleKey: string, device: 'mobile' | 'desktop'): string {
    const file = device === 'desktop' ? `${styleKey}-hero-desktop.jpg` : `${styleKey}-hero-mobile.jpg`;

    return `/images/gallery/previews/birthday/${file}?v=1`;
}

export function birthdayCardSrc(styleKey: string): string {
    const stem = styleKey === 'gold-leaf-40' ? 'gold-leaf-40' : styleKey;

    return `/images/gallery/birthday/birthday-card-${stem}.jpg`;
}

const GALLERY_MOMENTS = [
    { title: 'Cake hour', note: 'The wish, the glow' },
    { title: 'The table', note: 'Set for friends' },
    { title: 'In bloom', note: 'Details of the night' },
    { title: 'Golden hour', note: 'Soft light, loud joy' },
    { title: 'Party glow', note: 'Lanterns and laughter' },
    { title: 'After dusk', note: 'When the music starts' },
    { title: 'A quiet view', note: 'The place we chose' },
    { title: 'Make a wish', note: 'A frame from the night' },
] as const;

export type BirthdayGalleryPhoto = {
    src: string;
    title: string;
    note: string;
    span: 'hero' | 'tall' | 'wide' | 'square';
};

export function birthdayGalleryPhotos(styleKey: string): BirthdayGalleryPhoto[] {
    const start = Math.max(0, BIRTHDAY_STYLE_KEYS.indexOf(styleKey as (typeof BIRTHDAY_STYLE_KEYS)[number]));
    const spans: BirthdayGalleryPhoto['span'][] = ['hero', 'tall', 'square', 'square', 'wide', 'tall', 'square', 'wide'];

    return GALLERY_MOMENTS.map((moment, index) => {
        const key = BIRTHDAY_STYLE_KEYS[(start + index) % BIRTHDAY_STYLE_KEYS.length];
        const portrait = spans[index] === 'tall';

        return {
            src: birthdayHeroSrc(key, portrait ? 'mobile' : 'desktop'),
            title: moment.title,
            note: moment.note,
            span: spans[index],
        };
    });
}

export type BirthdaySiteTheme = {
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

const themes: Record<string, BirthdaySiteTheme> = {
    'neon-glow': {
        bg: '#f6efe4',
        surface: '#efe4d4',
        ink: '#3b2414',
        accent: '#d97706',
        muted: '#9a7b52',
        buttonInk: '#fff8ef',
        button: 'rounded-full',
        venue: 'Coastal Terrace',
        city: 'Malibu',
        space: 'Sunset Lawn',
        afterparty: 'Lantern Deck',
        schedule: [
            { time: '6:00 PM', title: 'Welcome drinks' },
            { time: '7:30 PM', title: 'Cake hour' },
            { time: '9:00 PM', title: 'Dancing' },
        ],
    },
    'midnight-velvet': {
        bg: '#f4efe8',
        surface: '#ebe3d8',
        ink: '#1c1916',
        accent: '#c6a36a',
        muted: '#7a7168',
        buttonInk: '#1c1916',
        button: 'rounded-md',
        venue: 'Velvet Room',
        city: 'Chicago',
        space: 'Gold Salon',
        afterparty: 'Afterglow Lounge',
        schedule: [
            { time: '7:00 PM', title: 'Cocktails' },
            { time: '8:00 PM', title: 'Toasts' },
            { time: '10:00 PM', title: 'Afterparty' },
        ],
    },
    'boho-sunset': {
        bg: '#f8f0e3',
        surface: '#f0e6d4',
        ink: '#3b2a1c',
        accent: '#c45c26',
        muted: '#8a6440',
        buttonInk: '#fff8ef',
        button: 'rounded-full',
        venue: 'Garden Terrace',
        city: 'Austin',
        space: 'Olive Courtyard',
        afterparty: 'String-light Lawn',
        schedule: [
            { time: '5:30 PM', title: 'Golden hour' },
            { time: '7:00 PM', title: 'Dinner' },
            { time: '9:00 PM', title: 'Playlist' },
        ],
    },
    'y2k-disco': {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#7c2d12',
        accent: '#ea580c',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Studio Loft',
        city: 'Brooklyn',
        space: 'Disco Floor',
        afterparty: 'Roof Mix',
        schedule: [
            { time: '8:00 PM', title: 'Doors' },
            { time: '9:00 PM', title: 'Cake' },
            { time: '10:30 PM', title: 'Dance floor' },
        ],
    },
    'english-garden': {
        bg: '#ecfdf3',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#15803d',
        muted: '#4d7c5a',
        buttonInk: '#ecfdf3',
        button: 'rounded-full',
        venue: 'Palm Beach Club',
        city: 'Miami',
        space: 'Shore Table',
        afterparty: 'Tide Bar',
        schedule: [
            { time: '4:00 PM', title: 'Beach welcome' },
            { time: '6:00 PM', title: 'Cake' },
            { time: '8:00 PM', title: 'Sunset toast' },
        ],
    },
    'gold-leaf-40': {
        bg: '#fff1f2',
        surface: '#ffe4e6',
        ink: '#9f1239',
        accent: '#e11d48',
        muted: '#9f7380',
        buttonInk: '#fff1f2',
        button: 'rounded-full',
        venue: 'Blush Atelier',
        city: 'Paris',
        space: 'Rose Room',
        afterparty: 'Confetti Hall',
        schedule: [
            { time: '3:00 PM', title: 'Brunch table' },
            { time: '4:30 PM', title: 'Cake' },
            { time: '6:00 PM', title: 'Gifts' },
        ],
    },
    comic: {
        bg: '#16120f',
        surface: '#1c1916',
        ink: '#f6f0e6',
        accent: '#e8b84a',
        muted: '#b7a48a',
        buttonInk: '#16120f',
        button: 'rounded-md',
        venue: 'Noir Studio',
        city: 'London',
        space: 'Candle Hall',
        afterparty: 'Gold Bar',
        schedule: [
            { time: '7:30 PM', title: 'Arrival' },
            { time: '8:30 PM', title: 'Toasts' },
            { time: '10:00 PM', title: 'After dark' },
        ],
    },
    safari: {
        bg: '#f8f0e3',
        surface: '#efe4d0',
        ink: '#3b2414',
        accent: '#b45309',
        muted: '#8a6440',
        buttonInk: '#fff8ef',
        button: 'rounded-full',
        venue: 'Hillside Vineyard',
        city: 'Napa',
        space: 'Olive Table',
        afterparty: 'Terrace Fire',
        schedule: [
            { time: '5:00 PM', title: 'Wine hour' },
            { time: '7:00 PM', title: 'Dinner' },
            { time: '9:00 PM', title: 'Cake' },
        ],
    },
    typographic: {
        bg: '#1b1028',
        surface: '#2a1840',
        ink: '#f5e9ff',
        accent: '#e879f9',
        muted: '#c4b5d4',
        buttonInk: '#1b1028',
        button: 'rounded-md',
        venue: 'Neon House',
        city: 'Seoul',
        space: 'Glow Room',
        afterparty: 'Bass Lounge',
        schedule: [
            { time: '8:00 PM', title: 'Neon hour' },
            { time: '9:00 PM', title: 'Cake' },
            { time: '11:00 PM', title: 'Dance' },
        ],
    },
    balloon: {
        bg: '#eef3f0',
        surface: '#e1ebe4',
        ink: '#142028',
        accent: '#6b8f71',
        muted: '#5e6b66',
        buttonInk: '#eef3f0',
        button: 'rounded-full',
        venue: 'Alpine Lawn',
        city: 'Interlaken',
        space: 'Lake Table',
        afterparty: 'Mountain Deck',
        schedule: [
            { time: '2:00 PM', title: 'Picnic' },
            { time: '4:00 PM', title: 'Cake' },
            { time: '6:00 PM', title: 'Golden hour' },
        ],
    },
    galaxy: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#4d7c0f',
        muted: '#5b7a62',
        buttonInk: '#f0fdf4',
        button: 'rounded-full',
        venue: 'Secret Garden',
        city: 'Charleston',
        space: 'Floral Aisle',
        afterparty: 'Lantern Walk',
        schedule: [
            { time: '4:00 PM', title: 'Garden welcome' },
            { time: '6:00 PM', title: 'Cake' },
            { time: '8:00 PM', title: 'Night lights' },
        ],
    },
    campfire: {
        bg: '#fafafa',
        surface: '#f4f4f5',
        ink: '#171717',
        accent: '#404040',
        muted: '#737373',
        buttonInk: '#fafafa',
        button: 'rounded-md',
        venue: 'White Studio',
        city: 'Copenhagen',
        space: 'Atrium Table',
        afterparty: 'Quiet Lounge',
        schedule: [
            { time: '11:00 AM', title: 'Brunch' },
            { time: '12:30 PM', title: 'Cake' },
            { time: '2:00 PM', title: 'Playlist' },
        ],
    },
    brunch: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#431407',
        accent: '#c2410c',
        muted: '#9a6b4a',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Shore Canopy',
        city: 'Lisbon',
        space: 'Sunset Arch',
        afterparty: 'Tide Lights',
        schedule: [
            { time: '5:00 PM', title: 'Welcome' },
            { time: '6:30 PM', title: 'Cake' },
            { time: '8:30 PM', title: 'Dancing' },
        ],
    },
    carnival: {
        bg: '#ecfeff',
        surface: '#cffafe',
        ink: '#155e75',
        accent: '#0891b2',
        muted: '#5e8a95',
        buttonInk: '#ecfeff',
        button: 'rounded-full',
        venue: 'Atelier Hall',
        city: 'Montreal',
        space: 'Cake Studio',
        afterparty: 'Confetti Bar',
        schedule: [
            { time: '3:00 PM', title: 'Open house' },
            { time: '4:30 PM', title: 'Cake' },
            { time: '6:00 PM', title: 'Games' },
        ],
    },
    cyberpunk: {
        bg: '#fff1f2',
        surface: '#ffe4e6',
        ink: '#9f1239',
        accent: '#fb7185',
        muted: '#9f7380',
        buttonInk: '#fff1f2',
        button: 'rounded-full',
        venue: 'Color Loft',
        city: 'Mexico City',
        space: 'Gift Table',
        afterparty: 'Balloon Room',
        schedule: [
            { time: '4:00 PM', title: 'Party start' },
            { time: '5:00 PM', title: 'Cake' },
            { time: '7:00 PM', title: 'Dance' },
        ],
    },
    jubilee: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#7c2d12',
        accent: '#ea580c',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Skyline Roof',
        city: 'New York',
        space: 'West Terrace',
        afterparty: 'City Lights Bar',
        schedule: [
            { time: '6:30 PM', title: 'Skyline drinks' },
            { time: '8:00 PM', title: 'Cake' },
            { time: '10:00 PM', title: 'Afterparty' },
        ],
    },
    pastel: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#86efac',
        muted: '#4d7c5a',
        buttonInk: '#14532d',
        button: 'rounded-full',
        venue: 'Woodland Picnic',
        city: 'Portland',
        space: 'String-light Grove',
        afterparty: 'Fire Circle',
        schedule: [
            { time: '5:00 PM', title: 'Picnic' },
            { time: '7:00 PM', title: 'Cake' },
            { time: '9:00 PM', title: 'Songs' },
        ],
    },
    sea: {
        bg: '#fdf2f8',
        surface: '#fce7f3',
        ink: '#9d174d',
        accent: '#f9a8d4',
        muted: '#a67a90',
        buttonInk: '#9d174d',
        button: 'rounded-full',
        venue: 'Cloud House',
        city: 'Los Angeles',
        space: 'Arch Studio',
        afterparty: 'Pastel Lounge',
        schedule: [
            { time: '2:00 PM', title: 'Open studio' },
            { time: '3:30 PM', title: 'Cake' },
            { time: '5:00 PM', title: 'Photos' },
        ],
    },
    artsy: {
        bg: '#0f172a',
        surface: '#1e293b',
        ink: '#e2e8f0',
        accent: '#fbbf24',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-md',
        venue: 'Night Terrace',
        city: 'Singapore',
        space: 'Candle Deck',
        afterparty: 'City Bar',
        schedule: [
            { time: '8:00 PM', title: 'Night welcome' },
            { time: '9:00 PM', title: 'Cake' },
            { time: '11:00 PM', title: 'Skyline' },
        ],
    },
    ticket: {
        bg: '#18181b',
        surface: '#27272a',
        ink: '#fafafa',
        accent: '#eab308',
        muted: '#a3a3a3',
        buttonInk: '#18181b',
        button: 'rounded-md',
        venue: 'Black Tie Loft',
        city: 'Milan',
        space: 'Gold Table',
        afterparty: 'Midnight Bar',
        schedule: [
            { time: '7:00 PM', title: 'Arrival' },
            { time: '8:30 PM', title: 'Cake' },
            { time: '10:30 PM', title: 'After dark' },
        ],
    },
};

export function birthdaySiteTheme(styleKey: string): BirthdaySiteTheme {
    return themes[styleKey] ?? themes['neon-glow'];
}
