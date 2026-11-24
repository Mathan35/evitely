import {
    OccasionCountdownShell,
    type OccasionCountdownTheme,
    type OccasionLayoutId,
} from '@/components/marketing/site-previews/occasion-countdown-engine';
import { EventCountdownTimer } from '@/components/marketing/site-previews/event-countdown-timer';
import {
    BABY_SHOWER_FRIEND_SRC,
    BABY_SHOWER_PARENT_SRC,
    BABY_SHOWER_STORK_SRC,
    resolveBabyShowerCountdownStyleId,
    type BabyShowerCountdownStyleId,
} from '@/lib/baby-shower-countdown-styles';
import { isCustomCountdownStyle, resolveCustomCountdownPack } from '@/lib/event-countdown-packs';
import type { CountdownState } from '@/hooks/use-countdown';

const BABY_SHOWER_THEME: OccasionCountdownTheme = {
    accent: '#d4849a',
    digit: '#b85c74',
    nightDigit: '#ffe4ec',
    rootClass: 'occ-baby',
    chars: {
        a: BABY_SHOWER_PARENT_SRC,
        b: BABY_SHOWER_FRIEND_SRC,
        c: BABY_SHOWER_STORK_SRC,
    },
    confetti: ['#f4a6b8', '#a8d5e5', '#f6d6a8', '#c9b6e4', '#b8e0d2'],
    balloons: ['#f4a6b8', '#a8d5e5', '#f6d6a8', '#c9b6e4', '#b8e0d2', '#a8d5e5', '#f4a6b8'],
    eyebrow: 'Counting down to',
    defaultHeading: 'Baby Shower',
};

const LAYOUT_BY_STYLE: Record<BabyShowerCountdownStyleId, OccasionLayoutId> = {
    nurserdash: 'dash',
    strollrise: 'rise',
    softglow: 'glow',
    showerorbit: 'orbit',
    pastelstrip: 'strip',
    pastelburst: 'burst',
    cloudtrail: 'trail',
    softarch: 'arch',
    rattleparade: 'parade',
    moonlit: 'night',
};

export function BabyShowerCountdownTimer({
    styleId,
    countdown,
    dateLabel,
    year,
    host,
    desktop = false,
    compact = false,
    className,
}: {
    styleId?: string | null;
    countdown: CountdownState;
    dateLabel?: string;
    year?: string;
    host?: string | null;
    desktop?: boolean;
    compact?: boolean;
    className?: string;
}) {
    if (isCustomCountdownStyle(styleId)) {
        return (
            <EventCountdownTimer
                pack={resolveCustomCountdownPack()}
                styleId={styleId}
                countdown={countdown}
                dateLabel={dateLabel}
                year={year}
                host={host}
                desktop={desktop}
                compact={compact}
                className={className}
            />
        );
    }

    const style = resolveBabyShowerCountdownStyleId(styleId);

    return (
        <OccasionCountdownShell
            theme={BABY_SHOWER_THEME}
            layout={LAYOUT_BY_STYLE[style]}
            countdown={countdown}
            dateLabel={dateLabel}
            year={year}
            host={host}
            desktop={desktop}
            compact={compact}
            className={className}
        />
    );
}
