export const BABY_SHOWER_COUNTDOWN_STYLE_IDS = [
    'nurserdash',
    'strollrise',
    'softglow',
    'showerorbit',
    'pastelstrip',
    'pastelburst',
    'cloudtrail',
    'softarch',
    'rattleparade',
    'moonlit',
] as const;

export type BabyShowerCountdownStyleId = (typeof BABY_SHOWER_COUNTDOWN_STYLE_IDS)[number];

export type BabyShowerCountdownStyleOption = {
    id: BabyShowerCountdownStyleId;
    label: string;
    description: string;
};

/** Ten elevated baby-shower countdown designs for the editor + live site. */
export const BABY_SHOWER_COUNTDOWN_STYLE_OPTIONS: BabyShowerCountdownStyleOption[] = [
    {
        id: 'nurserdash',
        label: 'Nursery Dash',
        description: 'Parent & friend dash closer around a soft glass chrono strip',
    },
    {
        id: 'strollrise',
        label: 'Stroll Rise',
        description: 'Stork rises with pastel clouds as the day nears',
    },
    {
        id: 'softglow',
        label: 'Soft Glow',
        description: 'Candle-soft light + shower cartoons flank blush digits',
    },
    {
        id: 'showerorbit',
        label: 'Gift Orbit',
        description: 'Parent & stork orbit a luminous baby-shower clock',
    },
    {
        id: 'pastelstrip',
        label: 'Pastel Strip',
        description: 'Pastel neon strip with balloon friend & parent runners',
    },
    {
        id: 'pastelburst',
        label: 'Pastel Burst',
        description: 'Pastel confetti builds while the duo meets center stage',
    },
    {
        id: 'cloudtrail',
        label: 'Cloud Trail',
        description: 'Clouds drift inward while cartoons cheer floating pods',
    },
    {
        id: 'softarch',
        label: 'Balloon Arch',
        description: 'Pastel balloon arch frames animated shower characters',
    },
    {
        id: 'rattleparade',
        label: 'Rattle Parade',
        description: 'Poppers + bouncing parent, friend & stork cameos',
    },
    {
        id: 'moonlit',
        label: 'Moonlit',
        description: 'Soft night nursery glow with bright glass digits',
    },
];

export const DEFAULT_BABY_SHOWER_COUNTDOWN_STYLE: BabyShowerCountdownStyleId = 'nurserdash';

export const BABY_SHOWER_PARENT_SRC = '/images/countdown/babyshower-parent-cut.png?v=2';
export const BABY_SHOWER_FRIEND_SRC = '/images/countdown/babyshower-friend-cut.png?v=2';
export const BABY_SHOWER_STORK_SRC = '/images/countdown/babyshower-stork-cut.png?v=2';

const CROSS_OCCASION_STYLE_MAP: Record<string, BabyShowerCountdownStyleId> = {
    meetcute: 'nurserdash',
    balloonlift: 'nurserdash',
    boardroomdash: 'nurserdash',
    skyorbit: 'showerorbit',
    giftorbit: 'showerorbit',
    chartorbit: 'showerorbit',
    runway: 'pastelstrip',
    partystrip: 'pastelstrip',
    summitstrip: 'pastelstrip',
    loftglow: 'softglow',
    candleglow: 'softglow',
    keynoteglow: 'softglow',
    petaldrift: 'softarch',
    balloonarch: 'softarch',
    blueprint: 'softarch',
    filmstrip: 'strollrise',
    cakebloom: 'strollrise',
    signalrise: 'strollrise',
    softneon: 'moonlit',
    nightglow: 'moonlit',
    afterhours: 'moonlit',
    floatpods: 'rattleparade',
    sparkparade: 'rattleparade',
    teampace: 'rattleparade',
    meadowdash: 'cloudtrail',
    startrail: 'cloudtrail',
    spotlight: 'cloudtrail',
    celebration: 'pastelburst',
    confettistream: 'pastelburst',
    networkpulse: 'pastelburst',
};

export function resolveBabyShowerCountdownStyleId(raw?: string | null): BabyShowerCountdownStyleId {
    const value = (raw || '').trim().toLowerCase();
    if ((BABY_SHOWER_COUNTDOWN_STYLE_IDS as readonly string[]).includes(value)) {
        return value as BabyShowerCountdownStyleId;
    }
    if (CROSS_OCCASION_STYLE_MAP[value]) {
        return CROSS_OCCASION_STYLE_MAP[value];
    }

    return DEFAULT_BABY_SHOWER_COUNTDOWN_STYLE;
}

export function isBabyShowerOccasion(occasion?: string | null): boolean {
    const slug = (occasion || '').toLowerCase().replace(/_/g, '-');
    return slug === 'baby-shower' || slug.includes('baby-shower') || slug.includes('babyshower');
}
