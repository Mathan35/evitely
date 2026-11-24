import { Head, router } from '@inertiajs/react';
import { FormEvent } from 'react';
import { AdminCard, AdminPageHeader, AdminTable } from '@/components/admin/admin-ui';
import { AdminPagination, type Paginator, shortDate } from '@/components/admin/pagination';

type Log = {
    id: number;
    action: string;
    actor_email?: string | null;
    subject_type?: string | null;
    subject_id?: number | string | null;
    meta?: unknown;
    ip?: string | null;
    created_at?: string | null;
};

export default function AuditIndex({ logs, filters }: { logs: Paginator<Log>; filters: { q: string; action: string } }) {
    function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get('/admin/audit', { q: String(data.get('q') ?? ''), action: String(data.get('action') ?? '') }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Audit" />
            <AdminPageHeader title="Audit" description="Owner actions recorded by the admin logger." />
            <form onSubmit={search} className="mb-3 flex flex-wrap gap-2">
                <input name="q" defaultValue={filters.q} placeholder="Email, subject, IP" className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px]" />
                <input name="action" defaultValue={filters.action} placeholder="Action" className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px]" />
                <button type="submit" className="h-9 rounded-lg bg-zinc-950 px-3 text-[13px] font-medium text-white">
                    Filter
                </button>
            </form>
            <AdminCard>
                <AdminTable
                    headers={['When', 'Action', 'Actor', 'Subject', 'IP', 'Meta']}
                    rows={logs.data.map((log) => [
                        shortDate(log.created_at),
                        log.action,
                        log.actor_email ?? '—',
                        log.subject_type ? `${log.subject_type.split('\\').pop()} #${log.subject_id ?? ''}` : '—',
                        log.ip ?? '—',
                        <span key={log.id} className="block max-w-xs truncate font-mono text-[11px] text-zinc-500" title={JSON.stringify(log.meta)}>
                            {log.meta ? JSON.stringify(log.meta) : '—'}
                        </span>,
                    ])}
                />
                <AdminPagination paginator={logs} />
            </AdminCard>
        </>
    );
}
