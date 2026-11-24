import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CountdownComplete } from '@/components/marketing/site-previews/countdown-complete';
import { EventCountdownTimer } from '@/components/marketing/site-previews/event-countdown-timer';
import {
    BIRTHDAY_BALLOON_FRIEND_SRC,
    BIRTHDAY_CELEBRANT_SRC,
    BIRTHDAY_GIFT_FRIEND_SRC,
    resolveBirthdayCountdownStyleId,
    type BirthdayCountdownStyleId,
} from '@/lib/birthday-countdown-styles';
import { isCustomCountdownStyle, resolveCustomCountdownPack } from '@/lib/event-countdown-packs';
import { countdownApproachProgress } from '@/lib/countdown-timer-styles';
import type { CountdownState } from '@/hooks/use-countdown';
import { cn } from '@/lib/utils';

const POPPER_SRC = '/images/celebrate-popper.png';

type PartyRole = 'celebrant' | 'balloon' | 'gift';

const PARTY_SRC: Record<PartyRole, string> = {
    celebrant: BIRTHDAY_CELEBRANT_SRC,
    balloon: BIRTHDAY_BALLOON_FRIEND_SRC,
    gift: BIRTHDAY_GIFT_FRIEND_SRC,
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

function PartyChar({
    role,
    walking = true,
    flip,
    className,
    style,
}: {
    role: PartyRole;
    walking?: boolean;
    flip?: boolean;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <div
            className={cn(
                'bday-cartoon relative shrink-0 bg-transparent',
                walking && (role === 'celebrant' ? 'bday-walk' : role === 'balloon' ? 'bday-walk-delay' : 'bday-walk-gift'),
                className,
            )}
            style={style}
        >
            <img
                src={PARTY_SRC[role]}
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

function BirthdayDigits({
    units,
    compact,
    flashSeconds,
    tone = 'party',
    variant = 'strip',
}: {
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
                ? 'text-[#ffe9b8]'
                : 'text-[#c43b5a]';
    const labelTone =
        tone === 'light' ? 'text-white/60' : tone === 'night' ? 'text-[#ffe9b8]/70' : 'text-[#9a7a6e]';

    return (
        <div
            className={cn(
                'countdown-digits mx-auto grid w-full max-w-full',
                units.length <= 3 ? 'grid-cols-3' : 'grid-cols-4',
                compact ? 'gap-1.5' : 'gap-2',
                variant === 'strip' && 'bday-digits-strip px-2.5 py-2',
                variant === 'pods' && 'gap-2',
                variant === 'neon' && 'bday-digits-neon px-2.5 py-2',
                variant === 'night' && 'bday-digits-night px-2.5 py-2.5',
                variant === 'editorial' && 'gap-2.5',
                variant === 'cake' && 'bday-digits-cake px-2.5 py-2',
            )}
        >
            {units.map((unit, index) => (
                <div
                    key={unit.label}
                    className={cn(
                        'relative min-w-0 text-center',
                        variant === 'pods' && 'bday-pod px-2 py-2',
                        flashSeconds && unit.label === 'Seconds' && 'countdown-tick',
                    )}
                >
                    {index > 0 && variant === 'editorial' ? (
                        <span className={cn('absolute top-[0.15em] -left-2.5 opacity-25', valueTone)} aria-hidden>
                            ·
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

function BalloonLift({
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
    const shift = approachShift(progress, compact, desktop, 22);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <Flank
            compact={compact}
            desktop={desktop}
            left={
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                    <PartyChar role="balloon" walking={walking} className={size} />
                </div>
            }
            right={
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                    <PartyChar role="celebrant" walking={walking} className={size} />
                </div>
            }
            center={<BirthdayDigits units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="strip" />}
        />
    );
}

function CakeBloom({
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
    const rise = Math.round(progress * (compact ? 6 : 14));
    const walking = !countdown.past;

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none' : desktop ? 'max-w-3xl' : 'max-w-lg')}>
            <div className="bday-cake-stage relative mx-auto mb-2" style={{ ['--bday-progress' as string]: String(progress) }}>
                <div className="bday-cake-tier bday-cake-tier-top" />
                <div className="bday-cake-tier bday-cake-tier-mid" />
                <div className="bday-cake-tier bday-cake-tier-base" />
                <div className="pointer-events-none absolute inset-x-0 -top-1 flex justify-center gap-2.5">
                    <span className="bday-candle"><span className="bday-candle-flame" /></span>
                    <span className="bday-candle" style={{ animationDelay: '0.2s' }}><span className="bday-candle-flame" /></span>
                    <span className="bday-candle" style={{ animationDelay: '0.4s' }}><span className="bday-candle-flame" /></span>
                </div>
            </div>
            <BirthdayDigits units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="cake" />
            <div className={cn('relative z-[3] flex items-end justify-center', compact ? 'mt-3 h-16' : 'mt-5 h-24')}>
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateY(-${rise}px)` }}>
                    <PartyChar
                        role="celebrant"
                        walking={walking}
                        className={charSize(compact, desktop)}
                    />
                </div>
            </div>
        </div>
    );
}

function GiftOrbit({
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
                <div className="bday-orbit-ring absolute inset-[10%] rounded-full" style={{ transform: `rotate(${spin}deg)` }} />
                <div className="bday-orbit-ring-soft absolute inset-[20%] rounded-full" style={{ transform: `rotate(${-spin * 0.55}deg)` }} />
                <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                        <p className={cn('font-serif font-semibold tabular-nums text-[#c43b5a]', compact ? 'text-3xl' : desktop ? 'text-5xl' : 'text-4xl')}>
                            {unitsOf(countdown)[0]?.value}
                        </p>
                        <p className="mt-1 text-[8px] tracking-[0.28em] text-[#9a7a6e] uppercase">Days</p>
                    </div>
                </div>
            </div>
            <div className={cn(compact ? 'mt-2' : 'mt-3')}>
                <BirthdayDigits units={unitsOf(countdown).slice(1)} compact={compact} flashSeconds={flash} variant="pods" />
            </div>
            <div className={cn('relative z-[3] mx-auto flex items-end justify-center', compact ? 'mt-3 gap-8' : 'mt-5 gap-12')}>
                <PartyChar role="gift" walking={walking} className={size} />
                <PartyChar role="balloon" walking={walking} flip className={size} />
            </div>
        </div>
    );
}

function CandleGlow({
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
    const shift = approachShift(progress, compact, desktop, 18);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <Flank
            compact={compact}
            desktop={desktop}
            left={
                <div className="flex flex-col items-end gap-1">
                    <div className="mb-1 flex gap-1.5 pr-2">
                        <span className="bday-candle"><span className="bday-candle-flame" /></span>
                        <span className="bday-candle" style={{ animationDelay: '0.25s' }}><span className="bday-candle-flame" /></span>
                    </div>
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                        <PartyChar role="celebrant" walking={walking} className={size} />
                    </div>
                </div>
            }
            right={
                <div className="flex flex-col items-start gap-1">
                    <div className="mb-1 flex gap-1.5 pl-2">
                        <span className="bday-candle" style={{ animationDelay: '0.1s' }}><span className="bday-candle-flame" /></span>
                        <span className="bday-candle" style={{ animationDelay: '0.35s' }}><span className="bday-candle-flame" /></span>
                    </div>
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                        <PartyChar role="gift" walking={walking} className={size} />
                    </div>
                </div>
            }
            center={<BirthdayDigits units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="editorial" tone="gold" />}
        />
    );
}

function ConfettiStream({
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
                        background: ['#ff6b8a', '#ffd166', '#6c8cff', '#4be3ac', '#ff8ecf'][index % 5],
                        animationDelay: `${index * 0.12}s`,
                    }}
                />
            ))}
            <div className="relative z-[1]">
                <BirthdayDigits units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="strip" />
            </div>
            <div className={cn('relative z-[3] flex items-end justify-center', compact ? 'mt-3 h-16' : 'mt-5 h-24')}>
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                    <PartyChar role="balloon" walking={walking} className={compact ? 'h-14 w-auto' : 'h-[5.8rem] w-auto'} />
                </div>
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                    <PartyChar role="celebrant" walking={walking} className={compact ? 'h-14 w-auto' : 'h-[5.8rem] w-auto'} />
                </div>
            </div>
        </div>
    );
}

function PartyStrip({
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
    const shift = approachShift(progress, compact, desktop, 16);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <Flank
            compact={compact}
            desktop={desktop}
            left={
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(${shift}px)` }}>
                    <PartyChar role="gift" walking={walking} className={size} />
                </div>
            }
            right={
                <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                    <PartyChar role="balloon" walking={walking} flip className={size} />
                </div>
            }
            center={
                <div className="relative">
                    <div className="bday-ribbon absolute inset-x-[-8%] top-1/2 h-px -translate-y-1/2" aria-hidden />
                    <BirthdayDigits units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="neon" />
                </div>
            }
        />
    );
}

function StarTrail({
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
                            transform: `translateX(${index % 2 === 0 ? pull : -pull}px)`,
                            animationDelay: `${index * 0.1}s`,
                        }}
                    />
                ))}
            </div>
            <Flank
                compact={compact}
                desktop={desktop}
                left={<PartyChar role="celebrant" walking={walking} className={size} />}
                right={<PartyChar role="gift" walking={walking} className={size} />}
                center={<BirthdayDigits units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="pods" />}
            />
        </div>
    );
}

function BalloonArch({
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
    const shift = approachShift(progress, compact, desktop, 18);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);
    const colors = ['#ff6b8a', '#ffd166', '#6c8cff', '#4be3ac', '#ff8ecf', '#ffd166', '#ff6b8a'];

    return (
        <div className={cn('relative mx-auto', compact ? 'max-w-none pt-7' : desktop ? 'max-w-3xl pt-11' : 'max-w-lg pt-9')}>
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center gap-1 sm:gap-1.5" aria-hidden>
                {colors.map((color, index) => (
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
                        <PartyChar role="balloon" walking={walking} className={size} />
                    </div>
                }
                right={
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                        <PartyChar role="celebrant" walking={walking} className={size} />
                    </div>
                }
                center={<BirthdayDigits units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="strip" />}
            />
        </div>
    );
}

function SparkParade({
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
    const bounce = Math.round(progress * (compact ? 4 : 10));
    const walking = !countdown.past;
    const size = charSize(compact, desktop);

    return (
        <Flank
            compact={compact}
            desktop={desktop}
            left={
                <div className="flex flex-col items-end gap-1">
                    <img
                        src={POPPER_SRC}
                        alt=""
                        draggable={false}
                        className={cn('bday-popper object-contain', compact ? 'h-7 w-7' : 'h-10 w-10')}
                    />
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateY(-${bounce}px)` }}>
                        <PartyChar role="gift" walking={walking} className={size} />
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
                        <PartyChar role="balloon" walking={walking} flip className={size} />
                    </div>
                </div>
            }
            center={<BirthdayDigits units={unitsOf(countdown)} compact={compact} flashSeconds={flash} variant="pods" />}
        />
    );
}

function NightGlow({
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
    const shift = approachShift(progress, compact, desktop, 18);
    const walking = !countdown.past && progress < 0.98;
    const size = charSize(compact, desktop);

    return (
        <div
            className={cn(
                'bday-night relative mx-auto overflow-hidden rounded-[1.5rem] px-2.5 py-4 sm:px-4 sm:py-5',
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
                        <PartyChar role="celebrant" walking={walking} className={size} />
                    </div>
                }
                right={
                    <div className="transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${shift}px)` }}>
                        <PartyChar role="balloon" walking={walking} flip className={size} />
                    </div>
                }
                center={
                    <BirthdayDigits
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

function renderStyle(
    style: BirthdayCountdownStyleId,
    countdown: CountdownState,
    compact?: boolean,
    desktop?: boolean,
): ReactNode {
    switch (style) {
        case 'cakebloom':
            return <CakeBloom countdown={countdown} compact={compact} desktop={desktop} />;
        case 'giftorbit':
            return <GiftOrbit countdown={countdown} compact={compact} desktop={desktop} />;
        case 'candleglow':
            return <CandleGlow countdown={countdown} compact={compact} desktop={desktop} />;
        case 'confettistream':
            return <ConfettiStream countdown={countdown} compact={compact} desktop={desktop} />;
        case 'partystrip':
            return <PartyStrip countdown={countdown} compact={compact} desktop={desktop} />;
        case 'startrail':
            return <StarTrail countdown={countdown} compact={compact} desktop={desktop} />;
        case 'balloonarch':
            return <BalloonArch countdown={countdown} compact={compact} desktop={desktop} />;
        case 'sparkparade':
            return <SparkParade countdown={countdown} compact={compact} desktop={desktop} />;
        case 'nightglow':
            return <NightGlow countdown={countdown} compact={compact} desktop={desktop} />;
        case 'balloonlift':
        default:
            return <BalloonLift countdown={countdown} compact={compact} desktop={desktop} />;
    }
}

export function BirthdayCountdownTimer({
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

    const style = resolveBirthdayCountdownStyleId(styleId);
    const heading = dateLabel?.replace(/ 20\d{2}$/, '') || 'Birthday';

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
        <div className={cn('birthday-countdown-root w-full max-w-full overflow-x-clip text-center', className)}>
            {!compact ? (
                <>
                    <p className="text-[10px] tracking-[0.34em] text-[#c43b5a] uppercase">Counting down to</p>
                    <p className="mt-3 font-serif text-[1.45rem] leading-tight font-light text-[var(--w-ink,#2b241c)] sm:text-[1.7rem] md:text-[1.85rem]">
                        {heading}
                        {year ? <span className="mt-1 block opacity-80">{year}</span> : null}
                    </p>
                    {host ? (
                        <p className="mt-2 text-[11px] tracking-[0.16em] text-[var(--w-muted,#8a7468)] uppercase">{host}</p>
                    ) : null}
                </>
            ) : null}
            <div className={cn('w-full max-w-full', compact ? 'mt-0' : 'mt-6 sm:mt-8')}>{renderStyle(style, countdown, compact, desktop)}</div>
        </div>
    );
}
