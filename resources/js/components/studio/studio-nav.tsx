import { Link } from '@inertiajs/react';
import {
    BarChart3,
    LayoutDashboard,
    LayoutTemplate,
    Settings,
    Sparkles,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

export type StudioNavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    /** When set, active if the current path starts with this prefix. */
    matchPrefix?: string;
};

/** Primary studio destinations shown in the desktop header nav. */
export const STUDIO_PRIMARY_LINKS: StudioNavItem[] = [
    { href: dashboard.url(), label: 'Dashboard', icon: LayoutDashboard },
    { href: '/events', label: 'My Events', icon: Sparkles },
    { href: '/designs', label: 'Templates', icon: LayoutTemplate },
    { href: '/guests', label: 'Guests', icon: Users },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export const STUDIO_SETTINGS_LINK: StudioNavItem = {
    href: '/settings/profile',
    label: 'Settings',
    icon: Settings,
    matchPrefix: '/settings',
};

/** Full list for the mobile sheet (primary + settings with icon + name). */
export const STUDIO_NAV_LINKS: StudioNavItem[] = [
    ...STUDIO_PRIMARY_LINKS,
    STUDIO_SETTINGS_LINK,
];

export function useStudioNavActive() {
    const { currentUrl, isCurrentOrParentUrl, isCurrentUrl } = useCurrentUrl();
    const dashboardPath = dashboard.url();

    return (item: StudioNavItem): boolean => {
        if (item.matchPrefix) {
            return currentUrl === item.matchPrefix || currentUrl.startsWith(`${item.matchPrefix}/`);
        }

        return item.href === dashboardPath ? isCurrentUrl(item.href) : isCurrentOrParentUrl(item.href);
    };
}

export function StudioNavLinks({
    className,
    onNavigate,
    showIcons = false,
}: {
    className?: string;
    onNavigate?: () => void;
    showIcons?: boolean;
}) {
    const linkActive = useStudioNavActive();

    return (
        <nav
            className={cn(
                'flex min-w-0 flex-nowrap items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:gap-1.5',
                className,
            )}
            aria-label="Studio"
        >
            {STUDIO_PRIMARY_LINKS.map((item) => {
                const active = linkActive(item);
                const Icon = item.icon;

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                            'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition-colors xl:px-3.5',
                            active
                                ? 'bg-zinc-950 text-white shadow-sm shadow-zinc-950/15 dark:bg-white dark:text-zinc-950'
                                : 'text-zinc-600 hover:bg-zinc-950/5 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white',
                        )}
                    >
                        {showIcons ? (
                            <Icon
                                className="hidden size-3.5 shrink-0 opacity-80 xl:block"
                                aria-hidden
                            />
                        ) : null}
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

/** Icon-only settings control for the header utility cluster (beside theme toggle). */
export function StudioSettingsIconLink({ className }: { className?: string }) {
    const linkActive = useStudioNavActive();
    const item = STUDIO_SETTINGS_LINK;
    const active = linkActive(item);
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={cn(
                'inline-flex size-10 shrink-0 items-center justify-center rounded-full transition sm:size-9',
                active
                    ? 'bg-zinc-950 text-white shadow-sm shadow-zinc-950/20 dark:bg-white dark:text-zinc-950'
                    : 'bg-zinc-100 text-zinc-950 ring-1 ring-zinc-950/15 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:ring-white/20 dark:hover:bg-zinc-700',
                className,
            )}
        >
            <Icon absoluteStrokeWidth className="size-4 sm:size-[18px]" strokeWidth={2} aria-hidden />
        </Link>
    );
}

export function StudioNavSheetLinks({ onNavigate }: { onNavigate?: () => void }) {
    const linkActive = useStudioNavActive();

    return (
        <nav className="flex flex-1 flex-col gap-1.5 p-4" aria-label="Studio">
            {STUDIO_NAV_LINKS.map((item) => {
                const active = linkActive(item);
                const Icon = item.icon;

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                            'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition',
                            active
                                ? 'bg-zinc-950 text-white shadow-lg shadow-zinc-950/15 dark:bg-white dark:text-zinc-950'
                                : 'text-zinc-700 hover:bg-white/80 dark:text-zinc-200 dark:hover:bg-white/5',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-9 items-center justify-center rounded-xl',
                                active
                                    ? 'bg-white/15 dark:bg-zinc-950/10'
                                    : 'bg-zinc-950/5 dark:bg-white/5',
                            )}
                        >
                            <Icon className="size-4" />
                        </span>
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
