import { Bone, StudioHeaderSkeleton, StudioSurfaceSkeleton } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact layout mirror of `pages/weddings/index.tsx`. */
export function EventsIndexSkeleton({ className }: { className?: string }) {
    return (
        <StudioSurfaceSkeleton className={cn('animate-in fade-in duration-300', className)} data-skeleton-page="events-index">
            <StudioHeaderSkeleton actions={1} />

            <div className="flex flex-wrap items-center gap-2">
                <Bone className="h-10 w-48 rounded-full" />
                <Bone className="h-10 w-20 rounded-full" />
                <Bone className="h-10 w-20 rounded-full" />
                <Bone className="ml-auto h-10 w-24 rounded-full" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                    <article
                        key={i}
                        className="rounded-3xl border border-zinc-950/8 bg-white/80 p-6 dark:border-white/10 dark:bg-zinc-950/55"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-2">
                                <Bone className="h-3 w-16" />
                                <Bone className="h-7 w-[70%]" />
                                <Bone className="h-4 w-[50%]" />
                            </div>
                            <Bone className="h-7 w-16 rounded-full" />
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <Bone className="h-16 rounded-2xl" />
                            <Bone className="h-16 rounded-2xl" />
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <Bone className="h-9 w-24 rounded-full" />
                            <Bone className="h-9 w-24 rounded-full" />
                            <Bone className="h-9 w-20 rounded-full" />
                        </div>
                    </article>
                ))}
            </div>
        </StudioSurfaceSkeleton>
    );
}
