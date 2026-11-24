import type { ReactNode } from 'react';
import { Bone } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact mirror of `EditorTopBar` chrome. */
export function EditorTopBarSkeleton() {
    return (
        <header className="relative z-20 flex h-12 w-full min-w-0 max-w-full shrink-0 items-center gap-1.5 overflow-hidden px-2 sm:h-14 sm:gap-3 sm:px-5">
            <Bone className="h-8 w-[4.5rem] shrink-0 rounded-full sm:h-9 sm:w-[5.25rem]" />
            <div className="flex min-w-0 flex-1 items-center justify-center">
                <div className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 shadow-sm ring-1 ring-zinc-950/5 backdrop-blur sm:gap-2 sm:px-3.5 sm:py-1.5">
                    <span className="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
                    <Bone className="h-3.5 w-28 sm:w-40" />
                    <Bone className="hidden h-3 w-12 sm:block" />
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                <Bone className="size-8 rounded-full sm:size-9" />
                <Bone className="size-8 rounded-full sm:size-9" />
                <Bone className="ml-0.5 h-9 w-9 rounded-full sm:ml-1 sm:w-[5.5rem]" />
                <Bone className="ml-0.5 h-9 w-14 rounded-full sm:ml-1 sm:w-16" />
                <Bone className="ml-0.5 h-9 w-16 rounded-full bg-zinc-900/90 sm:ml-1 sm:w-20" />
            </div>
        </header>
    );
}

/** Desktop panel toggles — siblings of canvas inside shell column (md+ only). */
export function EditorPanelTogglesSkeleton() {
    return (
        <>
            <span className="absolute top-3 left-3 z-20 hidden size-9 rounded-full bg-zinc-900 shadow-lg shadow-zinc-900/25 ring-1 ring-zinc-950/20 md:inline-flex" />
            <span className="absolute top-3 right-3 z-20 hidden size-9 rounded-full bg-zinc-900 shadow-lg shadow-zinc-900/25 ring-1 ring-zinc-950/20 md:inline-flex" />
        </>
    );
}

/** Exact mirror of `EditorInspector` chrome + field bones. */
export function EditorInspectorSkeleton({
    titleWidth = 'w-28',
    descriptionWidth = 'w-48',
}: {
    titleWidth?: string;
    descriptionWidth?: string;
}) {
    return (
        <aside className="flex h-full min-h-0 w-full min-w-0 flex-col self-stretch overflow-hidden bg-white md:border-l md:border-zinc-200/70 md:bg-white/95 md:backdrop-blur-xl">
            <div className="shrink-0 border-b border-zinc-100 px-3.5 py-2.5 sm:px-4 sm:py-3.5">
                <Bone className={cn('h-4', titleWidth)} />
                <Bone className={cn('mt-1.5 h-3 max-w-full', descriptionWidth)} />
            </div>
            <div className="min-h-0 min-w-0 flex-1 space-y-3.5 overflow-hidden px-3.5 py-3 sm:px-4 sm:py-3.5">
                <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-950/5">
                    <Bone className="size-12 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <Bone className="h-2.5 w-24" />
                        <Bone className="h-3.5 w-32" />
                        <Bone className="h-2.5 w-40" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 4 }, (_, i) => (
                        <Bone key={i} className="h-6 w-16 rounded-full" />
                    ))}
                </div>
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="space-y-1.5">
                        <Bone className="h-3 w-20" />
                        <Bone className="h-10 w-full rounded-xl" />
                    </div>
                ))}
                <Bone className="h-28 w-full rounded-xl" />
            </div>
        </aside>
    );
}

/**
 * Exact `EditorShell` frame — light zinc studio, desktop 3-pane glass, mobile canvas + dock.
 * Pass already-built nav / canvas nodes (site vs card differ).
 */
export function EditorShellSkeletonFrame({
    nav,
    canvas,
    inspector,
    className,
    page,
}: {
    nav: ReactNode;
    canvas: ReactNode;
    inspector: ReactNode;
    className?: string;
    page: 'site-editor' | 'card-editor';
}) {
    return (
        <div
            className={cn(
                'relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] animate-in fade-in flex-col overflow-hidden overscroll-none bg-zinc-100 text-zinc-900 duration-300',
                className,
            )}
            aria-hidden
            data-skeleton-page={page}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_12%_-10%,rgba(24,24,27,0.08),transparent_55%),radial-gradient(700px_360px_at_88%_0%,rgba(82,82,91,0.08),transparent_50%)]"
            />
            <div className="relative z-10 flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden">
                <div className="shrink-0">
                    <EditorTopBarSkeleton />
                </div>

                {/* Desktop workspace — matches EditorShell isDesktop branch */}
                <div className="hidden min-h-0 w-full min-w-0 max-w-full flex-1 p-2 pt-0 md:flex lg:p-3 lg:pt-0">
                    <div className="relative grid min-h-0 w-full min-w-0 max-w-full flex-1 grid-cols-[auto_minmax(0,1fr)_minmax(15.5rem,min(21.5rem,32vw))] overflow-hidden rounded-[1.35rem] bg-white/70 shadow-[0_30px_80px_-40px_rgba(24,24,27,0.45)] ring-1 ring-zinc-950/5 backdrop-blur-xl">
                        <div className="min-h-0 min-w-0 overflow-hidden opacity-100">{nav}</div>
                        <div className="relative flex min-h-0 min-w-0 overflow-hidden">
                            <EditorPanelTogglesSkeleton />
                            {canvas}
                        </div>
                        <div className="min-h-0 min-w-0 overflow-hidden opacity-100">{inspector}</div>
                    </div>
                </div>

                {/* Mobile workspace — canvas + bottom dock (inspector sheet closed by default) */}
                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden overscroll-none touch-manipulation md:hidden">
                    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#efefef]">
                        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">{canvas}</div>
                    </div>
                    <div
                        data-mobile-editor-dock
                        className="relative z-[80] shrink-0 border-t border-zinc-200/90 bg-white pb-[env(safe-area-inset-bottom)]"
                    >
                        {nav}
                    </div>
                </div>
            </div>
        </div>
    );
}
