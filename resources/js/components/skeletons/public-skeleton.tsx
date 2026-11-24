import { Bone } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/**
 * Full-bleed live invitation website — `pages/public/wedding.tsx` → `WeddingSiteView`
 * (unframed gallery site). Warm theme canvas, sticky header, 16:9 hero, sections.
 * NOT a dark marketing shell.
 */
export function PublicSiteSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'relative min-h-svh max-w-[100vw] animate-in fade-in overflow-x-hidden overflow-y-hidden bg-[#f8f0e3] text-[#2b241c] duration-300',
                className,
            )}
            aria-hidden
            data-skeleton-page="public-site"
            style={
                {
                    ['--w-bg' as string]: '#f8f0e3',
                    ['--w-ink' as string]: '#2b241c',
                    ['--w-accent' as string]: '#c6a36a',
                } as React.CSSProperties
            }
        >
            {/* Sticky desktop-style header (live always passes device=desktop) */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#c6a36a]/10 bg-[#f8f0e3]/90 px-5 py-3.5 backdrop-blur-md sm:px-8">
                <Bone className="h-4 w-12 bg-[#c6a36a]/40" />
                <nav className="hidden max-w-[72%] flex-wrap items-center justify-end gap-x-4 gap-y-1.5 md:flex" aria-hidden>
                    {Array.from({ length: 6 }, (_, i) => (
                        <Bone key={i} className="h-2.5 w-14 bg-[#2b241c]/12" />
                    ))}
                </nav>
                <Bone className="size-6 rounded-md bg-[#c6a36a]/35 md:hidden" />
            </header>

            {/* Hero — full bleed; aspect softens on narrow viewports */}
            <section className="relative z-[2] w-full bg-zinc-900">
                <div className="relative overflow-hidden">
                    <Bone className="aspect-[4/5] w-full rounded-none bg-zinc-800/85 sm:aspect-[16/9]" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/70" />
                    <div className="absolute inset-0 z-[12] flex flex-col items-center justify-center gap-3 px-6 text-center sm:gap-4">
                        <Bone className="h-2.5 w-28 bg-white/35" />
                        <Bone className="mt-2 h-12 w-44 max-w-[75%] bg-white/45 sm:h-16 sm:w-64" />
                        <Bone className="h-5 w-8 bg-white/30" />
                        <Bone className="h-12 w-44 max-w-[75%] bg-white/45 sm:h-16 sm:w-64" />
                        <Bone className="mt-3 h-3.5 w-64 max-w-full bg-white/25 sm:w-80" />
                        <Bone className="mt-2 h-2.5 w-40 bg-white/30" />
                        <div className="mt-6 flex w-full max-w-xs flex-col gap-3 sm:max-w-md sm:flex-row">
                            <Bone className="h-12 flex-1 rounded-full bg-[#c6a36a]/75" />
                            <Bone className="h-12 flex-1 rounded-full bg-white/30" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Body sections — max-w-5xl like live gallery content */}
            <div className="relative z-[1] mx-auto w-full max-w-5xl">
                <section className="flex flex-col items-center border-t border-[#c6a36a]/15 px-5 py-10 text-center sm:px-10 sm:py-14">
                    <Bone className="h-2.5 w-32 bg-[#c6a36a]/40" />
                    <Bone className="mt-3 h-8 w-48 bg-[#2b241c]/15" />
                    <div className="mt-7 grid w-full max-w-xl grid-cols-4 gap-1.5 sm:gap-4">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className="flex min-w-0 flex-col items-center gap-2">
                                <Bone className="h-8 w-full max-w-[3rem] bg-[#c6a36a]/35 sm:h-9" />
                                <Bone className="h-2 w-8 max-w-full bg-[#2b241c]/10 sm:w-12" />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="border-t border-[#c6a36a]/15 px-5 py-10 sm:px-10 sm:py-14">
                    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
                        <Bone className="h-2.5 w-24 bg-[#c6a36a]/40" />
                        <Bone className="h-7 w-56 max-w-full bg-[#2b241c]/15" />
                        <Bone className="mt-2 h-3.5 w-full bg-[#2b241c]/10" />
                        <Bone className="h-3.5 w-[90%] bg-[#2b241c]/10" />
                        <Bone className="h-3.5 w-[70%] bg-[#2b241c]/10" />
                    </div>
                </section>

                <section className="border-t border-[#c6a36a]/15 px-5 py-10 sm:px-10 sm:py-14">
                    <Bone className="mx-auto h-2.5 w-28 bg-[#c6a36a]/40" />
                    <Bone className="mx-auto mt-3 h-7 w-40 bg-[#2b241c]/15" />
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Bone className="aspect-[4/3] w-full rounded-2xl bg-[#2b241c]/08" />
                        <Bone className="aspect-[4/3] w-full rounded-2xl bg-[#2b241c]/08" />
                    </div>
                </section>
            </div>
        </div>
    );
}

/** Public card face — `pages/public/card.tsx`. */
export function PublicCardSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'flex min-h-svh animate-in fade-in items-center justify-center bg-[#1c1712] p-6 duration-300 sm:p-10',
                className,
            )}
            aria-hidden
            data-skeleton-page="public-card"
        >
            <div className="relative aspect-[3/4] w-full max-w-[420px] overflow-hidden rounded-[1.15rem] bg-[#f4efe6] shadow-[0_28px_70px_-28px_rgba(24,24,27,0.55)] ring-1 ring-white/10">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                    <Bone className="h-3 w-20 bg-[#2b241c]/15" />
                    <Bone className="h-8 w-40 max-w-full bg-[#2b241c]/20" />
                    <Bone className="h-3 w-28 bg-[#2b241c]/12" />
                    <Bone className="mt-6 h-px w-16 bg-[#2b241c]/15" />
                    <Bone className="mt-4 h-3 w-36 bg-[#2b241c]/12" />
                    <Bone className="h-3 w-28 bg-[#2b241c]/12" />
                    <Bone className="mt-8 h-10 w-32 rounded-full bg-[#2b241c]/15" />
                </div>
            </div>
        </div>
    );
}
