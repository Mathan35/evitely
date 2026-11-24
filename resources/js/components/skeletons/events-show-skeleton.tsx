import { Bone } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact layout mirror of `pages/weddings/show.tsx` (gap-8 surface). */
export function EventsShowSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('relative min-h-[calc(100dvh-4rem)] animate-in fade-in overflow-hidden duration-300', className)} aria-hidden data-skeleton-page="events-show">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#fafafa_0%,#f4f4f5_48%,#eef2f0_100%)] dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#111113_48%,#0f1412_100%)]" />
            <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
                <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="min-w-0 max-w-2xl space-y-3">
                        <Bone className="h-3 w-24" />
                        <Bone className="h-10 w-72 max-w-full" />
                        <Bone className="h-4 w-56" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Bone className="h-10 w-28 rounded-full" />
                        <Bone className="h-10 w-28 rounded-full" />
                        <Bone className="h-10 w-28 rounded-full" />
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="space-y-6">
                        <Bone className="min-h-[10rem] rounded-[1.6rem]" />
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                            {Array.from({ length: 8 }, (_, i) => (
                                <Bone key={i} className="h-[5.25rem] rounded-[1.25rem]" />
                            ))}
                        </div>
                        <Bone className="min-h-40 rounded-[1.6rem]" />
                        <Bone className="min-h-40 rounded-[1.6rem]" />
                    </div>
                    <aside className="lg:sticky lg:top-6 lg:self-start">
                        <div className="overflow-hidden rounded-[1.6rem] border border-zinc-950/8 bg-white/95 p-5 dark:border-white/10 dark:bg-zinc-950/55">
                            <Bone className="h-5 w-28" />
                            <Bone className="mt-4 aspect-square w-full rounded-2xl" />
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <Bone className="h-10 rounded-full" />
                                <Bone className="h-10 rounded-full" />
                            </div>
                            <Bone className="mt-3 h-10 w-full rounded-full" />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
