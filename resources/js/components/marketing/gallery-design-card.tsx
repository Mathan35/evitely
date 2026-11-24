import { Link } from '@inertiajs/react';
import type { MouseEvent } from 'react';
import { useAuthGate } from '@/components/auth-gate';
import { Eye, Heart, Zap } from 'lucide-react';
import { GalleryLazyImage } from '@/components/marketing/gallery-lazy-image';
import { CardPreview, LinkPreview } from '@/components/marketing/gallery-previews';
import { InvitationCardFace } from '@/components/marketing/invitation-card-face';
import type { GalleryDesign } from '@/types/gallery';

export function customizeHref(design: GalleryDesign): string {
    const query = new URLSearchParams({
        event_type: design.event_type,
        invitation_mode: design.kind === 'card' ? 'card' : 'link',
        gallery_template: design.id,
        theme: design.theme,
    });

    if (design.kind === 'card') {
        query.set('card_template', design.id);
        query.set('card_format', design.format);
    }

    return `/events/create?${query.toString()}`;
}

function FavoriteButton({ saved, onToggle, compact = false }: { saved: boolean; onToggle: () => void; compact?: boolean }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
            className={`absolute z-20 grid place-items-center rounded-full bg-white/95 shadow-[0_8px_20px_-12px_rgba(28,24,20,0.55)] ring-1 ring-[#2b241c]/8 transition hover:scale-105 dark:bg-[#1c1814]/90 dark:ring-white/10 ${compact ? 'top-1.5 right-1.5 h-7 w-7' : 'top-2.5 right-2.5 h-9 w-9'}`}
        >
            <Heart className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${saved ? 'fill-[#e11d48] text-[#e11d48]' : 'text-[#8a8178]'}`} />
        </button>
    );
}

function DesignActions({
    design,
    preview,
    accent = '#c6a36a',
    dense = false,
}: {
    design: GalleryDesign;
    preview: { type: 'dialog'; onPreview: (design: GalleryDesign) => void } | { type: 'link'; href: string };
    accent?: string;
    dense?: boolean;
}) {
    const { ensure } = useAuthGate();
    const href = customizeHref(design);

    function goCustomize(event: MouseEvent<Element>): void {
        if (ensure({ type: 'customize', href })) {
            return;
        }

        event.preventDefault();
    }

    const previewClass = dense
        ? 'inline-flex h-8 w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-[#2b241c]/12 bg-white px-2.5 text-[10px] font-medium tracking-wide text-[#2b241c] transition hover:border-[#c6a36a]/50 dark:border-white/12 dark:bg-transparent dark:text-inherit'
        : 'inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border border-[#2b241c]/12 bg-white px-2.5 text-[11px] font-medium tracking-wide text-[#2b241c] transition hover:border-[#c6a36a]/50 hover:text-[#1c1814] dark:border-white/12 dark:bg-transparent dark:text-inherit';
    const customizeClass = dense
        ? 'inline-flex h-8 w-fit shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-[10px] font-medium tracking-wide text-white shadow-[0_10px_18px_-12px_rgba(198,163,106,0.9)] transition hover:brightness-105'
        : 'inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium tracking-wide text-white shadow-[0_10px_18px_-12px_rgba(198,163,106,0.9)] transition hover:brightness-105';

    return (
        <div className={dense ? 'flex flex-wrap items-center gap-1.5' : 'grid grid-cols-2 gap-2'}>
            {preview.type === 'dialog' ? (
                <button type="button" className={previewClass} onClick={() => preview.onPreview(design)}>
                    <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Preview
                </button>
            ) : (
                <Link href={preview.href} className={previewClass}>
                    <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Preview
                </Link>
            )}
            <Link href={href} onClick={goCustomize} className={customizeClass} style={{ backgroundColor: accent }}>
                <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Customize
            </Link>
        </div>
    );
}

function DesignStage({ design, compact = false }: { design: GalleryDesign; compact?: boolean }) {
    const isCard = design.kind === 'card';
    const inviteCard =
        isCard &&
        (design.event_type === 'wedding' ||
            design.event_type === 'housewarming' ||
            design.event_type === 'birthday' ||
            design.event_type === 'baby-shower' ||
            design.event_type === 'party' ||
            design.event_type === 'graduation' ||
            design.event_type === 'bridal-shower' ||
            design.event_type === 'corporate-event' ||
            design.event_type === 'custom');
    const src = design.image;
    const responsiveCardImage = undefined;
    const cover =
        design.kind === 'link' &&
        (design.event_type === 'wedding' ||
            design.event_type === 'birthday' ||
            design.event_type === 'corporate-event' ||
            design.event_type === 'baby-shower' ||
            design.event_type === 'party' ||
            design.event_type === 'bridal-shower' ||
            design.event_type === 'graduation' ||
            design.event_type === 'housewarming' ||
            design.event_type === 'custom');

    if (inviteCard) {
        const uniformStage =
            design.event_type === 'birthday' ||
            design.event_type === 'baby-shower' ||
            design.event_type === 'party' ||
            design.event_type === 'graduation' ||
            design.event_type === 'bridal-shower' ||
            design.event_type === 'housewarming' ||
            design.event_type === 'corporate-event' ||
            design.event_type === 'custom';
        const artW = design.image_width || 9;
        const artH = design.image_height || 16;
        const artRatio = artW / artH;
        const stageRatio = 3 / 4;
        // Birthday: cover-fill for even tiles. Blank-center occasions: contain so copy is never cropped.
        const coverFill = design.event_type === 'birthday';
        const fitByHeight = artRatio <= stageRatio;

        if (uniformStage) {
            const fitStyle = coverFill
                ? fitByHeight
                    ? { width: '100%', height: 'auto' }
                    : { height: '100%', width: 'auto' }
                : fitByHeight
                  ? { height: '100%', width: 'auto', maxWidth: '100%' }
                  : { width: '100%', height: 'auto', maxHeight: '100%' };

            return (
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f3ebe1] dark:bg-[#1a1612]">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="relative shrink-0"
                            style={{
                                aspectRatio: `${artW} / ${artH}`,
                                ...fitStyle,
                            }}
                        >
                            <InvitationCardFace
                                design={design}
                                variant="compact"
                                className="invitation-card-face--fill"
                                imageSizes={
                                    compact
                                        ? '(min-width: 640px) 7.5rem, 5.5rem'
                                        : '(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw'
                                }
                            />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="relative overflow-hidden bg-transparent">
                {/* Gallery tiles stay compact so copy fits the blank art center; Preview uses full face. */}
                <InvitationCardFace
                    design={design}
                    variant="compact"
                    imageSizes={compact ? '(min-width: 640px) 7.5rem, 5.5rem' : '(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw'}
                />
            </div>
        );
    }

    return (
        <div className="relative aspect-square overflow-hidden bg-transparent">
            {src ? (
                <GalleryLazyImage
                    src={src}
                    srcSet={responsiveCardImage}
                    sizes={
                        responsiveCardImage
                            ? compact
                                ? '(min-width: 640px) 7.5rem, 5.5rem'
                                : '(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw'
                            : undefined
                    }
                    alt=""
                    className={`h-full w-full object-center ${cover ? 'object-cover' : 'object-contain'}`}
                    width={responsiveCardImage ? design.image_width : undefined}
                    height={responsiveCardImage ? design.image_height : undefined}
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <div className={`flex aspect-square items-center justify-center overflow-hidden ${compact ? 'p-2' : 'p-3'}`}>
                    <div className="max-h-full max-w-[78%] [&_*]:max-w-full">
                        {isCard ? <CardPreview design={design} /> : <LinkPreview design={design} />}
                    </div>
                </div>
            )}
        </div>
    );
}

export function GalleryDesignCard({
    design,
    view,
    saved,
    onFavorite,
    preview,
    accent = '#c6a36a',
    featured = false,
    showStyle = true,
}: {
    design: GalleryDesign;
    view: 'grid' | 'list';
    saved: boolean;
    onFavorite: (id: string) => void;
    preview: { type: 'dialog'; onPreview: (design: GalleryDesign) => void } | { type: 'link'; href: string };
    accent?: string;
    featured?: boolean;
    showStyle?: boolean;
}) {
    const sampleLine =
        design.sample?.headline?.trim() ||
        design.sample?.request_line?.trim()?.split('\n')[0] ||
        design.sample?.kicker?.trim() ||
        null;
    const kindLabel = design.kind === 'card' ? 'Digital card' : 'Event website';
    const moodChips = (design.moods ?? [])
        .filter((mood) => mood !== 'All Styles' && mood !== 'Top Rated' && mood !== design.style)
        .slice(0, 3);

    if (view === 'list') {
        return (
            <article className="group flex h-full w-full items-stretch gap-2.5 rounded-[1.15rem] border border-[#2b241c]/8 bg-white p-2 shadow-[0_10px_24px_-22px_rgba(43,36,28,0.75)] transition duration-200 hover:border-[#c6a36a]/40 hover:shadow-[0_16px_32px_-24px_rgba(43,36,28,0.65)] dark:border-white/10 dark:bg-card sm:gap-3 sm:rounded-[1.25rem] sm:p-2.5">
                <div className="relative h-[6.5rem] w-[4.85rem] shrink-0 self-center overflow-hidden rounded-[0.9rem] bg-[#f3ebe1] ring-1 ring-[#2b241c]/8 dark:bg-[#1a1612] sm:h-[7rem] sm:w-[5.25rem]">
                    <FavoriteButton saved={saved} onToggle={() => onFavorite(design.id)} compact />
                    {featured && (
                        <span className="absolute bottom-1.5 left-1.5 z-20 rounded-full bg-[#2b241c]/90 px-1.5 py-0.5 text-[8px] tracking-wide text-[#f4efe6]">
                            Featured
                        </span>
                    )}
                    <div className="absolute inset-0 [&_.invitation-card-face]:h-full [&_.invitation-card-face]:w-full">
                        <DesignStage design={design} compact />
                    </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-0.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <h3 className="min-w-0 truncate text-[13px] leading-5 font-medium text-[#1c1814] sm:text-[15px] dark:text-inherit">
                            {design.name}
                        </h3>
                        <span className="inline-flex shrink-0 rounded-full bg-[#2b241c]/6 px-2 py-0.5 text-[9px] tracking-[0.08em] text-[#6d645b] uppercase dark:bg-white/10 dark:text-[#c9c0b5]">
                            {kindLabel}
                        </span>
                    </div>
                    {showStyle ? (
                        <p className="truncate text-[11px] leading-4 tracking-wide" style={{ color: accent }}>
                            {design.style}
                        </p>
                    ) : null}
                    {sampleLine ? (
                        <p className="line-clamp-2 text-[11px] leading-4 text-[#7a7168] dark:text-[#a89f94]">{sampleLine}</p>
                    ) : null}
                    {(moodChips.length > 0 || design.format) && (
                        <div className="flex flex-wrap items-center gap-1">
                            {design.format ? (
                                <span className="rounded-md border border-[#2b241c]/10 px-1.5 py-0.5 text-[10px] tracking-wide text-[#8a8178] capitalize dark:border-white/10">
                                    {design.format}
                                </span>
                            ) : null}
                            {moodChips.slice(0, 2).map((mood) => (
                                <span key={mood} className="rounded-md bg-[#f6f0e8] px-1.5 py-0.5 text-[10px] tracking-wide text-[#6d645b] dark:bg-white/8 dark:text-[#c9c0b5]">
                                    {mood}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="pt-0.5">
                        <DesignActions design={design} preview={preview} accent={accent} dense />
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="group flex h-full w-full flex-col rounded-[1.2rem] border border-[#2b241c]/8 bg-white p-1.5 shadow-[0_16px_36px_-28px_rgba(43,36,28,0.85)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c6a36a]/35 hover:shadow-[0_22px_44px_-26px_rgba(43,36,28,0.7)] dark:border-white/10 dark:bg-card sm:rounded-[1.45rem] sm:p-2.5">
            <div className="relative overflow-hidden rounded-[1.1rem]">
                <FavoriteButton saved={saved} onToggle={() => onFavorite(design.id)} />
                {featured && (
                    <span className="absolute top-2.5 left-2.5 z-20 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[10px] tracking-wide text-[#2b241c] shadow-sm ring-1 ring-[#2b241c]/8">
                        Featured
                    </span>
                )}
                <DesignStage design={design} />
            </div>
            <div className="mt-3 flex flex-1 flex-col px-1 pb-0.5">
                <h3 className="line-clamp-2 text-[13px] leading-5 font-medium text-[#1c1814] sm:text-[15px] dark:text-inherit">
                    {design.name}
                </h3>
                {showStyle ? (
                    <p className="mt-1 truncate text-[12px] leading-4 tracking-wide" style={{ color: accent }}>
                        {design.style}
                    </p>
                ) : null}
                <div className="mt-auto pt-3">
                    <DesignActions design={design} preview={preview} accent={accent} />
                </div>
            </div>
        </article>
    );
}
