import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { AdminCard, AdminPageHeader, AdminStat } from '@/components/admin/admin-ui';
import { AdminPagination, shortDate, type Paginator } from '@/components/admin/pagination';
import { cn } from '@/lib/utils';

type SupportRow = {
    id: number;
    name: string;
    email: string;
    topic: string;
    topic_label: string;
    message: string;
    page_url?: string | null;
    status: string;
    status_label: string;
    user_id?: number | null;
    created_at?: string | null;
};

const statusTone: Record<string, string> = {
    new: 'bg-amber-100 text-amber-900',
    read: 'bg-sky-100 text-sky-900',
    resolved: 'bg-emerald-100 text-emerald-900',
};

export default function AdminSupportIndex({
    messages,
    filters,
    topics,
    counts,
}: {
    messages: Paginator<SupportRow>;
    filters: { q: string; status: string; topic: string };
    topics: Record<string, string>;
    statuses: Record<string, string>;
    counts: { new: number; open: number; resolved: number; all: number };
}) {
    const [q, setQ] = useState(filters.q);

    function apply(next: Partial<typeof filters>): void {
        router.get(
            '/admin/support',
            {
                q: next.q ?? filters.q,
                status: next.status ?? filters.status,
                topic: next.topic ?? filters.topic,
            },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Support inbox" />
            <AdminPageHeader
                title="Support inbox"
                description="Bugs, help requests, billing questions, and feedback from /support."
            />

            <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                <AdminStat label="New" value={counts.new} />
                <AdminStat label="Open" value={counts.open} />
                <AdminStat label="Resolved" value={counts.resolved} />
                <AdminStat label="All time" value={counts.all} />
            </div>

            <AdminCard>
                <div className="grid gap-2 border-b border-zinc-100 px-3.5 py-3 sm:flex sm:flex-wrap sm:items-center sm:px-4">
                    <form
                        className="flex min-w-0 flex-1 gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            apply({ q });
                        }}
                    >
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search name, email, message…"
                            className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] sm:h-9 sm:max-w-sm"
                        />
                        <button
                            type="submit"
                            className="h-10 shrink-0 rounded-lg bg-zinc-950 px-3 text-[12px] font-medium text-white sm:h-9"
                        >
                            Search
                        </button>
                    </form>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                        <select
                            value={filters.status}
                            onChange={(e) => apply({ status: e.target.value })}
                            className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-2 text-[13px] sm:h-9 sm:w-auto"
                        >
                            <option value="open">Open (new + read)</option>
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="resolved">Resolved</option>
                            <option value="all">All</option>
                        </select>
                        <select
                            value={filters.topic}
                            onChange={(e) => apply({ topic: e.target.value })}
                            className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-2 text-[13px] sm:h-9 sm:w-auto"
                        >
                            <option value="">All topics</option>
                            {Object.entries(topics).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <ul className="divide-y divide-zinc-100">
                    {messages.data.map((row) => (
                        <li key={row.id}>
                            <Link
                                href={`/admin/support/${row.id}`}
                                className="block px-4 py-3.5 transition hover:bg-zinc-50/80"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-[13px] font-semibold text-zinc-950">
                                                {row.name}
                                            </p>
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                                                    statusTone[row.status] ?? 'bg-zinc-100 text-zinc-700',
                                                )}
                                            >
                                                {row.status_label}
                                            </span>
                                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                                                {row.topic_label}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-[13px] text-zinc-600">{row.message}</p>
                                        <p className="mt-1 text-[11px] text-zinc-400">
                                            {row.email}
                                            {row.user_id ? (
                                                <>
                                                    {' · '}
                                                    <span className="text-zinc-500">account #{row.user_id}</span>
                                                </>
                                            ) : null}
                                            {' · '}
                                            {shortDate(row.created_at)}
                                        </p>
                                    </div>
                                    <span className="text-[12px] font-medium text-zinc-500">View →</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                    {messages.data.length === 0 ? (
                        <li className="px-4 py-10 text-center text-[13px] text-zinc-400">
                            No support messages match these filters.
                        </li>
                    ) : null}
                </ul>
                <AdminPagination paginator={messages} />
            </AdminCard>
        </>
    );
}
