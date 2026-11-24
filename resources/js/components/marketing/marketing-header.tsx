import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    Menu,
    Plus,
    Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuthGate } from '@/components/auth-gate';
import { BrandMark } from '@/components/brand-mark';
import {
    StudioNavLinks,
    StudioNavSheetLinks,
} from '@/components/studio/studio-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

const templateLinks = [
    ['/designs', 'All templates'],
    ['/designs/wedding', 'Weddings'],
    ['/designs/birthday', 'Birthdays'],
    ['/designs/graduation', 'Graduations'],
    ['/designs/housewarming', 'Housewarming'],
    ['/designs/baby-shower', 'Baby showers'],
    ['/designs/bridal-shower', 'Bridal showers'],
    ['/designs/corporate', 'Corporate'],
    ['/designs/party', 'Parties'],
    ['/designs/custom', 'Custom'],
] as const;

const featureLinks = [
    ['/#rsvp', 'RSVP & guest list'],
    ['/#designs', 'Design galleries'],
    ['/#timeline', 'Schedule & venue'],
    ['/#wall', 'Guest wishes wall'],
    ['/#registry', 'Gifts & registry'],
    ['/#analytics', 'Invite analytics'],
] as const;

export function MarketingHeader({
    back,
}: {
    back?: { href: string; label: string };
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const { open } = useAuthGate();
    const [menu, setMenu] = useState<'templates' | 'features' | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const desktopNavRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!menu) {
            return;
        }

        function onPointerDown(event: MouseEvent) {
            if (
                desktopNavRef.current &&
                !desktopNavRef.current.contains(event.target as Node)
            ) {
                setMenu(null);
            }
        }

        function onKey(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setMenu(null);
            }
        }

        window.addEventListener('mousedown', onPointerDown);
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('mousedown', onPointerDown);
            window.removeEventListener('keydown', onKey);
        };
    }, [menu]);

    function start(): void {
        if (user) {
            router.visit('/events?create=1');
            return;
        }

        open({ type: 'start' }, 'register');
    }

    return (
        <header className="sticky top-0 z-40 border-b border-zinc-950/8 bg-background/90 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl dark:border-white/10 dark:shadow-none">
            <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-10 shrink-0 rounded-full border-zinc-950/10 bg-white/80 lg:hidden dark:border-white/10 dark:bg-zinc-900/70"
                            aria-label="Open menu"
                        >
                            <Menu className="size-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="flex w-[min(100%,20rem)] flex-col gap-0 border-zinc-950/10 bg-[linear-gradient(180deg,#fafafa_0%,#f4f4f5_48%,#eef2f0_100%)] p-0 dark:border-white/10 dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#111113_100%)]"
                    >
                        <SheetHeader className="border-b border-zinc-950/8 px-5 py-5 text-left dark:border-white/10">
                            <BrandMark href="/" />
                            <SheetTitle className="sr-only">Site menu</SheetTitle>
                            <SheetDescription className="mt-2 text-sm text-zinc-500">
                                {user
                                    ? 'Jump into your studio or browse designs.'
                                    : 'Browse templates, features, and start your invitation.'}
                            </SheetDescription>
                        </SheetHeader>

                        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-4" aria-label="Primary">
                            {user ? (
                                <div className="-mx-4 -mt-4">
                                    <StudioNavSheetLinks onNavigate={() => setMobileOpen(false)} />
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1.5">
                                        <p className="px-1 text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                                            Templates
                                        </p>
                                        {templateLinks.map(([href, label]) => (
                                            <Link
                                                key={label}
                                                href={href}
                                                onClick={() => setMobileOpen(false)}
                                                className="block rounded-2xl px-3.5 py-2.5 text-sm text-zinc-700 transition hover:bg-white/80 dark:text-zinc-200 dark:hover:bg-white/5"
                                            >
                                                {label}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="px-1 text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                                            Explore
                                        </p>
                                        {featureLinks.map(([href, label]) => (
                                            <a
                                                key={label}
                                                href={href}
                                                onClick={() => setMobileOpen(false)}
                                                className="block rounded-2xl px-3.5 py-2.5 text-sm text-zinc-700 transition hover:bg-white/80 dark:text-zinc-200 dark:hover:bg-white/5"
                                            >
                                                {label}
                                            </a>
                                        ))}
                                        <a
                                            href="/#planning"
                                            onClick={() => setMobileOpen(false)}
                                            className="block rounded-2xl px-3.5 py-2.5 text-sm text-zinc-700 transition hover:bg-white/80 dark:text-zinc-200 dark:hover:bg-white/5"
                                        >
                                            Planning
                                        </a>
                                        <a
                                            href="/#pricing"
                                            onClick={() => setMobileOpen(false)}
                                            className="block rounded-2xl px-3.5 py-2.5 text-sm text-zinc-700 transition hover:bg-white/80 dark:text-zinc-200 dark:hover:bg-white/5"
                                        >
                                            Pricing
                                        </a>
                                    </div>
                                </>
                            )}
                        </nav>

                        <div className="border-t border-zinc-950/8 p-4 dark:border-white/10">
                            {user ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMobileOpen(false);
                                        start();
                                    }}
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 text-sm font-medium text-white shadow-lg shadow-zinc-950/20 dark:bg-white dark:text-zinc-950"
                                >
                                    <Plus className="size-4" />
                                    Create Invitation
                                </button>
                            ) : (
                                <div className="grid gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMobileOpen(false);
                                            open({ type: 'start' }, 'login');
                                        }}
                                        className="inline-flex h-11 w-full items-center justify-center rounded-full border border-zinc-950/10 bg-white/80 text-sm font-medium dark:border-white/10 dark:bg-zinc-900/60"
                                    >
                                        Log in
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMobileOpen(false);
                                            start();
                                        }}
                                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 text-sm font-medium text-white shadow-lg shadow-zinc-950/20 dark:bg-white dark:text-zinc-950"
                                    >
                                        <Sparkles className="size-4" />
                                        Get Started
                                    </button>
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="shrink-0">
                    <BrandMark href="/" showName={false} className="lg:hidden" />
                    <BrandMark href="/" className="hidden lg:inline-flex" />
                </div>

                {user ? (
                    <StudioNavLinks showIcons className="ml-1 hidden min-w-0 lg:flex xl:ml-2" />
                ) : (
                    <nav
                        ref={desktopNavRef}
                        className="ml-1 hidden min-w-0 items-center gap-1 text-sm lg:flex xl:ml-2 xl:gap-1.5"
                        aria-label="Primary"
                    >
                        <NavMenu
                            label="Templates"
                            open={menu === 'templates'}
                            onOpen={() => setMenu('templates')}
                            onClose={() => setMenu(null)}
                            links={templateLinks}
                        />
                        <NavMenu
                            label="Features"
                            open={menu === 'features'}
                            onOpen={() => setMenu('features')}
                            onClose={() => setMenu(null)}
                            links={featureLinks}
                        />
                        <a
                            href="/#planning"
                            className="rounded-full px-3 py-1.5 font-medium text-zinc-600 transition hover:bg-zinc-950/5 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
                            onClick={() => setMenu(null)}
                        >
                            Planning
                        </a>
                        <a
                            href="/#pricing"
                            className="rounded-full px-3 py-1.5 font-medium text-zinc-600 transition hover:bg-zinc-950/5 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
                            onClick={() => setMenu(null)}
                        >
                            Pricing
                        </a>
                    </nav>
                )}

                <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
                    <ThemeToggle />
                    {user ? (
                        <>
                            <button
                                type="button"
                                onClick={start}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-zinc-950 px-3 text-sm font-medium whitespace-nowrap text-white shadow-lg shadow-zinc-950/15 transition hover:bg-zinc-800 sm:h-10 sm:px-3.5 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                            >
                                <Plus className="size-4 shrink-0" />
                                <span className="hidden xl:inline">Create Invitation</span>
                                <span className="xl:hidden">Create</span>
                            </button>
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger className="inline-flex max-w-[10.5rem] items-center rounded-full border border-zinc-950/10 bg-white/80 p-1 backdrop-blur xl:max-w-none xl:pr-2.5 dark:border-white/10 dark:bg-zinc-900/70 [&_.user-name]:hidden xl:[&_.user-name]:grid">
                                    <UserInfo user={user} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    sideOffset={8}
                                    className="min-w-56 duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2"
                                >
                                    <UserMenuContent user={user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => open({ type: 'start' }, 'login')}
                                className="hidden h-10 items-center rounded-full px-3.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-950/5 sm:inline-flex dark:text-zinc-200 dark:hover:bg-white/5"
                            >
                                Log in
                            </button>
                            <button
                                type="button"
                                onClick={start}
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-zinc-950 px-3.5 text-sm font-medium text-white shadow-lg shadow-zinc-950/15 transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                            >
                                <Sparkles className="size-4" />
                                <span className="hidden sm:inline">Get Started</span>
                                <span className="sm:hidden">Start</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {back ? (
                <div className="border-t border-zinc-950/8 bg-background/70 dark:border-white/10">
                    <div className="mx-auto flex max-w-6xl items-center px-3 py-2.5 sm:px-4">
                        <Link
                            href={back.href}
                            className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition hover:text-zinc-950 dark:hover:text-white"
                        >
                            <ArrowLeft className="size-3.5" aria-hidden />
                            {back.label}
                        </Link>
                    </div>
                </div>
            ) : null}
        </header>
    );
}

function NavMenu({
    label,
    open,
    onOpen,
    onClose,
    links,
}: {
    label: string;
    open: boolean;
    onOpen: () => void;
    onClose: () => void;
    links: readonly (readonly [string, string])[];
}) {
    return (
        <div className="relative">
            <button
                type="button"
                className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition duration-200',
                    open
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                        : 'text-zinc-600 hover:bg-zinc-950/5 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white',
                )}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={(event) => {
                    event.stopPropagation();
                    if (open) {
                        onClose();
                    } else {
                        onOpen();
                    }
                }}
            >
                {label}
                <ChevronDown
                    className={cn(
                        'size-3.5 transition-transform duration-300 ease-out',
                        open && 'rotate-180',
                    )}
                    aria-hidden
                />
            </button>
            {/* Keep the panel attached (no hover gap) so it does not close while moving into it. */}
            <div
                role="menu"
                className={cn(
                    'absolute top-full left-0 z-50 pt-2',
                    open ? 'pointer-events-auto' : 'pointer-events-none',
                )}
            >
                <div
                    className={cn(
                        'w-64 origin-top rounded-2xl border border-zinc-950/10 bg-white/95 p-2 shadow-xl backdrop-blur transition-all duration-200 ease-out dark:border-white/10 dark:bg-zinc-950/95',
                        open
                            ? 'translate-y-0 scale-100 opacity-100'
                            : 'pointer-events-none -translate-y-1 scale-95 opacity-0',
                    )}
                >
                    {links.map(([href, item]) => (
                        <Link
                            key={item}
                            href={href}
                            prefetch
                            role="menuitem"
                            className="block rounded-xl px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-950/5 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-white"
                            onClick={onClose}
                        >
                            {item}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
