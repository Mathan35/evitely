import { Head, router } from '@inertiajs/react';
import { AdminCard, AdminPageHeader, AdminStat, AdminTable } from '@/components/admin/admin-ui';
import { shortDate } from '@/components/admin/pagination';

type FailedJob = { id: number; uuid?: string; queue?: string; exception?: string; failed_at?: string | null };

const btn = 'rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700';

export default function QueuesIndex({
    failed_jobs,
    pending_count,
    failed_count,
    scheduler_age_seconds,
    log_channel,
    log_level,
    log_tail,
    support,
}: {
    failed_jobs: FailedJob[];
    pending_count: number;
    failed_count: number;
    scheduler_age_seconds: number | null;
    log_channel?: string;
    log_level?: string;
    log_tail: string[] | null;
    support?: { digest_due_hint?: string; remindable_guests?: number };
}) {
    return (
        <>
            <Head title="Queues" />
            <AdminPageHeader
                title="Queues & logs"
                description="Failed jobs, scheduler heartbeat, and the tail of the app log."
                actions={
                    <>
                        <button
                            type="button"
                            className="rounded-lg bg-zinc-950 px-3 py-1.5 text-[12px] font-medium text-white"
                            onClick={() => {
                                if (confirm('Retry every failed job?')) {
                                    router.post('/admin/queues/retry-all');
                                }
                            }}
                        >
                            Retry all
                        </button>
                        <button type="button" className={btn} onClick={() => router.post('/admin/queues/run-digest')}>
                            Run digest
                        </button>
                        <button type="button" className={btn} onClick={() => router.post('/admin/queues/run-reminders')}>
                            Run reminders
                        </button>
                    </>
                }
            />
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <AdminStat label="Pending" value={pending_count} />
                <AdminStat label="Failed" value={failed_count} />
                <AdminStat label="Scheduler age" value={scheduler_age_seconds == null ? '—' : `${scheduler_age_seconds}s`} />
                <AdminStat label="Remindable guests" value={support?.remindable_guests ?? 0} />
            </div>
            <p className="mb-3 text-[12px] text-zinc-500">
                Log {log_channel ?? '—'} · {log_level ?? '—'}
                {support?.digest_due_hint ? ` · ${support.digest_due_hint}` : ''}
            </p>
            <AdminCard title="Failed jobs" className="mb-3">
                <AdminTable
                    headers={['Job', 'Queue', 'Failed', '']}
                    rows={failed_jobs.map((job) => [
                        <span key={job.id} className="block max-w-md truncate font-mono text-[11px]" title={job.exception}>
                            {job.uuid || job.id}
                        </span>,
                        job.queue ?? '—',
                        shortDate(job.failed_at),
                        <span key={`a-${job.id}`} className="inline-flex gap-1">
                            <button type="button" className={btn} onClick={() => router.post(`/admin/queues/failed/${job.id}/retry`)}>
                                Retry
                            </button>
                            <button
                                type="button"
                                className={btn}
                                onClick={() => {
                                    if (confirm('Delete this failed job?')) {
                                        router.delete(`/admin/queues/failed/${job.id}`);
                                    }
                                }}
                            >
                                Delete
                            </button>
                        </span>,
                    ])}
                />
            </AdminCard>
            <AdminCard title="Log tail">
                <pre className="max-h-96 overflow-auto px-4 py-3 font-mono text-[11px] leading-5 whitespace-pre-wrap text-zinc-600">
                    {(log_tail ?? []).join('\n') || 'No log lines.'}
                </pre>
            </AdminCard>
        </>
    );
}
