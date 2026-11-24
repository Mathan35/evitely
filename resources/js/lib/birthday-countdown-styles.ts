export const BIRTHDAY_COUNTDOWN_STYLE_IDS = [
    'balloonlift',
    'cakebloom',
    'giftorbit',
    'candleglow',
    'confettistream',
    'partystrip',
    'startrail',
    'balloonarch',
    'sparkparade',
    'nightglow',
] as const;

export type BirthdayCountdownStyleId = (typeof BIRTHDAY_COUNTDOWN_STYLE_IDS)[number];

export type BirthdayCountdownStyleOption = {
    id: BirthdayCountdownStyleId;
    label: string;
    description: string;
};

/** Ten elevated birthday countdown designs for the editor + live site. */
export const BIRTHDAY_COUNTDOWN_STYLE_OPTIONS: BirthdayCountdownStyleOption[] = [
    {
        id: 'balloonlift',
        label: 'Balloon Lift',
        description: 'Balloon friend & cake hero dash closer around a glass chrono strip',
    },
    {
        id: 'cakebloom',
        label: 'Cake Bloom',
        description: 'Celebrant rises with a glowing cake stage as candles flicker',
    },
    {
        id: 'giftorbit',
        label: 'Gift Orbit',
        description: 'Gift & balloon cartoons orbit a luminous birthday clock',
    },
    {
        id: 'candleglow',
        label: 'Candle Glow',
        description: 'Candle flames + party cartoons flank gold editorial digits',
    },
    {
        id: 'confettistream',
        label: 'Confetti Stream',
        description: 'Confetti builds while the duo meets center stage',
    },
    {
        id: 'partystrip',
        label: 'Party Strip',
        description: 'Neon chrono strip with gift & balloon runners',
    },
    {
        id: 'startrail',
        label: 'Star Trail',
        description: 'Stars pull inward while cartoon guests cheer the pods',
    },
    {
        id: 'balloonarch',
        label: 'Balloon Arch',
        description: 'Balloon arch frames animated party characters',
    },
    {
        id: 'sparkparade',
        label: 'Spark Parade',
        description: 'Poppers + bouncing gift & balloon cartoons',
    },
    {
        id: 'nightglow',
        label: 'Night Glow',
        description: 'Night party stage with bright glass digits and sparkles',
    },
];

export const DEFAULT_BIRTHDAY_COUNTDOWN_STYLE: BirthdayCountdownStyleId = 'balloonlift';

/** Unique birthday cartoon cutouts used across elevated timer designs. */
export const BIRTHDAY_CELEBRANT_SRC = '/images/countdown/birthday-celebrant-cut.png?v=2';
export const BIRTHDAY_BALLOON_FRIEND_SRC = '/images/countdown/birthday-balloon-cut.png?v=2';
export const BIRTHDAY_GIFT_FRIEND_SRC = '/images/countdown/birthday-gift-cut.png?v=2';

/** Map wedding (or legacy) style ids → nearest birthday design. */
const CROSS_OCCASION_STYLE_MAP: Record<string, BirthdayCountdownStyleId> = {
    meetcute: 'balloonlift',
    skyorbit: 'giftorbit',
    runway: 'partystrip',
    loftglow: 'candleglow',
    petaldrift: 'balloonarch',
    filmstrip: 'cakebloom',
    softneon: 'nightglow',
    floatpods: 'sparkparade',
    meadowdash: 'startrail',
    celebration: 'confettistream',
};

export function resolveBirthdayCountdownStyleId(raw?: string | null): BirthdayCountdownStyleId {
    const value = (raw || '').trim().toLowerCase();
    if ((BIRTHDAY_COUNTDOWN_STYLE_IDS as readonly string[]).includes(value)) {
        return value as BirthdayCountdownStyleId;
    }
    if (CROSS_OCCASION_STYLE_MAP[value]) {
        return CROSS_OCCASION_STYLE_MAP[value];
    }

    return DEFAULT_BIRTHDAY_COUNTDOWN_STYLE;
}

export function isBirthdayOccasion(occasion?: string | null): boolean {
    const slug = (occasion || '').toLowerCase().replace(/_/g, '-');
    return slug === 'birthday' || slug.includes('birthday');
}
