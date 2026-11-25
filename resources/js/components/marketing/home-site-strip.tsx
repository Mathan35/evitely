import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { GalleryLazyImage } from '@/components/marketing/gallery-lazy-image';
import { PreviewLoader } from '@/components/marketing/preview-effects';
import { cn } from '@/lib/utils';
import type { GalleryDesign } from '@/types/gallery';

const GalleryWebsiteCanvas = lazy(() =>
    import('@/components/studio/gallery-website-canvas').then((m) => ({
        default: m.GalleryWebsiteCanvas,
    })),
);

function prefetchGalleryCanvas(): void {
    void import('@/components/studio/gallery-website-canvas');
}

export type HomeSiteDesign = {
    id: string;
    name: string;
    kind: string;
    occasion: string;
    occasion_name: string;
    image: string;
    href: string;
    customize_href: string;
    site?: GalleryDesign;
};

const TILE_WIDTH = 'w-[11.5rem] sm:w-[13.5rem]';

function canHoverPreview(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function SiteCardHoverPreview({
    design,
    occasionSlug,
    active,
}: {
    design: GalleryDesign;
    occasionSlug: string;
    active: boolean;
}) {
    const [openerVisible, setOpenerVisible] = useState(true);
    const scrollRootRef = useRef<HTMLDivElement>(null);
    const tourRef = useRef<number | null>(null);

    useEffect(() => {
        if (!active) {
            setOpenerVisible(true);
            return;
        }

        setOpenerVisible(true);
        const hideOpener = window.setTimeout(() => setOpenerVisible(false), 1700);

        return () => window.clearTimeout(hideOpener);
    }, [active, design.id]);

    useEffect(() => {
        if (!active || openerVisible) {
            if (tourRef.current !== null) {
                window.clearInterval(tourRef.current);
                tourRef.current = null;
            }
            return;
        }

        const startTour = () => {
            const root = scrollRootRef.current;
            if (!root) {
                return;
            }

            const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-preview-reveal]'));
            sections.forEach((node) => node.classList.add('is-in'));

            const pane =
                root.querySelector<HTMLElement>('[class*="overflow-y"]') ??
                (root.querySelector<HTMLElement>('.preview-reveal')?.parentElement as HTMLElement | null) ??
                root;

            if (sections.length === 0) {
                return;
            }

            let index = 0;
            const step = () => {
                const target = sections[index % sections.length];
                if (!target) {
                    return;
                }

                if (pane && typeof pane.scrollTo === 'function') {
                    pane.scrollTo({ top: Math.max(0, target.offsetTop - 8), behavior: 'smooth' });
                } else {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                index += 1;
            };

            step();
            tourRef.current = window.setInterval(step, 2200);
        };

        const kickoff = window.setTimeout(startTour, 280);

        return () => {
            window.clearTimeout(kickoff);
            if (tourRef.current !== null) {
                window.clearInterval(tourRef.current);
                tourRef.current = null;
            }
        };
    }, [active, openerVisible, design.id]);

    if (!active) {
        return null;
    }

    return (
        <div
            className={cn(
                'pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[1.1rem]',
                'origin-center scale-[1.08] transition-transform duration-500 ease-out',
            )}
            aria-hidden
        >
            <div ref={scrollRootRef} className="absolute inset-0 bg-[#1c1814]">
                {/* Scaled live site fills the square tile */}
                <div className="absolute top-0 left-1/2 h-[720px] w-[400px] origin-top -translate-x-1/2 scale-[0.48] sm:scale-[0.54]">
                    <div className="h-full w-full overflow-hidden bg-[#f6f1e8]">
                        <Suspense fallback={<div className="h-full w-full bg-[#f6f1e8]" aria-hidden />}>
                            <GalleryWebsiteCanvas
                                design={design}
                                slug={occasionSlug}
                                device="mobile"
                                framed
                                intro={false}
                                interactive={false}
                                showInvitationCard={false}
                            />
                        </Suspense>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 z-[26] overflow-hidden [&_.preview-opener-kicker]:!text-[8px] [&_.preview-opener-line]:!mt-3 [&_.preview-opener-line]:!text-[8px] [&_.preview-opener-mark]:!mt-5 [&_.preview-opener-mark]:!text-[9px] [&_.preview-opener-message]:!hidden [&_.preview-opener-names]:!mt-3 [&_.preview-opener-names_span]:!text-[1.35rem] sm:[&_.preview-opener-names_span]:!text-[1.55rem]">
                <PreviewLoader
                    visible={openerVisible}
                    design={design}
                    device="mobile"
                    eventSlug={occasionSlug}
                    background={design.palette?.paper || '#f4efe6'}
                    accent={design.palette?.gold || '#c6a36a'}
                />
            </div>
        </div>
    );
}

function HomeSiteTile({
    design,
    active,
    onActivate,
    onDeactivate,
}: {
    design: HomeSiteDesign;
    active: boolean;
    onActivate: () => void;
    onDeactivate: () => void;
}) {
    const site = design.site;
    const cover = site?.image_mobile || site?.image || design.image;
    const styleLabel = site?.style || 'Event website';

    return (
        <article
            className={cn(
                TILE_WIDTH,
                'group flex shrink-0 snap-start flex-col rounded-[1.2rem] border border-[#2b241c]/8 bg-white p-1.5 shadow-[0_16px_36px_-28px_rgba(43,36,28,0.85)] transition duration-300',
                'hover:-translate-y-0.5 hover:border-[#c6a36a]/35 hover:shadow-[0_22px_44px_-26px_rgba(43,36,28,0.7)]',
                'sm:rounded-[1.45rem] sm:p-2.5',
                active && 'border-[#c6a36a]/45',
            )}
            onMouseEnter={() => {
                if (canHoverPreview() && site) {
                    prefetchGalleryCanvas();
                    onActivate();
                }
            }}
            onMouseLeave={onDeactivate}
        >
            <button
                type="button"
                className="relative aspect-square w-full overflow-hidden rounded-[1.1rem] bg-[#f3ebe1] text-left"
                onClick={() => {
                    if (!site) {
                        return;
                    }
                    if (active) {
                        onDeactivate();
                    } else {
                        onActivate();
                    }
                }}
                aria-label={`${design.name} site preview`}
                aria-pressed={active}
            >
                {cover ? (
                    <GalleryLazyImage
                        src={cover}
                        alt=""
                        className={cn(
                            'h-full w-full object-cover object-center transition duration-500 ease-out',
                            active ? 'scale-105 opacity-0' : 'scale-100 opacity-100 group-hover:scale-[1.04]',
                        )}
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className="grid h-full place-items-center bg-[#efe6d8] text-xs text-[#8a7d6e]">Site</div>
                )}

                {site ? <SiteCardHoverPreview design={site} occasionSlug={design.occasion} active={active} /> : null}
            </button>

            <div className="mt-3 flex flex-1 flex-col px-1 pb-0.5">
                <p className="text-[10px] tracking-[0.16em] text-[#8a7d6e] uppercase">{design.occasion_name}</p>
                <h3 className="mt-1 line-clamp-2 text-[13px] leading-5 font-medium text-[#1c1814] sm:text-[15px]">
                    {design.name}
                </h3>
                <p className="mt-1 truncate text-[12px] leading-4 tracking-wide text-[#c6a36a]">{styleLabel}</p>
                <Link
                    href={design.href}
                    className="mt-3 inline-flex h-9 items-center justify-center rounded-full border border-[#2b241c]/12 bg-white px-2.5 text-[11px] font-medium tracking-wide text-[#2b241c] transition hover:border-[#c6a36a]/50"
                >
                    View design
                </Link>
            </div>
        </article>
    );
}

export function HomeSiteStrip({ designs }: { designs: HomeSiteDesign[] }) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);

    const updateArrows = () => {
        const node = scrollerRef.current;
        if (!node) return;
        const max = node.scrollWidth - node.clientWidth;
        setCanPrev(node.scrollLeft > 8);
        setCanNext(node.scrollLeft < max - 8);
    };

    useEffect(() => {
        const node = scrollerRef.current;
        if (!node) return;
        updateArrows();
        node.addEventListener('scroll', updateArrows, { passive: true });
        window.addEventListener('resize', updateArrows);
        return () => {
            node.removeEventListener('scroll', updateArrows);
            window.removeEventListener('resize', updateArrows);
        };
    }, [designs.length]);

    const scrollByDir = (dir: -1 | 1) => {
        const node = scrollerRef.current;
        if (!node) return;
        const amount = Math.max(220, Math.round(node.clientWidth * 0.72)) * dir;
        node.scrollBy({ left: amount, behavior: 'smooth' });
    };

    const arrowClass =
        'pointer-events-auto absolute top-[5.75rem] z-10 grid size-9 place-items-center rounded-full border border-[#e7dcc8] bg-white/95 text-[#241c16] shadow-[0_8px_20px_-10px_rgba(43,36,28,0.55)] backdrop-blur-sm transition enabled:hover:border-[#c6a36a] enabled:hover:text-[#c6a36a] disabled:cursor-not-allowed disabled:opacity-30 sm:top-[6.5rem] sm:size-10';

    return (
        <section className="border-y border-[#e7dcc8]/80 bg-[#faf6ef]/70 py-16 sm:py-20" aria-labelledby="design-strip-heading">
            <div className="mx-auto max-w-6xl px-3 sm:px-4">
                <p className="text-center text-xs tracking-[0.22em] text-[#8a7d6e] uppercase">Design gallery</p>
                <h2 id="design-strip-heading" className="mt-3 text-center font-serif text-4xl sm:text-5xl">
                    Guest websites for every occasion
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-[#5e554c]">
                    Same site cards as Designs — hover to watch the invite open inside the card.
                </p>

                <div className="relative mt-10">
                    <button
                        type="button"
                        aria-label="Previous designs"
                        disabled={!canPrev}
                        onClick={() => scrollByDir(-1)}
                        className={cn(arrowClass, 'left-0 -translate-x-1/2')}
                    >
                        <ChevronLeft className="size-4 sm:size-5" />
                    </button>

                    <div
                        ref={scrollerRef}
                        className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
                    >
                        {designs.map((design) => (
                            <HomeSiteTile
                                key={`${design.occasion}-${design.id}`}
                                design={design}
                                active={activeId === design.id}
                                onActivate={() => setActiveId(design.id)}
                                onDeactivate={() => setActiveId((current) => (current === design.id ? null : current))}
                            />
                        ))}

                        <Link
                            href="/designs"
                            className={cn(
                                TILE_WIDTH,
                                'flex shrink-0 snap-start flex-col justify-center rounded-[1.2rem] border border-dashed border-[#c6a36a]/50 bg-white/70 px-4 py-8 text-center sm:rounded-[1.45rem]',
                            )}
                        >
                            <span className="font-serif text-xl text-[#241c16] sm:text-2xl">All designs</span>
                            <span className="mt-2 text-sm text-[#5e554c]">Browse every occasion →</span>
                        </Link>
                    </div>

                    <button
                        type="button"
                        aria-label="Next designs"
                        disabled={!canNext}
                        onClick={() => scrollByDir(1)}
                        className={cn(arrowClass, 'right-0 translate-x-1/2')}
                    >
                        <ChevronRight className="size-4 sm:size-5" />
                    </button>
                </div>
            </div>
        </section>
    );
}
