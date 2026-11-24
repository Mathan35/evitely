import { Bone, StudioHeaderSkeleton, StudioSurfaceSkeleton } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact layout mirror of `pages/studio/guests.tsx`. */
export function GuestsSkeleton({ className }: { className?: string }) {
    return (
        <StudioSurfaceSkeleton className={cn('animate-in fade-in duration-300', className)} data-skeleton-page="guests">
            <StudioHeaderSkeleton actions={1} />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }, (_, i) => (
                    <Bone key={i} className="h-[4.25rem] rounded-2xl" />
                ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-950/8 bg-white/75 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/55">
                <div className="flex flex-wrap items-center gap-3 border-b border-zinc-950/8 px-4 py-3 dark:border-white/10">
                    <Bone className="h-10 min-w-0 w-full flex-1 rounded-full sm:min-w-[12rem]" />
                    <Bone className="h-10 w-24 shrink-0 rounded-full sm:w-28" />
                </div>
                <ul className="divide-y divide-zinc-950/8 dark:divide-white/10">
                    {Array.from({ length: 8 }, (_, i) => (
                        <li key={i} className="flex flex-wrap items-center gap-4 px-4 py-4">
                            <Bone className="size-10 shrink-0 rounded-full" />
                            <div className="min-w-0 flex-1 space-y-2">
                                <Bone className="h-4 w-[40%]" />
                                <Bone className="h-3 w-[28%]" />
                            </div>
                            <Bone className="h-7 w-20 rounded-full" />
                        </li>
                    ))}
                </ul>
            </div>
        </StudioSurfaceSkeleton>
    );
}
