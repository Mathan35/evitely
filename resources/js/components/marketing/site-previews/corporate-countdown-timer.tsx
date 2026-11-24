import {
    OccasionCountdownShell,
    type OccasionCountdownTheme,
    type OccasionLayoutId,
} from '@/components/marketing/site-previews/occasion-countdown-engine';
import { EventCountdownTimer } from '@/components/marketing/site-previews/event-countdown-timer';
import {
    CORPORATE_COLLEAGUE_SRC,
    CORPORATE_HOST_SRC,
    CORPORATE_PRESENTER_SRC,
    resolveCorporateCountdownStyleId,
    type CorporateCountdownStyleId,
} from '@/lib/corporate-countdown-styles';
import { isCustomCountdownStyle, resolveCustomCountdownPack } from '@/lib/event-countdown-packs';
import type { CountdownState } from '@/hooks/use-countdown';

const CORPORATE_THEME: OccasionCountdownTheme = {
    accent: '#1f6f8b',
    digit: '#1a4d63',
    nightDigit: '#c8e7ff',
    rootClass: 'occ-corporate',
    chars: {
        a: CORPORATE_PRESENTER_SRC,
        b: CORPORATE_COLLEAGUE_SRC,
        c: CORPORATE_HOST_SRC,
    },
    confetti: ['#1f6f8b', '#2ec4b6', '#ffb703', '#457b9d', '#e9c46a'],
    balloons: ['#1f6f8b', '#2ec4b6', '#457b9d', '#ffb703', '#2ec4b6', '#1f6f8b', '#457b9d'],
    eyebrow: 'Counting down to',
    defaultHeading: 'The Summit',
};

const LAYOUT_BY_STYLE: Record<CorporateCountdownStyleId, OccasionLayoutId> = {
    boardroomdash: 'dash',
    signalrise: 'rise',
    keynoteglow: 'glow',
    chartorbit: 'orbit',
    summitstrip: 'strip',
    networkpulse: 'burst',
    blueprint: 'arch',
    teampace: 'parade',
    spotlight: 'trail',
    afterhours: 'night',
};

export function CorporateCountdownTimer({
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

    const style = resolveCorporateCountdownStyleId(styleId);

    return (
        <OccasionCountdownShell
            theme={CORPORATE_THEME}
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
