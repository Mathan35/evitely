import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CountdownComplete } from '@/components/marketing/site-previews/countdown-complete';
import { countdownApproachProgress } from '@/lib/countdown-timer-styles';
import type { CountdownState } from '@/hooks/use-countdown';
import { cn } from '@/lib/utils';

const POPPER_SRC = '/images/celebrate-popper.png';

export type OccasionCharRole = 'a' | 'b' | 'c';

export type OccasionCountdownTheme = {
    /** Accent label color above the heading. */
    accent: string;
    /** Digit value color for default/party tone. */
    digit: string;
    /** Night digit color. */
    nightDigit: string;
    /** CSS theme class root (corp / baby). */
    rootClass: string;
    /** Character image map. */
    chars: Record<OccasionCharRole, string>;
    /** Confetti / accent palette. */
    confetti: string[];
    /** Balloon colors for arch styles. */
    balloons: string[];
    eyebrow?: string;
    defaultHeading?: string;
};

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

type Unit = { value: string; label: string };

function unitsOf(countdown: CountdownState): Unit[] {
    return [
        { value: pad(countdown.days), label: 'Days' },
        { value: pad(countdown.hours), label: 'Hours' },
        { value: pad(countdown.minutes), label: 'Minutes' },
        { value: pad(countdown.seconds), label: 'Seconds' },
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

function Char({
    theme,
    role,
    walking = true,
    flip,
    className,
    style,
}: {
    theme: OccasionCountdownTheme;
    role: OccasionCharRole;
    walking?: boolean;
    flip?: boolean;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <div
            className={cn(
                'occ-cartoon relative shrink-0 bg-transparent',
                walking && (role === 'a' ? 'bday-walk' : role === 'b' ? 'bday-walk-delay' : 'bday-walk-gift'),
                className,
            )}
            style={style}
        >
            <img
                src={theme.chars[role]}
                alt=""
                draggable={false}
                className={cn(
                    'bday-cartoon-img relative z-[1] h-full w-auto object-contain object-bottom select-none',
                    flip && 'scale-x-[-1]',
                )}
            />
        </div>
    );
}

function Digits({
    theme,
    units,
    compact,
    flashSeconds,
    tone = 'party',
    variant = 'strip',
}: {
    theme: OccasionCountdownTheme;
    units: Unit[];
    compact?: boolean;
    flashSeconds?: boolean;
    tone?: 'party' | 'light' | 'gold' | 'night';
    variant?: 'strip' | 'pods' | 'neon' | 'editorial' | 'cake' | 'night';
}) {
    const valueTone =
        tone === 'light'
            ? 'text-white'
            : tone === 'gold'
              ? 'text-[#c9963a]'
              : tone === 'night'
                ? undefined
                : undefined;
    const valueStyle: CSSProperties | undefined =
        tone === 'night'
            ? { color: theme.nightDigit }
            : tone === 'party'
              ? { color: theme.digit }
              : undefined;
    const labelTone =
        tone === 'light' ? 'text-white/60' : tone === 'night' ? 'text-white/65' : 'text-[#9a7a6e]';

    return (
        <div
            className={cn(
                'countdown-digits mx-auto grid w-full max-w-full',
                units.length <= 3 ? 'grid-cols-3' : 'grid-cols-4',
                compact ? 'gap-1.5' : 'gap-2',
                variant === 'strip' && cn('occ-digits-strip px-2.5 py-2', theme.rootClass),
                variant === 'pods' && 'gap-2',
                variant === 'neon' && cn('occ-digits-neon px-2.5 py-2', theme.rootClass),
                variant === 'night' && 'bday-digits-night px-2.5 py-2.5',
                variant === 'editorial' && 'gap-2.5',
                variant === 'cake' && cn('occ-digits-stage px-2.5 py-2', theme.rootClass),
            )}
        >
            {units.map((unit, index) => (
                <div
                    key={unit.label}
                    className={cn(
                        'relative min-w-0 text-center',
                        variant === 'pods' && cn('occ-pod px-2 py-2', theme.rootClass),
                        flashSeconds && unit.label === 'Seconds' && 'countdown-tick',
                    )}
                >
                    {index > 0 && variant === 'editorial' ? (
                        <span
                            className={cn('absolute top-[0.15em] -left-2.5 opacity-25', valueTone)}
                            style={valueStyle}
                            aria-hidden
                        >
                            ·
                        </span>
                    ) : null}
                    <p
                        className={cn(
                            'font-serif leading-none font-semibold tabular-nums tracking-tight',
                            valueTone,
                            compact ? 'text-[0.95rem]' : 'text-[1.2rem]',
                        )}
                        style={valueStyle}
                    >
                        {unit.value}
                    </p>
                    <p
                        className={cn(
                            'mt-1.5 tracking-[0.2em] uppercase',
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

function Flank({
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
            <div className="countdown-flank__side relative z-[3] flex min-w-0 max-w-full justify-end overflow-visible">{left}</div>
            <div className="countdown-flank__center relative z-[1] min-w-0 max-w-full self-center overflow-visible">{center}</div>
            <div className="countdown-flank__side relative z-[3] flex min-w-0 max-w-full justify-start overflow-visible">{right}</div>
        </div>
    );
}

function charSize(compact?: boolean, desktop?: boolean): string {
    // Height-only — width follows the PNG cutout (no square bg frame).
    if (compact) {
        return 'h-[3.85rem] w-auto';
    }
    if (desktop) {
        return 'h-[11rem] w-auto';
    }
    return 'h-[4.85rem] w-auto';
}

function approachShift(progress: number, compact?: boolean, desktop?: boolean, maxDesktop = 10): number {
    const max = compact ? 2 : desktop ? Math.min(maxDesktop, 10) : 0;
    return Math.round(progress * max);
}

/** Shared layout presets used by corporate + baby-shower elevated timers. */
export type OccasionLayoutId =
    | 'dash'
    | 'rise'
    | 'glow'
    | 'orbit'
    | 'strip'
    | 'burst'
    | 'trail'
    | 'arch'
    | 'parade'
    | 'night'
    | 'helix'
    | 'cascade'
    | 'mirror'
    | 'frame'
    | 'mosaic'
    | 'ribbon'
    | 'pulse'
    | 'horizon'
    | 'portal'
    | 'lantern'
    | 'ticker'
    | 'constellation';

function LayoutDash({
    theme,
    countdown,
    compact,
    desktop,
    leftRole = 'b',
    rightRole = 'a',
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
    leftRole?: OccasionCharRole;
    rightRole?: OccasionCharRole;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const shift = approachShift(progress, compact, desktop, 22);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <Flank
            compact={compact}
            desktop={desktop}
            left={
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                    <Char theme={theme} role={leftRole} walking={walking} className={size} />
                </div>
            }
            right={
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                    <Char theme={theme} role={rightRole} walking={walking} className={size} />
                </div>
            }
            center={<Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="strip" />}
        />
    );
}

function LayoutRise({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const rise = Math.round(progress * (compact ? 6 : 14));
    const walking = !countdown.past;

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <div className={cn('occ-stage relative mx-auto mb-2', theme.rootClass)} style={{ ['--occ-progress' as string]: String(progress) }}>
                <div className="occ-stage-tier occ-stage-tier-top" />
                <div className="occ-stage-tier occ-stage-tier-mid" />
                <div className="occ-stage-tier occ-stage-tier-base" />
            </div>
            <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="cake" />
            <div className={cn('relative z-[3] flex items-end justify-center', compact ? 'mt-3 h-16' : 'mt-5 h-24')}>
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateY(-${rise}px)` }}>
                    <Char
                        theme={theme}
                        role="c"
                        walking={walking}
                        className={charSize(compact, desktop)}
                    />
                </div>
            </div>
        </div>
    );
}

function LayoutGlow({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const shift = approachShift(progress, compact, desktop, 18);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <Flank
            compact={compact}
            desktop={desktop}
            left={
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                    <Char theme={theme} role="a" walking={walking} className={size} />
                </div>
            }
            right={
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                    <Char theme={theme} role="c" walking={walking} className={size} />
                </div>
            }
            center={<Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="editorial" tone="gold" />}
        />
    );
}

function LayoutOrbit({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const spin = progress * 140;
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <div
                className={cn(
                    'relative mx-auto w-full',
                    compact ? 'h-[9rem] max-w-[11rem]' : desktop ? 'h-[15rem] max-w-md' : 'h-[10rem] max-w-[14rem]',
                )}
            >
                <div className={cn('bday-orbit-ring absolute inset-[10%] rounded-full', theme.rootClass)} style={{ transform: `rotate(${spin}deg)` }} />
                <div className="bday-orbit-ring-soft absolute inset-[20%] rounded-full" style={{ transform: `rotate(${-spin * 0.55}deg)` }} />
                <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                        <p
                            className={cn('font-serif font-semibold tabular-nums', compact ? 'text-3xl' : desktop ? 'text-5xl' : 'text-4xl')}
                            style={{ color: theme.digit }}
                        >
                            {unitsOf(countdown)[0]?.value}
                        </p>
                        <p className="mt-1 text-[8px] tracking-[0.28em] text-[#9a7a6e] uppercase">Days</p>
                    </div>
                </div>
            </div>
            <div className={cn(compact ? 'mt-2' : 'mt-3')}>
                <Digits theme={theme} units={unitsOf(countdown).slice(1)} compact={compact} flashSeconds={flash} variant="pods" />
            </div>
            <div className={cn('relative z-[3] mx-auto flex items-end justify-center', compact ? 'mt-3 gap-8' : 'mt-5 gap-12')}>
                <Char theme={theme} role="c" walking={walking} className={size} />
                <Char theme={theme} role="b" walking={walking} flip className={size} />
            </div>
        </div>
    );
}

function LayoutStrip({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const shift = approachShift(progress, compact, desktop, 16);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <Flank
            compact={compact}
            desktop={desktop}
            left={
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                    <Char theme={theme} role="c" walking={walking} className={size} />
                </div>
            }
            right={
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                    <Char theme={theme} role="b" walking={walking} flip className={size} />
                </div>
            }
            center={
                <div className="relative">
                    <div className={cn('bday-ribbon absolute inset-x-[-8%] top-1/2 h-px -translate-y-1/2', theme.rootClass)} aria-hidden />
                    <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="neon" />
                </div>
            }
        />
    );
}

function LayoutBurst({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const count = Math.max(6, Math.round(progress * 18));
    const shift = approachShift(1 - progress, compact, desktop, 28);
    const walking = !countdown.past;

    return (
        <div className={cn('bday-confetti-stage relative mx-auto overflow-hidden', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            {Array.from({ length: count }).map((_, index) => (
                <span
                    key={index}
                    className="bday-confetti absolute"
                    style={{
                        left: `${5 + ((index * 17) % 90)}%`,
                        top: `${5 + ((index * 23) % 72)}%`,
                        background: theme.confetti[index % theme.confetti.length],
                        animationDelay: `${index * 0.12}s`,
                    }}
                />
            ))}
            <div className="relative z-[1]">
                <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="strip" />
            </div>
            <div className={cn('relative z-[3] flex items-end justify-center', compact ? 'mt-3 h-16' : 'mt-5 h-24')}>
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                    <Char theme={theme} role="b" walking={walking} className={compact ? 'h-14 w-auto' : 'h-[5.8rem] w-auto'} />
                </div>
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                    <Char theme={theme} role="a" walking={walking} className={compact ? 'h-14 w-auto' : 'h-[5.8rem] w-auto'} />
                </div>
            </div>
        </div>
    );
}

function LayoutTrail({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const pull = approachShift(1 - progress, compact, desktop, 20);
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                {Array.from({ length: 10 }).map((_, index) => (
                    <span
                        key={index}
                        className="bday-star absolute"
                        style={{
                            left: `${8 + index * 9}%`,
                            top: `${10 + ((index * 17) % 65)}%`,
                            background: theme.confetti[index % theme.confetti.length],
                            transform: `translateX(${index % 2 === 0 ? pull : -pull}px)`,
                            animationDelay: `${index * 0.1}s`,
                        }}
                    />
                ))}
            </div>
            <Flank
                compact={compact}
                desktop={desktop}
                left={<Char theme={theme} role="a" walking={walking} className={size} />}
                right={<Char theme={theme} role="c" walking={walking} className={size} />}
                center={<Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="pods" />}
            />
        </div>
    );
}

function LayoutArch({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const shift = approachShift(progress, compact, desktop, 18);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none pt-7' : desktop ? 'max-w-3xl pt-11' : 'max-w-lg pt-9')}>
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center gap-1 sm:gap-1.5" aria-hidden>
                {theme.balloons.map((color, index) => (
                    <span
                        key={`${color}-${index}`}
                        className={cn('bday-balloon', index % 2 === 0 ? 'bday-bob' : 'bday-bob-delay', compact && 'scale-75')}
                        style={{
                            ['--bday-balloon' as string]: color,
                            marginTop: `${Math.abs(3 - index) * (compact ? 3 : 7)}px`,
                        }}
                    >
                        <span className="bday-balloon-knot" />
                        <span className="bday-balloon-string" />
                    </span>
                ))}
            </div>
            <Flank
                compact={compact}
                desktop={desktop}
                left={
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                        <Char theme={theme} role="b" walking={walking} className={size} />
                    </div>
                }
                right={
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                        <Char theme={theme} role="a" walking={walking} className={size} />
                    </div>
                }
                center={<Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="strip" />}
            />
        </div>
    );
}

function LayoutParade({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const bounce = Math.round(progress * (compact ? 4 : 10));
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <Flank
            compact={compact}
            desktop={desktop}
            left={
                <div className="flex flex-col items-end gap-1">
                    <img src={POPPER_SRC} alt="" draggable={false} className={cn('bday-popper object-contain', compact ? 'h-7 w-7' : 'h-10 w-10')} />
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateY(-${bounce}px)` }}>
                        <Char theme={theme} role="c" walking={walking} className={size} />
                    </div>
                </div>
            }
            right={
                <div className="flex flex-col items-start gap-1">
                    <img
                        src={POPPER_SRC}
                        alt=""
                        draggable={false}
                        className={cn('bday-popper scale-x-[-1] object-contain', compact ? 'h-7 w-7' : 'h-10 w-10')}
                    />
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateY(-${bounce}px)` }}>
                        <Char theme={theme} role="b" walking={walking} flip className={size} />
                    </div>
                </div>
            }
            center={<Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="pods" />}
        />
    );
}

function LayoutNight({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const shift = approachShift(progress, compact, desktop, 18);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <div
            className={cn(
                'bday-night relative mx-auto overflow-hidden rounded-[1.5rem] px-2.5 py-4 sm:px-4 sm:py-5',
                theme.rootClass,
                compact ? 'max-w-none' : desktop ? 'max-w-4xl' : 'max-w-xl',
            )}
        >
            <span className="bday-glow-orb absolute -top-6 left-[10%]" aria-hidden />
            <span className="bday-glow-orb bday-glow-orb-b absolute -right-3 bottom-0" aria-hidden />
            {Array.from({ length: 7 }).map((_, index) => (
                <span
                    key={index}
                    className="bday-night-spark absolute"
                    style={{
                        left: `${10 + index * 12}%`,
                        top: `${14 + ((index * 19) % 55)}%`,
                        animationDelay: `${index * 0.18}s`,
                    }}
                    aria-hidden
                />
            ))}
            <Flank
                compact={compact}
                desktop={desktop}
                className="relative z-[1]"
                left={
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                        <Char theme={theme} role="a" walking={walking} className={size} />
                    </div>
                }
                right={
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                        <Char theme={theme} role="b" walking={walking} flip className={size} />
                    </div>
                }
                center={
                    <Digits
                        theme={theme}
                        units={unitsOf(countdown)}
                        compact={compact}
                        flashSeconds={flash}
                        variant="night"
                        tone="night"
                    />
                }
            />
        </div>
    );
}

function LayoutHelix({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const spin = progress * 220;
    const size = charSize(compact, desktop);
    const walking = !countdown.past;

    return (
        <div className={cn('relative mx-auto w-full', compact ? 'h-[9rem] max-w-none' : desktop ? 'h-[15rem] max-w-3xl' : 'h-[10.5rem] max-w-full')}>
            {Array.from({ length: 12 }).map((_, index) => {
                const angle = (index / 12) * Math.PI * 2 + (spin * Math.PI) / 180;
                const radius = compact ? 38 : 52;
                return (
                    <span
                        key={index}
                        className="occ-helix-dot absolute left-1/2 top-1/2"
                        style={{
                            background: theme.confetti[index % theme.confetti.length],
                            transform: `translate(-50%, -50%) translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius * 0.55}px)`,
                        }}
                    />
                );
            })}
            <div className="absolute inset-0 flex items-center justify-center">
                <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="pods" />
            </div>
            <div className="absolute bottom-0 left-[6%]">
                <Char theme={theme} role="a" walking={walking} className={size} />
            </div>
            <div className="absolute right-[6%] bottom-0">
                <Char theme={theme} role="c" walking={walking} flip className={size} />
            </div>
        </div>
    );
}

function LayoutCascade({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const drop = Math.round((1 - progress) * (compact ? 8 : 16));
    const walking = !countdown.past;

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateY(${drop}px)` }}>
                <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="strip" />
            </div>
            <div className={cn('flex items-end justify-center gap-3', compact ? 'mt-2 h-16' : 'mt-4 h-24')}>
                    <Char theme={theme} role="b" walking={walking} className={compact ? 'h-14 w-auto' : 'h-[5.8rem] w-auto'} />
                    <Char theme={theme} role="a" walking={walking} className={compact ? 'h-14 w-auto' : 'h-[5.8rem] w-auto'} />
                <Char theme={theme} role="c" walking={walking} className={compact ? 'h-14 w-auto' : 'h-[5.8rem] w-auto'} />
            </div>
        </div>
    );
}

function LayoutMirror({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const flash = useTickFlash(countdown.seconds);
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const shift = approachShift(progress, compact, desktop, 16);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <Flank
                compact={compact}
                desktop={desktop}
                left={
                    <div className="transition-transform duration-1000" style={{ transform: `translateX(${shift}px)` }}>
                        <Char theme={theme} role="a" walking={walking} className={size} />
                    </div>
                }
                right={
                    <div className="transition-transform duration-1000" style={{ transform: `translateX(-${shift}px)` }}>
                        <Char theme={theme} role="b" walking={walking} flip className={size} />
                    </div>
                }
                center={<Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="neon" />}
            />
            <div className="occ-mirror-floor pointer-events-none mx-auto mt-1 h-8 opacity-40" aria-hidden />
        </div>
    );
}

function LayoutFrame({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const flash = useTickFlash(countdown.seconds);
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('occ-frame relative mx-auto px-3 py-4', theme.rootClass, compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="editorial" tone="gold" />
            <div className={cn('mt-3 flex items-end justify-center gap-4', compact ? 'h-14' : 'h-20')}>
                <Char theme={theme} role="a" walking={walking} className={size} />
                <Char theme={theme} role="c" walking={walking} className={size} />
            </div>
        </div>
    );
}

function LayoutMosaic({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const flash = useTickFlash(countdown.seconds);
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <Flank
            compact={compact}
            desktop={desktop}
            left={<Char theme={theme} role="b" walking={walking} className={size} />}
            right={<Char theme={theme} role="c" walking={walking} flip className={size} />}
            center={<Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="pods" />}
        />
    );
}

function LayoutRibbon({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const flash = useTickFlash(countdown.seconds);
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="strip" />
            <div
                className={cn('occ-ribbon-wave mx-auto mt-3', theme.rootClass)}
                style={{ ['--occ-progress' as string]: String(progress) }}
                aria-hidden
            />
            <div className={cn('flex justify-center', compact ? 'mt-2' : 'mt-3')}>
                <Char theme={theme} role="a" walking={walking} className={size} />
            </div>
        </div>
    );
}

function LayoutPulse({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                {[0.55, 0.75, 0.95].map((scale, index) => (
                    <span
                        key={scale}
                        className={cn('occ-pulse-ring absolute rounded-full', theme.rootClass)}
                        style={{
                            width: `${(compact ? 5 : 8) + index * 2.2}rem`,
                            height: `${(compact ? 5 : 8) + index * 2.2}rem`,
                            opacity: 0.15 + progress * 0.35,
                            animationDelay: `${index * 0.35}s`,
                        }}
                    />
                ))}
            </div>
            <div className="relative z-[1]">
                <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="neon" />
            </div>
            <div className={cn('relative z-[3] flex justify-center gap-4', compact ? 'mt-3' : 'mt-5')}>
                <Char theme={theme} role="b" walking={walking} className={size} />
                <Char theme={theme} role="a" walking={walking} className={size} />
            </div>
        </div>
    );
}

function LayoutHorizon({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const shift = approachShift(progress, compact, desktop, 20);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="editorial" tone="gold" />
            <div className={cn('occ-horizon relative mt-4', theme.rootClass, compact ? 'h-16' : 'h-24')}>
                <div className="absolute bottom-0 left-[4%] transition-transform duration-1000" style={{ transform: `translateX(${shift}px)` }}>
                    <Char theme={theme} role="a" walking={walking} className={size} />
                </div>
                <div className="absolute right-[4%] bottom-0 transition-transform duration-1000" style={{ transform: `translateX(-${shift}px)` }}>
                    <Char theme={theme} role="b" walking={walking} flip className={size} />
                </div>
            </div>
        </div>
    );
}

function LayoutPortal({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <div
                className={cn('occ-portal relative mx-auto flex items-center justify-center', theme.rootClass, compact ? 'h-[9rem] w-[9rem]' : 'h-[12rem] w-[12rem]')}
                style={{ ['--occ-progress' as string]: String(progress) }}
            >
                <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="pods" />
            </div>
            <div className={cn('flex justify-center gap-6', compact ? 'mt-1' : 'mt-2')}>
                <Char theme={theme} role="a" walking={walking} className={size} />
                <Char theme={theme} role="c" walking={walking} className={size} />
            </div>
        </div>
    );
}

function LayoutLantern({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const lift = approachShift(progress, compact, desktop, 16);
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto pt-6', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-around px-4" aria-hidden>
                {theme.confetti.slice(0, 5).map((color, index) => (
                    <span
                        key={color + index}
                        className="occ-lantern"
                        style={{
                            background: color,
                            transform: `translateY(-${lift * (0.6 + (index % 3) * 0.2)}px)`,
                            animationDelay: `${index * 0.2}s`,
                        }}
                    />
                ))}
            </div>
            <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="strip" />
            <div className={cn('flex justify-center', compact ? 'mt-2' : 'mt-3')}>
                <Char theme={theme} role="c" walking={walking} className={size} />
            </div>
        </div>
    );
}

function LayoutTicker({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const flash = useTickFlash(countdown.seconds);
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <div className={cn('occ-ticker overflow-hidden rounded-2xl px-2 py-3', theme.rootClass)}>
                <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="neon" />
            </div>
            <div className={cn('mt-3 flex items-end justify-between px-2', compact ? 'h-14' : 'h-20')}>
                <Char theme={theme} role="a" walking={walking} className={size} />
                <Char theme={theme} role="b" walking={walking} flip className={size} />
            </div>
        </div>
    );
}

function LayoutConstellation({
    theme,
    countdown,
    compact,
    desktop,
}: {
    theme: OccasionCountdownTheme;
    countdown: CountdownState;
    compact?: boolean;
    desktop?: boolean;
}) {
    const progress = countdownApproachProgress(countdown.remainingMs, countdown.past);
    const flash = useTickFlash(countdown.seconds);
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-50" aria-hidden>
                <line x1="15%" y1="20%" x2="50%" y2="45%" stroke={theme.accent} strokeWidth="1" opacity={0.35 + progress * 0.4} />
                <line x1="85%" y1="18%" x2="50%" y2="45%" stroke={theme.accent} strokeWidth="1" opacity={0.35 + progress * 0.4} />
                <line x1="20%" y1="75%" x2="50%" y2="55%" stroke={theme.accent} strokeWidth="1" opacity={0.3 + progress * 0.4} />
                <line x1="80%" y1="78%" x2="50%" y2="55%" stroke={theme.accent} strokeWidth="1" opacity={0.3 + progress * 0.4} />
            </svg>
            {Array.from({ length: 8 }).map((_, index) => (
                <span
                    key={index}
                    className="bday-star absolute"
                    style={{
                        left: `${12 + index * 10}%`,
                        top: `${14 + ((index * 19) % 60)}%`,
                        background: theme.confetti[index % theme.confetti.length],
                    }}
                />
            ))}
            <div className="relative z-[1]">
                <Digits theme={theme} units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="pods" />
            </div>
            <div className={cn('relative z-[3] flex justify-center gap-5', compact ? 'mt-3' : 'mt-5')}>
                <Char theme={theme} role="a" walking={walking} className={size} />
                <Char theme={theme} role="b" walking={walking} className={size} />
            </div>
        </div>
    );
}

export function renderOccasionLayout(
    layout: OccasionLayoutId,
    theme: OccasionCountdownTheme,
    countdown: CountdownState,
    compact?: boolean,
    desktop?: boolean,
): ReactNode {
    switch (layout) {
        case 'rise':
            return <LayoutRise theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'glow':
            return <LayoutGlow theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'orbit':
            return <LayoutOrbit theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'strip':
            return <LayoutStrip theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'burst':
            return <LayoutBurst theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'trail':
            return <LayoutTrail theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'arch':
            return <LayoutArch theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'parade':
            return <LayoutParade theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'night':
            return <LayoutNight theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'helix':
            return <LayoutHelix theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'cascade':
            return <LayoutCascade theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'mirror':
            return <LayoutMirror theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'frame':
            return <LayoutFrame theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'mosaic':
            return <LayoutMosaic theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'ribbon':
            return <LayoutRibbon theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'pulse':
            return <LayoutPulse theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'horizon':
            return <LayoutHorizon theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'portal':
            return <LayoutPortal theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'lantern':
            return <LayoutLantern theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'ticker':
            return <LayoutTicker theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'constellation':
            return <LayoutConstellation theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
        case 'dash':
        default:
            return <LayoutDash theme={theme} countdown={countdown} compact={compact} desktop={desktop} />;
    }
}

export function OccasionCountdownShell({
    theme,
    layout,
    countdown,
    dateLabel,
    year,
    host,
    desktop = false,
    compact = false,
    className,
}: {
    theme: OccasionCountdownTheme;
    layout: OccasionLayoutId;
    countdown: CountdownState;
    dateLabel?: string;
    year?: string;
    host?: string | null;
    desktop?: boolean;
    compact?: boolean;
    className?: string;
}) {
    const heading = dateLabel?.replace(/ 20\d{2}$/, '').trim() || theme.defaultHeading || 'The day';

    if (countdown.ready && countdown.past) {
        return (
            <CountdownComplete
                dateLabel={dateLabel}
                year={year}
                hosts={host}
                showCouple={false}
                compact={compact}
                desktop={desktop}
                className={className}
            />
        );
    }

    return (
        <div className={cn('occasion-countdown-root w-full max-w-full overflow-x-clip text-center', theme.rootClass, className)}>
            {!compact ? (
                <>
                    <p className="text-[10px] tracking-[0.34em] uppercase" style={{ color: theme.accent }}>
                        {theme.eyebrow || 'Counting down to'}
                    </p>
                    <p className="mt-3 font-serif text-[1.45rem] leading-tight font-light text-[var(--w-ink,#2b241c)] sm:text-[1.7rem] md:text-[1.85rem]">
                        {heading}
                        {year ? <span className="mt-1 block opacity-80">{year}</span> : null}
                    </p>
                    {host ? (
                        <p className="mt-2 text-[11px] tracking-[0.16em] text-[var(--w-muted,#8a7468)] uppercase">{host}</p>
                    ) : null}
                </>
            ) : null}
            <div className={cn('w-full max-w-full', compact ? 'mt-0' : 'mt-6 sm:mt-8')}>
                {renderOccasionLayout(layout, theme, countdown, compact, desktop)}
            </div>
        </div>
    );
}
