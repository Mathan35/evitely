import { Bone, MarketingHeaderSkeleton } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Exact layout mirror of `pages/seo/landing.tsx` via SiteFrame. */
export function SeoSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('min-h-screen max-w-[100vw] animate-in fade-in overflow-x-hidden bg-background text-foreground duration-300', className)} aria-hidden data-skeleton-page="seo">
            <MarketingHeaderSkeleton />

            <main className="mx-auto w-full max-w-6xl px-4 py-14">
                <Bone className="h-3 w-36" />
                <div className="mt-4 grid items-start gap-10 lg:grid-cols-[1.15fr_.85fr]">
                    <div>
                        <Bone className="h-12 w-full max-w-lg sm:h-14" />
                        <Bone className="mt-2 h-12 w-[85%] max-w-md sm:h-14" />
                        <Bone className="mt-6 h-5 w-full max-w-xl" />
                        <Bone className="mt-2 h-5 w-[92%] max-w-xl" />
                        <div className="mt-4 max-w-2xl space-y-2">
                            <Bone className="h-4 w-full" />
                            <Bone className="h-4 w-full" />
                            <Bone className="h-4 w-[70%]" />
                        </div>
                        <Bone className="mt-8 h-11 w-48" />
                    </div>
                    <Bone className="aspect-[3/4] w-full max-w-md justify-self-center rounded-2xl lg:justify-self-end" />
                </div>

                <ol className="mt-14 grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }, (_, i) => (
                        <li key={i} className="border-t border-[#1c1712]/15 pt-4">
                            <Bone className="h-3 w-8" />
                            <Bone className="mt-2 h-7 w-full" />
                            <Bone className="mt-2 h-7 w-[80%]" />
                        </li>
                    ))}
                </ol>

                <div className="mt-14">
                    <Bone className="h-3 w-28" />
                    <div className="mt-4 flex flex-wrap gap-3">
                        {Array.from({ length: 8 }, (_, i) => (
                            <Bone key={i} className="h-9 w-28" />
                        ))}
                    </div>
                </div>
            </main>

            <footer className="bg-[#1c1916] text-[#f6f1e8]">
                <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="space-y-3">
                            <Bone className="h-4 w-24 bg-white/20" />
                            <Bone className="h-3 w-32 bg-white/10" />
                            <Bone className="h-3 w-28 bg-white/10" />
                            <Bone className="h-3 w-36 bg-white/10" />
                        </div>
                    ))}
                </div>
            </footer>
        </div>
    );
}
