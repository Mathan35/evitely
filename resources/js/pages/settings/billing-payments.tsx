import { Head, Link } from '@inertiajs/react';
import { Check, Circle } from 'lucide-react';
import { StudioCard, StudioEyebrow } from '@/components/studio/studio-surface';
import { cn } from '@/lib/utils';

type PaymentRow = {
    id: number;
    user: { id?: number; name?: string | null; email?: string | null };
    kind: string;
    sku: string;
    amount_label: string;
    status: string;
    order_id?: string | null;
    payment_id?: string | null;
    paid_at?: string | null;
    created_at?: string | null;
};

type ChecklistItem = {
    id: string;
    label: string;
    done: boolean;
    hint: string;
};

type Props = {
    payments: PaymentRow[];
    webhook_url: string;
    checklist: ChecklistItem[];
};

function formatWhen(value?: string | null): string {
    if (!value) {
        return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function BillingPayments({ payments, webhook_url, checklist }: Props) {
    return (
        <>
            <Head title="Billing payments" />

            <div className="min-w-0 space-y-5 sm:space-y-6">
                <div className="flex flex-col gap-3 px-1 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <StudioEyebrow>Ops</StudioEyebrow>
                        <h2 className="mt-1 font-serif text-xl text-zinc-950 sm:text-2xl">Payments</h2>
                        <p className="mt-1 text-[13px] text-pretty text-zinc-500">
                            Payment orders and unlocks.{' '}
                            <Link href="/settings/billing" className="font-medium text-zinc-900 underline-offset-2 hover:underline">
                                Back to Billing
                            </Link>
                        </p>
                    </div>
                    <p className="max-w-full text-left text-[11px] break-all text-zinc-400 sm:max-w-sm sm:text-right">
                        Webhook: {webhook_url}
                    </p>
                </div>

                <StudioCard className="overflow-hidden">
                    <div className="border-b border-zinc-100 px-5 py-4">
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                            Go-live checklist
                        </p>
                    </div>
                    <ul className="divide-y divide-zinc-100">
                        {checklist.map((item) => (
                            <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                                {item.done ? (
                                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                ) : (
                                    <Circle className="mt-0.5 size-4 shrink-0 text-zinc-300" />
                                )}
                                <div className="min-w-0">
                                    <p
                                        className={cn(
                                            'text-[13px] font-semibold',
                                            item.done ? 'text-zinc-950' : 'text-zinc-600',
                                        )}
                                    >
                                        {item.label}
                                    </p>
                                    <p className="mt-0.5 text-[12px] text-zinc-500">{item.hint}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </StudioCard>

                <StudioCard className="overflow-hidden">
                    <div className="border-b border-zinc-100 px-5 py-4">
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                            Recent payments
                        </p>
                        <p className="mt-1 text-[13px] text-zinc-500">Latest 100 payment rows</p>
                    </div>
                    {payments.length === 0 ? (
                        <p className="px-5 py-8 text-[13px] text-zinc-500">No payments yet.</p>
                    ) : (
                        <>
                            <ul className="divide-y divide-zinc-100 md:hidden">
                                {payments.map((row) => (
                                    <li key={row.id} className="flex flex-col gap-2 px-4 py-3.5 sm:px-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-zinc-950">
                                                    {row.user.name || '—'}
                                                </p>
                                                <p className="truncate text-[12px] text-zinc-500">
                                                    {row.user.email}
                                                </p>
                                            </div>
                                            <p className="shrink-0 font-serif text-lg tabular-nums text-zinc-950">
                                                {row.amount_label}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-zinc-500">
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                                    row.status === 'paid'
                                                        ? 'bg-emerald-50 text-emerald-800'
                                                        : 'bg-zinc-100 text-zinc-600',
                                                )}
                                            >
                                                {row.status}
                                            </span>
                                            <span>
                                                {row.kind}/{row.sku}
                                            </span>
                                            <span>{formatWhen(row.paid_at || row.created_at)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[40rem] text-left text-[13px]">
                                    <thead className="border-b border-zinc-100 text-[11px] tracking-[0.12em] text-zinc-400 uppercase">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold">User</th>
                                            <th className="px-3 py-3 font-semibold">SKU</th>
                                            <th className="px-3 py-3 font-semibold">Amount</th>
                                            <th className="px-3 py-3 font-semibold">Status</th>
                                            <th className="px-5 py-3 font-semibold">When</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {payments.map((row) => (
                                            <tr key={row.id}>
                                                <td className="px-5 py-3">
                                                    <p className="font-medium text-zinc-950">
                                                        {row.user.name || '—'}
                                                    </p>
                                                    <p className="text-[12px] text-zinc-500">
                                                        {row.user.email}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 text-zinc-700">
                                                    {row.kind}/{row.sku}
                                                </td>
                                                <td className="px-3 py-3 tabular-nums text-zinc-950">
                                                    {row.amount_label}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                                            row.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-800'
                                                                : 'bg-zinc-100 text-zinc-600',
                                                        )}
                                                    >
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-zinc-500">
                                                    {formatWhen(row.paid_at || row.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </StudioCard>

                <p className="px-1 text-[12px] text-pretty text-zinc-500">
                    Support override:{' '}
                    <code className="mt-1 block break-all rounded bg-zinc-100 px-1 py-0.5 sm:mt-0 sm:inline">
                        php artisan billing:set email@x.com pro --credits=400
                    </code>
                </p>
            </div>
        </>
    );
}
