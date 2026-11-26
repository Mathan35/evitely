import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { AdminCard, AdminPageHeader } from '@/components/admin/admin-ui';
import { shortDate } from '@/components/admin/pagination';
import { cn } from '@/lib/utils';

type SupportMessage = {
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
    user_name?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    resolved_at?: string | null;
    created_at?: string | null;
};

const statusTone: Record<string, string> = {
    new: 'bg-amber-100 text-amber-900',
    read: 'bg-sky-100 text-sky-900',
    resolved: 'bg-emerald-100 text-emerald-900',
};

export default function AdminSupportShow({
    message,
}: {
    message: SupportMessage;
    topics: Record<string, string>;
    statuses: Record<string, string>;
}) {
    const [busy, setBusy] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    function setStatus(status: string): void {
        if (busy || message.status === status) {
            return;
        }

        setBusy(status);
        router.post(
            `/admin/support/${message.id}`,
            { status },
            {
                preserveScroll: true,
                onFinish: () => setBusy(null),
            },
        );
    }

    function destroy(): void {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        setBusy('delete');
        router.delete(`/admin/support/${message.id}`, {
            onFinish: () => {
                setBusy(null);
                setConfirmDelete(false);
            },
        });
    }

    const actionBtn =
        'inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 disabled:cursor-not-allowed disabled:opacity-45';

    return (
        <>
            <Head title={`Support #${message.id}`} />
            <AdminPageHeader
                title={`#${message.id} · ${message.topic_label}`}
                description="Full support request details."
                actions={
                    <Link href="/admin/support" className="text-[13px] text-zinc-500 hover:text-zinc-950">
                        ← Inbox
                    </Link>
                }
            />

            <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
                <AdminCard title="Message">
                    <div className="space-y-4 px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={cn(
                                    'rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                                    statusTone[message.status] ?? 'bg-zinc-100 text-zinc-700',
                                )}
                            >
                                {message.status_label}
                            </span>
                            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600">
                                {message.topic_label}
                            </span>
                            <span className="text-[11px] text-zinc-400">{shortDate(message.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-[14px] leading-7 text-zinc-800">{message.message}</p>
                        {message.page_url ? (
                            <p className="text-[12px] text-zinc-500">
                                Page:{' '}
                                <a
                                    href={
                                        message.page_url.startsWith('http')
                                            ? message.page_url
                                            : message.page_url
                                    }
                                    className="break-all underline underline-offset-2"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {message.page_url}
                                </a>
                            </p>
                        ) : null}
                    </div>
                </AdminCard>

                <div className="space-y-4">
                    <AdminCard title="From">
                        <dl className="space-y-3 px-4 py-4 text-[13px]">
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                    Name
                                </dt>
                                <dd className="mt-1 font-medium text-zinc-900">{message.name}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                    Email
                                </dt>
                                <dd className="mt-1">
                                    <a
                                        href={`mailto:${message.email}`}
                                        className="text-zinc-900 underline-offset-2 hover:underline"
                                    >
                                        {message.email}
                                    </a>
                                </dd>
                            </div>
                            {message.user_id ? (
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                        Account
                                    </dt>
                                    <dd className="mt-1">
                                        <Link
                                            href={`/admin/users/${message.user_id}`}
                                            className="font-medium text-zinc-900 hover:underline"
                                        >
                                            {message.user_name ?? `User #${message.user_id}`}
                                        </Link>
                                    </dd>
                                </div>
                            ) : null}
                            {message.resolved_at ? (
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                        Resolved
                                    </dt>
                                    <dd className="mt-1 text-zinc-600">{shortDate(message.resolved_at)}</dd>
                                </div>
                            ) : null}
                        </dl>
                    </AdminCard>

                    <AdminCard title="Actions">
                        <div className="relative z-10 flex flex-wrap gap-2 px-4 py-4">
                            <button
                                type="button"
                                className={actionBtn}
                                disabled={busy !== null || message.status === 'new'}
                                aria-pressed={message.status === 'new'}
                                onClick={() => setStatus('new')}
                            >
                                {busy === 'new' ? 'Saving…' : 'Mark new'}
                            </button>
                            <button
                                type="button"
                                className={actionBtn}
                                disabled={busy !== null || message.status === 'read'}
                                aria-pressed={message.status === 'read'}
                                onClick={() => setStatus('read')}
                            >
                                {busy === 'read' ? 'Saving…' : 'Mark read'}
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    actionBtn,
                                    'border-zinc-950 bg-zinc-950 text-white hover:border-zinc-800 hover:bg-zinc-800',
                                )}
                                disabled={busy !== null || message.status === 'resolved'}
                                aria-pressed={message.status === 'resolved'}
                                onClick={() => setStatus('resolved')}
                            >
                                {busy === 'resolved' ? 'Saving…' : 'Mark resolved'}
                            </button>
                            <a
                                href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: Invidora support #${message.id}`)}`}
                                className={actionBtn}
                            >
                                Reply by email
                            </a>
                            <button
                                type="button"
                                className={cn(
                                    actionBtn,
                                    confirmDelete
                                        ? 'border-rose-600 bg-rose-600 text-white hover:border-rose-500 hover:bg-rose-500'
                                        : 'border-rose-300 text-rose-700 hover:border-rose-400 hover:bg-rose-50',
                                )}
                                disabled={busy !== null}
                                onClick={destroy}
                                onBlur={() => setConfirmDelete(false)}
                            >
                                {busy === 'delete'
                                    ? 'Deleting…'
                                    : confirmDelete
                                      ? 'Click again to confirm'
                                      : 'Delete'}
                            </button>
                        </div>
                        <p className="border-t border-zinc-100 px-4 py-2.5 text-[11px] text-zinc-400">
                            Current status: <span className="font-medium text-zinc-600">{message.status_label}</span>
                            . The active status button stays disabled until you pick another.
                        </p>
                    </AdminCard>

                    <AdminCard title="Technical">
                        <dl className="space-y-3 px-4 py-4 text-[12px] text-zinc-600">
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                    IP
                                </dt>
                                <dd className="mt-1 font-mono">{message.ip_address || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                    User agent
                                </dt>
                                <dd className="mt-1 break-all">{message.user_agent || '—'}</dd>
                            </div>
                        </dl>
                    </AdminCard>
                </div>
            </div>
        </>
    );
}
