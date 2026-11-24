export const COUNTDOWN_TIMER_STYLE_IDS = [
    'meetcute',
    'skyorbit',
    'runway',
    'loftglow',
    'petaldrift',
    'filmstrip',
    'softneon',
    'floatpods',
    'meadowdash',
    'celebration',
] as const;

export type CountdownTimerStyleId = (typeof COUNTDOWN_TIMER_STYLE_IDS)[number];

export type CountdownTimerStyleOption = {
    id: CountdownTimerStyleId;
    label: string;
    description: string;
};

/** Ten modern 2026 cartoon countdown designs for wedding sites. */
export const COUNTDOWN_TIMER_STYLE_OPTIONS: CountdownTimerStyleOption[] = [
    {
        id: 'meetcute',
        label: 'Meet Cute',
        description: 'Couple dashes closer around a glass chrono strip',
    },
    {
        id: 'skyorbit',
        label: 'Sky Orbit',
        description: 'Couple orbits a glowing day ring in soft motion',
    },
    {
        id: 'runway',
        label: 'Love Runway',
        description: 'A sleek aisle path with floating time chips',
    },
    {
        id: 'loftglow',
        label: 'Loft Glow',
        description: 'Ambient light orbs and editorial type with cartoons',
    },
    {
        id: 'petaldrift',
        label: 'Petal Drift',
        description: 'Petals lift as the couple rises toward the day',
    },
    {
        id: 'filmstrip',
        label: 'Film Strip',
        description: 'Cinematic frames tick with cartoon cameos',
    },
    {
        id: 'softneon',
        label: 'Soft Neon',
        description: 'Champagne neon trails follow the running couple',
    },
    {
        id: 'floatpods',
        label: 'Float Pods',
        description: 'Hovering time pods above a bouncing duo',
    },
    {
        id: 'meadowdash',
        label: 'Meadow Dash',
        description: 'A meadow path closes as they race to the altar',
    },
    {
        id: 'celebration',
        label: 'Celebration',
        description: 'Confetti builds while the couple meets center stage',
    },
];

export const DEFAULT_COUNTDOWN_TIMER_STYLE: CountdownTimerStyleId = 'meetcute';

/** Days of remaining time that map to “fully apart” for approach-style designs. */
export const COUNTDOWN_APPROACH_HORIZON_DAYS = 100;

export const COUNTDOWN_GROOM_SRC = '/images/countdown/groom-cut.png?v=4';
export const COUNTDOWN_BRIDE_SRC = '/images/countdown/bride-cut.png?v=4';

/** Older saved style ids → nearest new design. */
const LEGACY_TIMER_STYLE_MAP: Record<string, CountdownTimerStyleId> = {
    together: 'meetcute',
    classic: 'floatpods',
    vowring: 'skyorbit',
    heartbeat: 'loftglow',
    ribbon: 'petaldrift',
    constellation: 'softneon',
};

export function resolveCountdownTimerStyleId(raw?: string | null): CountdownTimerStyleId {
    const value = (raw || '').trim().toLowerCase();
    if ((COUNTDOWN_TIMER_STYLE_IDS as readonly string[]).includes(value)) {
        return value as CountdownTimerStyleId;
    }
    if (LEGACY_TIMER_STYLE_MAP[value]) {
        return LEGACY_TIMER_STYLE_MAP[value];
    }

    return DEFAULT_COUNTDOWN_TIMER_STYLE;
}

/** 0 = far apart / open, 1 = together / complete (or past). */
export function countdownApproachProgress(remainingMs: number, past: boolean): number {
    if (past) {
        return 1;
    }

    const horizon = COUNTDOWN_APPROACH_HORIZON_DAYS * 86_400_000;
    return 1 - Math.min(1, Math.max(0, remainingMs) / horizon);
}
