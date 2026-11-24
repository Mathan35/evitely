export const CORPORATE_SAMPLE = {
    kicker: "You're Invited",
    company: 'Northwind',
    eventName: 'Leadership Summit',
    message: 'Join colleagues, partners, and guests for a day of talks, dinners, and the people who move the work forward.',
    eventLine: 'Keynote · 19 March 2026',
    date: '2026-03-19',
    dateLabel: 'Thursday, 19 March 2026',
    dateShort: 'Thursday · 19 March 2026',
} as const;

export const CORPORATE_STYLE_KEYS = [
    'tech-frontier',
    'leadership',
    'industry-gala',
    'sustainable',
    'creative-summit',
    'trade',
    'fintech',
    'cowork',
    'healthcare',
    'jubilee',
    'ai-summit',
    'design-thinking',
    'real-estate',
    'diversity',
    'aerospace',
    'nonprofit',
    'retreat',
    'hr',
    'cyber',
    'dinner-circle',
] as const;

export function corporateHeroSrc(styleKey: string, device: 'mobile' | 'desktop'): string {
    const file = device === 'desktop' ? `${styleKey}-hero-desktop.jpg` : `${styleKey}-hero-mobile.jpg`;

    return `/images/gallery/previews/corporate/${file}?v=1`;
}

/** Card-gallery keys (blank arts), paired to website templates by index. */
const CORPORATE_CARD_KEYS = [
    'boardroom-blueprint',
    'celebration-hands-wave',
    'purple-office-team',
    'peach-office-desk',
    'online-cert-desk',
    'corner-tech-exam',
    'math-sage-oval',
    'book-forum-readers',
    'megaphone-announce',
    'exam-pc-corners',
    'blue-binder-circle',
    'desk-workspace-hands',
    'tech-desk-blue',
    'skyline-team-v',
    'handshake-flare',
    'stationery-cream-frame',
    'mint-chart-growth',
    'ink-desk-gadgets',
    'gear-bulb-frame',
    'presentation-torn-header',
] as const;

export function corporateCardSrc(styleKey: string): string {
    const index = Math.max(0, CORPORATE_STYLE_KEYS.indexOf(styleKey as (typeof CORPORATE_STYLE_KEYS)[number]));
    const key = CORPORATE_CARD_KEYS[index % CORPORATE_CARD_KEYS.length];

    return `/images/gallery/corporate/blank/card-${key}.jpg?v=1`;
}

const GALLERY_MOMENTS = [
    { title: 'Keynote hour', note: 'The room before doors' },
    { title: 'The table', note: 'Set for partners' },
    { title: 'Skyline', note: 'Where the day lands' },
    { title: 'Golden hour', note: 'Reception light' },
    { title: 'Lobby glow', note: 'Arrival, then work' },
    { title: 'After dusk', note: 'When talks become dinner' },
    { title: 'A quiet view', note: 'The place we chose' },
    { title: 'The stage', note: 'A frame from the summit' },
] as const;

export type CorporateGalleryPhoto = {
    src: string;
    title: string;
    note: string;
    span: 'hero' | 'tall' | 'wide' | 'square';
};

export function corporateGalleryPhotos(styleKey: string): CorporateGalleryPhoto[] {
    const start = Math.max(0, CORPORATE_STYLE_KEYS.indexOf(styleKey as (typeof CORPORATE_STYLE_KEYS)[number]));
    const spans: CorporateGalleryPhoto['span'][] = ['hero', 'tall', 'square', 'square', 'wide', 'tall', 'square', 'wide'];

    return GALLERY_MOMENTS.map((moment, index) => {
        const key = CORPORATE_STYLE_KEYS[(start + index) % CORPORATE_STYLE_KEYS.length];
        const portrait = spans[index] === 'tall';

        return {
            src: corporateHeroSrc(key, portrait ? 'mobile' : 'desktop'),
            title: moment.title,
            note: moment.note,
            span: spans[index],
        };
    });
}

export type CorporateSiteTheme = {
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
    reception: string;
    schedule: { time: string; title: string }[];
};

const themes: Record<string, CorporateSiteTheme> = {
    'tech-frontier': {
        bg: '#0b1220',
        surface: '#111827',
        ink: '#e5e7eb',
        accent: '#3b82f6',
        muted: '#94a3b8',
        buttonInk: '#0b1220',
        button: 'rounded-md',
        venue: 'Meridian Hall',
        city: 'Chicago',
        space: 'Main Stage',
        reception: 'Blue Room',
        schedule: [
            { time: '9:00 AM', title: 'Doors' },
            { time: '10:00 AM', title: 'Keynote' },
            { time: '6:00 PM', title: 'Reception' },
        ],
    },
    leadership: {
        bg: '#f4efe8',
        surface: '#ebe3d8',
        ink: '#1c1916',
        accent: '#c6a36a',
        muted: '#7a7168',
        buttonInk: '#1c1916',
        button: 'rounded-md',
        venue: 'Skyline Boardroom',
        city: 'New York',
        space: 'Executive Table',
        reception: 'West Lounge',
        schedule: [
            { time: '8:30 AM', title: 'Breakfast' },
            { time: '9:30 AM', title: 'Forum' },
            { time: '5:00 PM', title: 'Close' },
        ],
    },
    'industry-gala': {
        bg: '#1c1916',
        surface: '#27221c',
        ink: '#f6f0e6',
        accent: '#d4b483',
        muted: '#b7a48a',
        buttonInk: '#1c1916',
        button: 'rounded-md',
        venue: 'Gold Banquet',
        city: 'London',
        space: 'Candle Hall',
        reception: 'Awards Stage',
        schedule: [
            { time: '7:00 PM', title: 'Arrival' },
            { time: '8:00 PM', title: 'Dinner' },
            { time: '10:00 PM', title: 'Awards' },
        ],
    },
    sustainable: {
        bg: '#0f172a',
        surface: '#1e293b',
        ink: '#e2e8f0',
        accent: '#38bdf8',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-md',
        venue: 'Forum Arena',
        city: 'Berlin',
        space: 'Twin Screens',
        reception: 'Green Lounge',
        schedule: [
            { time: '9:00 AM', title: 'Plenary' },
            { time: '1:00 PM', title: 'Panels' },
            { time: '6:30 PM', title: 'Networking' },
        ],
    },
    'creative-summit': {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#7c2d12',
        accent: '#ea580c',
        muted: '#b45309',
        buttonInk: '#fff7ed',
        button: 'rounded-md',
        venue: 'Roof Deck',
        city: 'Los Angeles',
        space: 'Sunset Terrace',
        reception: 'Sky Bar',
        schedule: [
            { time: '4:00 PM', title: 'Welcome' },
            { time: '5:30 PM', title: 'Talks' },
            { time: '7:30 PM', title: 'Cocktails' },
        ],
    },
    trade: {
        bg: '#f8fafc',
        surface: '#f1f5f9',
        ink: '#0f172a',
        accent: '#1d4ed8',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-md',
        venue: 'Atrium Center',
        city: 'Singapore',
        space: 'Grand Lobby',
        reception: 'Exhibit Hall',
        schedule: [
            { time: '8:00 AM', title: 'Registration' },
            { time: '10:00 AM', title: 'Expo floor' },
            { time: '5:00 PM', title: 'Close' },
        ],
    },
    fintech: {
        bg: '#18181b',
        surface: '#27272a',
        ink: '#fafafa',
        accent: '#eab308',
        muted: '#a3a3a3',
        buttonInk: '#18181b',
        button: 'rounded-md',
        venue: 'Noir Atelier',
        city: 'Zurich',
        space: 'Candle Table',
        reception: 'Vault Lounge',
        schedule: [
            { time: '6:30 PM', title: 'Cocktails' },
            { time: '8:00 PM', title: 'Dinner' },
            { time: '10:00 PM', title: 'Close' },
        ],
    },
    cowork: {
        bg: '#f1f5f9',
        surface: '#e2e8f0',
        ink: '#0f172a',
        accent: '#334155',
        muted: '#64748b',
        buttonInk: '#f1f5f9',
        button: 'rounded-md',
        venue: 'Harbor Forum',
        city: 'Toronto',
        space: 'Window Hall',
        reception: 'Catalyst Lounge',
        schedule: [
            { time: '9:00 AM', title: 'Open space' },
            { time: '11:00 AM', title: 'Sessions' },
            { time: '4:00 PM', title: 'Mixer' },
        ],
    },
    healthcare: {
        bg: '#ecfeff',
        surface: '#cffafe',
        ink: '#155e75',
        accent: '#0891b2',
        muted: '#5e8a95',
        buttonInk: '#ecfeff',
        button: 'rounded-md',
        venue: 'Sky Lounge',
        city: 'Boston',
        space: 'West Terrace',
        reception: 'Care Pavilion',
        schedule: [
            { time: '8:00 AM', title: 'Showcase' },
            { time: '12:00 PM', title: 'Clinics' },
            { time: '5:00 PM', title: 'Reception' },
        ],
    },
    jubilee: {
        bg: '#faf7f2',
        surface: '#f3eee6',
        ink: '#241c16',
        accent: '#c6a36a',
        muted: '#8a7d6e',
        buttonInk: '#241c16',
        button: 'rounded-md',
        venue: 'Crystal Ballroom',
        city: 'Paris',
        space: 'Chandelier Hall',
        reception: 'Gold Foyer',
        schedule: [
            { time: '6:30 PM', title: 'Arrival' },
            { time: '7:30 PM', title: 'Dinner' },
            { time: '9:30 PM', title: 'Toasts' },
        ],
    },
    'ai-summit': {
        bg: '#f8fafc',
        surface: '#e2e8f0',
        ink: '#0f172a',
        accent: '#2563eb',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-md',
        venue: 'Expo Pavilion',
        city: 'San Francisco',
        space: 'Booth Hall',
        reception: 'Demo Stage',
        schedule: [
            { time: '9:00 AM', title: 'Open expo' },
            { time: '11:00 AM', title: 'Keynote' },
            { time: '4:00 PM', title: 'Demos' },
        ],
    },
    'design-thinking': {
        bg: '#0f172a',
        surface: '#1e293b',
        ink: '#e2e8f0',
        accent: '#818cf8',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-md',
        venue: 'Studio Stage',
        city: 'Amsterdam',
        space: 'Main Screen',
        reception: 'Workshop Lab',
        schedule: [
            { time: '10:00 AM', title: 'Kickoff' },
            { time: '1:00 PM', title: 'Studios' },
            { time: '5:00 PM', title: 'Share-out' },
        ],
    },
    'real-estate': {
        bg: '#f8fafc',
        surface: '#f1f5f9',
        ink: '#1e293b',
        accent: '#475569',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-md',
        venue: 'Glasshouse Lounge',
        city: 'Dubai',
        space: 'City Salon',
        reception: 'Terrace Bar',
        schedule: [
            { time: '9:30 AM', title: 'Briefing' },
            { time: '11:00 AM', title: 'Market tour' },
            { time: '4:00 PM', title: 'Close' },
        ],
    },
    diversity: {
        bg: '#f0fdf4',
        surface: '#dcfce7',
        ink: '#14532d',
        accent: '#4d7c0f',
        muted: '#5b7a62',
        buttonInk: '#f0fdf4',
        button: 'rounded-full',
        venue: 'Garden Court',
        city: 'Austin',
        space: 'String-light Lawn',
        reception: 'Round Table',
        schedule: [
            { time: '3:00 PM', title: 'Welcome' },
            { time: '4:30 PM', title: 'Conversation' },
            { time: '6:30 PM', title: 'Reception' },
        ],
    },
    aerospace: {
        bg: '#020617',
        surface: '#0f172a',
        ink: '#e2e8f0',
        accent: '#60a5fa',
        muted: '#94a3b8',
        buttonInk: '#020617',
        button: 'rounded-md',
        venue: 'Convention Arena',
        city: 'Houston',
        space: 'Plenary Seats',
        reception: 'Hangar Lounge',
        schedule: [
            { time: '8:30 AM', title: 'Doors' },
            { time: '9:30 AM', title: 'Keynote' },
            { time: '5:00 PM', title: 'Expo' },
        ],
    },
    nonprofit: {
        bg: '#1c1916',
        surface: '#292524',
        ink: '#fafaf9',
        accent: '#d6b25e',
        muted: '#a8a29e',
        buttonInk: '#1c1916',
        button: 'rounded-md',
        venue: 'Charity Hall',
        city: 'Washington',
        space: 'Gala Table',
        reception: 'Donor Lounge',
        schedule: [
            { time: '6:00 PM', title: 'Cocktails' },
            { time: '7:30 PM', title: 'Dinner' },
            { time: '9:00 PM', title: 'Program' },
        ],
    },
    retreat: {
        bg: '#f8fafc',
        surface: '#f1f5f9',
        ink: '#0f172a',
        accent: '#0f766e',
        muted: '#64748b',
        buttonInk: '#f8fafc',
        button: 'rounded-md',
        venue: 'Light Hall',
        city: 'Portland',
        space: 'Window Gallery',
        reception: 'Retreat Lawn',
        schedule: [
            { time: '9:00 AM', title: 'Arrival' },
            { time: '10:30 AM', title: 'Workshops' },
            { time: '4:00 PM', title: 'Close' },
        ],
    },
    hr: {
        bg: '#eff6ff',
        surface: '#dbeafe',
        ink: '#1e3a8a',
        accent: '#2563eb',
        muted: '#64748b',
        buttonInk: '#eff6ff',
        button: 'rounded-md',
        venue: 'Summit Boardroom',
        city: 'Seattle',
        space: 'Panel Table',
        reception: 'People Lounge',
        schedule: [
            { time: '8:30 AM', title: 'Check-in' },
            { time: '9:30 AM', title: 'Panels' },
            { time: '3:30 PM', title: 'Networking' },
        ],
    },
    cyber: {
        bg: '#0f172a',
        surface: '#1e293b',
        ink: '#e2e8f0',
        accent: '#22c55e',
        muted: '#94a3b8',
        buttonInk: '#0f172a',
        button: 'rounded-md',
        venue: 'Grove Terrace',
        city: 'Tel Aviv',
        space: 'Garden Lights',
        reception: 'Secure Lounge',
        schedule: [
            { time: '9:00 AM', title: 'Briefing' },
            { time: '11:00 AM', title: 'Labs' },
            { time: '6:00 PM', title: 'Reception' },
        ],
    },
    'dinner-circle': {
        bg: '#fff7ed',
        surface: '#ffedd5',
        ink: '#7c2d12',
        accent: '#c2410c',
        muted: '#9a6b4a',
        buttonInk: '#fff7ed',
        button: 'rounded-md',
        venue: 'Harbor Lounge',
        city: 'Miami',
        space: 'Waterfront Sofas',
        reception: 'Circle Table',
        schedule: [
            { time: '6:00 PM', title: 'Arrival' },
            { time: '7:00 PM', title: 'Dinner' },
            { time: '9:00 PM', title: 'Close' },
        ],
    },
};

export function corporateSiteTheme(styleKey: string): CorporateSiteTheme {
    return themes[styleKey] ?? themes['tech-frontier'];
}
