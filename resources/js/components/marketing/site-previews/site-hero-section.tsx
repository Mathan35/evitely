import { type CSSProperties, type ReactNode, type Ref } from 'react';
import { useInvitationCopy } from '@/hooks/use-invitation-copy';
import { resolveHeroStyleId, type HeroStyleId } from '@/lib/hero-section-styles';
import { cn } from '@/lib/utils';

export type SiteHeroSectionProps = {
    styleId?: string | null;
    /** Section element id — defaults to `gh-home` (use `hw-home` / `cu-home` when needed). */
    sectionId?: string;
    heroSrc: string;
    alt: string;
    desktop?: boolean;
    /** Editor / device-framed canvas — avoid viewport min-heights that break the shell. */
    framed?: boolean;
    kicker: string;
    title: ReactNode;
    message: string;
    eventLine: string;
    allowRsvp: boolean;
    onRsvp: () => void;
    onGuests: () => void;
    heroRef?: Ref<HTMLImageElement>;
    mediaStyle?: CSSProperties;
    extras?: ReactNode;
    className?: string;
};

const SQUARE_CTA: HeroStyleId[] = ['atelier', 'veil', 'sonnet', 'folio', 'mirage'];

function HeroCtas({
    allowRsvp,
    onRsvp,
    onGuests,
    desktop,
    variant,
}: {
    allowRsvp: boolean;
    onRsvp: () => void;
    onGuests: () => void;
    desktop?: boolean;
    variant: HeroStyleId;
}) {
    const ui = useInvitationCopy();
    const squared = SQUARE_CTA.includes(variant);
    const solid = cn(
        'inline-flex flex-1 items-center justify-center px-6 py-3 text-[11px] tracking-[0.2em] uppercase transition',
        squared ? 'rounded-sm bg-[var(--w-accent)] text-[var(--w-btn)]' : 'rounded-full bg-[var(--w-accent)] text-[var(--w-btn)]',
        !allowRsvp && 'cursor-not-allowed opacity-45',
    );
    const ghost = cn(
        'inline-flex flex-1 items-center justify-center border px-6 py-3 text-[11px] tracking-[0.2em] text-white uppercase transition',
        squared ? 'rounded-sm border-white/55' : 'rounded-full border-white/70',
        (variant === 'prism' || variant === 'ember') && 'border-white/50 bg-white/5 backdrop-blur-[2px]',
    );

    return (
        <div
            className={cn(
                'site-hero__ctas mt-8 flex w-full max-w-xs flex-col gap-3',
                desktop && 'max-w-md flex-row',
                (variant === 'horizon' || variant === 'veil' || variant === 'folio') && 'mt-6',
            )}
        >
            <button type="button" onClick={onRsvp} disabled={!allowRsvp} className={solid}>
                {ui.heroRsvp}
            </button>
            <button type="button" onClick={onGuests} className={ghost}>
                {ui.heroGuests}
            </button>
        </div>
    );
}

function HeroCopy({
    style,
    desktop,
    kicker,
    title,
    message,
    eventLine,
    extras,
    allowRsvp,
    onRsvp,
    onGuests,
}: {
    style: HeroStyleId;
    desktop?: boolean;
    kicker: string;
    title: ReactNode;
    message: string;
    eventLine: string;
    extras?: ReactNode;
    allowRsvp: boolean;
    onRsvp: () => void;
    onGuests: () => void;
}) {
    const titleSize = desktop ? 'text-[clamp(2.75rem,6vw,4.1rem)]' : 'text-[clamp(2.1rem,11vw,2.85rem)]';
    const folioTitle = desktop ? 'text-[clamp(3.4rem,8vw,5.6rem)]' : 'text-[clamp(2.6rem,13vw,3.4rem)]';
    const messageSize = cn('mt-6 max-w-md text-[14px] leading-7 text-white/90', desktop && 'max-w-xl text-[16px] leading-8');

    if (style === 'horizon') {
        return (
            <div className="site-hero__copy site-hero__copy--horizon site-hero__copy--bottom absolute inset-0 z-[12] flex flex-col justify-end text-white">
                <div className={cn('site-hero__horizon-stack max-w-3xl', desktop ? 'text-left' : 'mx-auto text-center')}>
                    <p className="site-hero__kicker text-[10px] tracking-[0.34em] uppercase opacity-90 sm:text-[11px]">{kicker}</p>
                    <h1 className={cn('site-hero__title mt-3 font-serif font-light tracking-tight sm:mt-4', titleSize)}>{title}</h1>
                    <div className="site-hero__horizon-rule mt-4 sm:mt-5" aria-hidden />
                    <p className={cn(messageSize, desktop ? 'mt-4 sm:mt-5' : 'mx-auto mt-4 sm:mt-5')}>{message}</p>
                    <p className="mt-3 text-[11px] tracking-[0.22em] text-white/92 uppercase sm:mt-4">{eventLine}</p>
                    {extras}
                    <HeroCtas allowRsvp={allowRsvp} onRsvp={onRsvp} onGuests={onGuests} desktop={desktop} variant={style} />
                </div>
            </div>
        );
    }

    if (style === 'veil') {
        return (
            <div className="site-hero__copy site-hero__copy--veil site-hero__copy--center absolute inset-0 z-[12] flex items-center justify-center">
                <div className="site-hero__veil-band w-full max-w-3xl px-5 py-7 text-center text-white sm:px-10 sm:py-10">
                    <p className="site-hero__kicker text-[10px] tracking-[0.34em] uppercase opacity-90 sm:text-[11px]">{kicker}</p>
                    <h1 className={cn('site-hero__title mt-3 font-serif font-light tracking-tight sm:mt-4', titleSize)}>{title}</h1>
                    <p className={cn(messageSize, 'mx-auto')}>{message}</p>
                    <p className="mt-4 text-[11px] tracking-[0.22em] text-white/92 uppercase sm:mt-5">{eventLine}</p>
                    {extras}
                    <div className="flex justify-center">
                        <HeroCtas allowRsvp={allowRsvp} onRsvp={onRsvp} onGuests={onGuests} desktop={desktop} variant={style} />
                    </div>
                </div>
            </div>
        );
    }

    if (style === 'prism') {
        return (
            <div
                className={cn(
                    'site-hero__copy site-hero__copy--prism site-hero__copy--center absolute inset-0 z-[12] flex flex-col justify-center text-white',
                    desktop ? 'items-start text-left' : 'items-center text-center',
                )}
            >
                <div className={cn('site-hero__prism-stack max-w-2xl', !desktop && 'mx-auto')}>
                    <p className="site-hero__kicker text-[10px] tracking-[0.34em] uppercase opacity-90 sm:text-[11px]">{kicker}</p>
                    <h1 className={cn('site-hero__title mt-4 font-serif font-light tracking-tight sm:mt-5', titleSize)}>{title}</h1>
                    <p className={cn(messageSize, !desktop && 'mx-auto')}>{message}</p>
                    <p className="mt-4 text-[11px] tracking-[0.22em] text-white/92 uppercase sm:mt-5">{eventLine}</p>
                    {extras}
                    <HeroCtas allowRsvp={allowRsvp} onRsvp={onRsvp} onGuests={onGuests} desktop={desktop} variant={style} />
                </div>
            </div>
        );
    }

    if (style === 'atelier') {
        return (
            <div className="site-hero__copy site-hero__copy--atelier site-hero__copy--center absolute inset-0 z-[12] flex items-center justify-center text-center text-white">
                <div className="site-hero__atelier-frame relative flex w-full max-w-3xl flex-col items-center px-5 py-8 sm:px-10 sm:py-12">
                    <span className="site-hero__atelier-corner site-hero__atelier-corner--tl" aria-hidden />
                    <span className="site-hero__atelier-corner site-hero__atelier-corner--tr" aria-hidden />
                    <span className="site-hero__atelier-corner site-hero__atelier-corner--bl" aria-hidden />
                    <span className="site-hero__atelier-corner site-hero__atelier-corner--br" aria-hidden />
                    <p className="site-hero__kicker text-[10px] tracking-[0.34em] uppercase opacity-90 sm:text-[11px]">{kicker}</p>
                    <h1 className={cn('site-hero__title mt-4 font-serif font-light tracking-tight sm:mt-5', titleSize)}>{title}</h1>
                    <p className={cn(messageSize, 'mx-auto')}>{message}</p>
                    <p className="mt-4 text-[11px] tracking-[0.22em] text-white/92 uppercase sm:mt-5">{eventLine}</p>
                    {extras}
                    <HeroCtas allowRsvp={allowRsvp} onRsvp={onRsvp} onGuests={onGuests} desktop={desktop} variant={style} />
                </div>
            </div>
        );
    }

    if (style === 'sonnet') {
        return (
            <div className="site-hero__copy site-hero__copy--sonnet site-hero__copy--center absolute inset-0 z-[12] flex items-center justify-center text-center text-white">
                {desktop ? (
                    <p className="site-hero__side-ribbon pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-[10px] tracking-[0.42em] uppercase opacity-80 lg:left-8">
                        {eventLine}
                    </p>
                ) : null}
                <div className="site-hero__sonnet-stack max-w-2xl">
                    <p className="site-hero__kicker text-[10px] tracking-[0.34em] uppercase opacity-90 sm:text-[11px]">{kicker}</p>
                    <h1 className={cn('site-hero__title mt-5 font-serif font-light tracking-tight sm:mt-6', titleSize)}>{title}</h1>
                    <div className="site-hero__sonnet-rule mx-auto mt-5 sm:mt-6" aria-hidden />
                    <p className={cn(messageSize, 'mx-auto')}>{message}</p>
                    {!desktop ? <p className="mt-4 text-[11px] tracking-[0.22em] text-white/92 uppercase sm:mt-5">{eventLine}</p> : null}
                    {extras}
                    <div className="flex justify-center">
                        <HeroCtas allowRsvp={allowRsvp} onRsvp={onRsvp} onGuests={onGuests} desktop={desktop} variant={style} />
                    </div>
                </div>
            </div>
        );
    }

    if (style === 'ember') {
        return (
            <div className="site-hero__copy site-hero__copy--ember site-hero__copy--center absolute inset-0 z-[12] flex flex-col items-center justify-center text-center text-white">
                <div className="site-hero__ember-glow" aria-hidden />
                <p className="site-hero__kicker text-[10px] tracking-[0.34em] uppercase opacity-90 sm:text-[11px]">{kicker}</p>
                <h1 className={cn('site-hero__title mt-4 font-serif font-light tracking-tight sm:mt-5', titleSize)}>{title}</h1>
                <p className={cn(messageSize)}>{message}</p>
                <p className="mt-4 text-[11px] tracking-[0.22em] text-white/92 uppercase sm:mt-5">{eventLine}</p>
                {extras}
                <HeroCtas allowRsvp={allowRsvp} onRsvp={onRsvp} onGuests={onGuests} desktop={desktop} variant={style} />
            </div>
        );
    }

    if (style === 'folio') {
        return (
            <div
                className={cn(
                    'site-hero__copy site-hero__copy--folio site-hero__copy--bottom absolute inset-0 z-[12] flex flex-col justify-end text-white',
                    desktop ? 'items-stretch' : 'items-center text-center',
                )}
            >
                <h1
                    className={cn(
                        'site-hero__title site-hero__folio-title font-serif font-light tracking-tight',
                        folioTitle,
                        desktop ? 'text-left' : 'text-center',
                    )}
                >
                    {title}
                </h1>
                <div className={cn('site-hero__folio-panel mt-4 sm:mt-6', desktop ? 'max-w-xl text-left' : 'mx-auto max-w-md text-center')}>
                    <p className="site-hero__kicker text-[10px] tracking-[0.34em] uppercase opacity-90 sm:text-[11px]">{kicker}</p>
                    <p className={cn(messageSize, 'mt-3')}>{message}</p>
                    <p className="mt-3 text-[11px] tracking-[0.22em] text-white/92 uppercase sm:mt-4">{eventLine}</p>
                    {extras}
                    <HeroCtas allowRsvp={allowRsvp} onRsvp={onRsvp} onGuests={onGuests} desktop={desktop} variant={style} />
                </div>
            </div>
        );
    }

    if (style === 'mirage') {
        return (
            <div className="site-hero__copy site-hero__copy--mirage site-hero__copy--center absolute inset-0 z-[12] grid text-white md:grid-cols-2">
                <div className={cn('flex flex-col justify-center', desktop ? 'text-left' : 'col-span-full items-center text-center')}>
                    <p className="site-hero__kicker text-[10px] tracking-[0.34em] uppercase opacity-90 sm:text-[11px]">{kicker}</p>
                    <h1 className={cn('site-hero__title mt-4 font-serif font-light tracking-tight sm:mt-5', titleSize)}>{title}</h1>
                </div>
                <div className={cn('flex flex-col justify-center', desktop ? 'text-left' : 'col-span-full items-center text-center')}>
                    <p className={cn(messageSize, 'mt-0')}>{message}</p>
                    <p className="mt-4 text-[11px] tracking-[0.22em] text-white/92 uppercase sm:mt-5">{eventLine}</p>
                    {extras}
                    <HeroCtas allowRsvp={allowRsvp} onRsvp={onRsvp} onGuests={onGuests} desktop={desktop} variant={style} />
                </div>
            </div>
        );
    }

    if (style === 'cascade') {
        return (
            <div className="site-hero__copy site-hero__copy--cascade site-hero__copy--center absolute inset-0 z-[12] flex flex-col items-center justify-center text-center text-white">
                <p className="site-hero__kicker site-hero__cascade-line text-[10px] tracking-[0.34em] uppercase opacity-90 sm:text-[11px]">{kicker}</p>
                <h1 className={cn('site-hero__title site-hero__cascade-line mt-4 font-serif font-light tracking-tight sm:mt-5', titleSize)}>{title}</h1>
                <p className={cn(messageSize, 'site-hero__cascade-line')}>{message}</p>
                <p className="site-hero__cascade-line mt-4 text-[11px] tracking-[0.22em] text-white/92 uppercase sm:mt-5">{eventLine}</p>
                {extras}
                <div className="site-hero__cascade-line">
                    <HeroCtas allowRsvp={allowRsvp} onRsvp={onRsvp} onGuests={onGuests} desktop={desktop} variant={style} />
                </div>
            </div>
        );
    }

    // cinema
    return (
        <div className="site-hero__copy site-hero__copy--cinema site-hero__copy--center absolute inset-0 z-[12] flex flex-col items-center justify-center text-center text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)]">
            <p className="site-hero__kicker text-[10px] tracking-[0.34em] uppercase opacity-90 sm:text-[11px]">{kicker}</p>
            <h1 className={cn('site-hero__title mt-4 font-serif font-light tracking-tight sm:mt-5', titleSize)}>{title}</h1>
            <p className={cn(messageSize)}>{message}</p>
            <p className="mt-4 text-[11px] tracking-[0.22em] text-white/92 uppercase sm:mt-5">{eventLine}</p>
            {extras}
            <HeroCtas allowRsvp={allowRsvp} onRsvp={onRsvp} onGuests={onGuests} desktop={desktop} variant={style} />
        </div>
    );
}

export function SiteHeroSection({
    styleId,
    sectionId = 'gh-home',
    heroSrc,
    alt,
    desktop = false,
    framed = false,
    kicker,
    title,
    message,
    eventLine,
    allowRsvp,
    onRsvp,
    onGuests,
    heroRef,
    mediaStyle,
    extras,
    className,
}: SiteHeroSectionProps) {
    const style = resolveHeroStyleId(styleId);

    return (
        <section
            id={sectionId}
            className={cn(
                'site-hero relative z-[2] w-full bg-black',
                `site-hero--${style}`,
                desktop && 'site-hero--desktop',
                framed && 'site-hero--framed',
                className,
            )}
        >
            <div className="site-hero__stage relative overflow-hidden">
                <img
                    ref={heroRef}
                    key={heroSrc}
                    src={heroSrc}
                    alt={alt}
                    draggable={false}
                    className={cn(
                        'site-hero__media block w-full select-none object-cover',
                        desktop ? 'aspect-[16/9]' : 'aspect-[9/16]',
                        /* Live / public view only — vh mins break the editor device shell. */
                        !framed && (desktop ? 'min-h-[min(72vh,42rem)]' : 'min-h-[min(88svh,40rem)]'),
                    )}
                    style={mediaStyle}
                />
                <div className="site-hero__wash pointer-events-none absolute inset-0" aria-hidden />
                <div className="site-hero__fx pointer-events-none absolute inset-0" aria-hidden />
                {style === 'ember' ? (
                    <div className="site-hero__embers pointer-events-none absolute inset-0" aria-hidden>
                        <span /><span /><span /><span /><span /><span />
                    </div>
                ) : null}
                <HeroCopy
                    style={style}
                    desktop={desktop}
                    kicker={kicker}
                    title={title}
                    message={message}
                    eventLine={eventLine}
                    extras={extras}
                    allowRsvp={allowRsvp}
                    onRsvp={onRsvp}
                    onGuests={onGuests}
                />
            </div>
        </section>
    );
}

/** Compact layout thumbnail for the editor style picker. */
export function HeroStyleThumb({ styleId, active }: { styleId: HeroStyleId; active?: boolean }) {
    return (
        <div
            className={cn(
                'site-hero-thumb relative h-[7.25rem] w-full overflow-hidden rounded-xl ring-1',
                `site-hero-thumb--${styleId}`,
                active ? 'ring-zinc-950/25' : 'ring-zinc-950/10',
            )}
            aria-hidden
        >
            <div className="site-hero-thumb__photo absolute inset-0" />
            <div className="site-hero-thumb__wash absolute inset-0" />
            {styleId === 'atelier' ? <div className="site-hero-thumb__frame absolute inset-3" /> : null}
            {styleId === 'veil' ? <div className="site-hero-thumb__veil absolute inset-x-2 top-1/2 h-[42%] -translate-y-1/2" /> : null}
            {styleId === 'horizon' ? <div className="site-hero-thumb__rule absolute inset-x-4 bottom-[38%]" /> : null}
            {styleId === 'prism' || styleId === 'mirage' ? <div className="site-hero-thumb__beam absolute inset-0" /> : null}
            {styleId === 'sonnet' ? <div className="site-hero-thumb__side absolute top-3 bottom-3 left-2 w-px bg-white/50" /> : null}
            {styleId === 'folio' ? <div className="site-hero-thumb__folio absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" /> : null}
            <div
                className={cn(
                    'site-hero-thumb__type absolute inset-x-0 flex flex-col px-3',
                    styleId === 'horizon' || styleId === 'folio' ? 'bottom-3 items-start' : 'top-1/2 -translate-y-1/2 items-center',
                    (styleId === 'prism' || styleId === 'mirage') && 'items-start pl-4',
                    styleId === 'cascade' && 'gap-0.5',
                )}
            >
                <span className="h-1 w-8 rounded-full bg-white/55" />
                <span className="mt-1.5 h-2 w-16 rounded-full bg-white/85" />
                <span className="mt-1 h-1.5 w-12 rounded-full bg-white/70" />
                <span className="mt-2 h-1 w-10 rounded-full bg-white/40" />
            </div>
        </div>
    );
}
