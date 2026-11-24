import type {
    OccasionCharRole,
    OccasionCountdownTheme,
    OccasionLayoutId,
} from '@/components/marketing/site-previews/occasion-countdown-engine';

export type EventCountdownStyleOption = {
    id: string;
    label: string;
    description: string;
};

export type EventCountdownPackId =
    | 'party'
    | 'bridal-shower'
    | 'graduation'
    | 'housewarming'
    | 'custom';

export type EventCountdownPack = {
    id: EventCountdownPackId;
    label: string;
    notice: string;
    accent: string;
    swatchBg: string;
    defaultClock: string;
    hostFallback: string;
    defaultStyle: string;
    options: EventCountdownStyleOption[];
    layouts: Record<string, OccasionLayoutId>;
    /** Optional per-style unique cartoon sets (custom designs). */
    styleChars?: Record<string, Record<OccasionCharRole, string>>;
    theme: OccasionCountdownTheme;
    match: (occasion?: string | null) => boolean;
};

const C = (name: string): string => `/images/countdown/custom-char-${name}-cut.png?v=2`;

const TEN_BASE: Array<{ key: string; label: string; description: string; layout: OccasionLayoutId }> = [
    { key: 'dash', label: 'Meet Dash', description: 'Characters dash closer around a glass chrono strip', layout: 'dash' },
    { key: 'rise', label: 'Stage Rise', description: 'Hero rises on a glowing stage as the day nears', layout: 'rise' },
    { key: 'glow', label: 'Soft Glow', description: 'Editorial gold digits with flanking cartoons', layout: 'glow' },
    { key: 'orbit', label: 'Orbit', description: 'Characters orbit a luminous event clock', layout: 'orbit' },
    { key: 'strip', label: 'Neon Strip', description: 'Neon chrono strip with animated runners', layout: 'strip' },
    { key: 'burst', label: 'Burst', description: 'Confetti intensifies while the duo meets center', layout: 'burst' },
    { key: 'trail', label: 'Star Trail', description: 'Stars pull inward while cartoons cheer floating pods', layout: 'trail' },
    { key: 'arch', label: 'Balloon Arch', description: 'Festive arch frames animated characters', layout: 'arch' },
    { key: 'parade', label: 'Spark Parade', description: 'Poppers + bouncing character parade', layout: 'parade' },
    { key: 'night', label: 'Night Glow', description: 'Night stage with bright glass digits and sparkles', layout: 'night' },
];

function packFromBase(
    prefix: string,
    labels?: Partial<Record<string, { label: string; description: string }>>,
): { options: EventCountdownStyleOption[]; layouts: Record<string, OccasionLayoutId>; defaultStyle: string } {
    const options: EventCountdownStyleOption[] = [];
    const layouts: Record<string, OccasionLayoutId> = {};
    for (const item of TEN_BASE) {
        const id = `${prefix}-${item.key}`;
        const override = labels?.[item.key];
        options.push({
            id,
            label: override?.label || item.label,
            description: override?.description || item.description,
        });
        layouts[id] = item.layout;
    }
    return { options, layouts, defaultStyle: `${prefix}-dash` };
}

/** Each custom design gets its own unique cartoon cast — no shared host/guest/mascot reuse. */
const CUSTOM_DESIGNS: Array<{
    id: string;
    label: string;
    description: string;
    layout: OccasionLayoutId;
    chars: Record<OccasionCharRole, string>;
}> = [
    {
        id: 'custom-dash',
        label: 'Jam Session',
        description: 'Musician & dancer dash closer around glass digits',
        layout: 'dash',
        chars: { a: C('musician'), b: C('dancer'), c: C('fox') },
    },
    {
        id: 'custom-rise',
        label: 'Chef Spotlight',
        description: 'Chef rises on a glowing dessert stage',
        layout: 'rise',
        chars: { a: C('chef'), b: C('chef'), c: C('chef') },
    },
    {
        id: 'custom-glow',
        label: 'Wander Glow',
        description: 'Traveler & photographer flank amber editorial digits',
        layout: 'glow',
        chars: { a: C('traveler'), b: C('photographer'), c: C('owl') },
    },
    {
        id: 'custom-orbit',
        label: 'Trophy Orbit',
        description: 'Athlete & robot orbit a luminous victory clock',
        layout: 'orbit',
        chars: { a: C('athlete'), b: C('robot'), c: C('athlete') },
    },
    {
        id: 'custom-strip',
        label: 'Studio Strip',
        description: 'Artist & surfer race a neon chrono ribbon',
        layout: 'strip',
        chars: { a: C('artist'), b: C('surfer'), c: C('artist') },
    },
    {
        id: 'custom-burst',
        label: 'Lab Burst',
        description: 'Scientist & magician meet in a confetti flash',
        layout: 'burst',
        chars: { a: C('scientist'), b: C('magician'), c: C('scientist') },
    },
    {
        id: 'custom-trail',
        label: 'Garden Trail',
        description: 'Gardener & owl cheer stars into floating pods',
        layout: 'trail',
        chars: { a: C('gardener'), b: C('owl'), c: C('gardener') },
    },
    {
        id: 'custom-arch',
        label: 'Sky Arch',
        description: 'Pilot & herald frame the countdown under balloons',
        layout: 'arch',
        chars: { a: C('pilot'), b: C('herald'), c: C('pilot') },
    },
    {
        id: 'custom-parade',
        label: 'Story Parade',
        description: 'Bookworm & astronaut bounce with party poppers',
        layout: 'parade',
        chars: { a: C('bookworm'), b: C('astronaut'), c: C('bookworm') },
    },
    {
        id: 'custom-night',
        label: 'Fox Midnight',
        description: 'Fox & dancer light up a night celebration stage',
        layout: 'night',
        chars: { a: C('fox'), b: C('dancer'), c: C('fox') },
    },
    {
        id: 'custom-helix',
        label: 'Robot Helix',
        description: 'Robot & musician whirl inside a spiral clock',
        layout: 'helix',
        chars: { a: C('robot'), b: C('musician'), c: C('robot') },
    },
    {
        id: 'custom-cascade',
        label: 'Trio Cascade',
        description: 'Chef, traveler & herald gather as digits settle',
        layout: 'cascade',
        chars: { a: C('chef'), b: C('traveler'), c: C('herald') },
    },
    {
        id: 'custom-mirror',
        label: 'Mirror Run',
        description: 'Athlete & artist approach across a reflective floor',
        layout: 'mirror',
        chars: { a: C('athlete'), b: C('artist'), c: C('athlete') },
    },
    {
        id: 'custom-frame',
        label: 'Gallery Owl',
        description: 'Photographer & owl pose in a framed editorial countdown',
        layout: 'frame',
        chars: { a: C('photographer'), b: C('owl'), c: C('photographer') },
    },
    {
        id: 'custom-mosaic',
        label: 'Magic Mosaic',
        description: 'Magician & surfer flank floating time pods',
        layout: 'mosaic',
        chars: { a: C('magician'), b: C('surfer'), c: C('magician') },
    },
    {
        id: 'custom-ribbon',
        label: 'Garden Ribbon',
        description: 'Gardener celebrates under a flowing ribbon wave',
        layout: 'ribbon',
        chars: { a: C('gardener'), b: C('gardener'), c: C('gardener') },
    },
    {
        id: 'custom-pulse',
        label: 'Pulse Lab',
        description: 'Scientist & bookworm pulse rings toward the day',
        layout: 'pulse',
        chars: { a: C('scientist'), b: C('bookworm'), c: C('scientist') },
    },
    {
        id: 'custom-horizon',
        label: 'Horizon Flight',
        description: 'Pilot & astronaut walk the horizon to meet',
        layout: 'horizon',
        chars: { a: C('pilot'), b: C('astronaut'), c: C('pilot') },
    },
    {
        id: 'custom-portal',
        label: 'Fox Portal',
        description: 'Fox & robot step through a glowing event portal',
        layout: 'portal',
        chars: { a: C('fox'), b: C('robot'), c: C('fox') },
    },
    {
        id: 'custom-lantern',
        label: 'Lantern Owl',
        description: 'Owl lifts lanterns while the countdown glows',
        layout: 'lantern',
        chars: { a: C('owl'), b: C('owl'), c: C('owl') },
    },
    {
        id: 'custom-ticker',
        label: 'Live Herald',
        description: 'Herald & dancer headline a broadcast ticker',
        layout: 'ticker',
        chars: { a: C('herald'), b: C('dancer'), c: C('herald') },
    },
    {
        id: 'custom-constellation',
        label: 'Star Magician',
        description: 'Magician & musician map stars to the celebration',
        layout: 'constellation',
        chars: { a: C('magician'), b: C('musician'), c: C('magician') },
    },
];

function slug(occasion?: string | null): string {
    return (occasion || '').toLowerCase().replace(/_/g, '-');
}

const partyBase = packFromBase('party', {
    dash: { label: 'Dance Dash', description: 'Party guest & host dash toward the chrono strip' },
    night: { label: 'Club Night', description: 'Night club glow with bright glass digits' },
});

const bridalBase = packFromBase('bridal', {
    dash: { label: 'Blush Dash', description: 'Bride-to-be & friend dash closer in soft blush tones' },
    arch: { label: 'Petal Arch', description: 'Pastel arch frames the bridal countdown' },
});

const gradBase = packFromBase('grad', {
    dash: { label: 'Cap Dash', description: 'Graduates dash closer around the diploma clock' },
    rise: { label: 'Podium Rise', description: 'Graduate rises on the commencement stage' },
    night: { label: 'Afterglow', description: 'Night celebration after the ceremony' },
});

const houseBase = packFromBase('house', {
    dash: { label: 'Welcome Dash', description: 'Host & guest dash toward the housewarming clock' },
    rise: { label: 'Key Rise', description: 'Host rises with keys on a cozy home stage' },
    arch: { label: 'Porch Arch', description: 'Festive porch arch frames the countdown' },
});

export const EVENT_COUNTDOWN_PACKS: EventCountdownPack[] = [
    {
        id: 'party',
        label: 'Party',
        notice:
            'Ten elevated party countdowns with unique dance cartoons — guest & host characters move as the night gets closer.',
        accent: '#7c3aed',
        swatchBg: 'bg-[#f6f2ff]',
        defaultClock: '20:00',
        hostFallback: 'Party',
        defaultStyle: partyBase.defaultStyle,
        options: partyBase.options,
        layouts: partyBase.layouts,
        theme: {
            accent: '#7c3aed',
            digit: '#5b21b6',
            nightDigit: '#e9d5ff',
            rootClass: 'occ-party',
            chars: {
                a: '/images/countdown/party-guest-cut.png?v=2',
                b: '/images/countdown/party-host-cut.png?v=2',
                c: '/images/countdown/party-guest-cut.png?v=2',
            },
            confetti: ['#7c3aed', '#f472b6', '#22d3ee', '#fbbf24', '#a78bfa'],
            balloons: ['#7c3aed', '#f472b6', '#22d3ee', '#fbbf24', '#a78bfa', '#f472b6', '#7c3aed'],
            defaultHeading: 'The Party',
        },
        match: (occasion) => {
            const s = slug(occasion);
            return s === 'party' || s.includes('party');
        },
    },
    {
        id: 'bridal-shower',
        label: 'Bridal Shower',
        notice:
            'Ten elevated bridal-shower countdowns with blush cartoons — bride-to-be & maid of honor animate as the day nears.',
        accent: '#db2777',
        swatchBg: 'bg-[#fff1f7]',
        defaultClock: '11:00',
        hostFallback: 'Bridal Shower',
        defaultStyle: bridalBase.defaultStyle,
        options: bridalBase.options,
        layouts: bridalBase.layouts,
        theme: {
            accent: '#db2777',
            digit: '#9d174d',
            nightDigit: '#fce7f3',
            rootClass: 'occ-bridal',
            chars: {
                a: '/images/countdown/bridal-bride-cut.png?v=2',
                b: '/images/countdown/bridal-friend-cut.png?v=2',
                c: '/images/countdown/bridal-bride-cut.png?v=2',
            },
            confetti: ['#f9a8d4', '#c4b5fd', '#fde68a', '#fda4af', '#a5b4fc'],
            balloons: ['#f9a8d4', '#c4b5fd', '#fde68a', '#fda4af', '#a5b4fc', '#f9a8d4', '#c4b5fd'],
            defaultHeading: 'Bridal Shower',
        },
        match: (occasion) => {
            const s = slug(occasion);
            return s === 'bridal-shower' || s.includes('bridal');
        },
    },
    {
        id: 'graduation',
        label: 'Graduation',
        notice:
            'Ten elevated graduation countdowns with diploma cartoons — graduates walk and celebrate as commencement nears.',
        accent: '#0f766e',
        swatchBg: 'bg-[#f0fdfa]',
        defaultClock: '10:00',
        hostFallback: 'Graduation',
        defaultStyle: gradBase.defaultStyle,
        options: gradBase.options,
        layouts: gradBase.layouts,
        theme: {
            accent: '#0f766e',
            digit: '#115e59',
            nightDigit: '#ccfbf1',
            rootClass: 'occ-grad',
            chars: {
                a: '/images/countdown/grad-student-cut.png?v=2',
                b: '/images/countdown/grad-classmate-cut.png?v=2',
                c: '/images/countdown/grad-student-cut.png?v=2',
            },
            confetti: ['#0f766e', '#f59e0b', '#14b8a6', '#64748b', '#fbbf24'],
            balloons: ['#0f766e', '#f59e0b', '#14b8a6', '#64748b', '#fbbf24', '#0f766e', '#14b8a6'],
            defaultHeading: 'Graduation',
        },
        match: (occasion) => {
            const s = slug(occasion);
            return s === 'graduation' || s.includes('grad');
        },
    },
    {
        id: 'housewarming',
        label: 'Housewarming',
        notice:
            'Ten elevated housewarming countdowns with cozy home cartoons — host & guest welcome the day together.',
        accent: '#b45309',
        swatchBg: 'bg-[#fff7ed]',
        defaultClock: '17:00',
        hostFallback: 'Housewarming',
        defaultStyle: houseBase.defaultStyle,
        options: houseBase.options,
        layouts: houseBase.layouts,
        theme: {
            accent: '#b45309',
            digit: '#9a3412',
            nightDigit: '#ffedd5',
            rootClass: 'occ-house',
            chars: {
                a: '/images/countdown/house-host-cut.png?v=2',
                b: '/images/countdown/house-guest-cut.png?v=2',
                c: '/images/countdown/house-host-cut.png?v=2',
            },
            confetti: ['#b45309', '#65a30d', '#f59e0b', '#0ea5e9', '#d97706'],
            balloons: ['#b45309', '#65a30d', '#f59e0b', '#0ea5e9', '#d97706', '#65a30d', '#b45309'],
            defaultHeading: 'Housewarming',
        },
        match: (occasion) => {
            const s = slug(occasion);
            return s === 'housewarming' || s.includes('house');
        },
    },
    {
        id: 'custom',
        label: 'Custom',
        notice:
            'Twenty-two unique custom countdowns — each design has its own cartoon cast (musician, chef, astronaut, fox, owl, and more). No repeated host/guest/mascot set.',
        accent: '#0ea5e9',
        swatchBg: 'bg-[#f0f9ff]',
        defaultClock: '18:00',
        hostFallback: 'Celebration',
        defaultStyle: 'custom-dash',
        options: CUSTOM_DESIGNS.map(({ id, label, description }) => ({ id, label, description })),
        layouts: Object.fromEntries(CUSTOM_DESIGNS.map((item) => [item.id, item.layout])),
        styleChars: Object.fromEntries(CUSTOM_DESIGNS.map((item) => [item.id, item.chars])),
        theme: {
            accent: '#0ea5e9',
            digit: '#0369a1',
            nightDigit: '#e0f2fe',
            rootClass: 'occ-custom',
            chars: CUSTOM_DESIGNS[0].chars,
            confetti: ['#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6'],
            balloons: ['#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6', '#0ea5e9'],
            defaultHeading: 'Our Event',
        },
        match: (occasion) => {
            const s = slug(occasion);
            return s === 'custom' || s.includes('custom') || s === 'general' || s === 'other';
        },
    },
];

export function resolveEventCountdownPack(occasion?: string | null): EventCountdownPack | null {
    return EVENT_COUNTDOWN_PACKS.find((pack) => pack.match(occasion)) ?? null;
}

export function isCustomCountdownStyle(raw?: string | null): boolean {
    return (raw || '').trim().toLowerCase().startsWith('custom-');
}

export function resolveCustomCountdownPack(): EventCountdownPack {
    return EVENT_COUNTDOWN_PACKS.find((pack) => pack.id === 'custom')!;
}

export function resolveEventCountdownStyleId(pack: EventCountdownPack, raw?: string | null): string {
    const value = (raw || '').trim().toLowerCase();
    if (pack.layouts[value]) {
        return value;
    }
    // Cross-map common legacy / other-occasion ids onto this pack's default family.
    const suffix = value.includes('-') ? value.split('-').pop() : value;
    const prefixed = `${pack.id === 'bridal-shower' ? 'bridal' : pack.id === 'housewarming' ? 'house' : pack.id === 'graduation' ? 'grad' : pack.id}-${suffix}`;
    if (pack.layouts[prefixed]) {
        return prefixed;
    }
    return pack.defaultStyle;
}
