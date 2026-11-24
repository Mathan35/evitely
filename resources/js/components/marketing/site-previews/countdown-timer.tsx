import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CountdownComplete } from '@/components/marketing/site-previews/countdown-complete';
import { EventCountdownTimer } from '@/components/marketing/site-previews/event-countdown-timer';
import {
    COUNTDOWN_BRIDE_SRC,
    COUNTDOWN_GROOM_SRC,
    countdownApproachProgress,
    resolveCountdownTimerStyleId,
    type CountdownTimerStyleId,
} from '@/lib/countdown-timer-styles';
import { isCustomCountdownStyle, resolveCustomCountdownPack } from '@/lib/event-countdown-packs';
import type { CountdownState } from '@/hooks/use-countdown';
import { useInvitationCopy } from '@/hooks/use-invitation-copy';

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

type Unit = { value: string; label: string };

function useUnits(countdown: CountdownState): Unit[] {
    const copy = useInvitationCopy();

    return [
        { value: pad(countdown.days), label: copy.days },
        { value: pad(countdown.hours), label: copy.hours },
        { value: pad(countdown.minutes), label: copy.minutes },
        { value: pad(countdown.seconds), label: copy.seconds },
    ];
}

function useTickFlash(value: number): boolean {
    const prev = useRef(value);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        if (prev.current === value) {
            return;
        }
        prev.current = value;
        setFlash(true);
        const id = window.setTimeout(() => setFlash(false), 360);
        return () => window.clearTimeout(id);
    }, [value]);

    return flash;
}

function CoupleImg({
    side,
    walking,
    className,
    style,
}: {
    side: 'groom' | 'bride';
    walking?: boolean;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <div
            className={cn(
                'countdown-cartoon relative shrink-0 bg-transparent',
                walking && (side === 'groom' ? 'countdown-bob' : 'countdown-bob-delay'),
                className,
            )}
            style={style}
        >
            <img
                src={side === 'groom' ? COUNTDOWN_GROOM_SRC : COUNTDOWN_BRIDE_SRC}
                alt=""
                className="countdown-cartoon-img h-full w-auto object-contain object-bottom select-none"
                draggable={false}
            />
        </div>
    );
}

function ModernDigits({
    units,
    compact,
    flashSeconds,
    tone = 'ink',
    variant = 'strip',
}: {
    units: Unit[];
    compact?: boolean;
    flashSeconds?: boolean;
    tone?: 'ink' | 'light' | 'gold';
    variant?: 'strip' | 'pods' | 'film' | 'neon' | 'editorial';
}) {
    const valueTone =
        tone === 'light' ? 'text-white' : tone === 'gold' ? 'text-[#c9963a]' : 'text-[#7a2e36]';
    const labelTone = tone === 'light' ? 'text-white/55' : 'text-[#9a7a6e]';

    return (
        <div
            className={cn(
                'countdown-digits mx-auto grid w-full max-w-full',
                units.length <= 3 ? 'grid-cols-3' : 'grid-cols-4',
                compact ? 'gap-1.5' : 'gap-2',
                variant === 'strip' && 'countdown-digits-strip px-2.5 py-2',
                variant === 'pods' && 'gap-2',
                variant === 'film' && 'gap-1.5',
                variant === 'neon' && 'countdown-digits-neon px-2.5 py-2',
                variant === 'editorial' && 'gap-2.5',
            )}
        >
            {units.map((unit, index) => (
                <div
                    key={unit.label}
                    className={cn(
                        'relative min-w-0 text-center',
                        variant === 'pods' && 'countdown-pod px-2 py-2',
                        variant === 'film' && 'countdown-film-cell px-2 py-2',
                        flashSeconds && unit.label === 'Seconds' && 'countdown-tick',
                    )}
                >
                    {index > 0 && variant === 'editorial' ? (
                        <span className={cn('absolute top-[0.15em] -left-2.5 opacity-25', valueTone)} aria-hidden>
                            {'\u00B7'}
                        </span>
                    ) : null}
                    <p
                        className={cn(
                            'font-serif leading-none font-semibold tabular-nums tracking-tight',
                            valueTone,
                            compact ? 'text-[0.95rem]' : 'text-[1.2rem]',
                        )}
                    >
                        {unit.value}
                    </p>
                    <p
                        className={cn(
                            'mt-1 tracking-[0.16em] uppercase',
                            labelTone,
                            compact ? 'text-[6px]' : 'text-[7px]',
                        )}
                    >
                        {unit.label}
                    </p>
                </div>
            ))}
        </div>
    );
}

function flankCharClass(compact?: boolean, desktop?: boolean): string {
    // Height-only sizing - width follows the PNG cutout (no square bg frame).
    if (compact) {
        return 'h-[3.85rem] w-auto';
    }
    if (desktop) {
        return 'h-[11rem] w-auto';
    }
    return 'h-[4.85rem] w-auto';
}

/** Smaller cartoons for stages under the digits (runway / meadow / celebration). */
function stageCharClass(compact?: boolean, desktop?: boolean): string {
    if (compact) {
        return 'h-[3.4rem] w-auto';
    }
    if (desktop) {
        return 'h-[6.25rem] w-auto';
    }
    return 'h-[4.4rem] w-auto';
}

function approachShiftPx(progress: number, compact?: boolean, desktop?: boolean, maxDesktop = 10): number {
    // Keep approach motion subtle so cartoons stay clear of digit columns.
    const max = compact ? 2 : desktop ? Math.min(maxDesktop, 10) : 0;
    return Math.round(progress * max);
}

function FlankLayout({
    left,
    right,
    center,
    compact,
    desktop,
    className,
}: {
    left: ReactNode;
    right: ReactNode;
    center: ReactNode;
    compact?: boolean;
    desktop?: boolean;
    className?: string;
}) {
    // Mobile / compact: digits on top, cartoons below AND in front (never tucked under the strip).
    // Desktop: classic three-column flank with cartoons above the digit layer.
    if (!desktop) {
        return (
            <div className={cn('countdown-flank countdown-flank--stack relative mx-auto flex w-full max-w-full flex-col items-center', className)}>
                <div className="countdown-flank__center relative z-[1] w-full max-w-full">{center}</div>
                <div
                    className={cn(
                        'countdown-flank__pair relative z-[3] flex w-full items-end justify-center bg-transparent',
                        compact ? 'mt-4 gap-10' : 'mt-7 gap-14',
                    )}
                >
                    <div className="countdown-flank__side flex shrink-0 justify-center overflow-visible">{left}</div>
                    <div className="countdown-flank__side flex shrink-0 justify-center overflow-visible">{right}</div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'countdown-flank relative mx-auto grid w-full max-w-4xl items-end grid-cols-[minmax(0,7rem)_minmax(0,1fr)_minmax(0,7rem)] gap-5',
                className,
            )}
        >
            <div className="countdown-flank__side relative z-[3] flex min-w-0 max-w-full justify-end overflow-visible">
                {left}
            </div>
            <div className="countdown-flank__center relative z-[1] min-w-0 max-w-full self-center overflow-visible">
                {center}
            </div>
            <div className="countdown-flank__side relative z-[3] flex min-w-0 max-w-full justify-start overflow-visible">
                {right}
            </div>
        </div>
    );
}

function MeetCute({
    countdown,
    compact,
    desktop,
}: {
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const shift = approachShiftPx(progress, compact, desktop, 18);
    const walking = !countdown.past && progress < 0.98;
    const size = flankCharClass(compact, desktop);

    return (
        <FlankLayout
            compact={compact}
            desktop={desktop}
            left={
                <div
                    className="inline-flex w-fit max-w-none items-end justify-center bg-transparent transition-transform duration-1000 ease-out"
                    style={{ transform: `translateX(${shift}px)` }}
                >
                    <CoupleImg side="groom" walking={walking} className={size} />
                </div>
            }
            right={
                <div
                    className="inline-flex w-fit max-w-none items-end justify-center bg-transparent transition-transform duration-1000 ease-out"
                    style={{ transform: `translateX(-${shift}px)` }}
                >
                    <CoupleImg side="bride" walking={walking} className={size} />
                </div>
            }
            center={<ModernDigits units={useUnits(countdown)} compact={compact} flashSeconds={flash} variant="strip" />}
        />
    );
}

function SkyOrbit({
    countdown,
    compact,
    desktop,
}: {
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const angle = progress * 48;

    return (
        <div className={cn('relative mx-auto w-full', compact ? 'max-w-[11rem]' : desktop ? 'max-w-md' : 'max-w-[15rem]')}>
            <div className={cn('countdown-orbit relative mx-auto', compact ? 'h-32 w-32' : desktop ? 'h-60 w-60' : 'h-40 w-40')}>
                <div className="countdown-orbit-ring absolute inset-[8%] rounded-full" />
                <div className="countdown-orbit-ring-soft absolute inset-[18%] rounded-full" />
                <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                        <p className={cn('font-serif font-semibold tabular-nums text-[#7a2e36]', compact ? 'text-3xl' : desktop ? 'text-5xl' : 'text-4xl')}>
                            {pad(countdown.days)}
                        </p>
                        <p className="mt-1 text-[8px] tracking-[0.28em] text-[#9a7a6e] uppercase">Days</p>
                    </div>
                </div>
                <div
                    className="absolute top-1/2 left-1/2"
                    style={{ transform: `rotate(${-140 + angle}deg) translateX(${compact ? 52 : desktop ? 96 : 58}px) rotate(${140 - angle}deg)` }}
                >
                    <CoupleImg side="groom" walking className={compact ? 'h-11 w-auto' : desktop ? 'h-16 w-auto' : 'h-12 w-auto'} />
                </div>
                <div
                    className="absolute top-1/2 left-1/2"
                    style={{ transform: `rotate(${40 - angle}deg) translateX(${compact ? 52 : desktop ? 96 : 58}px) rotate(${-40 + angle}deg)` }}
                >
                    <CoupleImg side="bride" walking className={compact ? 'h-11 w-auto' : desktop ? 'h-16 w-auto' : 'h-12 w-auto'} />
                </div>
            </div>
            <div className={cn(compact ? 'mt-3' : 'mt-6')}>
                <ModernDigits units={useUnits(countdown).slice(1)} compact={compact} flashSeconds={flash} variant="editorial" />
            </div>
        </div>
    );
}

function LoveRunway({
    countdown,
    compact,
    desktop,
}: {
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const shift = Math.round(progress * (compact ? 10 : 22));

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <ModernDigits units={useUnits(countdown)} compact={compact} flashSeconds={flash} variant="editorial" />
            <div
                className={cn(
                    'countdown-runway relative mx-auto overflow-visible',
                    compact ? 'mt-3 h-20' : desktop ? 'mt-5 h-40' : 'mt-4 h-28',
                )}
            >
                <div className="countdown-runway-line absolute inset-x-[8%] top-[62%]" />
                <div
                    className="absolute bottom-0 transition-transform duration-1000 ease-out"
                    style={{ left: `${6 + progress * 12}%`, transform: `translateX(${shift * 0.15}px)` }}
                >
                    <CoupleImg side="groom" walking className={stageCharClass(compact, desktop)} />
                </div>
                <div
                    className="absolute bottom-0 transition-transform duration-1000 ease-out"
                    style={{ right: `${6 + progress * 12}%`, transform: `translateX(-${shift * 0.15}px)` }}
                >
                    <CoupleImg side="bride" walking className={stageCharClass(compact, desktop)} />
                </div>
                <div
                    className="countdown-altar absolute top-[48%] left-1/2 -translate-x-1/2"
                    style={{ opacity: 0.35 + progress * 0.65, transform: `translate(-50%, 0) scale(${0.7 + progress * 0.35})` }}
                />
            </div>
        </div>
    );
}

function LoftGlow({
    countdown,
    compact,
    desktop,
}: {
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const flash = useTickFlash(countdown.seconds);

    return (
        <div className={cn('countdown-loft relative mx-auto', desktop ? 'max-w-3xl overflow-hidden py-4' : compact ? 'max-w-none overflow-visible py-2' : 'max-w-lg overflow-visible py-3')}>
            <span className="countdown-glow-orb absolute top-0 left-[12%] h-24 w-24" />
            <span className="countdown-glow-orb countdown-glow-orb-b absolute right-[10%] bottom-0 h-28 w-28" />
            <FlankLayout
                compact={compact}
                desktop={desktop}
                left={<CoupleImg side="groom" className={flankCharClass(compact, desktop)} />}
                right={<CoupleImg side="bride" className={flankCharClass(compact, desktop)} />}
                center={<ModernDigits units={useUnits(countdown)} compact={compact} flashSeconds={flash} variant="editorial" tone="ink" />}
            />
        </div>
    );
}

function PetalDrift({
    countdown,
    compact,
    desktop,
}: {
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const lift = Math.round(progress * (compact ? 6 : 14));

    return (
        <div className={cn('countdown-petal-stage relative mx-auto overflow-visible', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            {Array.from({ length: compact ? 5 : 9 }).map((_, index) => (
                <span
                    key={index}
                    className="countdown-petal-dot absolute rounded-full"
                    style={{
                        left: `${8 + ((index * 11) % 84)}%`,
                        animationDelay: `${index * 0.4}s`,
                        animationDuration: `${4.8 + (index % 3)}s`,
                        background: index % 2 === 0 ? '#e08a20' : '#c02040',
                        width: 5 + (index % 3),
                        height: 7 + (index % 3),
                    }}
                />
            ))}
            <div className="relative z-[1]">
                <ModernDigits units={useUnits(countdown)} compact={compact} flashSeconds={flash} variant="strip" />
            </div>
            <div
                className={cn(
                    'relative z-[3] mx-auto flex items-end justify-center gap-8 overflow-visible',
                    compact ? 'mt-3 h-16' : desktop ? 'mt-5 h-36' : 'mt-5 h-24',
                )}
            >
                <div style={{ transform: `translateY(-${Math.min(lift, compact ? 4 : 8)}px)` }} className="transition-transform duration-1000 ease-out">
                    <CoupleImg side="groom" walking className={stageCharClass(compact, desktop)} />
                </div>
                <div style={{ transform: `translateY(-${Math.min(lift, compact ? 4 : 8)}px)` }} className="transition-transform duration-1000 ease-out">
                    <CoupleImg side="bride" walking className={stageCharClass(compact, desktop)} />
                </div>
            </div>
        </div>
    );
}

function FilmStrip({
    countdown,
    compact,
    desktop,
}: {
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const flash = useTickFlash(countdown.seconds);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <div className={cn('countdown-film-rail px-1.5 py-1.5 sm:px-2 sm:py-2')}>
                <FlankLayout
                    compact={compact}
                    desktop={desktop}
                    left={<CoupleImg side="groom" className={flankCharClass(compact, desktop)} />}
                    right={<CoupleImg side="bride" className={flankCharClass(compact, desktop)} />}
                    center={<ModernDigits units={useUnits(countdown)} compact={compact} flashSeconds={flash} variant="film" />}
                />
            </div>
        </div>
    );
}

function SoftNeon({
    countdown,
    compact,
    desktop,
}: {
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const shift = approachShiftPx(progress, compact, desktop, 14);
    const size = flankCharClass(compact, desktop);

    return (
        <div className={cn('countdown-neon-stage relative mx-auto', compact ? 'max-w-none overflow-visible py-2' : desktop ? 'max-w-3xl overflow-hidden py-3' : 'max-w-lg overflow-visible py-3')}>
            <FlankLayout
                compact={compact}
                desktop={desktop}
                left={
                    <div style={{ transform: `translateX(${shift}px)` }} className="countdown-neon-trail w-full max-w-full transition-transform duration-1000">
                        <CoupleImg side="groom" walking className={size} />
                    </div>
                }
                right={
                    <div style={{ transform: `translateX(-${shift}px)` }} className="countdown-neon-trail w-full max-w-full transition-transform duration-1000">
                        <CoupleImg side="bride" walking className={size} />
                    </div>
                }
                center={<ModernDigits units={useUnits(countdown)} compact={compact} flashSeconds={flash} variant="neon" tone="gold" />}
            />
        </div>
    );
}

function FloatPods({
    countdown,
    compact,
    desktop,
}: {
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const flash = useTickFlash(countdown.seconds);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <ModernDigits units={useUnits(countdown)} compact={compact} flashSeconds={flash} variant="pods" />
            <div className={cn('mx-auto flex items-end justify-center gap-10', compact ? 'mt-2' : desktop ? 'mt-5' : 'mt-3')}>
                <CoupleImg side="groom" walking className={stageCharClass(compact, desktop)} />
                <CoupleImg side="bride" walking className={stageCharClass(compact, desktop)} />
            </div>
        </div>
    );
}

function MeadowDash({
    countdown,
    compact,
    desktop,
}: {
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <ModernDigits units={useUnits(countdown)} compact={compact} flashSeconds={flash} variant="strip" />
            <div
                className={cn(
                    'countdown-meadow relative overflow-visible',
                    compact ? 'mt-3 h-[4.75rem]' : desktop ? 'mt-5 h-40' : 'mt-4 h-28',
                )}
            >
                <div className="countdown-meadow-ground absolute inset-x-0 bottom-0 h-[42%]" />
                <div
                    className="absolute bottom-[8%] transition-[left] duration-1000 ease-out"
                    style={{ left: `${4 + progress * 28}%` }}
                >
                    <CoupleImg side="groom" walking className={stageCharClass(compact, desktop)} />
                </div>
                <div
                    className="absolute right-auto bottom-[8%] transition-[right] duration-1000 ease-out"
                    style={{ right: `${4 + progress * 28}%` }}
                >
                    <CoupleImg side="bride" walking className={stageCharClass(compact, desktop)} />
                </div>
                <div
                    className="countdown-meadow-altar absolute bottom-[38%] left-1/2 -translate-x-1/2"
                    style={{ opacity: 0.25 + progress * 0.75 }}
                />
            </div>
        </div>
    );
}

function Celebration({
    countdown,
    compact,
    desktop,
}: {
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const shift = approachShiftPx(1 - progress, compact, desktop, 36);

    return (
        <div className={cn('countdown-celeb relative mx-auto overflow-visible', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            {Array.from({ length: Math.max(4, Math.round(progress * 14)) }).map((_, index) => (
                <span
                    key={index}
                    className="countdown-confetti absolute"
                    style={{
                        left: `${6 + ((index * 17) % 88)}%`,
                        top: `${8 + ((index * 23) % 60)}%`,
                        background: ['#c9963a', '#c02040', '#e08a20', '#f0d078'][index % 4],
                        animationDelay: `${index * 0.18}s`,
                    }}
                />
            ))}
            <div className="relative z-[1]">
                <ModernDigits units={useUnits(countdown)} compact={compact} flashSeconds={flash} variant="strip" />
            </div>
            <div
                className={cn(
                    'relative z-[3] flex items-end justify-center overflow-visible',
                    compact ? 'mt-3 h-16' : desktop ? 'mt-5 h-36' : 'mt-5 h-24',
                )}
            >
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                    <CoupleImg side="groom" walking={!countdown.past} className={stageCharClass(compact, desktop)} />
                </div>
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                    <CoupleImg side="bride" walking={!countdown.past} className={stageCharClass(compact, desktop)} />
                </div>
            </div>
        </div>
    );
}

export function CountdownTimer({
    styleId,
    countdown,
    dateLabel,
    year,
    desktop = false,
    compact = false,
    className,
}: {
    styleId?: string | null;
    countdown: CountdownState;
    dateLabel?: string;
    year?: string;
    groom?: string;
    bride?: string;
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
                desktop={desktop}
                compact={compact}
                className={className}
            />
        );
    }

    const style = resolveCountdownTimerStyleId(styleId);
    const heading = dateLabel?.replace(/ 20\d{2}$/, '') || 'Our day';

    if (countdown.ready && countdown.past) {
        return (
            <CountdownComplete
                dateLabel={dateLabel}
                year={year}
                showCouple
                compact={compact}
                desktop={desktop}
                className={className}
            />
        );
    }

    const body: ReactNode = (() => {
        switch (style) {
            case 'skyorbit':
                return <SkyOrbit countdown={countdown} compact={compact} desktop={desktop} />;
            case 'runway':
                return <LoveRunway countdown={countdown} compact={compact} desktop={desktop} />;
            case 'loftglow':
                return <LoftGlow countdown={countdown} compact={compact} desktop={desktop} />;
            case 'petaldrift':
                return <PetalDrift countdown={countdown} compact={compact} desktop={desktop} />;
            case 'filmstrip':
                return <FilmStrip countdown={countdown} compact={compact} desktop={desktop} />;
            case 'softneon':
                return <SoftNeon countdown={countdown} compact={compact} desktop={desktop} />;
            case 'floatpods':
                return <FloatPods countdown={countdown} compact={compact} desktop={desktop} />;
            case 'meadowdash':
                return <MeadowDash countdown={countdown} compact={compact} desktop={desktop} />;
            case 'celebration':
                return <Celebration countdown={countdown} compact={compact} desktop={desktop} />;
            case 'meetcute':
            default:
                return <MeetCute countdown={countdown} compact={compact} desktop={desktop} />;
        }
    })();

    return (
        <div className={cn('countdown-timer-root w-full max-w-full overflow-x-clip text-center', className)}>
            {!compact ? (
                <>
                    <p className="text-[10px] tracking-[0.34em] text-[#c9963a] uppercase">Counting down to</p>
                    <p className="mt-3 font-serif text-[1.45rem] leading-tight font-light text-[var(--w-ink,#2b241c)] sm:text-[1.7rem] md:text-[1.85rem]">
                        {heading}
                        {year ? <span className="mt-1 block opacity-80">{year}</span> : null}
                    </p>
                </>
            ) : null}
            <div className={cn('w-full max-w-full', compact ? 'mt-0' : 'mt-6 sm:mt-8')}>{body}</div>
        </div>
    );
}

export type { CountdownTimerStyleId };
