export const CUSTOM_SAMPLE = {
    kicker: 'You are invited',
    name: 'Morgan',
    eventName: 'The Gathering',
    message: 'Come as you are. Share a table, a toast, and an evening that belongs to everyone in the room.',
    eventLine: 'Evening · 14 November 2026',
    date: '2026-11-14',
    dateLabel: 'Saturday, 14 November 2026',
    dateShort: 'Saturday · 14 November 2026',
} as const;

export const CUSTOM_STYLE_KEYS = [
    'canvas',
    'structured',
    'collage',
    'cyber',
    'sunset-art',
    'opulence',
    'playroom',
    'barn',
    'botanicals',
    'noir',
    'fusion',
    'pop',
    'loft',
    'aviation',
    'portfolio',
    'silhouette',
    'next-project',
    'ivy-estate',
    'splash',
    'supper',
    'pool-cabana',
    'blossom-bridge',
    'shore-arch',
    'rainbow-drape',
    'crystal-hall',
    'palm-shore',
    'canvas-tents',
    'lantern-supper',
    'alpine-hearth',
    'balloon-salon',
    'harvest-banquet',
    'desert-lounge',
    'gilded-ballroom',
    'skyline-night',
    'library-gather',
    'villa-shore',
    'stair-balloons',
    'harbor-table',
    'festival-mandap',
    'mesa-dusk',
] as const;

const CARD_KEYS = CUSTOM_STYLE_KEYS.slice(0, 20);

export function customHeroSrc(styleKey: string, device: 'mobile' | 'desktop'): string {
    const file = device === 'desktop' ? `${styleKey}-hero-desktop.jpg` : `${styleKey}-hero-mobile.jpg`;

    return `/images/gallery/previews/custom/${file}?v=3`;
}

export function customCardSrc(styleKey: string): string {
    const index = Math.max(0, CUSTOM_STYLE_KEYS.indexOf(styleKey as (typeof CUSTOM_STYLE_KEYS)[number]));
    const cardKey = CARD_KEYS.includes(styleKey as (typeof CARD_KEYS)[number]) ? styleKey : CARD_KEYS[index % CARD_KEYS.length];

    // Match the custom card gallery: website photos with soft-blur treatment on the card face.
    return `/images/gallery/custom/link-${cardKey}.jpg?v=4`;
}

const GALLERY_MOMENTS = [
    { title: 'The arrival', note: 'Where guests gather' },
    { title: 'The table', note: 'A place to sit' },
    { title: 'Soft light', note: 'Details of the night' },
    { title: 'Golden hour', note: 'Before dinner' },
    { title: 'In bloom', note: 'Flowers for the room' },
    { title: 'After dark', note: 'When music begins' },
    { title: 'A quiet view', note: 'The place we chose' },
    { title: 'The toast', note: 'A frame from the evening' },
] as const;

export type CustomGalleryPhoto = {
    src: string;
    title: string;
    note: string;
    span: 'hero' | 'tall' | 'wide' | 'square';
};

export function customGalleryPhotos(styleKey: string): CustomGalleryPhoto[] {
    const start = Math.max(0, CUSTOM_STYLE_KEYS.indexOf(styleKey as (typeof CUSTOM_STYLE_KEYS)[number]));
    const spans: CustomGalleryPhoto['span'][] = ['hero', 'tall', 'square', 'square', 'wide', 'tall', 'square', 'wide'];

    return GALLERY_MOMENTS.map((moment, index) => {
        const key = CUSTOM_STYLE_KEYS[(start + index) % CUSTOM_STYLE_KEYS.length];
        const portrait = spans[index] === 'tall';

        return {
            src: customHeroSrc(key, portrait ? 'mobile' : 'desktop'),
            title: moment.title,
            note: moment.note,
            span: spans[index],
        };
    });
}

export type CustomSiteTheme = {
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
    { time: '6:00 PM', title: 'Arrive' },
    { time: '7:00 PM', title: 'Dinner' },
    { time: '9:00 PM', title: 'Music' },
];

type ThemeSeed = Omit<CustomSiteTheme, 'schedule'>;

const seeds: Record<string, ThemeSeed> = {
    canvas: { bg: '#fff7ed', surface: '#ffedd5', ink: '#9a3412', accent: '#ea580c', muted: '#b45309', buttonInk: '#fff7ed', button: 'rounded-full', venue: 'Shore Lights', city: 'Malibu', space: 'Sunset Table', afterparty: 'Beach Walk' },
    structured: { bg: '#f0fdf4', surface: '#dcfce7', ink: '#14532d', accent: '#3f6212', muted: '#5b7a62', buttonInk: '#f0fdf4', button: 'rounded-md', venue: 'Garden Pergola', city: 'Austin', space: 'String Court', afterparty: 'Lawn Toast' },
    collage: { bg: '#1c1917', surface: '#292524', ink: '#fafaf9', accent: '#f97316', muted: '#a8a29e', buttonInk: '#1c1917', button: 'rounded-full', venue: 'Fire Circle', city: 'Asheville', space: 'Night Pit', afterparty: 'Cabin Porch' },
    cyber: { bg: '#fdf2f8', surface: '#fce7f3', ink: '#9d174d', accent: '#db2777', muted: '#a67a90', buttonInk: '#fff1f2', button: 'rounded-full', venue: 'Balloon Salon', city: 'Miami', space: 'Party Room', afterparty: 'Terrace' },
    'sunset-art': { bg: '#ecfeff', surface: '#cffafe', ink: '#155e75', accent: '#0891b2', muted: '#5e8a95', buttonInk: '#ecfeff', button: 'rounded-md', venue: 'Snow Cabin', city: 'Banff', space: 'Winter Lodge', afterparty: 'Pine Walk' },
    opulence: { bg: '#0f172a', surface: '#1e293b', ink: '#e2e8f0', accent: '#fbbf24', muted: '#94a3b8', buttonInk: '#0f172a', button: 'rounded-md', venue: 'Skyline Terrace', city: 'Chicago', space: 'Roof Table', afterparty: 'City Lights' },
    playroom: { bg: '#fdf2f8', surface: '#fce7f3', ink: '#9f1239', accent: '#f9a8d4', muted: '#a67a90', buttonInk: '#9f1239', button: 'rounded-full', venue: 'Bloom Hall', city: 'Charleston', space: 'Floral Arch', afterparty: 'Salon' },
    barn: { bg: '#f0fdf4', surface: '#dcfce7', ink: '#3f6212', accent: '#65a30d', muted: '#6b8f4e', buttonInk: '#f0fdf4', button: 'rounded-full', venue: 'Lawn Tables', city: 'Napa', space: 'Green Fairway', afterparty: 'Club Porch' },
    botanicals: { bg: '#fff7ed', surface: '#ffedd5', ink: '#7c2d12', accent: '#c2410c', muted: '#9a6b4a', buttonInk: '#fff7ed', button: 'rounded-md', venue: 'Timber Hall', city: 'Portland', space: 'String Barn', afterparty: 'Yard' },
    noir: { bg: '#0f172a', surface: '#1e293b', ink: '#e0e7ff', accent: '#38bdf8', muted: '#94a3b8', buttonInk: '#0f172a', button: 'rounded-md', venue: 'Night Pool', city: 'Palm Springs', space: 'Palm Deck', afterparty: 'Cabana' },
    fusion: { bg: '#faf8f5', surface: '#f3eee6', ink: '#3b2414', accent: '#c6a36a', muted: '#8a7d6e', buttonInk: '#241c16', button: 'rounded-full', venue: 'Aisle Garden', city: 'Savannah', space: 'White Arch', afterparty: 'Lawn' },
    pop: { bg: '#2e1065', surface: '#4c1d95', ink: '#f5d0fe', accent: '#e879f9', muted: '#c4b5fd', buttonInk: '#2e1065', button: 'rounded-full', venue: 'Neon Stage', city: 'Austin', space: 'Light Floor', afterparty: 'After Show' },
    loft: { bg: '#f8fafc', surface: '#e2e8f0', ink: '#1e293b', accent: '#64748b', muted: '#64748b', buttonInk: '#f8fafc', button: 'rounded-md', venue: 'Glass Conservatory', city: 'London', space: 'Light Room', afterparty: 'Garden' },
    aviation: { bg: '#1c1917', surface: '#292524', ink: '#fafaf9', accent: '#f59e0b', muted: '#a8a29e', buttonInk: '#1c1917', button: 'rounded-full', venue: 'Fairground', city: 'Vienna', space: 'Ferris Lawn', afterparty: 'Carnival Walk' },
    portfolio: { bg: '#0f172a', surface: '#1e293b', ink: '#e2e8f0', accent: '#38bdf8', muted: '#94a3b8', buttonInk: '#0f172a', button: 'rounded-md', venue: 'Cinema Lawn', city: 'Los Angeles', space: 'Screen Field', afterparty: 'Blanket Toast' },
    silhouette: { bg: '#faf8f5', surface: '#f3eee6', ink: '#3b2414', accent: '#c6a36a', muted: '#8a7d6e', buttonInk: '#241c16', button: 'rounded-full', venue: 'Drape Garden', city: 'Provence', space: 'Tea Lawn', afterparty: 'Orchard' },
    'next-project': { bg: '#fafafa', surface: '#f4f4f5', ink: '#171717', accent: '#a3a3a3', muted: '#737373', buttonInk: '#171717', button: 'rounded-md', venue: 'Ivory Dining', city: 'Paris', space: 'White Hall', afterparty: 'Courtyard' },
    'ivy-estate': { bg: '#fff7ed', surface: '#ffedd5', ink: '#9a3412', accent: '#c2410c', muted: '#9a6b4a', buttonInk: '#fff7ed', button: 'rounded-full', venue: 'Vineyard Table', city: 'Sonoma', space: 'Row Dinner', afterparty: 'Cellar' },
    splash: { bg: '#fff7ed', surface: '#ffedd5', ink: '#9a3412', accent: '#ea580c', muted: '#b45309', buttonInk: '#fff7ed', button: 'rounded-full', venue: 'Harvest Porch', city: 'Salem', space: 'Pumpkin Step', afterparty: 'Cider Table' },
    supper: { bg: '#1c1917', surface: '#292524', ink: '#fef3c7', accent: '#f59e0b', muted: '#a8a29e', buttonInk: '#1c1917', button: 'rounded-full', venue: 'Hearth Room', city: 'Edinburgh', space: 'Tree Salon', afterparty: 'Cocoa Nook' },
    'pool-cabana': { bg: '#ecfeff', surface: '#cffafe', ink: '#155e75', accent: '#0891b2', muted: '#5e8a95', buttonInk: '#ecfeff', button: 'rounded-full', venue: 'Cabana Pool', city: 'Honolulu', space: 'Palm Deck', afterparty: 'Night Swim' },
    'blossom-bridge': { bg: '#fdf2f8', surface: '#fce7f3', ink: '#9d174d', accent: '#f9a8d4', muted: '#a67a90', buttonInk: '#9d174d', button: 'rounded-full', venue: 'Blossom Bridge', city: 'Kyoto', space: 'Petal Path', afterparty: 'Tea House' },
    'shore-arch': { bg: '#ecfeff', surface: '#cffafe', ink: '#164e63', accent: '#22d3ee', muted: '#57808c', buttonInk: '#164e63', button: 'rounded-full', venue: 'Shore Arch', city: 'Cape Town', space: 'Beach Aisle', afterparty: 'Tide Table' },
    'rainbow-drape': { bg: '#faf5ff', surface: '#f3e8ff', ink: '#6b21a8', accent: '#c026d3', muted: '#8b6fa0', buttonInk: '#faf5ff', button: 'rounded-full', venue: 'Color Court', city: 'Barcelona', space: 'Drape Hall', afterparty: 'Plaza' },
    'crystal-hall': { bg: '#faf8f5', surface: '#f3eee6', ink: '#3b2414', accent: '#c6a36a', muted: '#8a7d6e', buttonInk: '#241c16', button: 'rounded-md', venue: 'Crystal Hall', city: 'Prague', space: 'Chandelier Room', afterparty: 'Foyer' },
    'palm-shore': { bg: '#ecfeff', surface: '#cffafe', ink: '#155e75', accent: '#0e7490', muted: '#5e8a95', buttonInk: '#ecfeff', button: 'rounded-full', venue: 'Palm Shore', city: 'Tulum', space: 'Beach Arch', afterparty: 'Sand Table' },
    'canvas-tents': { bg: '#fffbeb', surface: '#fef3c7', ink: '#422006', accent: '#d97706', muted: '#a16207', buttonInk: '#fffbeb', button: 'rounded-full', venue: 'Tent Meadow', city: 'Denver', space: 'Canvas Camp', afterparty: 'Fire Ring' },
    'lantern-supper': { bg: '#fff7ed', surface: '#ffedd5', ink: '#9a3412', accent: '#c2410c', muted: '#9a6b4a', buttonInk: '#fff7ed', button: 'rounded-md', venue: 'Lantern Court', city: 'Marrakech', space: 'String Table', afterparty: 'Courtyard' },
    'alpine-hearth': { bg: '#0f172a', surface: '#1e293b', ink: '#e2e8f0', accent: '#fbbf24', muted: '#94a3b8', buttonInk: '#0f172a', button: 'rounded-md', venue: 'Alpine Cabin', city: 'Innsbruck', space: 'Mountain Deck', afterparty: 'Hearth' },
    'balloon-salon': { bg: '#fdf2f8', surface: '#fce7f3', ink: '#9f1239', accent: '#fb7185', muted: '#a67a90', buttonInk: '#fff1f2', button: 'rounded-full', venue: 'Cloud Salon', city: 'Brooklyn', space: 'Balloon Room', afterparty: 'Loft' },
    'harvest-banquet': { bg: '#fff7ed', surface: '#ffedd5', ink: '#7c2d12', accent: '#ea580c', muted: '#9a6b4a', buttonInk: '#fff7ed', button: 'rounded-full', venue: 'Harvest Lawn', city: 'Tuscany', space: 'Long Table', afterparty: 'Olive Walk' },
    'desert-lounge': { bg: '#fff7ed', surface: '#ffedd5', ink: '#9a3412', accent: '#d97706', muted: '#b45309', buttonInk: '#fff7ed', button: 'rounded-md', venue: 'Cactus Lounge', city: 'Scottsdale', space: 'Mesa Seats', afterparty: 'Dusk Deck' },
    'gilded-ballroom': { bg: '#faf8f5', surface: '#f3eee6', ink: '#3b2414', accent: '#c6a36a', muted: '#8a7d6e', buttonInk: '#241c16', button: 'rounded-md', venue: 'Gilded Hall', city: 'Vienna', space: 'Gold Room', afterparty: 'Gallery' },
    'skyline-night': { bg: '#0f172a', surface: '#1e293b', ink: '#e2e8f0', accent: '#f59e0b', muted: '#94a3b8', buttonInk: '#0f172a', button: 'rounded-md', venue: 'Night Roof', city: 'Singapore', space: 'City Table', afterparty: 'Sky Bar' },
    'library-gather': { bg: '#fffbeb', surface: '#fef3c7', ink: '#422006', accent: '#b45309', muted: '#a16207', buttonInk: '#fffbeb', button: 'rounded-md', venue: 'Stack Room', city: 'Boston', space: 'Reading Hall', afterparty: 'Quiet Nook' },
    'villa-shore': { bg: '#ecfeff', surface: '#cffafe', ink: '#155e75', accent: '#22d3ee', muted: '#5e8a95', buttonInk: '#155e75', button: 'rounded-full', venue: 'Villa Shore', city: 'Santorini', space: 'Pool Lawn', afterparty: 'Cliff Walk' },
    'stair-balloons': { bg: '#fafafa', surface: '#f4f4f5', ink: '#171717', accent: '#a3a3a3', muted: '#737373', buttonInk: '#171717', button: 'rounded-full', venue: 'Stair Hall', city: 'Madrid', space: 'Entry Stair', afterparty: 'Salon' },
    'harbor-table': { bg: '#fff7ed', surface: '#ffedd5', ink: '#9a3412', accent: '#ea580c', muted: '#b45309', buttonInk: '#fff7ed', button: 'rounded-full', venue: 'Harbor Deck', city: 'San Diego', space: 'Water Table', afterparty: 'Pier Walk' },
    'festival-mandap': { bg: '#fdf2f8', surface: '#fce7f3', ink: '#9d174d', accent: '#f59e0b', muted: '#a67a90', buttonInk: '#9d174d', button: 'rounded-full', venue: 'Color Mandap', city: 'Singapore', space: 'Drape Court', afterparty: 'Garden' },
    'mesa-dusk': { bg: '#fff7ed', surface: '#ffedd5', ink: '#7c2d12', accent: '#c2410c', muted: '#9a6b4a', buttonInk: '#fff7ed', button: 'rounded-md', venue: 'Mesa Lounge', city: 'Santa Fe', space: 'Dusk Seats', afterparty: 'Canyon View' },
};

export function customSiteTheme(styleKey: string): CustomSiteTheme {
    const seed = seeds[styleKey] ?? seeds.canvas;

    return { ...seed, schedule: evening };
}
