import { Bone } from '@/components/skeletons/_primitives';
import {
    EditorInspectorSkeleton,
    EditorShellSkeletonFrame,
} from '@/components/skeletons/_editor-shell-skeleton';
import { FramedSiteContentSkeleton } from '@/components/skeletons/_framed-site-content-skeleton';
import { cn } from '@/lib/utils';

/** Exact mirror of `EditorSectionNav` — Website rail, 10 sections. */
function SiteNavSkeleton() {
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
                <Bone className="mx-auto mt-0 h-3.5 w-14 md:mt-1 xl:mx-0 xl:h-4 xl:w-20" />
            </div>
            <nav
                className={cn(
                    'flex min-h-0 flex-1',
                    'gap-0.5 overflow-x-auto overscroll-x-contain px-1 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    'md:flex-col md:space-y-1 md:overflow-x-hidden md:overflow-y-auto md:overscroll-y-contain md:p-1.5 xl:p-2.5',
                )}
            >
                {Array.from({ length: 10 }, (_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'flex w-[4.35rem] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2',
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
                        <Bone className={cn('h-2 w-8 md:hidden', i === 0 && 'bg-white/40')} />
                        <div className="hidden min-w-0 flex-1 space-y-1 pt-0.5 xl:block">
                            <Bone className={cn('h-3.5 w-20', i === 0 && 'bg-white/25')} />
                            <Bone className={cn('h-2.5 w-24', i === 0 && 'bg-white/15')} />
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}

/**
 * Exact mirror of `EditorCanvas` —
 * mobile device `min(100%,390px)` + `rounded-[1.85rem]`;
 * desktop `min(100%,880px)` + `rounded-2xl`.
 * Inner content matches the live framed site design (not a generic zinc plate).
 */
function SiteCanvasSkeleton() {
    return (
        <section className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#f4f4f5_0%,#ececef_100%)]">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-3 py-3 sm:px-4 sm:pb-5 sm:pt-4">
                <div className="mx-auto flex min-h-0 w-full max-w-[390px] flex-1 flex-col md:max-w-[880px]">
                    <div
                        className={cn(
                            'flex min-h-0 flex-1 flex-col overflow-hidden bg-white shadow-[0_28px_70px_-28px_rgba(24,24,27,0.55)] ring-1 ring-zinc-950/10',
                            'rounded-[1.85rem] md:rounded-2xl',
                        )}
                    >
                        <FramedSiteContentSkeleton />
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Layout-faithful skeleton for `pages/weddings/edit.tsx` via `EditorShell`. */
export function SiteEditorSkeleton({ className }: { className?: string }) {
    return (
        <EditorShellSkeletonFrame
            page="site-editor"
            className={className}
            nav={<SiteNavSkeleton />}
            canvas={<SiteCanvasSkeleton />}
            inspector={<EditorInspectorSkeleton titleWidth="w-28" descriptionWidth="w-52" />}
        />
    );
}
