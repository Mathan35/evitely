import { OccasionCountdownShell } from '@/components/marketing/site-previews/occasion-countdown-engine';
import {
    isCustomCountdownStyle,
    resolveCustomCountdownPack,
    resolveEventCountdownPack,
    resolveEventCountdownStyleId,
    type EventCountdownPack,
} from '@/lib/event-countdown-packs';
import type { CountdownState } from '@/hooks/use-countdown';

export function EventCountdownTimer({
    pack,
    styleId,
    countdown,
    dateLabel,
    year,
    host,
    desktop = false,
    compact = false,
    className,
}: {
    pack: EventCountdownPack;
    styleId?: string | null;
    countdown: CountdownState;
    dateLabel?: string;
    year?: string;
    host?: string | null;
    desktop?: boolean;
    compact?: boolean;
    className?: string;
}) {
    const style = resolveEventCountdownStyleId(pack, styleId);
    const layout = pack.layouts[style] || pack.layouts[pack.defaultStyle] || 'dash';
    const styleChars = pack.styleChars?.[style];
    const theme = styleChars
        ? { ...pack.theme, chars: styleChars }
        : pack.theme;

    return (
        <OccasionCountdownShell
            theme={theme}
            layout={layout}
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

/** Convenience for website previews — resolves pack from occasion slug on live content. */
export function EventCountdownTimerForOccasion({
    occasion,
    styleId,
    countdown,
    dateLabel,
    year,
    host,
    desktop = false,
    compact = false,
    className,
}: {
    occasion?: string | null;
    styleId?: string | null;
    countdown: CountdownState;
    dateLabel?: string;
    year?: string;
    host?: string | null;
    desktop?: boolean;
    compact?: boolean;
    className?: string;
}) {
    // Custom designs can be picked from any event editor — always honor custom-* styles.
    const pack = isCustomCountdownStyle(styleId)
        ? resolveCustomCountdownPack()
        : resolveEventCountdownPack(occasion);
    if (!pack) {
        return null;
    }

    return (
        <EventCountdownTimer
            pack={pack}
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

