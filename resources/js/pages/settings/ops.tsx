import { Head, Link } from '@inertiajs/react';
import { Check, Circle } from 'lucide-react';
import { StudioCard, StudioEyebrow } from '@/components/studio/studio-surface';
import { cn } from '@/lib/utils';

type ChecklistItem = {
    id: string;
    label: string;
    done: boolean;
    hint: string;
    group: string;
};

type Props = {
    platform: {
        twilio: { configured: boolean; email: boolean; sms: boolean; whatsapp: boolean };
        mailer: string;
        queue: string;
        subdomains: { enabled: boolean; root: string; example: string | null };
        checklist: ChecklistItem[];
    };
    users: Array<{
        id: number;
        name: string;
        email: string;
        plan: string;
        message_credits: number;
        weddings_count: number;
    }>;
    events: Array<{
        id: number;
        title: string;
        slug: string;
        status: string;
        user: { name?: string | null; email?: string | null };
        starts_on?: string | null;
    }>;
    payments: Array<{
        id: number;
        user: { name?: string | null; email?: string | null };
        kind: string;
        sku: string;
        amount_label: string;
        status: string;
    }>;
    webhook_url: string;
    commands: Record<string, string>;
};

export default function Ops({ platform, users, events, payments, webhook_url, commands }: Props) {
    return (
        <>
            <Head title="Ops" />

            <div className="min-w-0 space-y-5 sm:space-y-6">
                <div className="px-1">
                    <StudioEyebrow>Platform</StudioEyebrow>
                    <h2 className="mt-1 font-serif text-xl text-zinc-950 sm:text-2xl">Ops</h2>
                    <p className="mt-1 max-w-2xl text-[13px] text-pretty text-zinc-500">
                        Delivery readiness, users, events, and payments.{' '}
                        <Link
                            href="/settings/billing"
                            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                        >
                            Billing
                        </Link>
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {(
                        [
                            { label: 'Mailer', value: platform.mailer },
                            { label: 'Queue', value: platform.queue },
                            {
                                label: 'Twilio',
                                value: [
                                    platform.twilio.email ? 'email' : null,
                                    platform.twilio.sms ? 'sms' : null,
                                    platform.twilio.whatsapp ? 'wa' : null,
                                ]
                                    .filter(Boolean)
                                    .join(' · ') || 'off',
                            },
                            {
                                label: 'Subdomains',
                                value: platform.subdomains.enabled
                                    ? platform.subdomains.root
                                    : 'path-only',
                            },
                        ] as const
                    ).map((stat) => (
                        <StudioCard key={stat.label} className="px-3 py-3 sm:px-4">
                            <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                {stat.label}
                            </p>
                            <p className="mt-1 truncate text-[13px] font-semibold text-zinc-950">
                                {stat.value}
                            </p>
                        </StudioCard>
                    ))}
                </div>

                <StudioCard className="overflow-hidden">
                    <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                            Readiness
                        </p>
                        <p className="mt-1 text-[12px] break-all text-zinc-500">
                            Razorpay webhook: {webhook_url}
                        </p>
                    </div>
                    <ul className="divide-y divide-zinc-100">
                        {platform.checklist.map((item) => (
                            <li key={item.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                                {item.done ? (
                                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                ) : (
                                    <Circle className="mt-0.5 size-4 shrink-0 text-zinc-300" />
                                )}
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                        {item.group}
                                    </p>
                                    <p
                                        className={cn(
                                            'text-[13px] font-semibold',
                                            item.done ? 'text-zinc-950' : 'text-zinc-700',
                                        )}
                                    >
                                        {item.label}
                                    </p>
                                    {!item.done ? (
                                        <p className="mt-0.5 text-[12px] text-zinc-500">{item.hint}</p>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="space-y-2 border-t border-zinc-100 px-4 py-3 text-[11px] text-zinc-500 sm:px-5">
                        {Object.entries(commands).map(([key, cmd]) => (
                            <p key={key} className="min-w-0">
                                <span className="font-semibold text-zinc-700">{key}:</span>{' '}
                                <code className="mt-0.5 block break-all rounded bg-zinc-100 px-1.5 py-1 sm:mt-0 sm:inline">
                                    {cmd}
                                </code>
                            </p>
                        ))}
                    </div>
                </StudioCard>

                <div className="grid gap-4 lg:grid-cols-2">
                    <StudioCard className="overflow-hidden">
                        <div className="border-b border-zinc-100 px-5 py-4">
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                Users
                            </p>
                        </div>
                        <ul className="divide-y divide-zinc-100">
                            {users.map((user) => (
                                <li key={user.id} className="min-w-0 px-4 py-3 text-[13px] sm:px-5">
                                    <p className="truncate font-medium text-zinc-950">{user.name}</p>
                                    <p className="truncate text-[12px] text-zinc-500">{user.email}</p>
                                    <p className="mt-1 text-[12px] text-zinc-600">
                                        {user.plan} · {user.message_credits} credits ·{' '}
                                        {user.weddings_count} events
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </StudioCard>

                    <StudioCard className="overflow-hidden">
                        <div className="border-b border-zinc-100 px-5 py-4">
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                Events
                            </p>
                        </div>
                        <ul className="divide-y divide-zinc-100">
                            {events.map((event) => (
                                <li key={event.id} className="min-w-0 px-4 py-3 text-[13px] sm:px-5">
                                    <p className="truncate font-medium text-zinc-950">{event.title}</p>
                                    <p className="truncate text-[12px] text-zinc-500">
                                        {event.user.email} · {event.status}
                                        {event.starts_on ? ` · ${event.starts_on}` : ''}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </StudioCard>
                </div>

                <StudioCard className="overflow-hidden">
                    <div className="border-b border-zinc-100 px-5 py-4">
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                            Recent payments
                        </p>
                    </div>
                    <ul className="divide-y divide-zinc-100">
                        {payments.length === 0 ? (
                            <li className="px-5 py-6 text-[13px] text-zinc-500">No payments yet.</li>
                        ) : (
                            payments.map((row) => (
                                <li
                                    key={row.id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]"
                                >
                                    <div>
                                        <p className="font-medium text-zinc-950">
                                            {row.user.name} · {row.kind}/{row.sku}
                                        </p>
                                        <p className="text-[12px] text-zinc-500">{row.status}</p>
                                    </div>
                                    <p className="font-serif text-lg tabular-nums">{row.amount_label}</p>
                                </li>
                            ))
                        )}
                    </ul>
                </StudioCard>
            </div>
        </>
    );
}
