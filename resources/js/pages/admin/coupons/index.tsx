import { Head, router, useForm } from '@inertiajs/react';
import {
    Bell,
    CalendarClock,
    CheckCircle2,
    Copy,
    Hash,
    IndianRupee,
    Percent,
    Plus,
    Power,
    Ticket,
    Users,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { AdminPageHeader, AdminStat } from '@/components/admin/admin-ui';
import { shortDate } from '@/components/admin/pagination';
import { cn } from '@/lib/utils';

type Campaign = {
    id: number;
    code: string;
    title: string;
    description?: string | null;
    discount_type: 'percent' | 'amount';
    percent_off?: number | null;
    amount_off_minor?: number | null;
    discount_label: string;
    starts_at?: string | null;
    ends_at?: string | null;
    max_claims: number;
    claimed_count: number;
    notified_count: number;
    notify_status: string;
    is_active: boolean;
    created_at?: string | null;
};

const field =
    'mt-1.5 flex h-11 w-full items-center rounded-xl border border-zinc-200/90 bg-white px-3.5 text-[13.5px] text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10';
const labelCls = 'text-[11px] font-semibold tracking-[0.08em] text-zinc-500 uppercase';

function toLocalInput(iso?: string | null): string {
    if (!iso) {
        return '';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultExpiryLocal(): string {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    d.setMinutes(0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function claimProgress(claimed: number, max: number): number {
    if (max <= 0) {
        return 0;
    }
    return Math.min(100, Math.round((claimed / max) * 100));
}

function notifyTone(status: string): string {
    if (status === 'done') {
        return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
    }
    if (status === 'running') {
        return 'bg-amber-50 text-amber-900 ring-amber-200';
    }
    return 'bg-zinc-100 text-zinc-600 ring-zinc-200';
}

export default function CouponsIndex({ campaigns = [] }: { campaigns?: Campaign[] }) {
    const list = Array.isArray(campaigns) ? campaigns : [];
    const [composerOpen, setComposerOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const form = useForm({
        code: '',
        title: '',
        description: '',
        discount_type: 'percent' as 'percent' | 'amount',
        percent_off: '20',
        amount_rupees: '100',
        starts_at: '',
        ends_at: defaultExpiryLocal(),
        no_expiry: false,
        max_claims: '100',
        is_active: true,
        notify: true,
    });

    const editing = useMemo(() => list.find((c) => c.id === editingId) ?? null, [list, editingId]);

    const editForm = useForm({
        title: '',
        description: '',
        starts_at: '',
        ends_at: '',
        no_expiry: false,
        max_claims: '100',
        is_active: true,
    });

    const stats = useMemo(() => {
        const active = list.filter((c) => c.is_active).length;
        const claims = list.reduce((sum, c) => sum + (c.claimed_count || 0), 0);
        const capacity = list.reduce((sum, c) => sum + (c.max_claims || 0), 0);
        const notified = list.reduce((sum, c) => sum + (c.notified_count || 0), 0);
        return { active, claims, capacity, notified, total: list.length };
    }, [list]);

    function openEdit(row: Campaign) {
        setEditingId(row.id);
        setComposerOpen(false);
        editForm.setData({
            title: row.title,
            description: row.description ?? '',
            starts_at: toLocalInput(row.starts_at),
            ends_at: toLocalInput(row.ends_at) || defaultExpiryLocal(),
            no_expiry: !row.ends_at,
            max_claims: String(row.max_claims),
            is_active: row.is_active,
        });
        editForm.clearErrors();
    }

    function submitCreate(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            percent_off: data.discount_type === 'percent' ? Number(data.percent_off) : null,
            amount_rupees: data.discount_type === 'amount' ? Number(data.amount_rupees) : null,
            max_claims: Number(data.max_claims),
            starts_at: data.starts_at || null,
            ends_at: data.no_expiry ? null : data.ends_at || null,
            no_expiry: Boolean(data.no_expiry),
            code: data.code || null,
        }));
        form.post('/admin/coupons', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('code', 'title', 'description');
                form.setData({
                    ends_at: defaultExpiryLocal(),
                    no_expiry: false,
                    max_claims: '100',
                    percent_off: '20',
                    amount_rupees: '100',
                    discount_type: 'percent',
                    notify: true,
                    is_active: true,
                });
                setComposerOpen(false);
            },
        });
    }

    function submitEdit(event: FormEvent) {
        event.preventDefault();
        if (!editing) {
            return;
        }
        editForm.transform((data) => ({
            title: data.title,
            description: data.description || null,
            starts_at: data.starts_at || null,
            ends_at: data.no_expiry ? null : data.ends_at || null,
            no_expiry: Boolean(data.no_expiry),
            max_claims: Number(data.max_claims),
            is_active: Boolean(data.is_active),
        }));
        editForm.post(`/admin/coupons/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    }

    async function copyCode(code: string, id: number) {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedId(id);
            window.setTimeout(() => setCopiedId(null), 1400);
        } catch {
            // ignore
        }
    }

    const createForm = (
        <form onSubmit={submitCreate} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label className={labelCls}>Title</label>
                    <input
                        className={field}
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                        placeholder="Spring launch offer"
                        required
                    />
                    {form.errors.title ? <p className="mt-1.5 text-[12px] text-rose-600">{form.errors.title}</p> : null}
                </div>
                <div>
                    <label className={labelCls}>Code</label>
                    <div className="relative">
                        <Hash className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-zinc-400" />
                        <input
                            className={cn(field, 'pl-9 font-mono tracking-wide')}
                            value={form.data.code}
                            onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                            placeholder="AUTO"
                        />
                    </div>
                    {form.errors.code ? <p className="mt-1.5 text-[12px] text-rose-600">{form.errors.code}</p> : null}
                </div>
                <div>
                    <label className={labelCls}>Claim count</label>
                    <div className="relative">
                        <Users className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-zinc-400" />
                        <input
                            className={cn(field, 'pl-9')}
                            type="number"
                            min={1}
                            value={form.data.max_claims}
                            onChange={(e) => form.setData('max_claims', e.target.value)}
                            required
                        />
                    </div>
                    {form.errors.max_claims ? (
                        <p className="mt-1.5 text-[12px] text-rose-600">{form.errors.max_claims}</p>
                    ) : null}
                </div>
            </div>

            <div>
                <p className={labelCls}>Discount</p>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1">
                    {(
                        [
                            ['percent', 'Percentage', Percent],
                            ['amount', 'Fixed ₹', IndianRupee],
                        ] as const
                    ).map(([value, text, Icon]) => {
                        const active = form.data.discount_type === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => form.setData('discount_type', value)}
                                className={cn(
                                    'inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition',
                                    active
                                        ? 'bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/80'
                                        : 'text-zinc-500 hover:text-zinc-800',
                                )}
                            >
                                <Icon className="size-3.5" />
                                {text}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-3">
                    {form.data.discount_type === 'percent' ? (
                        <>
                            <label className={labelCls}>Percent off</label>
                            <input
                                className={field}
                                type="number"
                                min={1}
                                max={90}
                                value={form.data.percent_off}
                                onChange={(e) => form.setData('percent_off', e.target.value)}
                                required
                            />
                            {form.errors.percent_off ? (
                                <p className="mt-1.5 text-[12px] text-rose-600">{form.errors.percent_off}</p>
                            ) : null}
                        </>
                    ) : (
                        <>
                            <label className={labelCls}>Amount off (₹)</label>
                            <input
                                className={field}
                                type="number"
                                min={1}
                                step="1"
                                value={form.data.amount_rupees}
                                onChange={(e) => form.setData('amount_rupees', e.target.value)}
                                required
                            />
                            {form.errors.amount_rupees ? (
                                <p className="mt-1.5 text-[12px] text-rose-600">{form.errors.amount_rupees}</p>
                            ) : null}
                        </>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4">
                <div className="mb-3 flex items-center gap-2">
                    <CalendarClock className="size-4 text-zinc-500" />
                    <p className="text-[12px] font-semibold tracking-[0.1em] text-zinc-500 uppercase">Validity</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className={labelCls}>Starts</label>
                        <input
                            className={field}
                            type="datetime-local"
                            value={form.data.starts_at}
                            onChange={(e) => form.setData('starts_at', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Expiry</label>
                        <input
                            className={cn(field, form.data.no_expiry && 'opacity-50')}
                            type="datetime-local"
                            value={form.data.ends_at}
                            onChange={(e) => form.setData('ends_at', e.target.value)}
                            disabled={form.data.no_expiry}
                            required={!form.data.no_expiry}
                        />
                        {form.errors.ends_at ? (
                            <p className="mt-1.5 text-[12px] text-rose-600">{form.errors.ends_at}</p>
                        ) : null}
                    </div>
                </div>
                <label className="mt-3 flex items-center gap-2.5 text-[13px] text-zinc-700">
                    <input
                        type="checkbox"
                        className="size-4 rounded border-zinc-300"
                        checked={form.data.no_expiry}
                        onChange={(e) => form.setData('no_expiry', e.target.checked)}
                    />
                    No expiry date
                </label>
            </div>

            <div>
                <label className={labelCls}>Description</label>
                <textarea
                    className={cn(field, 'h-24 resize-none py-3')}
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    placeholder="Shown on the public coupons page"
                />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3.5 py-3 text-[13px] text-zinc-700">
                    <input
                        type="checkbox"
                        className="size-4 rounded border-zinc-300"
                        checked={form.data.notify}
                        onChange={(e) => form.setData('notify', e.target.checked)}
                    />
                    <span>
                        <span className="block font-semibold text-zinc-900">Notify users</span>
                        <span className="text-[12px] text-zinc-500">Active hosts first</span>
                    </span>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3.5 py-3 text-[13px] text-zinc-700">
                    <input
                        type="checkbox"
                        className="size-4 rounded border-zinc-300"
                        checked={form.data.is_active}
                        onChange={(e) => form.setData('is_active', e.target.checked)}
                    />
                    <span>
                        <span className="block font-semibold text-zinc-900">Active</span>
                        <span className="text-[12px] text-zinc-500">Claimable when live</span>
                    </span>
                </label>
            </div>

            <button
                type="submit"
                disabled={form.processing}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-[14px] font-semibold text-white shadow-lg shadow-zinc-950/15 transition hover:bg-zinc-800 disabled:opacity-50"
            >
                <Plus className="size-4" />
                {form.processing ? 'Creating…' : 'Create coupon'}
            </button>
        </form>
    );

    return (
        <>
            <Head title="Coupons" />
            <AdminPageHeader
                title="Coupons"
                description="Launch site-pack offers with claim limits and expiry. Heavy hosts get notified first."
                actions={
                    <button
                        type="button"
                        onClick={() => {
                            setEditingId(null);
                            setComposerOpen((v) => !v);
                        }}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-3.5 text-[13px] font-semibold text-white lg:hidden"
                    >
                        <Plus className="size-4" />
                        {composerOpen ? 'Close' : 'New coupon'}
                    </button>
                }
            />

            <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                <AdminStat label="Campaigns" value={stats.total} />
                <AdminStat label="Active" value={stats.active} />
                <AdminStat label="Claims used" value={`${stats.claims}/${stats.capacity || 0}`} />
                <AdminStat label="Notified" value={stats.notified} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
                <aside
                    className={cn(
                        'overflow-hidden rounded-[1.35rem] border border-zinc-200/90 bg-white shadow-[0_12px_40px_-24px_rgba(24,24,27,0.35)]',
                        composerOpen ? 'block' : 'hidden lg:block',
                    )}
                >
                    <div className="relative overflow-hidden border-b border-zinc-100 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(16,185,129,0.12),transparent_55%),linear-gradient(180deg,#fafafa,white)] px-5 py-5">
                        <div className="flex items-start gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-md shadow-zinc-950/20">
                                <Ticket className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                    Composer
                                </p>
                                <h2 className="mt-0.5 font-serif text-2xl tracking-tight text-zinc-950">
                                    New offer
                                </h2>
                                <p className="mt-1 text-[13px] leading-5 text-zinc-500">
                                    Percent or fixed amount, with hard claim caps and expiry.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="px-5 py-5">{createForm}</div>
                </aside>

                <section className="min-w-0 space-y-4">
                    {editing ? (
                        <div className="overflow-hidden rounded-[1.35rem] border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-white shadow-[0_12px_40px_-28px_rgba(16,185,129,0.45)]">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/80 px-5 py-4">
                                <div>
                                    <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-700/80 uppercase">
                                        Edit limits
                                    </p>
                                    <p className="mt-0.5 font-mono text-sm text-zinc-700">{editing.code}</p>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-700"
                                    onClick={() => setEditingId(null)}
                                >
                                    Close
                                </button>
                            </div>
                            <form onSubmit={submitEdit} className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>Title</label>
                                    <input
                                        className={field}
                                        value={editForm.data.title}
                                        onChange={(e) => editForm.setData('title', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Claim count</label>
                                    <input
                                        className={field}
                                        type="number"
                                        min={editing.claimed_count || 1}
                                        value={editForm.data.max_claims}
                                        onChange={(e) => editForm.setData('max_claims', e.target.value)}
                                        required
                                    />
                                    {editForm.errors.max_claims ? (
                                        <p className="mt-1.5 text-[12px] text-rose-600">{editForm.errors.max_claims}</p>
                                    ) : (
                                        <p className="mt-1.5 text-[12px] text-zinc-500">
                                            Already claimed: {editing.claimed_count}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className={labelCls}>Starts</label>
                                    <input
                                        className={field}
                                        type="datetime-local"
                                        value={editForm.data.starts_at}
                                        onChange={(e) => editForm.setData('starts_at', e.target.value)}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="flex items-center gap-2.5 text-[13px] text-zinc-700">
                                        <input
                                            type="checkbox"
                                            className="size-4 rounded border-zinc-300"
                                            checked={editForm.data.no_expiry}
                                            onChange={(e) => editForm.setData('no_expiry', e.target.checked)}
                                        />
                                        No expiry date
                                    </label>
                                </div>
                                {!editForm.data.no_expiry ? (
                                    <div className="sm:col-span-2">
                                        <label className={labelCls}>Expiry</label>
                                        <input
                                            className={field}
                                            type="datetime-local"
                                            value={editForm.data.ends_at}
                                            onChange={(e) => editForm.setData('ends_at', e.target.value)}
                                            required={!editForm.data.no_expiry}
                                        />
                                        {editForm.errors.ends_at ? (
                                            <p className="mt-1.5 text-[12px] text-rose-600">{editForm.errors.ends_at}</p>
                                        ) : null}
                                    </div>
                                ) : null}
                                <div className="sm:col-span-2 flex flex-wrap gap-2">
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="inline-flex h-11 items-center rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white disabled:opacity-50"
                                    >
                                        {editForm.processing ? 'Saving…' : 'Save counts & expiry'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : null}

                    <div className="overflow-hidden rounded-[1.35rem] border border-zinc-200/90 bg-white shadow-[0_12px_40px_-28px_rgba(24,24,27,0.28)]">
                        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-100 px-5 py-4">
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                    Library
                                </p>
                                <h2 className="mt-0.5 font-serif text-2xl tracking-tight text-zinc-950">
                                    Campaigns
                                </h2>
                            </div>
                            <p className="text-[12px] text-zinc-500">
                                {list.length === 0 ? 'No campaigns yet' : `${list.length} total`}
                            </p>
                        </div>

                        {list.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="flex size-14 items-center justify-center rounded-3xl bg-zinc-100 text-zinc-500">
                                    <Ticket className="size-6" />
                                </div>
                                <p className="mt-4 font-serif text-xl text-zinc-900">No coupons yet</p>
                                <p className="mt-1 max-w-sm text-[13px] leading-5 text-zinc-500">
                                    Create your first offer with a claim count and expiry. It will show here for
                                    tracking and edits.
                                </p>
                                <button
                                    type="button"
                                    className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white lg:hidden"
                                    onClick={() => setComposerOpen(true)}
                                >
                                    <Plus className="size-4" />
                                    Create coupon
                                </button>
                            </div>
                        ) : (
                            <ul className="divide-y divide-zinc-100">
                                {list.map((row) => {
                                    const progress = claimProgress(row.claimed_count, row.max_claims);
                                    return (
                                        <li
                                            key={row.id}
                                            className="grid gap-4 px-4 py-4 transition hover:bg-zinc-50/70 sm:px-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_auto] lg:items-center"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate font-semibold text-zinc-950">
                                                        {row.title}
                                                    </p>
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ring-1',
                                                            row.is_active
                                                                ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                                                                : 'bg-zinc-100 text-zinc-500 ring-zinc-200',
                                                        )}
                                                    >
                                                        {row.is_active ? 'Active' : 'Off'}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ring-1',
                                                            notifyTone(row.notify_status),
                                                        )}
                                                    >
                                                        {row.notify_status}
                                                    </span>
                                                </div>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                                    <code className="rounded-lg bg-zinc-100 px-2 py-1 font-mono text-[12px] text-zinc-700">
                                                        {row.code}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyCode(row.code, row.id)}
                                                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                                                    >
                                                        {copiedId === row.id ? (
                                                            <>
                                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                                Copied
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="size-3.5" />
                                                                Copy
                                                            </>
                                                        )}
                                                    </button>
                                                    <span className="text-[12px] font-medium text-emerald-800">
                                                        {row.discount_label}
                                                    </span>
                                                </div>
                                                {row.description ? (
                                                    <p className="mt-2 line-clamp-2 text-[12.5px] leading-5 text-zinc-500">
                                                        {row.description}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="min-w-0 space-y-2">
                                                <div className="flex items-center justify-between gap-3 text-[12px]">
                                                    <span className="font-medium text-zinc-700">
                                                        {row.claimed_count}
                                                        <span className="text-zinc-400"> / {row.max_claims} claims</span>
                                                    </span>
                                                    <span className="text-zinc-500">{progress}%</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-zinc-800 to-emerald-600 transition-all"
                                                        style={{ width: `${Math.max(progress, progress > 0 ? 4 : 0)}%` }}
                                                    />
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-zinc-500">
                                                    <span>
                                                        Expiry{' '}
                                                        <span className="font-medium text-zinc-700">
                                                            {row.ends_at ? shortDate(row.ends_at) : 'None'}
                                                        </span>
                                                    </span>
                                                    <span>
                                                        Notified{' '}
                                                        <span className="font-medium text-zinc-700">
                                                            {row.notified_count}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 lg:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(row)}
                                                    className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50"
                                                >
                                                    Edit limits
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.post(
                                                            `/admin/coupons/${row.id}`,
                                                            { is_active: !row.is_active },
                                                            { preserveScroll: true },
                                                        )
                                                    }
                                                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50"
                                                >
                                                    <Power className="size-3.5" />
                                                    {row.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.post(`/admin/coupons/${row.id}/notify`, {}, {
                                                            preserveScroll: true,
                                                        })
                                                    }
                                                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50"
                                                >
                                                    <Bell className="size-3.5" />
                                                    Re-notify
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}
