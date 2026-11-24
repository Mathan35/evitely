import { Bone, StudioHeaderSkeleton, StudioSurfaceSkeleton } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact layout mirror of `pages/dashboard.tsx` (StudioSurface body). */
export function DashboardSkeleton({ className }: { className?: string }) {
    return (
        <StudioSurfaceSkeleton className={cn('animate-in fade-in duration-300', className)} data-skeleton-page="dashboard">
            <StudioHeaderSkeleton actions={2} />

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                    <Bone key={i} className="h-[6.5rem] rounded-2xl" style={{ animationDelay: `${80 + i * 40}ms` }} />
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Bone className="min-h-[14rem] rounded-3xl" />
                <div className="rounded-2xl border border-zinc-950/8 bg-white/75 p-6 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/55">
                    <Bone className="h-3 w-24" />
                    <Bone className="mt-2 h-7 w-36" />
                    <div className="mt-6 space-y-4">
                        {Array.from({ length: 3 }, (_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Bone className="h-4 w-28" />
                                    <Bone className="h-4 w-10" />
                                </div>
                                <Bone className="h-1.5 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-3">
                <Bone className="h-3 w-24" />
                <Bone className="h-7 w-40" />
                {Array.from({ length: 4 }, (_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 rounded-2xl border border-zinc-950/8 bg-white/75 p-4 dark:border-white/10 dark:bg-zinc-950/55"
                    >
                        <Bone className="size-12 shrink-0 rounded-xl" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Bone className="h-4 w-[45%]" />
                            <Bone className="h-3 w-[30%]" />
                        </div>
                        <Bone className="h-8 w-20 rounded-full" />
                    </div>
                ))}
            </section>
        </StudioSurfaceSkeleton>
    );
}
