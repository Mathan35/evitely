import { useLayoutEffect, useRef, useState } from 'react';
import { CardCanvas } from '@/components/cards/card-canvas';
import { cn } from '@/lib/utils';
import type { CardDocument } from '@/types/wedding';

/**
 * Scales a CardCanvas to the measured parent width so site/mobile previews
 * stay edge-to-edge instead of a fixed fitWidth that clips or leaves gaps.
 */
export function ResponsiveCardCanvas({
    document,
    width,
    height,
    musicUrl,
    className,
    frameClassName,
    minFitWidth = 120,
    maxFitWidth,
}: {
    document: CardDocument;
    width: number;
    height: number;
    musicUrl?: string | null;
    className?: string;
    frameClassName?: string;
    minFitWidth?: number;
    maxFitWidth?: number;
}) {
    const shellRef = useRef<HTMLDivElement>(null);
    const [fitWidth, setFitWidth] = useState(0);

    useLayoutEffect(() => {
        const shell = shellRef.current;
        if (!shell) {
            return;
        }

        const update = (nextWidth: number): void => {
            const measured = Math.floor(nextWidth);
            if (measured < 40) {
                return;
            }
            const capped = Math.max(minFitWidth, Math.min(maxFitWidth ?? measured, measured));
            setFitWidth((prev) => (Math.abs(prev - capped) < 1 ? prev : capped));
        };

        update(shell.getBoundingClientRect().width || shell.clientWidth);

        if (typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) {
                return;
            }
            update(entry.contentRect.width);
        });
        observer.observe(shell);
        return () => observer.disconnect();
    }, [minFitWidth, maxFitWidth, width, height]);

    const cardW = Math.max(1, width);
    const cardH = Math.max(1, height);

    return (
        <div
            ref={shellRef}
            data-responsive-card-canvas
            className={cn('mx-auto w-full min-w-0 overflow-hidden', frameClassName)}
            style={{ aspectRatio: `${cardW} / ${cardH}` }}
        >
            {fitWidth > 0 ? (
                <CardCanvas
                    document={document}
                    width={cardW}
                    height={cardH}
                    fitWidth={fitWidth}
                    musicUrl={musicUrl}
                    className={cn('!mx-0 !max-w-none', className)}
                    showSelectionTools={false}
                />
            ) : (
                <div className="h-full w-full bg-[var(--w-surface,#f4efe6)]" aria-hidden />
            )}
        </div>
    );
}
