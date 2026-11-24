import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StudioSurface({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('relative min-h-[calc(100dvh-4rem)] overflow-x-clip', className)}>
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(920px_420px_at_8%_-8%,rgba(24,24,27,0.08),transparent_55%),radial-gradient(680px_360px_at_92%_0%,rgba(16,185,129,0.10),transparent_50%),linear-gradient(180deg,#fafafa_0%,#f4f4f5_48%,#eef2f0_100%)] dark:bg-[radial-gradient(920px_420px_at_8%_-8%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(680px_360px_at_92%_0%,rgba(16,185,129,0.12),transparent_50%),linear-gradient(180deg,#0a0a0a_0%,#111113_48%,#0f1412_100%)]"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(24,24,27,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.03)_1px,transparent_1px)] [background-size:48px_48px] dark:opacity-[0.2] dark:[background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]"
            />
            <div className="relative mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-3 py-5 sm:gap-8 sm:px-6 sm:py-8 lg:py-10">
                {children}
            </div>
        </div>
    );
}

export function StudioEyebrow({ children }: { children: ReactNode }) {
    return (
        <p className="text-[10px] font-semibold tracking-[0.22em] text-zinc-500 uppercase">
            {children}
        </p>
    );
}

export function StudioTitle({ children }: { children: ReactNode }) {
    return (
        <h1 className="mt-2 font-serif text-[clamp(1.85rem,7vw,3.4rem)] leading-[0.95] tracking-tight text-zinc-950 dark:text-zinc-50">
            {children}
        </h1>
    );
}

export function StudioCard({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'min-w-0 rounded-2xl border border-zinc-950/8 bg-white/75 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/55 dark:shadow-none',
                className,
            )}
        >
            {children}
        </div>
    );
}
