import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import { AdminCard, AdminPageHeader, AdminTable } from '@/components/admin/admin-ui';
import { shortDate } from '@/components/admin/pagination';

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
    'mt-1 block h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-[13px] text-zinc-900';
const label = 'block text-[12px] font-medium text-zinc-500';
const btnDark = 'rounded-lg bg-zinc-950 px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50';
const btnLight =
    'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800 disabled:opacity-50';

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

export default function CouponsIndex({ campaigns = [] }: { campaigns?: Campaign[] }) {
    const list = Array.isArray(campaigns) ? campaigns : [];
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

    const [editingId, setEditingId] = useState<number | null>(null);
    const editing = useMemo(
        () => list.find((c) => c.id === editingId) ?? null,
        [list, editingId],
    );

    const editForm = useForm({
        title: '',
        description: '',
        starts_at: '',
        ends_at: '',
        no_expiry: false,
        max_claims: '100',
        is_active: true,
    });

    function openEdit(row: Campaign) {
        setEditingId(row.id);
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
                form.reset(
                    'code',
                    'title',
                    'description',
                );
                form.setData('ends_at', defaultExpiryLocal());
                form.setData('no_expiry', false);
                form.setData('max_claims', '100');
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

    return (
        <>
            <Head title="Coupons" />
            <AdminPageHeader
                title="Coupons"
                description="Set claim counts and an expiry when you create a coupon. Active hosts are notified first, then unused accounts."
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
                <AdminCard title="Create coupon">
                    <form onSubmit={submitCreate} className="space-y-3">
                        <div>
                            <label className={label}>Title</label>
                            <input
                                className={field}
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                placeholder="Spring launch offer"
                                required
                            />
                            {form.errors.title ? <p className="mt-1 text-[11px] text-rose-600">{form.errors.title}</p> : null}
                        </div>
                        <div>
                            <label className={label}>Code (optional)</label>
                            <input
                                className={field}
                                value={form.data.code}
                                onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                placeholder="Auto-generated if blank"
                            />
                            {form.errors.code ? <p className="mt-1 text-[11px] text-rose-600">{form.errors.code}</p> : null}
                        </div>
                        <div>
                            <label className={label}>Discount type</label>
                            <select
                                className={field}
                                value={form.data.discount_type}
                                onChange={(e) =>
                                    form.setData('discount_type', e.target.value as 'percent' | 'amount')
                                }
                            >
                                <option value="percent">Percentage</option>
                                <option value="amount">Fixed amount (₹)</option>
                            </select>
                        </div>
                        {form.data.discount_type === 'percent' ? (
                            <div>
                                <label className={label}>Percent off (1–90)</label>
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
                                    <p className="mt-1 text-[11px] text-rose-600">{form.errors.percent_off}</p>
                                ) : null}
                            </div>
                        ) : (
                            <div>
                                <label className={label}>Amount off (₹)</label>
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
                                    <p className="mt-1 text-[11px] text-rose-600">{form.errors.amount_rupees}</p>
                                ) : null}
                            </div>
                        )}

                        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 space-y-3">
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                                Limits
                            </p>
                            <div>
                                <label className={label}>
                                    Claim count <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    className={field}
                                    type="number"
                                    min={1}
                                    value={form.data.max_claims}
                                    onChange={(e) => form.setData('max_claims', e.target.value)}
                                    required
                                />
                                <p className="mt-1 text-[11px] text-zinc-500">
                                    How many users can get this coupon (total).
                                </p>
                                {form.errors.max_claims ? (
                                    <p className="mt-1 text-[11px] text-rose-600">{form.errors.max_claims}</p>
                                ) : null}
                            </div>
                            <div>
                                <label className={label}>Starts (optional)</label>
                                <input
                                    className={field}
                                    type="datetime-local"
                                    value={form.data.starts_at}
                                    onChange={(e) => form.setData('starts_at', e.target.value)}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-[12px] text-zinc-700">
                                <input
                                    type="checkbox"
                                    checked={form.data.no_expiry}
                                    onChange={(e) => form.setData('no_expiry', e.target.checked)}
                                />
                                No expiry date
                            </label>
                            {!form.data.no_expiry ? (
                                <div>
                                    <label className={label}>
                                        Expiry date <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                        className={field}
                                        type="datetime-local"
                                        value={form.data.ends_at}
                                        onChange={(e) => form.setData('ends_at', e.target.value)}
                                        required={!form.data.no_expiry}
                                    />
                                    <p className="mt-1 text-[11px] text-zinc-500">
                                        After this time the coupon cannot be claimed or used.
                                    </p>
                                    {form.errors.ends_at ? (
                                        <p className="mt-1 text-[11px] text-rose-600">{form.errors.ends_at}</p>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>

                        <div>
                            <label className={label}>Description</label>
                            <textarea
                                className={`${field} h-20 py-2`}
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                placeholder="Shown on the public coupons page"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-[12px] text-zinc-700">
                            <input
                                type="checkbox"
                                checked={form.data.notify}
                                onChange={(e) => form.setData('notify', e.target.checked)}
                            />
                            Notify users now (active hosts first, then unused)
                        </label>
                        <label className="flex items-center gap-2 text-[12px] text-zinc-700">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                            />
                            Active
                        </label>
                        <button type="submit" className={btnDark} disabled={form.processing}>
                            {form.processing ? 'Saving…' : 'Create coupon'}
                        </button>
                    </form>
                </AdminCard>

                <div className="space-y-6">
                    {editing ? (
                        <AdminCard title={`Edit limits · ${editing.code}`}>
                            <form onSubmit={submitEdit} className="grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className={label}>Title</label>
                                    <input
                                        className={field}
                                        value={editForm.data.title}
                                        onChange={(e) => editForm.setData('title', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={label}>
                                        Claim count <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                        className={field}
                                        type="number"
                                        min={editing.claimed_count || 1}
                                        value={editForm.data.max_claims}
                                        onChange={(e) => editForm.setData('max_claims', e.target.value)}
                                        required
                                    />
                                    {editForm.errors.max_claims ? (
                                        <p className="mt-1 text-[11px] text-rose-600">{editForm.errors.max_claims}</p>
                                    ) : (
                                        <p className="mt-1 text-[11px] text-zinc-500">
                                            Already claimed: {editing.claimed_count}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className={label}>Starts</label>
                                    <input
                                        className={field}
                                        type="datetime-local"
                                        value={editForm.data.starts_at}
                                        onChange={(e) => editForm.setData('starts_at', e.target.value)}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="flex items-center gap-2 text-[12px] text-zinc-700">
                                        <input
                                            type="checkbox"
                                            checked={editForm.data.no_expiry}
                                            onChange={(e) => editForm.setData('no_expiry', e.target.checked)}
                                        />
                                        No expiry date
                                    </label>
                                </div>
                                {!editForm.data.no_expiry ? (
                                    <div className="sm:col-span-2">
                                        <label className={label}>
                                            Expiry date <span className="text-rose-600">*</span>
                                        </label>
                                        <input
                                            className={field}
                                            type="datetime-local"
                                            value={editForm.data.ends_at}
                                            onChange={(e) => editForm.setData('ends_at', e.target.value)}
                                            required={!editForm.data.no_expiry}
                                        />
                                        {editForm.errors.ends_at ? (
                                            <p className="mt-1 text-[11px] text-rose-600">{editForm.errors.ends_at}</p>
                                        ) : (
                                            <p className="mt-1 text-[11px] text-zinc-500">
                                                Updates expiry on unused issued coupons too.
                                            </p>
                                        )}
                                    </div>
                                ) : null}
                                <div className="sm:col-span-2 flex flex-wrap gap-2">
                                    <button type="submit" className={btnDark} disabled={editForm.processing}>
                                        {editForm.processing ? 'Saving…' : 'Save counts & expiry'}
                                    </button>
                                    <button
                                        type="button"
                                        className={btnLight}
                                        onClick={() => setEditingId(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </AdminCard>
                    ) : null}

                    <AdminCard title="Campaigns">
                        <AdminTable
                            headers={['Coupon', 'Discount', 'Counts', 'Expiry', 'Notify', 'Actions']}
                            rows={list.map((row) => [
                                <div key={`c-${row.id}`}>
                                    <p className="font-medium text-zinc-900">{row.title}</p>
                                    <p className="font-mono text-[11px] text-zinc-500">{row.code}</p>
                                    {!row.is_active ? (
                                        <span className="text-[11px] text-amber-700">Inactive</span>
                                    ) : null}
                                </div>,
                                row.discount_label,
                                <div key={`n-${row.id}`}>
                                    <span className="font-medium text-zinc-900">
                                        {row.claimed_count}/{row.max_claims}
                                    </span>
                                    <span className="block text-[11px] text-zinc-400">claimed / limit</span>
                                </div>,
                                row.ends_at ? shortDate(row.ends_at) : 'No expiry',
                                <div key={`y-${row.id}`}>
                                    <span className="text-zinc-600">{row.notify_status}</span>
                                    <span className="block text-[11px] text-zinc-400">
                                        {row.notified_count} notified
                                    </span>
                                </div>,
                                <div key={`a-${row.id}`} className="flex flex-wrap gap-1.5">
                                    <button
                                        type="button"
                                        className={btnLight}
                                        onClick={() => openEdit(row)}
                                    >
                                        Edit limits
                                    </button>
                                    <button
                                        type="button"
                                        className={btnLight}
                                        onClick={() =>
                                            router.post(
                                                `/admin/coupons/${row.id}`,
                                                { is_active: !row.is_active },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        {row.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                        type="button"
                                        className={btnLight}
                                        onClick={() =>
                                            router.post(`/admin/coupons/${row.id}/notify`, {}, {
                                                preserveScroll: true,
                                            })
                                        }
                                    >
                                        Re-notify
                                    </button>
                                </div>,
                            ])}
                        />
                    </AdminCard>
                </div>
            </div>
        </>
    );
}
