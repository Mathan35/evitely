import {
    Bone,
    DesignCardSkeleton,
    MarketingHeaderSkeleton,
    SiteFooterSkeleton,
} from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact layout mirror of `pages/marketing/designs.tsx`. */
export function DesignsSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('min-h-svh max-w-[100vw] animate-in fade-in overflow-x-hidden bg-background text-foreground duration-300', className)} aria-hidden data-skeleton-page="designs">
            <MarketingHeaderSkeleton back />

            <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
                <div className="flex flex-col items-center">
                    <Bone className="size-12 rounded-full" />
                    <Bone className="mt-4 h-9 w-[min(100%,28rem)] sm:h-10" />
                </div>
                <div className="mx-auto mt-3 max-w-3xl space-y-2">
                    <Bone className="mx-auto h-4 w-full" />
                    <Bone className="mx-auto h-4 w-[88%]" />
                </div>

                <div className="mt-6 rounded-2xl border border-[#2b241c]/8 bg-white/80 p-3 shadow-sm sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Bone className="h-3 w-16" />
                        <Bone className="h-8 w-36 rounded-full" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Bone className="h-8 w-[8.5rem] rounded-full" />
                        {Array.from({ length: 8 }, (_, i) => (
                            <Bone key={i} className="h-8 w-[5.5rem] rounded-full" />
                        ))}
                    </div>
                </div>

                {/* FormatSwitch — max-w-2xl grid-cols-2 */}
                <div className="mx-auto mt-8 w-full max-w-2xl">
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 2 }, (_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 rounded-2xl border border-[#2b241c]/10 bg-[#f4efe6] px-3.5 py-3.5 sm:px-4 dark:border-white/10 dark:bg-white/[0.04]"
                            >
                                <Bone className="size-10 shrink-0 rounded-2xl" />
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <Bone className="h-4 w-28" />
                                    <Bone className="h-3 w-36" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {Array.from({ length: 3 }, (_, section) => (
                    <section key={section} className="mt-12 border-t border-[#2b241c]/8 pt-8">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                                <Bone className="size-10 shrink-0 rounded-full" />
                                <div className="min-w-0 space-y-2">
                                    <Bone className="h-3 w-20" />
                                    <Bone className="h-7 w-48 max-w-full sm:w-64" />
                                    <Bone className="h-4 w-72 max-w-full" />
                                </div>
                            </div>
                            <Bone className="h-8 w-40 rounded-full" />
                        </div>
                        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
                            {Array.from({ length: 4 }, (_, i) => (
                                <li key={i} className="min-w-0">
                                    <DesignCardSkeleton />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}

                <section className="mt-16 border-t border-[#2b241c]/10 pt-12 text-center">
                    <Bone className="mx-auto h-9 w-[min(100%,28rem)]" />
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Bone className="h-11 w-48 rounded-full" />
                        <Bone className="h-11 w-44 rounded-full" />
                    </div>
                </section>
            </main>

            <SiteFooterSkeleton />
        </div>
    );
}
