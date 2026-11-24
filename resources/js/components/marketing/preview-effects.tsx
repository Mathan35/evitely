import { BABY_SHOWER_SAMPLE, babyShowerHeroSrc } from '@/components/marketing/site-previews/baby-shower-site-themes';
import { BIRTHDAY_SAMPLE, birthdayHeroSrc } from '@/components/marketing/site-previews/birthday-site-themes';
import { BRIDAL_SHOWER_SAMPLE, bridalShowerHeroSrc } from '@/components/marketing/site-previews/bridal-shower-site-themes';
import { CORPORATE_SAMPLE, corporateHeroSrc } from '@/components/marketing/site-previews/corporate-site-themes';
import { GRADUATION_SAMPLE, graduationHeroSrc } from '@/components/marketing/site-previews/graduation-site-themes';
import { CUSTOM_SAMPLE, customHeroSrc } from '@/components/marketing/site-previews/custom-site-themes';
import { HOUSEWARMING_SAMPLE, housewarmingHeroSrc } from '@/components/marketing/site-previews/housewarming-site-themes';
import { PARTY_SAMPLE, partyHeroSrc } from '@/components/marketing/site-previews/party-site-themes';
import { WEDDING_SAMPLE, weddingHeroSrc } from '@/components/marketing/site-previews/wedding-site-themes';
import { cn } from '@/lib/utils';
import type { PreviewDevice } from '@/lib/preview-device';
import type { GalleryDesign } from '@/types/gallery';

const EVENT_GRADE: Record<string, string> = {
    wedding: 'bg-gradient-to-b from-[#1c1814]/50 via-[#1c1814]/32 to-[#1c1814]/82',
    birthday: 'bg-gradient-to-b from-[#3b2414]/55 via-[#d97706]/22 to-black/78',
    'baby-shower': 'bg-gradient-to-b from-[#14532d]/40 via-[#7dd3fc]/16 to-[#0c4a6e]/72',
    party: 'bg-gradient-to-b from-[#1e1b4b]/58 via-[#c026d3]/18 to-black/82',
    graduation: 'bg-gradient-to-b from-[#0f172a]/58 via-[#d4af37]/16 to-[#0f172a]/84',
    'bridal-shower': 'bg-gradient-to-b from-[#9d174d]/42 via-[#d7a3ab]/18 to-[#241c16]/78',
    housewarming: 'bg-gradient-to-b from-[#3f4f3a]/48 via-[#c6a36a]/16 to-[#241c16]/78',
    corporate: 'bg-gradient-to-b from-[#0f172a]/62 via-[#1d4ed8]/14 to-black/82',
    custom: 'bg-gradient-to-b from-[#241c16]/52 via-[#c6a36a]/14 to-black/78',
};

const OPENER_SPECKS = Array.from({ length: 18 }, (_, index) => ({
    left: `${(index * 19 + 8) % 94}%`,
    delay: `${(index * 0.18).toFixed(2)}s`,
    duration: `${(7 + (index % 5) * 1.1).toFixed(2)}s`,
    size: 4 + (index % 5) * 2,
    drift: `${index % 2 === 0 ? 28 + (index % 4) * 6 : -22 - (index % 3) * 8}px`,
}));

function hostLines(hosts: string): { first: string; second?: string } {
    const parts = hosts.split(/\s*&\s*|\s+and\s+/i).map((part) => part.trim()).filter(Boolean);

    if (parts.length >= 2) {
        return { first: parts[0], second: parts.slice(1).join(' & ') };
    }

    return { first: hosts };
}

type FallKind = 'dot' | 'petal' | 'confetti' | 'heart' | 'star' | 'spark' | 'ember' | 'diamond' | 'rose';
type FallMotion = 'leaf' | 'confetti' | 'ember' | 'star';

type FallSpec = {
    palette: string[];
    field: string;
    motion: FallMotion;
    baseDuration: number;
    kinds: FallKind[];
};

type FallItem = {
    kind: FallKind;
    left: string;
    delay: string;
    duration: string;
    size: number;
    height: number;
    drift: string;
    rotate: string;
    alpha: number;
    color: string;
};

const FALL_SPECS: Record<string, FallSpec> = {
    wedding: {
        palette: ['#c4a090'],
        field: '#c4a090',
        motion: 'leaf',
        baseDuration: 11,
        kinds: ['dot', 'petal', 'dot', 'dot'],
    },
    birthday: {
        palette: ['#e8b923', '#e85d4c', '#2a9d8f', '#f4efe6'],
        field: '#e8b923',
        motion: 'confetti',
        baseDuration: 7.2,
        kinds: ['confetti', 'confetti', 'spark', 'dot'],
    },
    corporate: {
        palette: ['#c6a36a', '#94a3b8', '#e2e8f0'],
        field: '#c6a36a',
        motion: 'star',
        baseDuration: 15,
        kinds: ['diamond', 'dot', 'diamond', 'spark'],
    },
    'baby-shower': {
        palette: ['#7dd3fc', '#fda4af', '#86efac', '#fde68a'],
        field: '#fda4af',
        motion: 'leaf',
        baseDuration: 12.4,
        kinds: ['heart', 'dot', 'heart', 'spark'],
    },
    party: {
        palette: ['#e879f9', '#fbbf24', '#38bdf8', '#fb7185'],
        field: '#e879f9',
        motion: 'confetti',
        baseDuration: 6.4,
        kinds: ['spark', 'confetti', 'dot', 'spark'],
    },
    graduation: {
        palette: ['#d4af37', '#1e3a8a', '#f8fafc'],
        field: '#d4af37',
        motion: 'star',
        baseDuration: 13.5,
        kinds: ['star', 'dot', 'diamond', 'star'],
    },
    'bridal-shower': {
        palette: ['#e8b4bc', '#f9a8d4', '#fda4af'],
        field: '#e8b4bc',
        motion: 'leaf',
        baseDuration: 10.6,
        kinds: ['rose', 'dot', 'rose', 'heart'],
    },
    housewarming: {
        palette: ['#c2410c', '#c6a36a', '#fdba74'],
        field: '#c2410c',
        motion: 'ember',
        baseDuration: 9.8,
        kinds: ['ember', 'dot', 'spark', 'ember'],
    },
    custom: {
        palette: ['#c6a36a', '#e7e5e4', '#fde68a'],
        field: '#c6a36a',
        motion: 'confetti',
        baseDuration: 8.6,
        kinds: ['spark', 'diamond', 'dot', 'confetti'],
    },
};

function fallItems(slug: string, scale = 1): FallItem[] {
    const spec = FALL_SPECS[slug] ?? FALL_SPECS.custom;
    const count = scale > 1 ? 22 : 16;

    return Array.from({ length: count }, (_, index) => {
        const kind = spec.kinds[index % spec.kinds.length];
        const drawn = kind !== 'dot' && kind !== 'confetti' && kind !== 'ember';
        const base = drawn ? 11 + (index % 4) * 2 : kind === 'confetti' ? 7 + (index % 5) : 6 + (index % 4) * 2;
        const size = Math.round(base * scale);

        return {
            kind,
            left: `${((index * 17) + 6) % 94}%`,
            delay: `${((index * 0.83) % 11).toFixed(2)}s`,
            duration: `${(spec.baseDuration + (index % 6) * 1.15).toFixed(2)}s`,
            size,
            height: kind === 'confetti' ? size * (1.6 + (index % 3) * 0.25) : drawn ? Math.round(size * 1.45) : size,
            drift: `${index % 2 === 0 ? 36 + (index % 5) * 8 : -28 - (index % 4) * 7}px`,
            rotate: `${drawn ? (index % 2 === 0 ? 210 : -190) : 40 + index * 18}deg`,
            alpha: Math.min(0.92, (drawn ? 0.72 : 0.48 + (index % 4) * 0.08) * (scale > 1 ? 1.15 : 1)),
            color: spec.palette[index % spec.palette.length],
        };
    });
}

function LeafPetal() {
    return (
        <svg viewBox="0 0 20 28" className="preview-leaf-svg" aria-hidden>
            <path d="M10 1.4C15.2 6.6 18.4 13.4 10 26.4C1.6 13.4 4.8 6.6 10 1.4Z" fill="currentColor" />
        </svg>
    );
}

function RosePetal() {
    return (
        <svg viewBox="0 0 20 24" className="preview-leaf-svg" aria-hidden>
            <path d="M10 22C3.6 15.4 2 10.2 10 3.2C18 10.2 16.4 15.4 10 22Z" fill="currentColor" />
        </svg>
    );
}

function HeartMark() {
    return (
        <svg viewBox="0 0 20 20" className="preview-leaf-svg" aria-hidden>
            <path d="M10 17.6C10 17.6 2.4 12.2 2.4 7.6C2.4 4.8 4.6 3.2 6.8 3.2C8.2 3.2 9.3 4 10 5.1C10.7 4 11.8 3.2 13.2 3.2C15.4 3.2 17.6 4.8 17.6 7.6C17.6 12.2 10 17.6 10 17.6Z" fill="currentColor" />
        </svg>
    );
}

function StarMark() {
    return (
        <svg viewBox="0 0 20 20" className="preview-leaf-svg" aria-hidden>
            <path d="M10 1.4L12.2 7.2H18.4L13.4 10.8L15.4 16.8L10 13.4L4.6 16.8L6.6 10.8L1.6 7.2H7.8Z" fill="currentColor" />
        </svg>
    );
}

function SparkMark() {
    return (
        <svg viewBox="0 0 20 20" className="preview-leaf-svg" aria-hidden>
            <path d="M10 0.8L11.1 8.2L18.6 10L11.1 11.8L10 19.2L8.9 11.8L1.4 10L8.9 8.2Z" fill="currentColor" />
        </svg>
    );
}

function DiamondMark() {
    return (
        <svg viewBox="0 0 20 20" className="preview-leaf-svg" aria-hidden>
            <path d="M10 1.6L18.2 10L10 18.4L1.8 10Z" fill="currentColor" />
        </svg>
    );
}

function FallShape({ kind }: { kind: FallKind }) {
    if (kind === 'petal') {
        return <LeafPetal />;
    }

    if (kind === 'rose') {
        return <RosePetal />;
    }

    if (kind === 'heart') {
        return <HeartMark />;
    }

    if (kind === 'star') {
        return <StarMark />;
    }

    if (kind === 'spark') {
        return <SparkMark />;
    }

    if (kind === 'diamond') {
        return <DiamondMark />;
    }

    return null;
}

export function PreviewLeaves({
    className,
    eventSlug = 'wedding',
    /**
     * `absolute` — framed shells (editor / marketing popup) where the parent is viewport-sized.
     * `fixed` — published full-page sites; keeps fall particles in the viewport while the document scrolls.
     */
    placement = 'absolute',
}: {
    className?: string;
    eventSlug?: string;
    placement?: 'absolute' | 'fixed';
}) {
    const slug = FALL_SPECS[eventSlug] ? eventSlug : 'custom';
    const spec = FALL_SPECS[slug];
    // Full-page sites need a slightly denser field — framed popups already feel busy in a small shell.
    const scale = placement === 'fixed' ? 1.35 : 1;
    const items = slug === 'wedding' ? weddingLeaves(scale) : fallItems(slug, scale);

    return (
        <div
            className={cn(
                'preview-leaf-field pointer-events-none inset-0 overflow-hidden',
                placement === 'fixed' ? 'fixed z-40' : 'absolute z-[16]',
                className,
            )}
            data-fall={slug}
            style={{ color: spec.field }}
            aria-hidden
        >
            {items.map((leaf, index) => (
                <span
                    key={index}
                    className={cn(
                        'preview-leaf-item',
                        spec.motion === 'confetti' && 'preview-confetti-item',
                        spec.motion === 'ember' && 'preview-ember-item',
                        spec.motion === 'star' && 'preview-star-item',
                        leaf.kind === 'dot' && 'preview-leaf-dot',
                        leaf.kind === 'petal' && 'preview-leaf-petal',
                        leaf.kind === 'confetti' && 'preview-fall-confetti',
                        leaf.kind === 'ember' && 'preview-fall-ember',
                    )}
                    style={{
                        left: leaf.left,
                        width: leaf.size,
                        height: leaf.height,
                        color: slug === 'wedding' ? undefined : leaf.color,
                        backgroundColor:
                            slug !== 'wedding' && (leaf.kind === 'dot' || leaf.kind === 'confetti' || leaf.kind === 'ember')
                                ? leaf.color
                                : undefined,
                        ['--leaf-delay' as string]: leaf.delay,
                        ['--leaf-dur' as string]: leaf.duration,
                        ['--leaf-x' as string]: leaf.drift,
                        ['--leaf-rot' as string]: leaf.rotate,
                        ['--leaf-alpha' as string]: String(leaf.alpha),
                    }}
                >
                    <FallShape kind={leaf.kind} />
                </span>
            ))}
        </div>
    );
}

function weddingLeaves(scale = 1): FallItem[] {
    const count = scale > 1 ? 22 : 16;

    return Array.from({ length: count }, (_, index) => {
        const petal = index % 4 === 1;
        const size = Math.round((petal ? 11 + (index % 3) * 2 : 8 + (index % 4) * 2) * scale);

        return {
            kind: petal ? 'petal' : 'dot',
            left: `${((index * 17) + 6) % 94}%`,
            delay: `${((index * 0.83) % 11).toFixed(2)}s`,
            duration: `${(11 + (index % 6) * 1.15).toFixed(2)}s`,
            size,
            height: petal ? Math.round(size * 1.45) : size,
            drift: `${index % 2 === 0 ? 36 + (index % 5) * 8 : -28 - (index % 4) * 7}px`,
            rotate: `${petal ? (index % 2 === 0 ? 210 : -190) : 40}deg`,
            alpha: Math.min(0.92, (petal ? 0.78 : 0.48 + (index % 4) * 0.08) * (scale > 1 ? 1.1 : 1)),
            color: '#c4a090',
        };
    });
}

export function PreviewLoader({
    visible,
    background = '#f4efe6',
    accent = '#c6a36a',
    design,
    device = 'mobile',
    eventSlug,
}: {
    visible: boolean;
    background?: string;
    accent?: string;
    design?: GalleryDesign | null;
    device?: PreviewDevice;
    eventSlug?: string;
}) {
    const slug = eventSlug ?? design?.event_type ?? 'custom';
    const weddingSite = slug === 'wedding' && design?.kind === 'link';
    const birthdaySite = slug === 'birthday' && design?.kind === 'link';
    const corporateSite = (slug === 'corporate' || slug === 'corporate-event') && design?.kind === 'link';
    const babyShowerSite = slug === 'baby-shower' && design?.kind === 'link';
    const partySite = slug === 'party' && design?.kind === 'link';
    const bridalShowerSite = slug === 'bridal-shower' && design?.kind === 'link';
    const graduationSite = slug === 'graduation' && design?.kind === 'link';
    const housewarmingSite = slug === 'housewarming' && design?.kind === 'link';
    const customSite = slug === 'custom' && design?.kind === 'link';
    const photo = weddingSite && design
        ? weddingHeroSrc(design.style_key, device)
        : birthdaySite && design
            ? birthdayHeroSrc(design.style_key, device)
            : corporateSite && design
                ? corporateHeroSrc(design.style_key, device)
                : babyShowerSite && design
                    ? babyShowerHeroSrc(design.style_key, device)
                    : partySite && design
                        ? partyHeroSrc(design.style_key, device)
                        : bridalShowerSite && design
                            ? bridalShowerHeroSrc(design.style_key, device)
                            : graduationSite && design
                                ? graduationHeroSrc(design.style_key, device)
                                : housewarmingSite && design
                                    ? housewarmingHeroSrc(design.style_key, device)
                                    : customSite && design
                                        ? customHeroSrc(design.style_key, device)
                                        : (design?.image ?? null);
    const sample = design?.sample;
    const kicker = weddingSite
        ? WEDDING_SAMPLE.kicker
        : birthdaySite
            ? BIRTHDAY_SAMPLE.kicker
            : corporateSite
                ? CORPORATE_SAMPLE.kicker
                : babyShowerSite
                    ? BABY_SHOWER_SAMPLE.kicker
                    : partySite
                        ? PARTY_SAMPLE.kicker
                        : bridalShowerSite
                            ? BRIDAL_SHOWER_SAMPLE.kicker
                            : graduationSite
                                ? GRADUATION_SAMPLE.kicker
                                : housewarmingSite
                                    ? HOUSEWARMING_SAMPLE.kicker
                                    : customSite
                                        ? CUSTOM_SAMPLE.kicker
                                        : (sample?.kicker || 'You are invited');
    const names = weddingSite
        ? `${WEDDING_SAMPLE.groom} & ${WEDDING_SAMPLE.bride}`
        : birthdaySite
            ? `${BIRTHDAY_SAMPLE.name} ${BIRTHDAY_SAMPLE.ageLine}`
            : corporateSite
                ? `${CORPORATE_SAMPLE.company} ${CORPORATE_SAMPLE.eventName}`
                : babyShowerSite
                    ? `${BABY_SHOWER_SAMPLE.name} ${BABY_SHOWER_SAMPLE.eventName}`
                    : partySite
                        ? `${PARTY_SAMPLE.name} ${PARTY_SAMPLE.eventName}`
                        : bridalShowerSite
                            ? `${BRIDAL_SHOWER_SAMPLE.name} ${BRIDAL_SHOWER_SAMPLE.eventName}`
                            : graduationSite
                                ? `${GRADUATION_SAMPLE.name} ${GRADUATION_SAMPLE.eventName}`
                                : housewarmingSite
                                    ? `${HOUSEWARMING_SAMPLE.name} ${HOUSEWARMING_SAMPLE.eventName}`
                                    : customSite
                                        ? `${CUSTOM_SAMPLE.name} ${CUSTOM_SAMPLE.eventName}`
                                        : (sample?.hosts || design?.name || 'You are invited');
    const lines = weddingSite
        ? { first: WEDDING_SAMPLE.groom, second: WEDDING_SAMPLE.bride, joiner: true }
        : birthdaySite
            ? { first: BIRTHDAY_SAMPLE.name, second: BIRTHDAY_SAMPLE.ageLine, joiner: false }
            : corporateSite
                ? { first: CORPORATE_SAMPLE.company, second: CORPORATE_SAMPLE.eventName, joiner: false }
                : babyShowerSite
                    ? { first: BABY_SHOWER_SAMPLE.name, second: BABY_SHOWER_SAMPLE.eventName, joiner: false }
                    : partySite
                        ? { first: PARTY_SAMPLE.name, second: PARTY_SAMPLE.eventName, joiner: false }
                        : bridalShowerSite
                            ? { first: BRIDAL_SHOWER_SAMPLE.name, second: BRIDAL_SHOWER_SAMPLE.eventName, joiner: false }
                            : graduationSite
                                ? { first: GRADUATION_SAMPLE.name, second: GRADUATION_SAMPLE.eventName, joiner: false }
                                : housewarmingSite
                                    ? { first: HOUSEWARMING_SAMPLE.name, second: HOUSEWARMING_SAMPLE.eventName, joiner: false }
                                    : customSite
                                        ? { first: CUSTOM_SAMPLE.name, second: CUSTOM_SAMPLE.eventName, joiner: false }
                                        : { ...hostLines(names), joiner: true };
    const message = weddingSite
        ? WEDDING_SAMPLE.message
        : birthdaySite
            ? BIRTHDAY_SAMPLE.message
            : corporateSite
                ? CORPORATE_SAMPLE.message
                : babyShowerSite
                    ? BABY_SHOWER_SAMPLE.message
                    : partySite
                        ? PARTY_SAMPLE.message
                        : bridalShowerSite
                            ? BRIDAL_SHOWER_SAMPLE.message
                            : graduationSite
                                ? GRADUATION_SAMPLE.message
                                : housewarmingSite
                                    ? HOUSEWARMING_SAMPLE.message
                                    : customSite
                                        ? CUSTOM_SAMPLE.message
                                        : null;
    const eventLine = weddingSite
        ? WEDDING_SAMPLE.eventLine
        : birthdaySite
            ? BIRTHDAY_SAMPLE.eventLine
            : corporateSite
                ? CORPORATE_SAMPLE.eventLine
                : babyShowerSite
                    ? BABY_SHOWER_SAMPLE.eventLine
                    : partySite
                        ? PARTY_SAMPLE.eventLine
                        : bridalShowerSite
                            ? BRIDAL_SHOWER_SAMPLE.eventLine
                            : graduationSite
                                ? GRADUATION_SAMPLE.eventLine
                                : housewarmingSite
                                    ? HOUSEWARMING_SAMPLE.eventLine
                                    : customSite
                                        ? CUSTOM_SAMPLE.eventLine
                                        : (sample?.when || design?.style || '');
    const grade = EVENT_GRADE[slug] ?? EVENT_GRADE.custom;

    return (
        <div
            className={cn(
                'preview-opener absolute inset-0 z-[26] overflow-hidden transition-opacity duration-700',
                visible ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            style={{ backgroundColor: background, ['--preview-accent' as string]: accent }}
            role="status"
            aria-live="polite"
            aria-hidden={!visible}
        >
            {photo ? (
                <img src={photo} alt="" className="preview-opener-photo absolute inset-0 h-full w-full object-cover" />
            ) : (
                <div
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(120% 80% at 50% 20%, ${accent}55, ${background} 62%)`,
                    }}
                />
            )}
            <div className={cn('absolute inset-0', grade)} />
            <div className="pointer-events-none absolute inset-0">
                {OPENER_SPECKS.map((speck, index) => (
                    <span
                        key={index}
                        className="preview-opener-speck"
                        style={{
                            left: speck.left,
                            width: speck.size,
                            height: speck.size,
                            ['--speck-delay' as string]: speck.delay,
                            ['--speck-dur' as string]: speck.duration,
                            ['--speck-x' as string]: speck.drift,
                        }}
                    />
                ))}
            </div>
            <div className="relative z-[1] flex h-full flex-col items-center justify-center px-8 text-center text-white">
                <p className="preview-opener-kicker text-[10px] tracking-[0.38em] uppercase opacity-90">{kicker}</p>
                <h2 className="preview-opener-names mt-5 font-serif font-light tracking-tight">
                    <span className="block text-[2.7rem] leading-none sm:text-[3.4rem]">{lines.first}</span>
                    {lines.second ? (
                        <>
                            {lines.joiner ? <span className="mt-2 block font-serif text-[1.2rem] italic opacity-80">&</span> : null}
                            <span className={cn('mt-2 block italic opacity-90', lines.joiner ? 'text-[2.7rem] leading-none sm:text-[3.4rem]' : 'text-[1.45rem] sm:text-[1.7rem]')}>
                                {lines.second}
                            </span>
                        </>
                    ) : null}
                </h2>
                {message ? (
                    <p className="preview-opener-message mt-6 max-w-md font-serif text-[14px] leading-7 italic text-white/88">{message}</p>
                ) : null}
                {eventLine ? (
                    <p className="preview-opener-line mt-5 text-[11px] tracking-[0.22em] text-white/90 uppercase">{eventLine}</p>
                ) : null}
                <p className="preview-opener-mark mt-10 font-serif text-[11px] tracking-[0.42em] text-[var(--preview-accent,#c6a36a)] uppercase">Opening</p>
            </div>
            <span className="sr-only">{visible ? 'Opening preview' : 'Preview ready'}</span>
        </div>
    );
}
