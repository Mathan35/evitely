import { useEffect, useRef, useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react';
import { cn } from '@/lib/utils';

type GalleryLazyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
    /** Called once the bitmap is usable (load or cache hit). */
    onReady?: (image: HTMLImageElement) => void;
};

/**
 * Product-level gallery media: shimmer while the lazy image decodes,
 * then fade in — so scrolling cards never look blank/stuck.
 */
export function GalleryLazyImage({
    className,
    onLoad,
    onError,
    onReady,
    src,
    ...props
}: GalleryLazyImageProps) {
    const [ready, setReady] = useState(false);
    const notified = useRef(false);

    useEffect(() => {
        // Cleaned/canvas data URLs are already decoded — keep ready so we don't re-shimmer.
        if (typeof src === 'string' && src.startsWith('data:')) {
            setReady(true);

            return;
        }

        setReady(false);
        notified.current = false;
    }, [src]);

    function settle(image: HTMLImageElement): void {
        if (!(image.complete && image.naturalWidth > 0)) {
            return;
        }

        setReady(true);

        if (!notified.current) {
            notified.current = true;
            onReady?.(image);
        }
    }

    return (
        <>
            {!ready ? (
                <div
                    className="skeleton-shimmer pointer-events-none absolute inset-0 z-[1] rounded-[inherit]"
                    aria-hidden
                />
            ) : null}
            <img
                {...props}
                src={src}
                className={cn(
                    'transition-opacity duration-300',
                    ready ? 'opacity-100' : 'opacity-0',
                    className,
                )}
                onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
                    settle(event.currentTarget);
                    onLoad?.(event);
                }}
                onError={(event) => {
                    setReady(true);
                    onError?.(event);
                }}
                ref={(node) => {
                    if (node) {
                        settle(node);
                    }
                }}
            />
        </>
    );
}
