import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Layout-faithful skeleton for `pages/welcome.tsx`.
 * Mirrors the same containers, padding, gaps, breakpoints, and section rhythm.
 */
function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return <Skeleton className={cn('skeleton-shimmer rounded-xl', className)} style={style} />;
}

/** Matches MarketingHeader row: h-14 / sm:h-16, max-w-6xl, gap-2 / sm:gap-3. */
function MarketingHeaderSkeleton() {
    return (
        <header className="sticky top-0 z-40 border-b border-zinc-950/8 bg-background/90 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl dark:border-white/10 dark:shadow-none">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4">
                {/* Mobile menu trigger — size-10, lg:hidden */}
                <Bone className="size-10 shrink-0 rounded-full lg:hidden" />
                {/* BrandMark */}
                <Bone className="h-7 w-20 shrink-0 sm:w-24" />
                {/* Desktop nav — lg:flex (Templates, Features, Planning, Pricing) */}
                <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-hidden>
                    <Bone className="h-8 w-[5.5rem] rounded-full" />
                    <Bone className="h-8 w-[5.25rem] rounded-full" />
                    <Bone className="h-8 w-[4.75rem] rounded-full" />
                    <Bone className="h-8 w-16 rounded-full" />
                </nav>
                <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                    {/* ThemeToggle */}
                    <Bone className="size-10 rounded-full" />
                    {/* Log in — hidden until sm */}
                    <Bone className="hidden h-10 w-[4.5rem] rounded-full sm:block" />
                    {/* Get Started */}
                    <Bone className="h-10 w-[4.75rem] rounded-full sm:w-[7.25rem]" />
                </div>
            </div>
        </header>
    );
}

/** Occasion pill widths measured from live home (~px/16). */
const OCCASION_PILL_WIDTHS = [
    'w-[6.7rem]', // All Events ~107px
    'w-[7.2rem]', // Weddings ~115px
    'w-[6.6rem]', // Birthdays ~105px
    'w-[6.9rem]', // Corporate ~110px
    'w-[8.4rem]', // Baby Showers ~134px
    'w-[5.6rem]', // Parties ~89px
    'w-[7.7rem]', // Graduations ~123px
    'w-[5.4rem]', // Bridals ~87px
    'w-[8.9rem]', // Housewarming ~142px
    'w-[5.9rem]', // Custom ~95px
] as const;

export function WelcomeSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn('min-h-screen max-w-[100vw] animate-in fade-in overflow-x-hidden bg-background text-foreground duration-300', className)}
            aria-hidden
            data-skeleton-page="welcome"
        >
            <MarketingHeaderSkeleton />

            <main>
                {/* Hero */}
                <section className="mx-auto max-w-6xl px-5 pt-14 text-center">
                    {/* OccasionMark size="lg" → h-12 w-12 */}
                    <div className="mb-5 flex justify-center">
                        <Bone className="size-12 rounded-full" />
                    </div>

                    {/* h1: max-w-3xl font-serif text-5xl / sm:text-6xl leading-[1.05] — ~2–3 lines */}
                    <div className="mx-auto max-w-3xl space-y-2 sm:space-y-2.5">
                        <Bone className="mx-auto h-[2.6rem] w-full max-w-[19rem] sm:h-[3.15rem] sm:max-w-[42rem]" />
                        <Bone className="mx-auto h-[2.6rem] w-[92%] max-w-[17rem] sm:h-[3.15rem] sm:w-full sm:max-w-[38rem]" />
                        <Bone className="mx-auto hidden h-[3.15rem] w-[55%] max-w-[18rem] sm:block" />
                    </div>

                    {/* Gold rule */}
                    <span className="mx-auto mt-5 block h-px w-24 bg-[#c6a36a]" />

                    {/* Sub: max-w-2xl text-sm leading-6 sm:text-base — ~2–3 lines */}
                    <div className="mx-auto mt-5 max-w-2xl space-y-2">
                        <Bone className="mx-auto h-4 w-full sm:h-[1.125rem]" />
                        <Bone className="mx-auto h-4 w-[94%] sm:h-[1.125rem]" />
                        <Bone className="mx-auto h-4 w-[72%] sm:h-[1.125rem] sm:w-[78%]" />
                    </div>

                    {/* Occasions tablist — flex-wrap gap-2, pills px-3 py-2 */}
                    <div className="mt-7 flex max-w-full flex-wrap justify-center gap-2 overflow-hidden">
                        {OCCASION_PILL_WIDTHS.map((width, i) => (
                            <Bone
                                key={i}
                                className={cn('h-9 max-w-full rounded-full', width, i >= 4 && 'hidden sm:block')}
                                style={{ animationDelay: `${i * 28}ms` }}
                            />
                        ))}
                    </div>

                    {/* Explore designs CTA — measured ~226×42 */}
                    <div className="mt-6 flex justify-center">
                        <Bone className="h-[2.625rem] w-full max-w-[14.125rem] rounded-full" />
                    </div>

                    {/* EventTypeHero — mt-10 grid gap-6 lg:grid-cols-2; images are 16:9 */}
                    <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
                        <div>
                            <Bone className="mx-auto h-3 w-[11rem]" />
                            <Bone className="mt-4 aspect-video w-full rounded-none" />
                        </div>
                        <div>
                            <Bone className="mx-auto h-3 w-[14rem]" />
                            <Bone className="mt-4 aspect-video w-full rounded-none" />
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section className="mx-auto max-w-6xl px-5 py-20">
                    <Bone className="mx-auto h-3 w-[6.5rem]" />
                    {/* text-4xl sm:text-5xl */}
                    <Bone className="mx-auto mt-3 h-9 w-[min(100%,22rem)] sm:h-11 sm:w-[min(100%,28rem)]" />
                    <ol className="mt-10 grid gap-4 lg:grid-cols-3">
                        {Array.from({ length: 3 }, (_, i) => (
                            <li key={i} className="rounded-3xl bg-white p-5 text-left shadow-sm dark:bg-card">
                                <Bone className="h-5 w-[9.5rem]" />
                                <Bone className="mt-2 h-4 w-full" />
                                <Bone className="mt-2 h-4 w-[92%]" />
                                <Bone className="mt-2 h-4 w-[70%]" />
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Celebration suite */}
                <section className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20">
                    <Bone className="mx-auto h-3 w-[14rem] sm:w-[16rem]" />
                    <Bone className="mx-auto mt-3 h-9 w-[min(100%,24rem)] sm:h-11 sm:w-[min(100%,32rem)]" />
                    <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, i) => (
                            <div key={i} className="rounded-3xl bg-white p-4 text-left shadow-sm dark:bg-card">
                                {/* SuiteCard media: mb-4 h-40 rounded-2xl */}
                                <Bone className="mb-4 h-40 w-full rounded-2xl" />
                                <Bone className="h-5 w-[75%]" />
                                <Bone className="mt-2 h-4 w-full" />
                                <Bone className="mt-1.5 h-4 w-[85%]" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Digital Card vs Event Website */}
                <section className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20">
                    <Bone className="mx-auto h-9 w-[min(100%,26rem)] sm:h-11 sm:w-[min(100%,34rem)]" />
                    <Bone className="mx-auto mt-3 h-4 w-48" />
                    <div className="mt-8 grid gap-4 lg:grid-cols-2">
                        {Array.from({ length: 2 }, (_, i) => (
                            <article
                                key={i}
                                className="grid items-center gap-4 rounded-[28px] bg-white p-5 shadow-sm sm:grid-cols-[1.1fr_0.9fr] dark:bg-card"
                            >
                                <div>
                                    <Bone className="h-5 w-[12rem]" />
                                    <div className="mt-3 space-y-1.5">
                                        <Bone className="h-4 w-36" />
                                        <Bone className="h-4 w-40" />
                                        <Bone className="h-4 w-48" />
                                    </div>
                                </div>
                                {/* FormatCard visual: h-36 area */}
                                <Bone className="h-36 w-full rounded-2xl" />
                            </article>
                        ))}
                    </div>
                </section>

                {/* Guest experiences + quotes */}
                <section className="mx-auto grid max-w-6xl items-start gap-12 px-5 pb-16 lg:grid-cols-2">
                    <div>
                        <Bone className="mx-auto h-3 w-[12.5rem]" />
                        <div className="mx-auto mt-3 max-w-md space-y-2">
                            <Bone className="mx-auto h-8 w-[92%] sm:h-9" />
                            <Bone className="mx-auto h-8 w-[78%] sm:h-9" />
                        </div>
                        <div className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-4 sm:gap-6">
                            {Array.from({ length: 2 }, (_, i) => (
                                <div key={i} className="text-center">
                                    {/* Phone shots: max-w-[220px], tall portrait */}
                                    <Bone className="mx-auto aspect-[9/19] w-full max-w-[220px] rounded-[1.25rem]" />
                                    <Bone className="mx-auto mt-4 h-6 w-[7.5rem] sm:h-7 sm:w-36" />
                                    <Bone className="mx-auto mt-1 h-4 w-full max-w-[200px]" />
                                    <Bone className="mx-auto mt-1 h-4 w-[85%] max-w-[180px]" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Bone className="mx-auto h-3 w-[11.5rem]" />
                        <div className="mx-auto mt-3 max-w-md space-y-2">
                            <Bone className="mx-auto h-8 w-[95%] sm:h-9" />
                            <Bone className="mx-auto h-8 w-[70%] sm:h-9" />
                        </div>
                        <div className="mt-6 grid gap-4">
                            {Array.from({ length: 2 }, (_, i) => (
                                <figure key={i} className="rounded-3xl bg-white p-5 shadow-sm dark:bg-card">
                                    <div className="flex items-center gap-3">
                                        <Bone className="size-12 shrink-0 rounded-full" />
                                        <div className="min-w-0 space-y-1.5">
                                            <Bone className="h-4 w-28" />
                                            <Bone className="h-3 w-20" />
                                        </div>
                                        <Bone className="ml-auto h-4 w-16 shrink-0" />
                                    </div>
                                    <Bone className="mt-3 h-4 w-full" />
                                    <Bone className="mt-1.5 h-4 w-[94%]" />
                                    <Bone className="mt-1.5 h-4 w-[60%]" />
                                </figure>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Masterpiece CTA */}
                <section className="w-full">
                    <article className="relative w-full scroll-mt-24 overflow-hidden bg-[#1c1916] px-6 py-20 text-[#f6f1e8] sm:px-10 sm:py-24">
                        <div className="relative z-10 mx-auto max-w-md text-center">
                            <div className="space-y-2.5 sm:space-y-3">
                                <Bone className="mx-auto h-9 w-full bg-white/15 sm:h-11" />
                                <Bone className="mx-auto h-9 w-[90%] bg-white/15 sm:h-11" />
                                <Bone className="mx-auto h-9 w-[70%] bg-white/15 sm:h-11" />
                            </div>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <Bone className="h-10 w-[11.5rem] rounded-full bg-white/25" />
                                <Bone className="h-10 w-[10rem] rounded-full bg-white/10" />
                            </div>
                        </div>
                    </article>
                </section>
            </main>

            <footer className="bg-[#1c1916] text-[#f6f1e8]">
                <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <Bone className="h-8 w-28 bg-white/20 sm:h-9" />
                        <Bone className="mt-3 h-4 w-full max-w-[14rem] bg-white/10" />
                        <Bone className="mt-1.5 h-4 w-[85%] max-w-[12rem] bg-white/10" />
                    </div>
                    <div>
                        <Bone className="h-3 w-20 bg-white/20" />
                        <ul className="mt-3 space-y-2">
                            {Array.from({ length: 4 }, (_, i) => (
                                <li key={i}>
                                    <Bone className="h-4 w-24 bg-white/10" />
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <Bone className="h-3 w-24 bg-white/20" />
                        <ul className="mt-3 space-y-2">
                            {Array.from({ length: 5 }, (_, i) => (
                                <li key={i}>
                                    <Bone className="h-4 w-20 bg-white/10" />
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <Bone className="h-3 w-14 bg-white/20" />
                        <div className="mt-4 flex gap-3">
                            <Bone className="size-10 rounded-full bg-white/10" />
                            <Bone className="size-10 rounded-full bg-white/10" />
                            <Bone className="size-10 rounded-full bg-white/10" />
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/10 px-5 py-4">
                    <Bone className="mx-auto h-3 w-24 bg-white/10" />
                </div>
            </footer>
        </div>
    );
}
