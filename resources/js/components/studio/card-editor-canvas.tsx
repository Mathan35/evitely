import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function CardEditorCanvas({
    stageMaxWidth = 560,
    children,
    onStageSize,
    onDeselect,
}: {
    stageMaxWidth?: number;
    children: ReactNode;
    /** Report usable stage size so the card can fill the viewport without empty chrome. */
    onStageSize?: (size: { width: number; height: number }) => void;
    /** Clear canvas selection when clicking the empty stage (not a layer / toolbar). */
    onDeselect?: () => void;
}) {
    const stageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = stageRef.current;
        if (!node) {
            return;
        }

        const measure = (): void => {
            const rect = node.getBoundingClientRect();
            onStageSize?.({
                width: Math.max(0, Math.floor(rect.width - 12)),
                height: Math.max(0, Math.floor(rect.height - 12)),
            });
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, [onStageSize]);

    function handleStagePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }
        if (
            target.closest('[data-card-layer]') ||
            target.closest('[data-card-selection-toolbar]') ||
            target.closest('[data-card-sheet]') ||
            target.closest('[data-mobile-editor-sheet]')
        ) {
            return;
        }
        onDeselect?.();
    }

    return (
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent md:bg-[linear-gradient(180deg,#f4f4f5_0%,#ececef_100%)]">
            <div className="hidden shrink-0 items-center justify-center px-3 py-2 md:flex">
                <p className="text-[11px] font-medium text-zinc-400">
                    Drag layers · tools appear to the right · click outside to deselect
                </p>
            </div>

            <div
                ref={stageRef}
                className="min-h-0 min-w-0 flex-1 overflow-hidden overscroll-none"
                onPointerDown={handleStagePointerDown}
            >
                <div className="flex h-full w-full items-center justify-center px-2 py-2 sm:px-3 sm:py-3">
                    <div
                        className={cn('flex h-full w-full max-w-full items-center justify-center')}
                        style={{ maxWidth: stageMaxWidth }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
}
