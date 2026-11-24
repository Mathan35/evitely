import { Head, Link, useForm } from '@inertiajs/react';
import { AdminCard, AdminPageHeader, AdminStat } from '@/components/admin/admin-ui';
import { rupees, shortDate } from '@/components/admin/pagination';

type Note = { at?: string; by?: string; note?: string };

type Payment = {
    id: number;
    user?: { id?: number; email?: string | null; name?: string | null };
    event_id?: number | null;
    provider?: string;
    kind?: string;
    sku: string;
    status: string;
    amount_paise: number;
    currency?: string;
    razorpay_order_id?: string | null;
    razorpay_payment_id?: string | null;
    stripe_session_id?: string | null;
    meta?: Record<string, unknown> & { admin_notes?: Note[] };
    paid_at?: string | null;
    created_at?: string | null;
};

export default function BillingShow({ payment }: { payment: Payment }) {
    const form = useForm({ note: '' });
    const notes = payment.meta?.admin_notes ?? [];
    const meta = { ...(payment.meta ?? {}) };
    delete meta.admin_notes;

    return (
        <>
            <Head title={`Payment ${payment.sku}`} />
            <AdminPageHeader title={payment.sku} description={`${payment.provider ?? 'payment'} · ${payment.status}`} />
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <AdminStat label="Amount" value={rupees(payment.amount_paise, payment.currency)} />
                <AdminStat label="Status" value={payment.status === 'created' ? 'pending' : payment.status} />
                <AdminStat label="Paid" value={shortDate(payment.paid_at)} />
            </div>
            {typeof payment.meta?.fail_reason === 'string' || typeof payment.meta?.error === 'string' ? (
                <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-900">
                    {(payment.meta.fail_reason as string) || (payment.meta.error as string)}
                </p>
            ) : null}
            <div className="grid gap-3 lg:grid-cols-2">
                <AdminCard title="Record">
                    <dl className="grid grid-cols-2 gap-y-2 px-4 py-3 text-[13px]">
                        <dt className="text-zinc-400">User</dt>
                        <dd>
                            {payment.user?.id ? (
                                <Link href={`/admin/users/${payment.user.id}`} className="hover:underline">
                                    {payment.user.email}
                                </Link>
                            ) : (
                                '—'
                            )}
                        </dd>
                        <dt className="text-zinc-400">Event</dt>
                        <dd>
                            {payment.event_id ? (
                                <Link href={`/admin/events/${payment.event_id}`} className="hover:underline">
                                    #{payment.event_id}
                                </Link>
                            ) : (
                                '—'
                            )}
                        </dd>
                        <dt className="text-zinc-400">Kind</dt>
                        <dd>{payment.kind ?? '—'}</dd>
                        <dt className="text-zinc-400">Razorpay order</dt>
                        <dd className="break-all">{payment.razorpay_order_id ?? '—'}</dd>
                        <dt className="text-zinc-400">Razorpay payment</dt>
                        <dd className="break-all">{payment.razorpay_payment_id ?? '—'}</dd>
                        <dt className="text-zinc-400">Stripe session</dt>
                        <dd className="break-all">{payment.stripe_session_id ?? '—'}</dd>
                        <dt className="text-zinc-400">Created</dt>
                        <dd>{shortDate(payment.created_at)}</dd>
                    </dl>
                </AdminCard>
                <AdminCard title="Note">
                    <form
                        className="space-y-2 px-4 py-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(`/admin/payments/${payment.id}/note`, { onSuccess: () => form.reset('note') });
                        }}
                    >
                        <textarea
                            value={form.data.note}
                            onChange={(e) => form.setData('note', e.target.value)}
                            maxLength={500}
                            rows={3}
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px]"
                            placeholder="Internal note"
                        />
                        <button type="submit" disabled={form.processing} className="rounded-lg bg-zinc-950 px-3 py-1.5 text-[12px] font-medium text-white">
                            Save note
                        </button>
                    </form>
                    <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
                        {notes.map((note, index) => (
                            <li key={index} className="px-4 py-2 text-[13px]">
                                <p className="text-zinc-800">{note.note}</p>
                                <p className="text-[11px] text-zinc-400">
                                    {note.by} · {shortDate(note.at)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </AdminCard>
            </div>
            <AdminCard title="Meta" className="mt-3">
                <pre className="overflow-x-auto px-4 py-3 text-[12px] text-zinc-600">{JSON.stringify(meta, null, 2)}</pre>
            </AdminCard>
        </>
    );
}
