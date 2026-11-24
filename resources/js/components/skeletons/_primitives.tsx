import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return <Skeleton className={cn('skeleton-shimmer rounded-xl', className)} style={style} />;
}

/** MarketingHeader row — optional back strip for gallery/formats. */
export function MarketingHeaderSkeleton({ back = false }: { back?: boolean }) {
    return (
        <header className="sticky top-0 z-40 border-b border-zinc-950/8 bg-background/90 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl dark:border-white/10 dark:shadow-none">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4">
                <Bone className="size-10 shrink-0 rounded-full lg:hidden" />
                <Bone className="h-7 w-20 shrink-0 sm:w-24" />
                <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-hidden>
                    <Bone className="h-8 w-[5.5rem] rounded-full" />
                    <Bone className="h-8 w-[5.25rem] rounded-full" />
                    <Bone className="h-8 w-[4.75rem] rounded-full" />
                    <Bone className="h-8 w-16 rounded-full" />
                </nav>
                <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                    <Bone className="size-10 rounded-full" />
                    <Bone className="hidden h-10 w-[4.5rem] rounded-full sm:block" />
                    <Bone className="h-10 w-[4.75rem] rounded-full sm:w-[7.25rem]" />
                </div>
            </div>
            {back ? (
                <div className="border-t border-zinc-950/8 bg-background/70 dark:border-white/10">
                    <div className="mx-auto flex max-w-6xl items-center px-3 py-2.5 sm:px-4">
                        <Bone className="h-4 w-28" />
                    </div>
                </div>
            ) : null}
        </header>
    );
}

/** SiteFooter used by designs / gallery. */
export function SiteFooterSkeleton() {
    return (
        <footer className="bg-[#1c1916] text-[#f6f1e8]">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <Bone className="h-8 w-28 bg-white/20 sm:h-9" />
                    <Bone className="mt-3 h-4 w-full max-w-[16rem] bg-white/10" />
                    <Bone className="mt-1.5 h-4 w-[90%] max-w-[14rem] bg-white/10" />
                </div>
                {Array.from({ length: 2 }, (_, col) => (
                    <div key={col}>
                        <Bone className="h-3 w-24 bg-white/20" />
                        <ul className="mt-3 space-y-2">
                            {Array.from({ length: col === 1 ? 9 : 4 }, (_, i) => (
                                <li key={i}>
                                    <Bone className="h-4 w-24 bg-white/10" />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <div>
                    <Bone className="h-3 w-14 bg-white/20" />
                    <div className="mt-4 flex gap-3">
                        <Bone className="size-10 rounded-full bg-white/10" />
                        <Bone className="size-10 rounded-full bg-white/10" />
                        <Bone className="size-10 rounded-full bg-white/10" />
                    </div>
                </div>
            </div>
            <div className="border-t border-white/10 px-4 py-4">
                <Bone className="mx-auto h-3 w-40 bg-white/10" />
            </div>
        </footer>
    );
}

/** StudioSurface inner column — body only (AppLayout chrome stays outside). */
export function StudioSurfaceSkeleton({
    children,
    className,
    innerClassName,
    ...rest
}: {
    children: React.ReactNode;
    className?: string;
    innerClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('relative min-h-[calc(100dvh-4rem)] max-w-[100vw] overflow-x-hidden', className)} aria-hidden {...rest}>
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(920px_420px_at_8%_-8%,rgba(24,24,27,0.08),transparent_55%),radial-gradient(680px_360px_at_92%_0%,rgba(16,185,129,0.10),transparent_50%),linear-gradient(180deg,#fafafa_0%,#f4f4f5_48%,#eef2f0_100%)] dark:bg-[radial-gradient(920px_420px_at_8%_-8%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(680px_360px_at_92%_0%,rgba(16,185,129,0.12),transparent_50%),linear-gradient(180deg,#0a0a0a_0%,#111113_48%,#0f1412_100%)]"
            />
            <div
                className={cn(
                    'relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-8 lg:py-10',
                    innerClassName,
                )}
            >
                {children}
            </div>
        </div>
    );
}

export function StudioHeaderSkeleton({
    actions = 1,
    blurbLines = 2,
}: {
    actions?: number;
    blurbLines?: number;
}) {
    return (
        <header>
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div className="max-w-xl space-y-0">
                    <Bone className="h-3 w-28" />
                    <Bone className="mt-2 h-[clamp(2.2rem,5vw,3.4rem)] w-[min(100%,18rem)] sm:w-[22rem]" />
                    <div className="mt-3 max-w-md space-y-2">
                        {Array.from({ length: blurbLines }, (_, i) => (
                            <Bone key={i} className={cn('h-4', i === blurbLines - 1 ? 'w-[75%]' : 'w-full')} />
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: actions }, (_, i) => (
                        <Bone key={i} className="h-11 w-36 rounded-full" />
                    ))}
                </div>
            </div>
        </header>
    );
}

export function DesignCardSkeleton() {
    return (
        <article className="flex h-full w-full flex-col rounded-[1.2rem] border border-[#2b241c]/8 bg-white p-1.5 shadow-[0_16px_36px_-28px_rgba(43,36,28,0.85)] sm:rounded-[1.45rem] sm:p-2.5 dark:border-white/10 dark:bg-card">
            <Bone className="aspect-square w-full rounded-[1.1rem]" />
            <div className="mt-3 flex flex-1 flex-col px-1 pb-0.5">
                <Bone className="h-[13px] w-[80%] sm:h-[15px]" />
                <Bone className="mt-1 h-3 w-[45%]" />
                <div className="mt-auto pt-3">
                    <Bone className="h-9 w-full rounded-full" />
                </div>
            </div>
        </article>
    );
}
