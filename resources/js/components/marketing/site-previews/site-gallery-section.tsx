import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { liveGalleryMediaStyle } from '@/components/marketing/site-previews/preview-live';
import {
    resolveGalleryStyleId,
    type GalleryStyleId,
} from '@/lib/gallery-section-styles';
import { previewOverlayClass } from '@/lib/preview-shell';
import { cn } from '@/lib/utils';

export type SiteGalleryPhoto = {
    id?: string;
    title: string;
    note: string;
    src: string;
    span?: 'hero' | 'tall' | 'wide' | 'square';
    zoom?: number;
    position_x?: number;
    position_y?: number;
};

type SiteGallerySectionProps = {
    photos: SiteGalleryPhoto[];
    styleId?: string | null;
    desktop?: boolean;
    framed?: boolean;
    className?: string;
};

function photoKey(photo: SiteGalleryPhoto, index: number): string {
    return `${photo.id || photo.src}-${index}`;
}

function Caption({
    title,
    note,
    className,
}: {
    title: string;
    note: string;
    className?: string;
}) {
    return (
        <span className={cn('absolute inset-x-0 bottom-0 p-3.5 text-white', className)}>
            <span className="block font-serif text-[1.15rem] leading-none font-light">{title}</span>
            {note ? (
                <span className="mt-1.5 block text-[10px] tracking-[0.16em] text-white/80 uppercase">{note}</span>
            ) : null}
        </span>
    );
}

function TileImage({ photo, className }: { photo: SiteGalleryPhoto; className?: string }) {
    return (
        <img
            key={photo.src}
            src={photo.src}
            alt={photo.title}
            className={cn('preview-zoom-media absolute inset-0 h-full w-full object-cover', className)}
            style={liveGalleryMediaStyle(photo)}
            draggable={false}
        />
    );
}

function MosaicLayout({
    photos,
    desktop,
    onOpen,
}: {
    photos: SiteGalleryPhoto[];
    desktop?: boolean;
    onOpen: (index: number) => void;
}) {
    return (
        <div className={cn('grid grid-cols-2 gap-2.5', desktop && 'grid-cols-6 gap-3')}>
            {photos.map((photo, index) => (
                <button
                    key={photoKey(photo, index)}
                    type="button"
                    onClick={() => onOpen(index)}
                    className={cn(
                        'group relative overflow-hidden rounded-[1.15rem] bg-[var(--w-surface)] text-left shadow-[0_18px_36px_-24px_rgba(28,24,20,0.55)] ring-1 ring-[var(--w-accent)]/12',
                        photo.span === 'hero' && (desktop ? 'col-span-4 row-span-2 min-h-[22rem]' : 'col-span-2 min-h-[13.5rem]'),
                        photo.span === 'tall' && (desktop ? 'col-span-2 min-h-[22rem]' : 'min-h-[15rem]'),
                        photo.span === 'wide' && (desktop ? 'col-span-3 min-h-[12.5rem]' : 'col-span-2 min-h-[10.5rem]'),
                        (!photo.span || photo.span === 'square') && (desktop ? 'col-span-2 min-h-[12.5rem]' : 'min-h-[10.5rem]'),
                    )}
                >
                    <TileImage photo={photo} />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90" />
                    <Caption title={photo.title} note={photo.note} />
                </button>
            ))}
        </div>
    );
}

function MasonryLayout({
    photos,
    desktop,
    onOpen,
}: {
    photos: SiteGalleryPhoto[];
    desktop?: boolean;
    onOpen: (index: number) => void;
}) {
    return (
        <div className={cn('columns-2 gap-2.5', desktop && 'columns-3 gap-3')}>
            {photos.map((photo, index) => {
                const tall = photo.span === 'tall' || photo.span === 'hero';
                return (
                    <button
                        key={photoKey(photo, index)}
                        type="button"
                        onClick={() => onOpen(index)}
                        className={cn(
                            'group relative mb-2.5 block w-full break-inside-avoid overflow-hidden rounded-[1.1rem] bg-[var(--w-surface)] text-left shadow-[0_16px_32px_-22px_rgba(28,24,20,0.5)] ring-1 ring-[var(--w-accent)]/12',
                            desktop && 'mb-3',
                            tall ? 'aspect-[3/4]' : photo.span === 'wide' ? 'aspect-[16/10]' : 'aspect-[4/5]',
                        )}
                    >
                        <TileImage photo={photo} />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-80 transition group-hover:opacity-95" />
                        <Caption title={photo.title} note={photo.note} />
                    </button>
                );
            })}
        </div>
    );
}

function CarouselLayout({
    photos,
    desktop,
    onOpen,
}: {
    photos: SiteGalleryPhoto[];
    desktop?: boolean;
    onOpen: (index: number) => void;
}) {
    const scrollerRef = useRef<HTMLDivElement>(null);

    const scrollBy = (dir: -1 | 1) => {
        const node = scrollerRef.current;
        if (!node) return;
        const amount = Math.max(220, node.clientWidth * 0.72) * dir;
        node.scrollBy({ left: amount, behavior: 'smooth' });
    };

    return (
        <div className="relative">
            <div
                ref={scrollerRef}
                className={cn(
                    'site-gallery-carousel flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    desktop && 'gap-4',
                )}
            >
                {photos.map((photo, index) => (
                    <button
                        key={photoKey(photo, index)}
                        type="button"
                        onClick={() => onOpen(index)}
                        className={cn(
                            'group relative aspect-[4/5] w-[78%] max-w-[18rem] shrink-0 snap-center overflow-hidden rounded-[1.25rem] bg-[var(--w-surface)] text-left shadow-[0_20px_40px_-24px_rgba(28,24,20,0.55)] ring-1 ring-[var(--w-accent)]/14',
                            desktop && 'w-[42%] max-w-[22rem] snap-start',
                        )}
                    >
                        <TileImage photo={photo} />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                        <Caption title={photo.title} note={photo.note} />
                    </button>
                ))}
            </div>
            {photos.length > 1 ? (
                <div className="pointer-events-none absolute inset-y-0 right-0 left-0 flex items-center justify-between px-1">
                    <button
                        type="button"
                        aria-label="Scroll gallery left"
                        className="pointer-events-auto grid size-9 place-items-center rounded-full bg-[var(--w-ink)]/70 text-white shadow-lg backdrop-blur-sm transition hover:bg-[var(--w-ink)]"
                        onClick={() => scrollBy(-1)}
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Scroll gallery right"
                        className="pointer-events-auto grid size-9 place-items-center rounded-full bg-[var(--w-ink)]/70 text-white shadow-lg backdrop-blur-sm transition hover:bg-[var(--w-ink)]"
                        onClick={() => scrollBy(1)}
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            ) : null}
        </div>
    );
}

function HoverboardLayout({
    photos,
    desktop,
    onOpen,
}: {
    photos: SiteGalleryPhoto[];
    desktop?: boolean;
    onOpen: (index: number) => void;
}) {
    return (
        <div className={cn('grid grid-cols-2 gap-3', desktop && 'grid-cols-3 gap-4')}>
            {photos.map((photo, index) => (
                <button
                    key={photoKey(photo, index)}
                    type="button"
                    onClick={() => onOpen(index)}
                    className="group relative aspect-[4/5] overflow-hidden rounded-[1.2rem] bg-[var(--w-surface)] text-left shadow-[0_14px_30px_-20px_rgba(28,24,20,0.45)] ring-1 ring-[var(--w-accent)]/10 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-22px_rgba(28,24,20,0.55)]"
                >
                    <TileImage photo={photo} className="transition duration-500 group-hover:scale-[1.06]" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 transition duration-300 group-hover:opacity-95" />
                    <span className="absolute inset-x-0 bottom-0 translate-y-2 p-3.5 text-white opacity-90 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className="block font-serif text-[1.1rem] leading-none font-light">{photo.title}</span>
                        <span className="mt-1.5 block max-h-0 overflow-hidden text-[10px] tracking-[0.16em] text-white/80 uppercase transition-all duration-300 group-hover:max-h-8">
                            {photo.note}
                        </span>
                    </span>
                </button>
            ))}
        </div>
    );
}

function AutoCarouselLayout({
    photos,
    desktop,
    onOpen,
}: {
    photos: SiteGalleryPhoto[];
    desktop?: boolean;
    onOpen: (index: number) => void;
}) {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [fadeKey, setFadeKey] = useState(0);

    useEffect(() => {
        setActive(0);
        setFadeKey((value) => value + 1);
    }, [photos.length, photos[0]?.src]);

    useEffect(() => {
        if (photos.length < 2 || paused) {
            return;
        }
        const timer = window.setInterval(() => {
            setActive((current) => (current + 1) % photos.length);
            setFadeKey((value) => value + 1);
        }, 4200);
        return () => window.clearInterval(timer);
    }, [photos.length, paused]);

    const goTo = (next: number) => {
        setActive(((next % photos.length) + photos.length) % photos.length);
        setFadeKey((value) => value + 1);
    };

    const current = photos[active];
    if (!current) {
        return null;
    }

    return (
        <div
            className="site-gallery-autocarousel space-y-3"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setPaused(false);
                }
            }}
        >
            <div
                className={cn(
                    'relative w-full overflow-hidden rounded-[1.35rem] bg-[var(--w-surface)] shadow-[0_22px_48px_-28px_rgba(28,24,20,0.55)] ring-1 ring-[var(--w-accent)]/14',
                    desktop ? 'aspect-[16/9] min-h-[22rem]' : 'aspect-[4/5] min-h-[16rem]',
                )}
            >
                <button
                    key={`${photoKey(current, active)}-${fadeKey}`}
                    type="button"
                    onClick={() => onOpen(active)}
                    className="site-gallery-slide absolute inset-0 text-left"
                    aria-label={`Open ${current.title}`}
                >
                    <TileImage photo={current} />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <Caption title={current.title} note={current.note} className="p-5 sm:p-7" />
                </button>

                {photos.length > 1 ? (
                    <>
                        <button
                            type="button"
                            aria-label="Previous slide"
                            className="absolute top-1/2 left-3 z-[2] grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
                            onClick={() => goTo(active - 1)}
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next slide"
                            className="absolute top-1/2 right-3 z-[2] grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
                            onClick={() => goTo(active + 1)}
                        >
                            <ChevronRight className="size-4" />
                        </button>
                        <div className="absolute inset-x-0 bottom-3 z-[2] flex items-center justify-center gap-1.5">
                            {photos.map((photo, index) => (
                                <button
                                    key={photoKey(photo, index)}
                                    type="button"
                                    aria-label={`Go to slide ${index + 1}`}
                                    aria-current={index === active}
                                    onClick={() => goTo(index)}
                                    className={cn(
                                        'h-1.5 rounded-full transition-all duration-300',
                                        index === active ? 'w-6 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/70',
                                    )}
                                />
                            ))}
                        </div>
                        <span className="absolute top-3 left-3 z-[2] rounded-full bg-black/40 px-2.5 py-1 text-[10px] tracking-[0.16em] text-white/90 uppercase backdrop-blur-sm">
                            {paused ? 'Paused' : 'Auto'}
                        </span>
                    </>
                ) : null}
            </div>
        </div>
    );
}

function PolaroidLayout({
    photos,
    desktop,
    onOpen,
}: {
    photos: SiteGalleryPhoto[];
    desktop?: boolean;
    onOpen: (index: number) => void;
}) {
    const tilts = [-3.5, 2.5, -1.8, 3.2, -2.6, 1.6, -3, 2.2];

    return (
        <div className={cn('grid grid-cols-2 gap-4', desktop && 'grid-cols-4 gap-5')}>
            {photos.map((photo, index) => (
                <button
                    key={photoKey(photo, index)}
                    type="button"
                    onClick={() => onOpen(index)}
                    style={{ transform: `rotate(${tilts[index % tilts.length]}deg)` }}
                    className="group relative bg-[#f7f3ec] p-2.5 pb-9 text-left shadow-[0_18px_36px_-20px_rgba(40,28,18,0.45)] transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_26px_48px_-18px_rgba(40,28,18,0.5)]"
                >
                    <span className="relative block aspect-[4/5] overflow-hidden bg-[var(--w-surface)]">
                        <TileImage photo={photo} />
                    </span>
                    <span className="absolute inset-x-2 bottom-2 truncate text-center font-serif text-[12px] text-[var(--w-ink)]/80">
                        {photo.title}
                    </span>
                </button>
            ))}
        </div>
    );
}

function SalonLayout({
    photos,
    desktop,
    onOpen,
}: {
    photos: SiteGalleryPhoto[];
    desktop?: boolean;
    onOpen: (index: number) => void;
}) {
    return (
        <div className={cn('grid grid-cols-2 gap-3', desktop && 'grid-cols-3 gap-5')}>
            {photos.map((photo, index) => (
                <button
                    key={photoKey(photo, index)}
                    type="button"
                    onClick={() => onOpen(index)}
                    className="group relative overflow-hidden rounded-[0.35rem] bg-[var(--w-surface)] p-2 text-left shadow-[0_14px_28px_-18px_rgba(28,24,20,0.4)] ring-1 ring-[var(--w-accent)]/25 transition hover:ring-[var(--w-accent)]/55"
                >
                    <span className="relative block aspect-[5/6] overflow-hidden ring-1 ring-[var(--w-ink)]/8">
                        <TileImage photo={photo} />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                        <span className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                            <span className="block font-serif text-[1.05rem] font-light">{photo.title}</span>
                        </span>
                    </span>
                </button>
            ))}
        </div>
    );
}

function CascadeLayout({
    photos,
    desktop,
    onOpen,
}: {
    photos: SiteGalleryPhoto[];
    desktop?: boolean;
    onOpen: (index: number) => void;
}) {
    return (
        <div className={cn('grid grid-cols-2 gap-2.5', desktop && 'gap-4')}>
            {photos.map((photo, index) => (
                <button
                    key={photoKey(photo, index)}
                    type="button"
                    onClick={() => onOpen(index)}
                    style={
                        {
                            marginTop: desktop ? (index % 2 === 1 ? '2.75rem' : 0) : index % 2 === 1 ? '1.35rem' : 0,
                        } as CSSProperties
                    }
                    className={cn(
                        'group relative overflow-hidden rounded-[1.2rem] bg-[var(--w-surface)] text-left shadow-[0_18px_36px_-24px_rgba(28,24,20,0.5)] ring-1 ring-[var(--w-accent)]/12',
                        photo.span === 'tall' || photo.span === 'hero' ? 'aspect-[3/4]' : 'aspect-[4/5]',
                    )}
                >
                    <TileImage photo={photo} />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <Caption title={photo.title} note={photo.note} />
                </button>
            ))}
        </div>
    );
}

function StripLayout({
    photos,
    desktop,
    onOpen,
}: {
    photos: SiteGalleryPhoto[];
    desktop?: boolean;
    onOpen: (index: number) => void;
}) {
    const [active, setActive] = useState(0);
    const current = photos[active] ?? photos[0];

    useEffect(() => {
        setActive(0);
    }, [photos.length, photos[0]?.src]);

    if (!current) return null;

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => onOpen(active)}
                className={cn(
                    'group relative w-full overflow-hidden rounded-[1.3rem] bg-[var(--w-surface)] text-left ring-1 ring-[var(--w-accent)]/14',
                    desktop ? 'aspect-[16/10] min-h-[20rem]' : 'aspect-[4/5] min-h-[15rem]',
                )}
            >
                <TileImage photo={current} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <Caption title={current.title} note={current.note} className="p-5" />
                <span className="absolute top-3 right-3 rounded-full bg-black/45 px-3 py-1 text-[10px] tracking-[0.16em] text-white/90 uppercase backdrop-blur-sm">
                    Tap for lightbox
                </span>
            </button>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {photos.map((photo, index) => (
                    <button
                        key={photoKey(photo, index)}
                        type="button"
                        onClick={() => setActive(index)}
                        onDoubleClick={() => onOpen(index)}
                        className={cn(
                            'relative aspect-square w-[4.5rem] shrink-0 overflow-hidden rounded-lg ring-2 transition sm:w-[5.25rem]',
                            active === index ? 'ring-[var(--w-accent)]' : 'ring-transparent opacity-80 hover:opacity-100',
                        )}
                    >
                        <TileImage photo={photo} />
                    </button>
                ))}
            </div>
        </div>
    );
}

function StackLayout({
    photos,
    desktop,
    onOpen,
}: {
    photos: SiteGalleryPhoto[];
    desktop?: boolean;
    onOpen: (index: number) => void;
}) {
    const visible = photos.slice(0, Math.min(photos.length, desktop ? 6 : 5));

    return (
        <div className={cn('relative mx-auto', desktop ? 'h-[28rem] max-w-3xl' : 'h-[22rem] max-w-sm')}>
            {visible.map((photo, index) => {
                const offset = index - Math.floor(visible.length / 2);
                return (
                    <button
                        key={photoKey(photo, index)}
                        type="button"
                        onClick={() => onOpen(index)}
                        style={
                            {
                                zIndex: 10 + index,
                                transform: desktop
                                    ? `translateX(${offset * 4.6}rem) translateY(${Math.abs(offset) * 0.55}rem) rotate(${offset * 4}deg)`
                                    : `translateY(${index * 1.15}rem) scale(${1 - index * 0.03})`,
                            } as CSSProperties
                        }
                        className={cn(
                            'group absolute inset-x-0 top-0 mx-auto overflow-hidden rounded-[1.25rem] bg-[var(--w-surface)] text-left shadow-[0_22px_44px_-24px_rgba(28,24,20,0.55)] ring-1 ring-[var(--w-accent)]/16 transition duration-300 hover:z-50 hover:scale-[1.03]',
                            desktop ? 'aspect-[4/5] w-[14.5rem]' : 'aspect-[4/5] w-[85%]',
                        )}
                    >
                        <TileImage photo={photo} />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                        <Caption title={photo.title} note={photo.note} />
                    </button>
                );
            })}
            {photos.length > visible.length ? (
                <p className="absolute inset-x-0 bottom-0 text-center text-[11px] tracking-[0.18em] text-[var(--w-muted)] uppercase">
                    +{photos.length - visible.length} more in lightbox
                </p>
            ) : null}
        </div>
    );
}

function GalleryLightbox({
    photos,
    index,
    framed,
    onClose,
    onChange,
}: {
    photos: SiteGalleryPhoto[];
    index: number;
    framed?: boolean;
    onClose: () => void;
    onChange: (next: number) => void;
}) {
    const photo = photos[index];
    const [slideKey, setSlideKey] = useState(0);

    useEffect(() => {
        setSlideKey((value) => value + 1);
    }, [index, photo?.src]);

    if (!photo) return null;

    return (
        <div className={previewOverlayClass(framed, 'site-gallery-lightbox z-50 flex flex-col bg-[#140f0c]/94')}>
            <div className="flex items-center justify-between px-4 py-3 text-white">
                <p key={`title-${slideKey}`} className="site-gallery-lightbox__meta font-serif text-lg font-light">
                    {photo.title}
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close gallery"
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="relative min-h-0 flex-1">
                <img
                    key={`img-${slideKey}`}
                    src={photo.src}
                    alt={photo.title}
                    className="site-gallery-lightbox__image h-full w-full object-contain"
                />
                {photos.length > 1 ? (
                    <>
                        <button
                            type="button"
                            aria-label="Previous photo"
                            className="absolute top-1/2 left-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white transition hover:bg-black/60"
                            onClick={() => onChange((index + photos.length - 1) % photos.length)}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next photo"
                            className="absolute top-1/2 right-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white transition hover:bg-black/60"
                            onClick={() => onChange((index + 1) % photos.length)}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                ) : null}
            </div>
            <p key={`note-${slideKey}`} className="site-gallery-lightbox__meta px-5 py-4 text-center text-[11px] tracking-[0.18em] text-white/70 uppercase">
                {photo.note || `${index + 1} / ${photos.length}`}
            </p>
        </div>
    );
}

function renderLayout(
    style: GalleryStyleId,
    photos: SiteGalleryPhoto[],
    desktop: boolean | undefined,
    onOpen: (index: number) => void,
): ReactNode {
    switch (style) {
        case 'masonry':
            return <MasonryLayout photos={photos} desktop={desktop} onOpen={onOpen} />;
        case 'carousel':
            return <CarouselLayout photos={photos} desktop={desktop} onOpen={onOpen} />;
        case 'hoverboard':
            return <HoverboardLayout photos={photos} desktop={desktop} onOpen={onOpen} />;
        case 'autocarousel':
            return <AutoCarouselLayout photos={photos} desktop={desktop} onOpen={onOpen} />;
        case 'polaroid':
            return <PolaroidLayout photos={photos} desktop={desktop} onOpen={onOpen} />;
        case 'salon':
            return <SalonLayout photos={photos} desktop={desktop} onOpen={onOpen} />;
        case 'cascade':
            return <CascadeLayout photos={photos} desktop={desktop} onOpen={onOpen} />;
        case 'strip':
            return <StripLayout photos={photos} desktop={desktop} onOpen={onOpen} />;
        case 'stack':
            return <StackLayout photos={photos} desktop={desktop} onOpen={onOpen} />;
        case 'mosaic':
        default:
            return <MosaicLayout photos={photos} desktop={desktop} onOpen={onOpen} />;
    }
}

/** Shared photo gallery layouts + lightbox for every occasion site. */
export function SiteGallerySection({
    photos,
    styleId,
    desktop,
    framed,
    className,
}: SiteGallerySectionProps) {
    const style = resolveGalleryStyleId(styleId);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [motionKey, setMotionKey] = useState(0);

    useEffect(() => {
        setMotionKey((value) => value + 1);
        setLightboxIndex(null);
    }, [style]);

    if (!photos.length) {
        return null;
    }

    return (
        <div className={cn('site-gallery mt-10', className)} data-gallery-style={style}>
            <div key={`gallery-layout-${style}-${motionKey}`} className="site-gallery__stage">
                {renderLayout(style, photos, desktop, setLightboxIndex)}
            </div>
            {lightboxIndex !== null ? (
                <GalleryLightbox
                    photos={photos}
                    index={lightboxIndex}
                    framed={framed}
                    onClose={() => setLightboxIndex(null)}
                    onChange={setLightboxIndex}
                />
            ) : null}
        </div>
    );
}

/** Compact visual thumb for the editor style picker. */
export function GalleryStyleThumb({ styleId, active }: { styleId: GalleryStyleId; active?: boolean }) {
    return (
        <div
            className={cn(
                'relative h-[5.75rem] w-full overflow-hidden rounded-xl bg-[#efe8dc] ring-1',
                active ? 'ring-zinc-950/25' : 'ring-zinc-950/10',
            )}
            aria-hidden
            data-gallery-thumb={styleId}
        >
            {styleId === 'mosaic' ? (
                <div className="absolute inset-2 grid grid-cols-3 grid-rows-2 gap-1">
                    <span className="col-span-2 row-span-2 rounded-md bg-[#c6a36a]/55" />
                    <span className="rounded-md bg-[#2b241c]/25" />
                    <span className="rounded-md bg-[#2b241c]/18" />
                </div>
            ) : null}
            {styleId === 'masonry' ? (
                <div className="absolute inset-2 columns-3 gap-1">
                    <span className="mb-1 block h-10 break-inside-avoid rounded-md bg-[#c6a36a]/50" />
                    <span className="mb-1 block h-6 break-inside-avoid rounded-md bg-[#2b241c]/20" />
                    <span className="mb-1 block h-8 break-inside-avoid rounded-md bg-[#2b241c]/28" />
                    <span className="mb-1 block h-7 break-inside-avoid rounded-md bg-[#c6a36a]/35" />
                    <span className="mb-1 block h-9 break-inside-avoid rounded-md bg-[#2b241c]/16" />
                    <span className="mb-1 block h-5 break-inside-avoid rounded-md bg-[#c6a36a]/40" />
                </div>
            ) : null}
            {styleId === 'carousel' ? (
                <div className="absolute inset-y-2 left-2 flex gap-1.5">
                    <span className="h-full w-10 rounded-lg bg-[#2b241c]/18" />
                    <span className="h-full w-14 rounded-lg bg-[#c6a36a]/55" />
                    <span className="h-full w-10 rounded-lg bg-[#2b241c]/18" />
                </div>
            ) : null}
            {styleId === 'hoverboard' ? (
                <div className="absolute inset-2 grid grid-cols-3 gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                        <span key={i} className="rounded-lg bg-[#2b241c]/20 shadow-sm" />
                    ))}
                </div>
            ) : null}
            {styleId === 'autocarousel' ? (
                <div className="absolute inset-2 overflow-hidden rounded-md">
                    <span className="absolute inset-0 bg-[#c6a36a]/5" />
                    <span className="absolute inset-x-3 bottom-3 flex justify-center gap-1">
                        <span className="h-1 w-4 rounded-full bg-white/90" />
                        <span className="h-1 w-1 rounded-full bg-white/45" />
                        <span className="h-1 w-1 rounded-full bg-white/45" />
                    </span>
                    <span className="absolute top-2 left-2 rounded-full bg-black/35 px-1.5 py-0.5 text-[7px] tracking-wider text-white/90 uppercase">
                        Auto
                    </span>
                </div>
            ) : null}
            {styleId === 'polaroid' ? (
                <div className="absolute inset-0">
                    <span className="absolute top-3 left-4 h-12 w-10 rotate-[-8deg] bg-white p-1 shadow-md">
                        <span className="block h-7 bg-[#c6a36a]/45" />
                    </span>
                    <span className="absolute top-4 right-5 h-12 w-10 rotate-[7deg] bg-white p-1 shadow-md">
                        <span className="block h-7 bg-[#2b241c]/25" />
                    </span>
                </div>
            ) : null}
            {styleId === 'salon' ? (
                <div className="absolute inset-2 grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 3 }, (_, i) => (
                        <span key={i} className="rounded-[2px] border border-[#c6a36a]/45 bg-[#f7f3ec] p-0.5">
                            <span className="block h-full rounded-[1px] bg-[#2b241c]/18" />
                        </span>
                    ))}
                </div>
            ) : null}
            {styleId === 'cascade' ? (
                <div className="absolute inset-2 grid grid-cols-2 gap-1">
                    <span className="mt-0 h-14 rounded-lg bg-[#c6a36a]/45" />
                    <span className="mt-4 h-14 rounded-lg bg-[#2b241c]/22" />
                </div>
            ) : null}
            {styleId === 'strip' ? (
                <div className="absolute inset-2 flex flex-col gap-1">
                    <span className="h-[70%] rounded-md bg-[#c6a36a]/5" />
                    <div className="flex h-[24%] gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={cn('flex-1 rounded-sm', i === 1 ? 'bg-[#2b241c]/45' : 'bg-[#2b241c]/15')} />
                        ))}
                    </div>
                </div>
            ) : null}
            {styleId === 'stack' ? (
                <div className="absolute inset-0">
                    <span className="absolute top-4 left-6 h-14 w-12 rotate-[-10deg] rounded-lg bg-[#2b241c]/18 shadow" />
                    <span className="absolute top-3 left-10 h-14 w-12 rotate-[-2deg] rounded-lg bg-[#c6a36a]/35 shadow" />
                    <span className="absolute top-2 left-14 h-14 w-12 rotate-[8deg] rounded-lg bg-[#2b241c]/28 shadow" />
                </div>
            ) : null}
        </div>
    );
}
