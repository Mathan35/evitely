import { Bone } from '@/components/skeletons/_primitives';
import { cn } from '@/lib/utils';

/** Full auth page — entering login/register from marketing. */
export function AuthSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('min-h-svh max-w-[100vw] animate-in fade-in overflow-x-hidden bg-background text-foreground duration-300', className)} aria-hidden data-skeleton-page="auth">
            <header className="sticky top-0 z-40 border-b border-zinc-950/8 bg-background/90 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl">
                <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4">
                    <Bone className="h-7 w-20" />
                    <nav className="ml-2 hidden items-center gap-1 md:flex">
                        <Bone className="h-8 w-24 rounded-full" />
                        <Bone className="h-8 w-16 rounded-full" />
                    </nav>
                    <div className="ml-auto">
                        <Bone className="size-10 rounded-full" />
                    </div>
                </div>
            </header>

            <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
                <div className="relative hidden overflow-hidden lg:block">
                    <Bone className="mx-auto h-3 w-36" />
                    <Bone className="mx-auto mt-3 h-12 w-[min(100%,28rem)]" />
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <Bone className="aspect-[3/4] w-full rounded-2xl" />
                        <Bone className="aspect-[3/4] w-full rounded-2xl" />
                    </div>
                    <div className="mt-8 grid gap-3">
                        {Array.from({ length: 3 }, (_, i) => (
                            <Bone key={i} className="h-16 w-full rounded-2xl" />
                        ))}
                    </div>
                </div>

                <div className="mx-auto w-full max-w-md">
                    <div className="rounded-[28px] border border-[#241c16]/5 bg-white p-6 shadow-[0_24px_60px_-36px_rgba(36,28,22,0.45)] sm:p-8">
                        <Bone className="h-3 w-28" />
                        <Bone className="mt-3 h-10 w-40" />
                        <span className="mt-4 block h-px w-16 bg-[#c6a36a]/50" />
                        <Bone className="mt-4 h-4 w-56 max-w-full" />
                        <div className="mt-8">
                            <AuthPanelSkeleton />
                        </div>
                    </div>
                    <Bone className="mx-auto mt-6 h-4 w-28" />
                </div>
            </div>
        </div>
    );
}

/** Auth form fields only — inside auth layout card. */
export function AuthPanelSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('animate-in fade-in space-y-3 duration-300', className)} aria-hidden data-skeleton-page="auth-panel">
            <Bone className="h-11 w-full rounded-xl" />
            <Bone className="h-11 w-full rounded-xl" />
            <Bone className="mt-4 h-11 w-full rounded-full" />
            <Bone className="mx-auto mt-3 h-3 w-40" />
        </div>
    );
}
