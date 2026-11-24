import type { CSSProperties } from 'react';
import { useInvitationCopy } from '@/hooks/use-invitation-copy';
import { COUNTDOWN_BRIDE_SRC, COUNTDOWN_GROOM_SRC } from '@/lib/countdown-timer-styles';
import { cn } from '@/lib/utils';

const CELEBRATE_ICON_SRC = '/images/celebrate-popper.png';

const CONFETTI = ['#c9963a', '#c02040', '#e08a20', '#f0d078', '#6a9b7a', '#d4a574'] as const;

type CountdownCompleteProps = {
    dateLabel?: string | null;
    year?: string | null;
    /** Optional host line under the date. */
    hosts?: string | null;
    /** Show wedding couple cartoons (default true for wedding timer). */
    showCouple?: boolean;
    compact?: boolean;
    desktop?: boolean;
    className?: string;
    style?: CSSProperties;
};

/**
 * Replaces the live countdown once the event time has passed —
 * festive completed state with celebration accents.
 * Couple art stays behind the copy so the date stays readable.
 */
export function CountdownComplete({
    dateLabel,
    year,
    hosts,
    showCouple = true,
    compact = false,
    desktop = false,
    className,
    style,
}: CountdownCompleteProps) {
    const ui = useInvitationCopy();
    const heading = (dateLabel || '').replace(/ 20\d{2}$/, '').trim() || ui.today;

    return (
        <div
            className={cn(
                'countdown-complete relative mx-auto overflow-hidden text-center',
                showCouple && (compact ? 'min-h-[11rem]' : desktop ? 'min-h-[14.5rem]' : 'min-h-[13rem]'),
                className,
            )}
            style={style}
            aria-live="polite"
        >
            <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
                {CONFETTI.map((color, index) => (
                    <span
                        key={color + index}
                        className="countdown-complete-dot absolute"
                        style={{
                            left: `${8 + ((index * 15) % 84)}%`,
                            top: `${10 + ((index * 19) % 70)}%`,
                            background: color,
                            animationDelay: `${index * 0.22}s`,
                        }}
                    />
                ))}
            </div>

            {showCouple ? (
                <div
                    className={cn(
                        'pointer-events-none absolute inset-x-0 bottom-0 z-0 flex items-end justify-between px-1 sm:px-3',
                        compact ? 'h-[7.5rem]' : desktop ? 'h-[11rem]' : 'h-[9.5rem]',
                    )}
                    aria-hidden
                >
                    <div className="countdown-cartoon countdown-complete-glow countdown-complete-couple relative -translate-x-1 opacity-[0.42] sm:opacity-[0.48]">
                        <span className="countdown-spark countdown-spark-a" />
                        <span className="countdown-spark countdown-spark-b" />
                        <img
                            src={COUNTDOWN_GROOM_SRC}
                            alt=""
                            draggable={false}
                            className={cn(
                                'countdown-cartoon-img object-contain object-bottom select-none',
                                compact ? 'h-[6.5rem] w-auto' : desktop ? 'h-[10rem] w-auto' : 'h-[8.5rem] w-auto',
                            )}
                        />
                    </div>
                    <div
                        className="countdown-cartoon countdown-complete-glow countdown-complete-couple relative translate-x-1 opacity-[0.42] sm:opacity-[0.48]"
                        style={{ animationDelay: '0.35s' }}
                    >
                        <span className="countdown-spark countdown-spark-c" />
                        <img
                            src={COUNTDOWN_BRIDE_SRC}
                            alt=""
                            draggable={false}
                            className={cn(
                                'countdown-cartoon-img object-contain object-bottom select-none',
                                compact ? 'h-[6.5rem] w-auto' : desktop ? 'h-[10rem] w-auto' : 'h-[8.5rem] w-auto',
                            )}
                        />
                    </div>
                </div>
            ) : null}

            <div className="relative z-[2] mx-auto flex max-w-lg flex-col items-center px-4 pt-1 pb-2">
                <div
                    className={cn(
                        'countdown-complete-copy w-full rounded-[1.35rem] px-4 py-4 sm:px-6 sm:py-5',
                        'bg-[linear-gradient(180deg,rgba(255,252,247,0.92),rgba(255,250,244,0.78))]',
                        'shadow-[0_18px_40px_-28px_rgba(40,24,12,0.35)] ring-1 ring-[rgba(43,36,28,0.06)] backdrop-blur-[2px]',
                    )}
                >
                    <p className="text-[10px] tracking-[0.34em] text-[#c9963a] uppercase">{ui.celebrated}</p>

                    <div
                        className={cn(
                            'mx-auto mt-3 flex items-center justify-center gap-3',
                            compact ? 'max-w-xs' : 'max-w-md',
                        )}
                    >
                        <img
                            src={CELEBRATE_ICON_SRC}
                            alt=""
                            draggable={false}
                            className={cn(
                                'countdown-complete-popper select-none object-contain drop-shadow-[0_4px_10px_rgba(40,24,12,0.2)]',
                                compact ? 'h-9 w-9' : 'h-11 w-11',
                            )}
                        />
                        <p
                            className={cn(
                                'font-serif leading-tight font-light text-[var(--w-ink,#2b241c)]',
                                compact ? 'text-[1.35rem]' : 'text-[1.7rem] sm:text-[1.85rem]',
                            )}
                        >
                            {heading}
                            {year ? <span className="mt-1 block opacity-80">{year}</span> : null}
                        </p>
                        <img
                            src={CELEBRATE_ICON_SRC}
                            alt=""
                            draggable={false}
                            className={cn(
                                'countdown-complete-popper select-none object-contain drop-shadow-[0_4px_10px_rgba(40,24,12,0.2)] scale-x-[-1]',
                                compact ? 'h-9 w-9' : 'h-11 w-11',
                            )}
                        />
                    </div>

                    {hosts ? (
                        <p className="mt-3 text-[11px] tracking-[0.18em] text-[var(--w-muted,#8a7468)] uppercase">
                            {hosts}
                        </p>
                    ) : null}

                    <p
                        className={cn(
                            'mx-auto max-w-sm text-[var(--w-ink,#2b241c)]/80',
                            compact ? 'mt-3 text-sm' : 'mt-4 text-base',
                        )}
                    >
                        The day is here — thank you for celebrating with us.
                    </p>
                </div>

                {!showCouple ? (
                    <div className={cn('relative mx-auto', compact ? 'mt-4' : 'mt-6')}>
                        <span className="countdown-complete-burst" aria-hidden />
                    </div>
                ) : (
                    <div
                        className={cn('w-full', compact ? 'h-10' : desktop ? 'h-14' : 'h-12')}
                        aria-hidden
                    />
                )}
            </div>
        </div>
    );
}
