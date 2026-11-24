export const CORPORATE_COUNTDOWN_STYLE_IDS = [
    'boardroomdash',
    'signalrise',
    'keynoteglow',
    'chartorbit',
    'summitstrip',
    'networkpulse',
    'blueprint',
    'teampace',
    'spotlight',
    'afterhours',
] as const;

export type CorporateCountdownStyleId = (typeof CORPORATE_COUNTDOWN_STYLE_IDS)[number];

export type CorporateCountdownStyleOption = {
    id: CorporateCountdownStyleId;
    label: string;
    description: string;
};

/** Ten elevated corporate countdown designs for the editor + live site. */
export const CORPORATE_COUNTDOWN_STYLE_OPTIONS: CorporateCountdownStyleOption[] = [
    {
        id: 'boardroomdash',
        label: 'Boardroom Dash',
        description: 'Presenter & colleague dash closer around a glass chrono strip',
    },
    {
        id: 'signalrise',
        label: 'Signal Rise',
        description: 'Host rises with signal bars as the summit clock ticks',
    },
    {
        id: 'keynoteglow',
        label: 'Keynote Glow',
        description: 'Soft keynote orbs + professionals flank editorial digits',
    },
    {
        id: 'chartorbit',
        label: 'Chart Orbit',
        description: 'Team cartoons orbit a luminous summit clock',
    },
    {
        id: 'summitstrip',
        label: 'Summit Strip',
        description: 'Neon chrono strip with host & colleague runners',
    },
    {
        id: 'networkpulse',
        label: 'Network Pulse',
        description: 'Connection nodes pulse while the duo meets center stage',
    },
    {
        id: 'blueprint',
        label: 'Blueprint',
        description: 'Grid blueprint stage with animated summit characters',
    },
    {
        id: 'teampace',
        label: 'Team Pace',
        description: 'Floating pods with bouncing presenter & host',
    },
    {
        id: 'spotlight',
        label: 'Spotlight',
        description: 'Stage spotlight frames approaching professionals',
    },
    {
        id: 'afterhours',
        label: 'After Hours',
        description: 'Night lobby glow with bright glass digits and sparkles',
    },
];

export const DEFAULT_CORPORATE_COUNTDOWN_STYLE: CorporateCountdownStyleId = 'boardroomdash';

export const CORPORATE_PRESENTER_SRC = '/images/countdown/corporate-presenter-cut.png?v=2';
export const CORPORATE_COLLEAGUE_SRC = '/images/countdown/corporate-colleague-cut.png?v=2';
export const CORPORATE_HOST_SRC = '/images/countdown/corporate-host-cut.png?v=2';

const CROSS_OCCASION_STYLE_MAP: Record<string, CorporateCountdownStyleId> = {
    meetcute: 'boardroomdash',
    balloonlift: 'boardroomdash',
    skyorbit: 'chartorbit',
    giftorbit: 'chartorbit',
    runway: 'summitstrip',
    partystrip: 'summitstrip',
    loftglow: 'keynoteglow',
    candleglow: 'keynoteglow',
    petaldrift: 'blueprint',
    balloonarch: 'blueprint',
    filmstrip: 'signalrise',
    cakebloom: 'signalrise',
    softneon: 'afterhours',
    nightglow: 'afterhours',
    floatpods: 'teampace',
    sparkparade: 'teampace',
    meadowdash: 'spotlight',
    startrail: 'spotlight',
    celebration: 'networkpulse',
    confettistream: 'networkpulse',
};

export function resolveCorporateCountdownStyleId(raw?: string | null): CorporateCountdownStyleId {
    const value = (raw || '').trim().toLowerCase();
    if ((CORPORATE_COUNTDOWN_STYLE_IDS as readonly string[]).includes(value)) {
        return value as CorporateCountdownStyleId;
    }
    if (CROSS_OCCASION_STYLE_MAP[value]) {
        return CROSS_OCCASION_STYLE_MAP[value];
    }

    return DEFAULT_CORPORATE_COUNTDOWN_STYLE;
}

export function isCorporateOccasion(occasion?: string | null): boolean {
    const slug = (occasion || '').toLowerCase().replace(/_/g, '-');
    return slug === 'corporate' || slug.includes('corporate') || slug.includes('summit');
}
