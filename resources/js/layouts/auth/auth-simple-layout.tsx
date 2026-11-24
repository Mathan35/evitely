import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { AuthPanelSkeleton } from '@/components/page-skeletons';
import { ThemeToggle } from '@/components/theme-toggle';
import { skeletonShell, useInertiaNavigating } from '@/hooks/use-inertia-navigating';
import { cn } from '@/lib/utils';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

const highlights = [
    ['Cards', 'Wax seals, unboxing, and foil suites.'],
    ['Websites', 'Countdown, map, RSVP, and a guest wall.'],
    ['Studio', 'Guests reply. You never wait on an account.'],
];

function AuthFormFrame({ children }: { children: ReactNode }) {
    const { navigating, kind } = useInertiaNavigating();
    // Only overlay the form when staying in auth chrome; cross-shell visits use AuthGate.
    const active = navigating && skeletonShell(kind) === 'auth';

    return (
        <div className="relative mt-8 min-h-[14rem]" aria-busy={active || undefined}>
            <div
                className={cn(
                    'transition-[opacity,filter] duration-300 ease-out',
                    active && 'pointer-events-none opacity-40 blur-[1px]',
                )}
            >
                {children}
            </div>
            {active ? (
                <div
                    className="fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-white/92 backdrop-blur-sm animate-in fade-in zoom-in-95 fill-mode-both duration-300"
                    role="status"
                    aria-live="polite"
                    aria-label="Loading"
                    data-skeleton-kind="auth-panel"
                >
                    <AuthPanelSkeleton />
                    <span className="sr-only">Loading</span>
                </div>
            ) : null}
        </div>
    );
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="min-h-svh bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b border-zinc-950/8 bg-background/90 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl">
                <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4">
                    <BrandMark href={home()} className="text-lg sm:text-xl" />
                    <nav className="ml-2 hidden items-center gap-1 text-sm md:flex" aria-label="Auth">
                        <Link
                            href="/designs"
                            className="rounded-full px-3 py-1.5 font-medium text-zinc-600 transition hover:bg-zinc-950/5 hover:text-zinc-950"
                        >
                            Templates
                        </Link>
                        <Link
                            href={home()}
                            className="rounded-full px-3 py-1.5 font-medium text-zinc-600 transition hover:bg-zinc-950/5 hover:text-zinc-950"
                        >
                            Home
                        </Link>
                    </nav>
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
                <aside className="relative hidden overflow-hidden lg:block">
                    <p className="text-center text-[11px] tracking-[0.22em] text-[#8a7d6e] uppercase">One elegant studio</p>
                    <h2 className="mt-3 text-center font-serif text-4xl leading-[1.08] xl:text-5xl">
                        Send elegant cards or build full event websites
                    </h2>
                    <span className="mx-auto mt-5 block h-px w-20 bg-[#c6a36a]" />
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <figure className="invite-rise">
                            <img src="/images/wedding/hero-phones.jpg" alt="Interactive invitation websites on three phones" className="w-full" />
                            <figcaption className="mt-2 text-center text-[11px] tracking-[0.14em] text-[#8a7d6e] uppercase">
                                Interactive websites & links
                            </figcaption>
                        </figure>
                        <figure className="invite-rise" style={{ animationDelay: '80ms' }}>
                            <img src="/images/wedding/hero-envelopes.jpg" alt="Digital wedding cards and envelopes" className="w-full" />
                            <figcaption className="mt-2 text-center text-[11px] tracking-[0.14em] text-[#8a7d6e] uppercase">
                                Classic cards & envelopes
                            </figcaption>
                        </figure>
                    </div>
                    <ul className="mt-8 grid gap-3">
                        {highlights.map(([label, text]) => (
                            <li key={label} className="flex gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm">
                                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#c6a36a] font-serif text-xs text-white">
                                    {label[0]}
                                </span>
                                <div>
                                    <p className="text-sm font-medium">{label}</p>
                                    <p className="text-sm leading-6 text-[#5e554c]">{text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </aside>

                <div className="invite-rise mx-auto w-full max-w-md">
                    <div className="rounded-[28px] border border-[#241c16]/5 bg-white p-6 shadow-[0_24px_60px_-36px_rgba(36,28,22,0.45)] sm:p-8">
                        <p className="text-[11px] tracking-[0.22em] text-[#8a7d6e] uppercase">Evitely studio</p>
                        <h1 className="mt-3 font-serif text-4xl leading-tight">{title}</h1>
                        <span className="mt-4 block h-px w-16 bg-[#c6a36a]" />
                        <p className="mt-4 text-sm leading-6 text-[#5e554c]">{description}</p>
                        <AuthFormFrame>{children}</AuthFormFrame>
                    </div>
                    <p className="mt-6 text-center text-sm text-[#5e554c]">
                        <Link href={home()} className="underline decoration-[#c6a36a]/50 underline-offset-4">
                            Back to Evitely
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
