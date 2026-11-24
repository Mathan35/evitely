import { Bone, MarketingHeaderSkeleton, SiteFooterSkeleton } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact layout mirror of `pages/marketing/wedding-formats.tsx`. */
export function FormatsSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('min-h-screen max-w-[100vw] animate-in fade-in overflow-x-hidden bg-background text-foreground duration-300', className)} aria-hidden data-skeleton-page="formats">
            <MarketingHeaderSkeleton back />

            <main className="mx-auto max-w-6xl px-5 py-8">
                <Bone className="h-3 w-48" />
                <Bone className="mx-auto mt-6 h-11 w-[min(100%,36rem)] sm:h-12" />
                <div className="mx-auto mt-3 max-w-2xl space-y-2">
                    <Bone className="mx-auto h-4 w-full" />
                    <Bone className="mx-auto h-4 w-[90%]" />
                </div>

                <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
                    <Bone className="h-12 w-full rounded-2xl" />
                    <Bone className="h-12 w-full rounded-2xl" />
                </div>

                <div className="mt-10 grid items-start gap-10 lg:grid-cols-2">
                    {Array.from({ length: 2 }, (_, col) => (
                        <div key={col}>
                            <Bone className="mx-auto h-3 w-56" />
                            <Bone className="mx-auto mt-4 aspect-[4/5] w-full max-w-[220px] rounded-[1.8rem] lg:max-w-none lg:rounded-[1.25rem]" />
                            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8">
                                {Array.from({ length: 4 }, (_, i) => (
                                    <div key={i}>
                                        <Bone className="aspect-[3/4] w-full rounded-xl" />
                                        <Bone className="mx-auto mt-2 h-3 w-[70%]" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl bg-white p-4 shadow-sm dark:bg-card">
                    <Bone className="h-5 w-40" />
                    <div className="mt-4 space-y-3">
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="flex gap-4">
                                <Bone className="h-4 w-28" />
                                <Bone className="h-4 flex-1" />
                                <Bone className="h-4 flex-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <SiteFooterSkeleton />
        </div>
    );
}
