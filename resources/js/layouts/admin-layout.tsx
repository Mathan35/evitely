import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    BookOpen,
    CreditCard,
    Gauge,
    LayoutDashboard,
    ListTree,
    MessageSquareWarning,
    ScrollText,
    Server,
    Users,
    CalendarDays,
} from 'lucide-react';
import { useEffect, type PropsWithChildren } from 'react';
import { clearStaleDocumentScrollLocks } from '@/lib/document-scroll-lock';
import { cn } from '@/lib/utils';

const NAV = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/events', label: 'Events', icon: CalendarDays },
    { href: '/admin/guests', label: 'Guests', icon: Users },
    { href: '/admin/billing', label: 'Billing', icon: CreditCard },
    { href: '/admin/moderation', label: 'Moderation', icon: MessageSquareWarning },
    { href: '/admin/integrations', label: 'Integrations', icon: Server },
    { href: '/admin/queues', label: 'Queues & Logs', icon: ScrollText },
    { href: '/admin/analytics', label: 'Analytics', icon: Activity },
    { href: '/admin/catalog', label: 'Catalog', icon: BookOpen },
    { href: '/admin/audit', label: 'Audit', icon: ListTree },
] as const;

export default function AdminLayout({ children }: PropsWithChildren) {
    const { url } = usePage();
    const path = url.split('?')[0];

    useEffect(() => {
        clearStaleDocumentScrollLocks();
        document.documentElement.classList.remove('boot-skeleton-active', 'festive-loader-active');
    }, []);

    return (
        <div className="min-h-svh bg-zinc-100 text-zinc-900">
            <div className="mx-auto flex min-h-svh max-w-[1400px]">
                <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
                    <div className="border-b border-zinc-100 px-4 py-4">
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">Owner</p>
                        <p className="mt-1 font-serif text-xl tracking-tight">Admin</p>
                        <Link href="/events" className="mt-2 inline-block text-[12px] text-zinc-500 hover:text-zinc-900">
                            ← Back to studio
                        </Link>
                    </div>
                    <nav className="flex-1 space-y-0.5 p-2">
                        {NAV.map((item) => {
                            const active = item.exact ? path === item.href : path.startsWith(item.href);
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
                    <header className="flex items-center gap-2 overflow-x-auto border-b border-zinc-200 bg-white px-3 py-2 md:hidden">
                        {NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium',
                                    path.startsWith(item.href) || (item.exact && path === item.href)
                                        ? 'bg-zinc-950 text-white'
                                        : 'bg-zinc-100 text-zinc-600',
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </header>
                    <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
                </div>
            </div>
        </div>
    );
}
