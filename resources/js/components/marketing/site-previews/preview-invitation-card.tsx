import { InvitationCardFace } from '@/components/marketing/invitation-card-face';
import type { GalleryDesign } from '@/types/gallery';
import { cn } from '@/lib/utils';

/**
 * Renders the real gallery card face inside a website preview invitation section.
 */
export function PreviewInvitationCard({
    card,
    fallbackSrc,
    alt,
    className,
    compact = false,
}: {
    card: GalleryDesign | null | undefined;
    fallbackSrc: string;
    alt: string;
    className?: string;
    compact?: boolean;
}) {
    if (card) {
        return (
            <div
                className={cn(
                    'overflow-hidden rounded-[1.2rem] border border-[var(--w-accent)]/25 bg-[var(--w-surface)] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.35)]',
                    compact
                        ? 'mx-auto h-[17rem] w-[11.5rem]'
                        : 'mx-auto aspect-[3/4] w-full max-w-sm',
                    className,
                )}
            >
                {/* Compact: fill a fixed box. Open: parent aspect gives height; do not use --fill (it zeros height). */}
                <div className="relative h-full w-full">
                    <InvitationCardFace
                        design={card}
                        variant={compact ? 'compact' : 'full'}
                        className="invitation-card-face--fill"
                        imageSizes={compact ? '12rem' : 'min(100vw, 24rem)'}
                    />
                </div>
            </div>
        );
    }

    return (
        <img
            src={fallbackSrc}
            alt={alt}
            className={cn(
                'rounded-[1.2rem] border border-[var(--w-accent)]/25 object-contain bg-[var(--w-surface)] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.35)]',
                compact ? 'mx-auto h-[17rem] w-[11.5rem]' : 'mx-auto aspect-[3/4] w-full max-w-sm',
                className,
            )}
        />
    );
}
