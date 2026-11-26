import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    BookOpen,
    CalendarDays,
    CreditCard,
    Gauge,
    LayoutDashboard,
    LifeBuoy,
    ListTree,
    Menu,
    MessageSquareWarning,
    ScrollText,
    Server,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { clearStaleDocumentScrollLocks } from '@/lib/document-scroll-lock';
import { cn } from '@/lib/utils';

const NAV = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/events', label: 'Events', icon: CalendarDays },
    { href: '/admin/guests', label: 'Guests', icon: Users },
    { href: '/admin/billing', label: 'Billing', icon: CreditCard },
    { href: '/admin/support', label: 'Support', icon: LifeBuoy },
    { href: '/admin/moderation', label: 'Moderation', icon: MessageSquareWarning },
    { href: '/admin/integrations', label: 'Integrations', icon: Server },
    { href: '/admin/queues', label: 'Queues & Logs', icon: ScrollText },
    { href: '/admin/analytics', label: 'Analytics', icon: Activity },
    { href: '/admin/catalog', label: 'Catalog', icon: BookOpen },
    { href: '/admin/audit', label: 'Audit', icon: ListTree },
] as const;

function isActive(path: string, item: (typeof NAV)[number]): boolean {
    return item.exact ? path === item.href : path.startsWith(item.href);
}

export default function AdminLayout({ children }: PropsWithChildren) {
    const { url } = usePage();
    const path = url.split('?')[0];
    const [menuOpen, setMenuOpen] = useState(false);

    const current = useMemo(
        () => NAV.find((item) => isActive(path, item)) ?? NAV[0],
        [path],
    );

    useEffect(() => {
        clearStaleDocumentScrollLocks();
        document.documentElement.classList.remove('boot-skeleton-active', 'festive-loader-active');
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [path]);

    return (
        <div className="min-h-svh bg-zinc-100 text-zinc-900">
            <div className="mx-auto flex min-h-svh max-w-[1400px]">
                <aside className="sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
                    <div className="border-b border-zinc-100 px-4 py-4">
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">
                            Owner
                        </p>
                        <p className="mt-1 font-serif text-xl tracking-tight">Admin</p>
                        <Link
                            href="/events"
                            className="mt-2 inline-block text-[12px] text-zinc-500 hover:text-zinc-900"
                        >
                            ← Back to studio
                        </Link>
                    </div>
                    <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
                        {NAV.map((item) => {
                            const active = isActive(path, item);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition',
                                        active
                                            ? 'bg-zinc-950 text-white'
                                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
                                    )}
                                >
                                    <Icon className="size-4 shrink-0 opacity-80" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="border-t border-zinc-100 px-4 py-3 text-[11px] text-zinc-400">
                        <Gauge className="mb-1 size-3.5" />
                        Platform console
                        <button
                            type="button"
                            className="mt-2 block text-[12px] font-medium text-zinc-600 hover:text-zinc-950"
                            onClick={() => router.post('/admin/logout')}
                        >
                            Sign out
                        </button>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur md:hidden">
                        <div className="flex items-center gap-2 px-3 py-2.5">
                            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="size-10 shrink-0 rounded-full border-zinc-200 bg-white"
                                        aria-label="Open admin menu"
                                    >
                                        <Menu className="size-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="left"
                                    className="flex h-dvh max-h-dvh w-[min(100%,18.5rem)] flex-col gap-0 overflow-hidden border-zinc-200 bg-white p-0"
                                >
                                    <SheetHeader className="shrink-0 border-b border-zinc-100 px-4 py-4 text-left">
                                        <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">
                                            Owner
                                        </p>
                                        <SheetTitle className="font-serif text-xl tracking-tight text-zinc-950">
                                            Admin
                                        </SheetTitle>
                                        <SheetDescription className="text-[12px] text-zinc-500">
                                            Platform console
                                        </SheetDescription>
                                    </SheetHeader>

                                    <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                                        {NAV.map((item) => {
                                            const active = isActive(path, item);
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setMenuOpen(false)}
                                                    className={cn(
                                                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition',
                                                        active
                                                            ? 'bg-zinc-950 text-white'
                                                            : 'text-zinc-700 hover:bg-zinc-100',
                                                    )}
                                                >
                                                    <Icon className="size-4 shrink-0 opacity-80" />
                                                    {item.label}
                                                </Link>
                                            );
                                        })}
                                    </nav>

                                    <div className="shrink-0 space-y-2 border-t border-zinc-100 p-4">
                                        <Link
                                            href="/events"
                                            onClick={() => setMenuOpen(false)}
                                            className="block rounded-xl border border-zinc-200 px-3 py-2.5 text-center text-[13px] font-medium text-zinc-700"
                                        >
                                            Back to studio
                                        </Link>
                                        <button
                                            type="button"
                                            className="block w-full rounded-xl bg-zinc-950 px-3 py-2.5 text-[13px] font-medium text-white"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                router.post('/admin/logout');
                                            }}
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                    Admin
                                </p>
                                <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-950">
                                    {current.label}
                                </p>
                            </div>

                            <Link
                                href="/events"
                                className="shrink-0 rounded-full bg-zinc-100 px-3 py-2 text-[11px] font-medium text-zinc-600"
                            >
                                Studio
                            </Link>
                        </div>
                    </header>

                    <main className="min-w-0 flex-1 px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
