import { Bone, StudioHeaderSkeleton, StudioSurfaceSkeleton } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact layout mirror of `pages/studio/analytics.tsx`. */
export function AnalyticsSkeleton({ className }: { className?: string }) {
    return (
        <StudioSurfaceSkeleton className={cn('animate-in fade-in duration-300', className)} data-skeleton-page="analytics">
            <StudioHeaderSkeleton actions={0} blurbLines={1} />

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                    <Bone key={i} className="h-[6.5rem] rounded-2xl" />
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                <div className="rounded-2xl border border-zinc-950/8 bg-white/75 p-5 sm:p-6 dark:border-white/10 dark:bg-zinc-950/55">
                    <Bone className="h-5 w-32" />
                    <Bone className="mt-4 h-56 w-full rounded-xl" />
                </div>
                <div className="rounded-2xl border border-zinc-950/8 bg-white/75 p-5 sm:p-6 dark:border-white/10 dark:bg-zinc-950/55">
                    <Bone className="h-5 w-28" />
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }, (_, i) => (
                            <Bone key={i} className="h-16 rounded-xl" />
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="overflow-hidden rounded-2xl border border-zinc-950/8 bg-white/75 dark:border-white/10 dark:bg-zinc-950/55">
                    <div className="border-b border-zinc-950/8 px-5 py-4 dark:border-white/10">
                        <Bone className="h-5 w-36" />
                    </div>
                    <div className="divide-y divide-zinc-950/8 dark:divide-white/10">
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-3">
                                <Bone className="h-4 w-[40%]" />
                                <Bone className="ml-auto h-4 w-12" />
                                <Bone className="h-4 w-12" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-zinc-950/8 bg-white/75 dark:border-white/10 dark:bg-zinc-950/55">
                    <div className="border-b border-zinc-950/8 px-5 py-4 dark:border-white/10">
                        <Bone className="h-5 w-28" />
                    </div>
                    <div className="space-y-3 p-5">
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between">
                                    <Bone className="h-3 w-20" />
                                    <Bone className="h-3 w-10" />
                                </div>
                                <Bone className="h-2 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </StudioSurfaceSkeleton>
    );
}
