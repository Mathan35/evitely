import { Bone, StudioSurfaceSkeleton } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Full settings chrome — used when entering settings from studio. */
export function SettingsSkeleton({ className }: { className?: string }) {
    return (
        <StudioSurfaceSkeleton className={cn('animate-in fade-in duration-300', className)} data-skeleton-page="settings">
            <header>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0 max-w-xl space-y-0">
                        <Bone className="h-3 w-20" />
                        <Bone className="mt-2 h-[clamp(2.2rem,5vw,3.4rem)] w-40" />
                        <Bone className="mt-3 h-4 w-72 max-w-full" />
                    </div>
                    <Bone className="h-[4.25rem] w-full max-w-xs rounded-2xl sm:w-60" />
                </div>
            </header>

            <div className="grid w-full min-w-0 max-w-full gap-4 sm:gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
                <aside className="w-full min-w-0 max-w-full lg:sticky lg:top-24 lg:self-start">
                    <nav className="flex w-full min-w-0 gap-1 overflow-x-auto rounded-2xl border border-zinc-950/8 bg-white/80 p-1.5 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:p-2 dark:border-white/10 dark:bg-zinc-950/55">
                        {Array.from({ length: 4 }, (_, i) => (
                            <Bone key={i} className="h-9 w-24 shrink-0 rounded-xl lg:h-14 lg:w-full" />
                        ))}
                    </nav>
                </aside>
                <div className="min-w-0">
                    <SettingsPanelSkeleton />
                </div>
            </div>
        </StudioSurfaceSkeleton>
    );
}

/** Settings form panel only — inside settings layout. */
export function SettingsPanelSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('animate-in fade-in space-y-5 duration-300 sm:space-y-6', className)} aria-hidden data-skeleton-page="settings-panel">
            <div className="overflow-hidden rounded-2xl border border-zinc-950/8 bg-white/75 dark:border-white/10 dark:bg-zinc-950/55">
                <Bone className="h-24 w-full rounded-none sm:h-28" />
                <div className="space-y-5 p-4 sm:p-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Bone className="h-11 w-full rounded-xl" />
                        <Bone className="h-11 w-full rounded-xl" />
                    </div>
                    <Bone className="h-11 w-full rounded-xl sm:w-[66%]" />
                    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                        <Bone className="h-10 w-32 rounded-full" />
                        <Bone className="h-4 w-40" />
                    </div>
                </div>
            </div>
            <div className="rounded-2xl border border-zinc-950/8 bg-white/75 p-4 sm:p-6 dark:border-white/10 dark:bg-zinc-950/55">
                <Bone className="h-4 w-40" />
                <Bone className="mt-4 h-24 w-full rounded-xl" />
            </div>
        </div>
    );
}
