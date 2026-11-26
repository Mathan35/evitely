import { Link, usePage } from '@inertiajs/react';
import { CreditCard, Gauge, Palette, Shield, UserRound } from 'lucide-react';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { SettingsPanelSkeleton } from '@/components/page-skeletons';
import { StudioEyebrow, StudioSurface, StudioTitle } from '@/components/studio/studio-surface';
import { skeletonShell, useInertiaNavigating } from '@/hooks/use-inertia-navigating';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { Auth, NavItem } from '@/types';

const sidebarNavItems: (NavItem & {
    description: string;
    icon: typeof UserRound;
    eyebrow: string;
    headline: string;
    blurb: string;
})[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: UserRound,
        description: 'Name, email, and identity',
        eyebrow: 'Account',
        headline: 'Profile',
        blurb: 'Manage how you appear in the studio and keep your contact details current.',
    },
    {
        title: 'Billing',
        href: '/settings/billing',
        icon: CreditCard,
        description: 'Season passes & credits',
        eyebrow: 'Account',
        headline: 'Billing',
        blurb: 'Buy a wedding-season Pro pass and message credits (UPI, cards, netbanking).',
    },
    {
        title: 'Admin',
        href: '/admin',
        icon: Gauge,
        description: 'Owner console',
        eyebrow: 'Platform',
        headline: 'Admin',
        blurb: 'Users, events, billing, moderation, integrations, queues, and analytics.',
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: Shield,
        description: 'Password, 2FA, and passkeys',
        eyebrow: 'Account',
        headline: 'Security',
        blurb: 'Protect your studio with a strong password, two-factor auth, and passkeys.',
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
        description: 'Theme preference',
        eyebrow: 'Account',
        headline: 'Appearance',
        blurb: 'Choose how Invidora looks across light and dark sessions.',
    },
];

function SettingsPanelFrame({ children }: PropsWithChildren) {
    const { navigating, kind } = useInertiaNavigating();
    const active = navigating && skeletonShell(kind) === 'settings';

    return (
        <div className="relative min-h-[24rem] w-full min-w-0 max-w-full" aria-busy={active || undefined}>
            <div
                className={cn(
                    'min-w-0 transition-[opacity,filter] duration-300 ease-out',
                    active && 'pointer-events-none opacity-40 blur-[1px]',
                )}
            >
                {children}
            </div>
            {active ? (
                <div
                    className="fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-background/92 backdrop-blur-sm animate-in fade-in zoom-in-95 fill-mode-both duration-300"
                    role="status"
                    aria-live="polite"
                    aria-label="Loading settings"
                    data-skeleton-kind="settings-panel"
                >
                    <SettingsPanelSkeleton />
                    <span className="sr-only">Loading</span>
                </div>
            ) : null}
        </div>
    );
}

type SettingsNavItem = (typeof sidebarNavItems)[number];

function SettingsNav({ items }: { items: SettingsNavItem[] }) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const navRef = useRef<HTMLElement>(null);
    const activeHref = items.find((item) => isCurrentOrParentUrl(item.href))?.href;

    useEffect(() => {
        const nav = navRef.current;
        if (!nav || !activeHref) {
            return;
        }

        const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
        if (!active) {
            return;
        }

        const left = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
        nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }, [activeHref]);

    return (
        <aside className="relative w-full min-w-0 max-w-full lg:sticky lg:top-24 lg:self-start">
            <nav
                ref={navRef}
                className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto overscroll-x-contain scroll-smooth rounded-2xl border border-zinc-950/8 bg-white/80 p-1.5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] backdrop-blur [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory lg:flex-col lg:gap-1.5 lg:overflow-visible lg:p-2 lg:snap-none dark:border-white/10 dark:bg-zinc-950/55 dark:shadow-none [&::-webkit-scrollbar]:hidden"
                aria-label="Account settings"
            >
                {items.map((item) => {
                    const active = isCurrentOrParentUrl(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={toUrl(item.href)}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'inline-flex shrink-0 snap-start items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium whitespace-nowrap transition sm:gap-2 sm:px-3.5 sm:py-2.5 lg:w-full lg:snap-align-none lg:flex-col lg:items-start lg:justify-start lg:gap-0 lg:whitespace-normal lg:px-3.5 lg:py-3',
                                active
                                    ? 'bg-zinc-950 text-white shadow-md shadow-zinc-950/15 dark:bg-white dark:text-zinc-950'
                                    : 'text-zinc-600 hover:bg-zinc-950/5 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white',
                            )}
                        >
                            <span className="inline-flex items-center gap-1.5 sm:gap-2">
                                <Icon className="size-4 shrink-0" aria-hidden />
                                {item.title}
                            </span>
                            <span
                                className={cn(
                                    'mt-1 hidden text-xs leading-snug font-normal lg:block',
                                    active ? 'text-white/70 dark:text-zinc-600' : 'text-zinc-500',
                                )}
                            >
                                {item.description}
                            </span>
                        </Link>
                    );
                })}
            </nav>
            <div
                aria-hidden
                className="pointer-events-none absolute inset-y-1.5 right-1.5 w-8 rounded-r-xl bg-gradient-to-l from-white/95 to-transparent lg:hidden dark:from-zinc-950/95"
            />
        </aside>
    );
}

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { auth, is_platform_admin } = usePage<{ auth: Auth; is_platform_admin?: boolean }>().props;
    const user = auth.user;
    const getInitials = useInitials();

    const navItems = sidebarNavItems.filter(
        (item) => toUrl(item.href) !== '/admin' || Boolean(is_platform_admin),
    );

    const activeItem =
        navItems.find((item) => isCurrentOrParentUrl(item.href)) ?? navItems[0];

    return (
        <StudioSurface>
            <header className="min-w-0 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
                <div className="flex flex-col gap-4 sm:gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0 max-w-xl">
                        <StudioEyebrow>{activeItem.eyebrow}</StudioEyebrow>
                        <StudioTitle>{activeItem.headline}</StudioTitle>
                        <p className="mt-2 text-sm leading-relaxed text-pretty text-zinc-500 sm:mt-3">
                            {activeItem.blurb}
                        </p>
                    </div>

                    {user ? (
                        <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-zinc-950/8 bg-white/80 px-3 py-3 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] backdrop-blur sm:w-auto sm:min-w-[15rem] sm:px-3.5 dark:border-white/10 dark:bg-zinc-950/55 dark:shadow-none">
                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-950 text-sm font-semibold tracking-wide text-white sm:size-11 dark:bg-white dark:text-zinc-950">
                                {getInitials(user.name)}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                                    Signed in
                                </p>
                                <p className="truncate font-medium text-zinc-950 dark:text-white">{user.name}</p>
                                <p className="truncate text-sm text-zinc-500">{user.email}</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </header>

            <div className="grid w-full min-w-0 max-w-full gap-4 sm:gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
                <SettingsNav items={navItems} />

                <SettingsPanelFrame>{children}</SettingsPanelFrame>
            </div>
        </StudioSurface>
    );
}
