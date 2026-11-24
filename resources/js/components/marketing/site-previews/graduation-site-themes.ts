export const GRADUATION_SAMPLE = {
    kicker: "You're Invited",
    name: 'Alex',
    eventName: 'Class of 2026',
    message: 'Join us to celebrate the walk, the cap, and the people who got Alex to this hour.',
    eventLine: 'Commencement · 6 June 2026',
    date: '2026-06-06',
    dateLabel: 'Saturday, 6 June 2026',
    dateShort: 'Saturday · 6 June 2026',
} as const;

export const GRADUATION_STYLE_KEYS = [
    'scholar-cap',
    'achievement',
    'caps-off',
    'creative-grad',
    'regal',
    'golden-journey',
    'retro-academic',
    'backyard-grad',
    'scholar-grid',
    'night-stars',
    'stem',
    'portfolio',
    'open-house',
    'ballroom',
    'throwback',
    'sunset-commencement',
    'next-step',
    'crest',
    'horizons',
    'dinner-open',
] as const;

export function graduationHeroSrc(styleKey: string, device: 'mobile' | 'desktop'): string {
    const file = device === 'desktop' ? `${styleKey}-hero-desktop.jpg` : `${styleKey}-hero-mobile.jpg`;

    return `/images/gallery/previews/graduation/${file}?v=1`;
}

const GRADUATION_CARD_KEYS = [
    'kraft-scrap',
    'classroom-fade',
    'chalkboard-rows',
    'autumn-books',
    'library-shelves',
    'stationery-desk',
    'backpack-autumn',
    'school-bunting',
    'students-horizon',
    'cap-diploma',
    'scholarly-desk',
    'doodle-dreams',
    'book-tree',
    'gold-florals',
    'yellow-graduate',
    'gold-ribbon',
    'damask-cap',
    'rose-books',
    'navy-filigree',
    'chalk-classroom',
] as const;

export function graduationCardSrc(styleKey: string): string {
    const index = Math.max(0, GRADUATION_STYLE_KEYS.indexOf(styleKey as (typeof GRADUATION_STYLE_KEYS)[number]));
    const key = GRADUATION_CARD_KEYS[index % GRADUATION_CARD_KEYS.length];

    return `/images/gallery/graduation/blank/card-${key}.jpg?v=1`;
}

const GALLERY_MOMENTS = [
    { title: 'The quad', note: 'Where guests arrive' },
    { title: 'The stage', note: 'The hour of the cap' },
    { title: 'Soft light', note: 'Details of the day' },
    { title: 'Golden hour', note: 'A quiet table' },
    { title: 'In bloom', note: 'Flowers for the class' },
    { title: 'After the walk', note: 'When the lunch begins' },
    { title: 'A quiet view', note: 'The place we chose' },
    { title: 'The diploma', note: 'A frame from the day' },
] as const;

export type GraduationGalleryPhoto = {
    src: string;
    title: string;
    note: string;
    span: 'hero' | 'tall' | 'wide' | 'square';
};

export function graduationGalleryPhotos(styleKey: string): GraduationGalleryPhoto[] {
    const start = Math.max(0, GRADUATION_STYLE_KEYS.indexOf(styleKey as (typeof GRADUATION_STYLE_KEYS)[number]));
    const spans: GraduationGalleryPhoto['span'][] = ['hero', 'tall', 'square', 'square', 'wide', 'tall', 'square', 'wide'];

    return GALLERY_MOMENTS.map((moment, index) => {
        const key = GRADUATION_STYLE_KEYS[(start + index) % GRADUATION_STYLE_KEYS.length];
        const portrait = spans[index] === 'tall';

        return {
            src: graduationHeroSrc(key, portrait ? 'mobile' : 'desktop'),
            title: moment.title,
            note: moment.note,
            span: spans[index],
        };
    });
}

export type GraduationSiteTheme = {
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

const ceremony = [
    { time: '10:00 AM', title: 'Procession' },
    { time: '11:30 AM', title: 'Caps' },
    { time: '1:00 PM', title: 'Lunch' },
];

const themes: Record<string, GraduationSiteTheme> = {
    'scholar-cap': {
        bg: '#f8fafc',
        surface: '#e2e8f0',
        ink: '#0f172a',
        accent: '#1e3a8a',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-md',
        venue: 'Senate Lawn',
        city: 'Oxford',
        space: 'College Quad',
        afterparty: 'Hall Lunch',
        schedule: ceremony,
    },
    achievement: {
        bg: '#0f172a',
        surface: '#1e293b',
        ink: '#e2e8f0',
        accent: '#d4af37',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-md',
        venue: 'Grand Theater',
        city: 'Boston',
        space: 'Blue Stage',
        afterparty: 'Lobby Toast',
        schedule: ceremony,
    },
    'caps-off': {
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
        afterparty: 'Horizon Table',
        schedule: ceremony,
    },
    'creative-grad': {
        bg: '#faf8f5',
        surface: '#f3eee6',
        ink: '#3b2414',
        accent: '#c6a36a',
        muted: '#8a7d6e',
        buttonInk: '#241c16',
        button: 'rounded-full',
        venue: 'Garden Study',
        city: 'Portland',
        space: 'Book Table',
        afterparty: 'Rose Walk',
        schedule: ceremony,
    },
    regal: {
        bg: '#0f172a',
        surface: '#1e3a8a',
        ink: '#f8fafc',
        accent: '#d4af37',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-full',
        venue: 'Balloon Court',
        city: 'Austin',
        space: 'Navy Arch',
        afterparty: 'Gold Lawn',
        schedule: ceremony,
    },
    'golden-journey': {
        bg: '#fffbeb',
        surface: '#fef3c7',
        ink: '#422006',
        accent: '#d97706',
        muted: '#a16207',
        buttonInk: '#fffbeb',
        button: 'rounded-md',
        venue: 'Athenaeum',
        city: 'Boston',
        space: 'Stack Room',
        afterparty: 'Reading Hall',
        schedule: ceremony,
    },
    'retro-academic': {
        bg: '#fdf2f8',
        surface: '#fce7f3',
        ink: '#9d174d',
        accent: '#f9a8d4',
        muted: '#a67a90',
        buttonInk: '#9d174d',
        button: 'rounded-full',
        venue: 'Blossom Quad',
        city: 'Kyoto',
        space: 'Cherry Path',
        afterparty: 'Petal Lawn',
        schedule: ceremony,
    },
    'backyard-grad': {
        bg: '#0f172a',
        surface: '#1e293b',
        ink: '#e0e7ff',
        accent: '#fbbf24',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-full',
        venue: 'Night Field',
        city: 'Austin',
        space: 'Cap Sky',
        afterparty: 'Lantern Lawn',
        schedule: ceremony,
    },
    'scholar-grid': {
        bg: '#fafafa',
        surface: '#f4f4f5',
        ink: '#171717',
        accent: '#a3a3a3',
        muted: '#737373',
        buttonInk: '#171717',
        button: 'rounded-md',
        venue: 'Ivory Salon',
        city: 'Charleston',
        space: 'Window Table',
        afterparty: 'Quiet Nook',
        schedule: ceremony,
    },
    'night-stars': {
        bg: '#ecfeff',
        surface: '#cffafe',
        ink: '#155e75',
        accent: '#0891b2',
        muted: '#5e8a95',
        buttonInk: '#ecfeff',
        button: 'rounded-full',
        venue: 'Lake Pavilion',
        city: 'Lucerne',
        space: 'Shore Terrace',
        afterparty: 'Alpine Walk',
        schedule: ceremony,
    },
    stem: {
        bg: '#0f172a',
        surface: '#1e293b',
        ink: '#e2e8f0',
        accent: '#38bdf8',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-md',
        venue: 'Blue Stage',
        city: 'Seattle',
        space: 'Lecture Hall',
        afterparty: 'Atrium Toast',
        schedule: ceremony,
    },
    portfolio: {
        bg: '#1c1917',
        surface: '#292524',
        ink: '#fafaf9',
        accent: '#d4af37',
        muted: '#a8a29e',
        buttonInk: '#1c1917',
        button: 'rounded-full',
        venue: 'Gold Studio',
        city: 'Los Angeles',
        space: 'Balloon Table',
        afterparty: 'Lobby Lights',
        schedule: ceremony,
    },
    'open-house': {
        bg: '#f8fafc',
        surface: '#e2e8f0',
        ink: '#0f172a',
        accent: '#1e3a8a',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-md',
        venue: 'College Court',
        city: 'Cambridge',
        space: 'Stone Quad',
        afterparty: 'Hall Lunch',
        schedule: ceremony,
    },
    ballroom: {
        bg: '#faf8f5',
        surface: '#f3eee6',
        ink: '#3b2414',
        accent: '#c6a36a',
        muted: '#8a7d6e',
        buttonInk: '#241c16',
        button: 'rounded-full',
        venue: 'Study Table',
        city: 'Edinburgh',
        space: 'Diploma Desk',
        afterparty: 'Rose Salon',
        schedule: ceremony,
    },
    throwback: {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#c2410c',
        muted: '#9a6b4a',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Sunset Bowl',
        city: 'Berkeley',
        space: 'Open Seats',
        afterparty: 'Hill Walk',
        schedule: ceremony,
    },
    'sunset-commencement': {
        bg: '#fffbeb',
        surface: '#fef3c7',
        ink: '#422006',
        accent: '#d4af37',
        muted: '#a16207',
        buttonInk: '#fffbeb',
        button: 'rounded-md',
        venue: 'Great Library',
        city: 'New Haven',
        space: 'Reading Hall',
        afterparty: 'Cloister Walk',
        schedule: ceremony,
    },
    'next-step': {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#9a3412',
        accent: '#ea580c',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-full',
        venue: 'Horizon Field',
        city: 'San Diego',
        space: 'Cap Sky',
        afterparty: 'Shore Toast',
        schedule: ceremony,
    },
    crest: {
        bg: '#0f172a',
        surface: '#1e3a8a',
        ink: '#f8fafc',
        accent: '#d4af37',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-md',
        venue: 'Curtain Hall',
        city: 'London',
        space: 'Gold Stage',
        afterparty: 'Foyer Toast',
        schedule: ceremony,
    },
    horizons: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#4d7c0f',
        muted: '#5b7a62',
        buttonInk: '#f0fdf4',
        button: 'rounded-full',
        venue: 'Modern Quad',
        city: 'Toronto',
        space: 'Stone Table',
        afterparty: 'Atrium Lunch',
        schedule: ceremony,
    },
    'dinner-open': {
        bg: '#faf8f5',
        surface: '#f3eee6',
        ink: '#3b2414',
        accent: '#c6a36a',
        muted: '#8a7d6e',
        buttonInk: '#241c16',
        button: 'rounded-full',
        venue: 'Diploma Table',
        city: 'Princeton',
        space: 'Study Desk',
        afterparty: 'Garden Lunch',
        schedule: ceremony,
    },
};

export function graduationSiteTheme(styleKey: string): GraduationSiteTheme {
    return themes[styleKey] ?? themes['scholar-cap'];
}
