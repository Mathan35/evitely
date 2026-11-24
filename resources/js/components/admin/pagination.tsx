import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export type PaginatorLink = { url: string | null; label: string; active: boolean };

export type Paginator<T> = {
    data: T[];
    links: PaginatorLink[];
    current_page?: number;
    last_page?: number;
    total?: number;
    from?: number | null;
    to?: number | null;
    per_page?: number;
};

function labelText(label: string): string {
    return label
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, '');
}

export function AdminPagination({ paginator }: { paginator: { links?: PaginatorLink[]; total?: number; from?: number | null; to?: number | null } }) {
    const links = paginator.links ?? [];
    if (links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 px-3 py-2.5">
            <p className="text-[11px] text-zinc-400">
                {paginator.total != null ? `${paginator.from ?? 0}–${paginator.to ?? 0} of ${paginator.total}` : null}
            </p>
            <nav className="flex flex-wrap gap-1">
                {links.map((link, i) =>
                    link.url ? (
                        <Link
                            key={`${link.label}-${i}`}
                            href={link.url}
                            preserveScroll
                            className={cn(
                                'rounded-md px-2 py-1 text-[12px]',
                                link.active ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-100',
                            )}
                        >
                            {labelText(link.label)}
                        </Link>
                    ) : (
                        <span key={`${link.label}-${i}`} className="rounded-md px-2 py-1 text-[12px] text-zinc-300">
                            {labelText(link.label)}
                        </span>
                    ),
                )}
            </nav>
        </div>
    );
}

export function rupees(paise?: number | null, currency?: string | null): string {
    const code = (currency || 'INR').toUpperCase();
    const symbol = code === 'USD' ? '$' : '₹';
    const amount = (paise ?? 0) / 100;

    return `${symbol}${amount.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    })}`;
}

export function shortDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value.slice(0, 16);
    }

    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
