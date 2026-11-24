import {
    Bone,
    DesignCardSkeleton,
    MarketingHeaderSkeleton,
    SiteFooterSkeleton,
} from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact layout mirror of `pages/marketing/event-gallery.tsx`. */
export function GallerySkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('min-h-svh animate-in fade-in overflow-x-hidden bg-background text-foreground duration-300', className)} aria-hidden data-skeleton-page="gallery">
            <MarketingHeaderSkeleton back />

            <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
                <div className="flex flex-wrap items-center gap-3">
                    <Bone className="size-10 shrink-0 rounded-full" />
                    <div className="min-w-0 space-y-2">
                        <Bone className="h-3 w-28" />
                        <Bone className="h-9 w-56 max-w-full sm:w-72" />
                    </div>
                </div>
                <Bone className="mt-3 h-4 w-full max-w-2xl" />

                <div className="mt-6 rounded-2xl border border-[#2b241c]/8 bg-white/80 p-3 shadow-sm sm:p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <Bone className="h-10 w-full max-w-sm rounded-full" />
                        <div className="flex flex-wrap gap-2">
                            <Bone className="h-9 w-24 rounded-full" />
                            <Bone className="h-9 w-24 rounded-full" />
                            <Bone className="h-9 w-28 rounded-full" />
                        </div>
                        <Bone className="ml-auto h-9 w-28 rounded-full" />
                    </div>
                </div>

                <div className="mx-auto mt-8 w-full max-w-2xl">
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 2 }, (_, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#2b241c]/10 bg-[#f4efe6] px-3.5 py-3.5 sm:px-4">
                                <Bone className="size-10 shrink-0 rounded-2xl" />
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <Bone className="h-4 w-28" />
                                    <Bone className="h-3 w-32" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
                    {Array.from({ length: 8 }, (_, i) => (
                        <li key={i} className="gallery-tab-tile flex h-full min-w-0">
                            <DesignCardSkeleton />
                        </li>
                    ))}
                </ul>
            </main>

            <SiteFooterSkeleton />
        </div>
    );
}
