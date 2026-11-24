import { Bone } from '@/components/skeletons/_primitives';
import { EditorShellSkeletonFrame } from '@/components/skeletons/_editor-shell-skeleton';
import { cn } from '@/lib/utils';

/** Exact mirror of `CardEditorNav` — Card rail, 6 equal dock items on mobile. */
function CardNavSkeleton() {
    return (
        <aside
            className={cn(
                'flex shrink-0 overflow-hidden bg-white',
                'w-full flex-row items-stretch',
                'md:h-full md:min-h-0 md:w-[4.5rem] md:flex-col md:self-stretch md:border-r md:border-zinc-200/70 md:bg-zinc-50/60 xl:w-[13.5rem]',
            )}
        >
            <div className="hidden shrink-0 border-b border-zinc-200/70 px-2 py-3 md:block xl:px-4 xl:py-4">
                <Bone className="mx-auto hidden h-2.5 w-12 xl:mx-0 xl:block" />
                <Bone className="mx-auto mt-0 h-3.5 w-10 md:mt-1 xl:mx-0 xl:h-4 xl:w-14" />
            </div>
            <nav
                className={cn(
                    'flex min-h-0 flex-1',
                    'grid grid-cols-6 gap-0.5 px-1 py-1.5',
                    'md:flex md:grid-cols-none md:flex-col md:space-y-1 md:overflow-y-auto md:p-1.5 xl:p-2.5',
                )}
            >
                {Array.from({ length: 6 }, (_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2',
                            'md:w-full md:flex-row md:items-center md:gap-2.5 md:rounded-2xl md:px-2 md:py-2.5 xl:items-start xl:px-2.5',
                            i === 0 && 'bg-zinc-900 text-white shadow-md shadow-zinc-900/15',
                        )}
                    >
                        <Bone
                            className={cn(
                                'size-7 shrink-0 rounded-lg md:size-8 md:rounded-xl',
                                i === 0 ? 'bg-white/10' : 'bg-zinc-100 md:bg-white md:ring-1 md:ring-zinc-950/5',
                            )}
                        />
                        <Bone className={cn('h-2 w-10 max-w-full md:hidden', i === 0 && 'bg-white/40')} />
                        <div className="hidden min-w-0 flex-1 space-y-1 pt-0.5 xl:block">
                            <Bone className={cn('h-3.5 w-20', i === 0 && 'bg-white/25')} />
                            <Bone className={cn('h-2.5 w-28', i === 0 && 'bg-white/15')} />
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}

/**
 * Exact mirror of `CardEditorCanvas` + card sheet chrome
 * (`rounded-[1.2rem]`, light card shadow, cream face).
 */
function CardCanvasSkeleton() {
    return (
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent md:bg-[linear-gradient(180deg,#f4f4f5_0%,#ececef_100%)]">
            <div className="hidden shrink-0 items-center justify-center px-3 py-2 md:flex">
                <Bone className="h-3 w-72 max-w-full" />
            </div>
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden overscroll-none">
                <div className="flex h-full w-full items-center justify-center px-2 py-2 sm:px-3 sm:py-3">
                    <div className="flex h-full w-full max-w-full items-center justify-center" style={{ maxWidth: 560 }}>
                        <div
                            data-card-sheet
                            className="relative aspect-[3/4] h-auto max-h-full w-full max-w-full overflow-hidden rounded-[1.2rem] bg-[#f4efe6] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.35)] ring-1 ring-zinc-950/10"
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                                <Bone className="h-3 w-20" />
                                <Bone className="h-8 w-40 max-w-full" />
                                <Bone className="h-3 w-28" />
                                <Bone className="mt-6 h-px w-16" />
                                <Bone className="mt-4 h-3 w-36" />
                                <Bone className="h-3 w-28" />
                                <Bone className="mt-8 h-10 w-32 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Card inspector — layer/property blocks like Content panel. */
function CardInspectorSkeleton() {
    return (
        <aside className="flex h-full min-h-0 w-full min-w-0 flex-col self-stretch overflow-hidden bg-white md:border-l md:border-zinc-200/70 md:bg-white/95 md:backdrop-blur-xl">
            <div className="shrink-0 border-b border-zinc-100 px-3.5 py-2.5 sm:px-4 sm:py-3.5">
                <Bone className="h-4 w-24" />
                <Bone className="mt-1.5 h-3 w-52 max-w-full" />
            </div>
            <div className="min-h-0 min-w-0 flex-1 space-y-3.5 overflow-hidden px-3.5 py-3 sm:px-4 sm:py-3.5">
                <Bone className="h-3 w-28" />
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="space-y-1.5 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-950/5">
                        <div className="flex items-center justify-between gap-2">
                            <Bone className="h-3.5 w-24" />
                            <Bone className="size-7 rounded-full" />
                        </div>
                        <Bone className="h-9 w-full rounded-xl" />
                    </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                    <Bone className="h-16 rounded-xl" />
                    <Bone className="h-16 rounded-xl" />
                </div>
                <Bone className="h-10 w-full rounded-full" />
            </div>
        </aside>
    );
}

/** Layout-faithful skeleton for `pages/events/card.tsx` via `EditorShell`. */
export function CardEditorSkeleton({ className }: { className?: string }) {
    return (
        <EditorShellSkeletonFrame
            page="card-editor"
            className={className}
            nav={<CardNavSkeleton />}
            canvas={<CardCanvasSkeleton />}
            inspector={<CardInspectorSkeleton />}
        />
    );
}
