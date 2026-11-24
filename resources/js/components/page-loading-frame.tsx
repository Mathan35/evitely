import type { ReactNode } from 'react';
import { PageSkeleton } from '@/components/page-skeletons';
import { useInertiaNavigating } from '@/hooks/use-inertia-navigating';
import type { PageSkeletonKind } from '@/lib/page-skeleton';
import { cn } from '@/lib/utils';

/**
 * Keeps the current page mounted and layers a festive cartoon loader while
 * Inertia navigates. Layout chrome outside this frame stays put.
 * Cast / copy always follow the destination page (`navigating.kind` + path).
 */
export function PageLoadingFrame({
    children,
    kind,
    className,
    overlayClassName,
    /** @deprecated Overlay is always fixed/fullscreen for correct cartoon centering. */
    fullscreen: _fullscreen = false,
}: {
    children: ReactNode;
    /** Optional override — defaults to destination-resolved kind. */
    kind?: PageSkeletonKind;
    className?: string;
    overlayClassName?: string;
    fullscreen?: boolean;
}) {
    void _fullscreen;
    const navigating = useInertiaNavigating();
    const active = navigating.navigating;
    const skeletonKind = kind ?? navigating.kind;

    return (
        <div className={cn('relative min-w-0', className)} data-page-loading={active ? '' : undefined} aria-busy={active || undefined}>
            <div
                className={cn(
                    'min-w-0 transition-[opacity,filter] duration-300 ease-out',
                    active && 'pointer-events-none opacity-40 blur-[1px]',
                )}
            >
                {children}
            </div>

            {active ? (
                <div
                    className={cn(
                        // Always fixed + viewport-centered so cartoons don't drift/clip
                        // when the page is scrolled or the content box is short.
                        'fixed inset-0 z-[60] grid place-items-center overflow-hidden overscroll-none',
                        'bg-background/92 backdrop-blur-sm',
                        'animate-in fade-in zoom-in-95 fill-mode-both duration-300',
                        overlayClassName,
                    )}
                    role="status"
                    aria-live="polite"
                    aria-label="Loading page"
                    data-skeleton-kind={skeletonKind}
                    data-skeleton-to={navigating.to ?? undefined}
                >
                    <PageSkeleton kind={skeletonKind} path={navigating.to} />
                    <span className="sr-only">Loading {skeletonKind}</span>
                </div>
            ) : null}
        </div>
    );
}
