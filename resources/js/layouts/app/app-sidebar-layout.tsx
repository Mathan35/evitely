import { Link, usePage } from '@inertiajs/react';
import { Menu, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageLoadingFrame } from '@/components/page-loading-frame';
import {
    StudioNavLinks,
    StudioNavSheetLinks,
    StudioSettingsIconLink,
} from '@/components/studio/studio-nav';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { NotificationsBell } from '@/components/studio/notifications-bell';
import { ThemeToggle } from '@/components/theme-toggle';
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
import {
    resolveSkeletonKind,
    skeletonShell,
    useInertiaNavigating,
} from '@/hooks/use-inertia-navigating';
import type { AppLayoutProps, Auth } from '@/types';

/** Studio body skeleton — skip when AuthGate or settings panel owns the overlay. */
function AppBodyLoadingFrame({ children }: { children: ReactNode }) {
    const page = usePage();
    const { kind } = useInertiaNavigating();
    const currentShell = skeletonShell(resolveSkeletonKind(page.component || page.url));
    const nextShell = skeletonShell(kind);

    // Fullscreen / auth destinations are handled by AuthGate.
    if (nextShell === 'fullscreen' || nextShell === 'auth') {
        return <>{children}</>;
    }

    // In-settings navigations use the settings panel skeleton.
    if (currentShell === 'settings' && nextShell === 'settings') {
        return <>{children}</>;
    }

    // Fixed viewport overlay so cartoons stay centered (absolute content overlays
    // drift / clip when the studio page is scrolled or shorter than the viewport).
    return (
        <PageLoadingFrame fullscreen className="min-h-[70vh]">
            {children}
        </PageLoadingFrame>
    );
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage<{ auth?: Auth | null }>().props;
    const user = auth?.user ?? null;
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-svh min-w-0 overflow-x-clip bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b border-zinc-950/8 bg-background/90 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl dark:border-white/10 dark:shadow-none">
                <div className="mx-auto flex h-14 w-full min-w-0 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
                    <div className="flex min-w-0 shrink-0 items-center gap-2.5">
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
                                    <SheetTitle className="sr-only">Studio menu</SheetTitle>
                                    <SheetDescription className="mt-2 text-sm text-zinc-500">
                                        Jump between your events, guests, and analytics.
                                    </SheetDescription>
                                </SheetHeader>

                                <StudioNavSheetLinks onNavigate={() => setMobileOpen(false)} />

                                <div className="border-t border-zinc-950/8 p-4 dark:border-white/10">
                                    <Link
                                        href="/events?create=1"
                                        onClick={() => setMobileOpen(false)}
                                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 text-sm font-medium text-white shadow-lg shadow-zinc-950/20 dark:bg-white dark:text-zinc-950"
                                    >
                                        <Plus className="size-4" />
                                        Create Invitation
                                    </Link>
                                    <Link
                                        href="/"
                                        onClick={() => setMobileOpen(false)}
                                        className="mt-3 block text-center text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                                    >
                                        Back to home
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <div className="shrink-0">
                            <BrandMark href="/" showName={false} className="lg:hidden" />
                            <BrandMark href="/" className="hidden lg:inline-flex" />
                        </div>
                    </div>

                    <StudioNavLinks showIcons className="ml-1 hidden min-w-0 lg:flex xl:ml-2" />

                    <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                        {user ? <NotificationsBell /> : null}
                        <ThemeToggle />
                        <StudioSettingsIconLink />
                        <Link
                            href="/events?create=1"
                            aria-label="Create invitation"
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-zinc-950 px-3 text-sm font-medium whitespace-nowrap text-white shadow-lg shadow-zinc-950/15 transition hover:bg-zinc-800 sm:px-3.5 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                            <Plus className="size-4 shrink-0" />
                            <span className="hidden xl:inline">Create Invitation</span>
                            <span className="xl:hidden">Create</span>
                        </Link>
                        {user ? (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger
                                    className="inline-flex h-10 max-w-[10.5rem] items-center rounded-full border border-zinc-950/10 bg-white/80 p-1 backdrop-blur xl:max-w-none xl:pr-2.5 dark:border-white/10 dark:bg-zinc-900/70 [&_.user-name]:hidden xl:[&_.user-name]:grid"
                                    data-test="sidebar-menu-button"
                                >
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
                        ) : null}
                    </div>
                </div>

                {breadcrumbs.length > 0 ? (
                    <div className="mx-auto w-full max-w-7xl px-4 pb-3 sm:px-6">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                ) : null}
            </header>
            <AppBodyLoadingFrame>{children}</AppBodyLoadingFrame>
        </div>
    );
}
