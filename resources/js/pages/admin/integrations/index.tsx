import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import { AdminCard, AdminPageHeader, AdminStat } from '@/components/admin/admin-ui';

type Check = { id: string; label: string; done: boolean; hint: string };

type Integrations = {
    mail?: { mailer?: string; from?: string; ready?: boolean };
    twilio?: { configured?: boolean; email?: boolean; sms?: boolean; whatsapp?: boolean; hints?: Record<string, string> };
    razorpay?: { ready?: boolean; mode?: string; key_prefix?: string | null; webhook_url?: string };
    stripe?: { ready?: boolean; mode?: string; key_prefix?: string | null; webhook_url?: string };
    storage?: { disk?: string; bucket_set?: boolean; region?: string | null };
    translation?: { driver?: string; deepl_key_set?: boolean };
    sentry?: { dsn_set?: boolean; package?: boolean };
    subdomains?: { enabled?: boolean; root?: string | null };
};

type SecretField = {
    key: string;
    label: string;
    group: string;
    secret: boolean;
    placeholder?: string | null;
    set: boolean;
    preview?: string | null;
    source: string;
};

type SecretGroup = {
    id: string;
    title: string;
    hint?: string;
    webhook_url?: string;
    fields: SecretField[];
};

const btn = 'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800 hover:bg-zinc-50';
const btnPrimary = 'rounded-lg bg-zinc-950 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50';

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3 px-4 py-2 text-[13px]">
            <span className="text-zinc-400">{label}</span>
            <span className="max-w-[16rem] text-right break-all text-zinc-800">{value}</span>
        </div>
    );
}

function sourceBadge(source: string) {
    if (source === 'database') {
        return 'bg-emerald-50 text-emerald-800';
    }
    if (source === 'environment') {
        return 'bg-sky-50 text-sky-800';
    }
    return 'bg-amber-50 text-amber-800';
}

export default function IntegrationsIndex({
    integrations,
    platform,
    note,
    secret_groups = [],
}: {
    integrations: Integrations;
    platform: { checklist?: Check[]; queue?: string; mailer?: string };
    note?: string;
    secret_groups?: SecretGroup[];
}) {
    const flash = (usePage().props as { flash?: { toast?: { type?: string; message?: string } } }).flash;
    const [clearKeys, setClearKeys] = useState<string[]>([]);

    const initialValues = useMemo(() => {
        const values: Record<string, string> = {};
        for (const group of secret_groups) {
            for (const field of group.fields) {
                values[field.key] = '';
            }
        }
        return values;
    }, [secret_groups]);

    const form = useForm<{ values: Record<string, string>; clear: string[] }>({
        values: initialValues,
        clear: [],
    });

    function toggleClear(key: string) {
        setClearKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.setData('clear', clearKeys);
        form.post('/admin/integrations', {
            preserveScroll: true,
            onSuccess: () => {
                form.setData({ values: initialValues, clear: [] });
                setClearKeys([]);
            },
        });
    }

    return (
        <>
            <Head title="Integrations" />
            <AdminPageHeader
                title="Integrations"
                description={note || 'Manage API keys and check readiness.'}
                actions={
                    <>
                        <button type="button" className={btn} onClick={() => router.post('/admin/integrations/test-mail')}>
                            Test mail
                        </button>
                        <button type="button" className={btn} onClick={() => router.post('/admin/integrations/test-translate')}>
                            Test translate
                        </button>
                        <button type="button" className={btn} onClick={() => router.post('/admin/integrations/test-storage')}>
                            Test storage
                        </button>
                    </>
                }
            />

            {flash?.toast?.message ? (
                <p
                    className={`mb-3 rounded-xl border px-3 py-2 text-[13px] ${
                        flash.toast.type === 'error'
                            ? 'border-rose-200 bg-rose-50 text-rose-800'
                            : flash.toast.type === 'info'
                              ? 'border-sky-200 bg-sky-50 text-sky-900'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    }`}
                >
                    {flash.toast.message}
                </p>
            ) : null}

            <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <AdminStat label="Mailer" value={integrations.mail?.mailer ?? platform.mailer ?? '—'} />
                <AdminStat label="Queue" value={platform.queue ?? '—'} />
                <AdminStat label="Razorpay" value={integrations.razorpay?.mode ?? '—'} />
                <AdminStat label="Stripe" value={integrations.stripe?.mode ?? '—'} />
            </div>

            <form onSubmit={submit} className="space-y-3">
                {secret_groups.map((group) => (
                    <AdminCard key={group.id} title={group.title}>
                        {group.hint ? <p className="border-b border-zinc-100 px-4 py-2 text-[12px] text-zinc-500">{group.hint}</p> : null}
                        {group.webhook_url ? (
                            <div className="border-b border-zinc-100 px-4 py-2 text-[12px] text-zinc-500">
                                Webhook · <span className="break-all text-zinc-800">{group.webhook_url}</span>
                            </div>
                        ) : null}
                        <div className="divide-y divide-zinc-100">
                            {group.fields.map((field) => {
                                const clearing = clearKeys.includes(field.key);
                                return (
                                    <div key={field.key} className="grid gap-2 px-4 py-3 sm:grid-cols-[11rem_1fr_auto] sm:items-center">
                                        <div>
                                            <p className="text-[13px] font-medium text-zinc-800">{field.label}</p>
                                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                                                <span className={`rounded-full px-1.5 py-0.5 font-medium ${sourceBadge(field.source)}`}>
                                                    {field.source}
                                                </span>
                                                {field.preview ? <span className="font-mono">{field.preview}</span> : <span>Not set</span>}
                                            </p>
                                        </div>
                                        <input
                                            type={field.secret ? 'password' : 'text'}
                                            autoComplete="off"
                                            disabled={clearing || form.processing}
                                            placeholder={clearing ? 'Will clear database override' : field.placeholder || (field.set ? '•••• keep current' : 'Paste value')}
                                            value={form.data.values[field.key] ?? ''}
                                            onChange={(e) =>
                                                form.setData('values', {
                                                    ...form.data.values,
                                                    [field.key]: e.target.value,
                                                })
                                            }
                                            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 disabled:bg-zinc-50"
                                        />
                                        <button
                                            type="button"
                                            className={`h-9 rounded-lg border px-2.5 text-[11px] font-medium ${
                                                clearing
                                                    ? 'border-rose-300 bg-rose-50 text-rose-800'
                                                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                                            }`}
                                            onClick={() => toggleClear(field.key)}
                                            disabled={!field.set && field.source !== 'database'}
                                            title="Remove database override (fall back to .env)"
                                        >
                                            {clearing ? 'Undo clear' : 'Clear'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </AdminCard>
                ))}

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                    <p className="text-[12px] text-zinc-500">Blank fields keep the current secret. Cleared fields drop the DB override.</p>
                    <button type="submit" className={btnPrimary} disabled={form.processing}>
                        {form.processing ? 'Saving…' : 'Save integration keys'}
                    </button>
                </div>
            </form>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <AdminCard title="Mail status">
                    <Row label="From" value={integrations.mail?.from || '—'} />
                    <Row label="Ready" value={integrations.mail?.ready ? 'Yes' : 'No'} />
                </AdminCard>
                <AdminCard title="Twilio status">
                    <Row label="SMS" value={integrations.twilio?.sms ? 'Ready' : 'Off'} />
                    <Row label="WhatsApp" value={integrations.twilio?.whatsapp ? 'Ready' : 'Off'} />
                    <Row label="Email hint" value={integrations.twilio?.hints?.email || '—'} />
                </AdminCard>
                <AdminCard title="Storage">
                    <Row label="Disk" value={integrations.storage?.disk || '—'} />
                    <Row label="Bucket" value={integrations.storage?.bucket_set ? 'Set' : 'Unset'} />
                    <Row label="Region" value={integrations.storage?.region || '—'} />
                </AdminCard>
                <AdminCard title="Extras">
                    <Row label="Driver" value={integrations.translation?.driver || '—'} />
                    <Row label="DeepL key" value={integrations.translation?.deepl_key_set ? 'Set' : 'Unset'} />
                    <Row label="Sentry DSN" value={integrations.sentry?.dsn_set ? 'Set' : 'Unset'} />
                    <Row label="Subdomains" value={integrations.subdomains?.enabled ? integrations.subdomains.root || 'On' : 'Off'} />
                </AdminCard>
            </div>

            <AdminCard title="Checklist" className="mt-3">
                <ul className="divide-y divide-zinc-100">
                    {(platform.checklist ?? []).map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2 text-[13px]">
                            <span>{item.label}</span>
                            <span className={item.done ? 'text-emerald-700' : 'text-amber-700'}>{item.done ? 'Ready' : 'Open'}</span>
                        </li>
                    ))}
                </ul>
            </AdminCard>
        </>
    );
}
