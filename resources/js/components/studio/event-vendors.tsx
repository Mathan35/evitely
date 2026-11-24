import { router } from '@inertiajs/react';
import { Plus, Trash2, Store } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type VendorRow = {
    id: string;
    name: string;
    category: string;
    contact: string;
    phone: string;
    email: string;
    quote: number;
    paid: number;
    status: 'inquiry' | 'quoted' | 'booked' | 'paid' | 'cancelled';
    notes: string;
};

const STATUSES: VendorRow['status'][] = ['inquiry', 'quoted', 'booked', 'paid', 'cancelled'];

const CATEGORIES = [
    'Venue',
    'Catering',
    'Decor',
    'Photo / Video',
    'Music / DJ',
    'Makeup',
    'Attire',
    'Transport',
    'Pandit / Officiant',
    'Other',
];

function uid(): string {
    return `vendor-${Math.random().toString(36).slice(2, 9)}`;
}

function blank(): VendorRow {
    return {
        id: uid(),
        name: '',
        category: 'Other',
        contact: '',
        phone: '',
        email: '',
        quote: 0,
        paid: 0,
        status: 'inquiry',
        notes: '',
    };
}

function parseVendors(raw: string | null | undefined): VendorRow[] {
    if (!raw?.trim()) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw) as VendorRow[];
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.map((row) => ({
            id: row.id || uid(),
            name: String(row.name ?? ''),
            category: String(row.category ?? 'Other'),
            contact: String(row.contact ?? ''),
            phone: String(row.phone ?? ''),
            email: String(row.email ?? ''),
            quote: Number(row.quote) || 0,
            paid: Number(row.paid) || 0,
            status: STATUSES.includes(row.status) ? row.status : 'inquiry',
            notes: String(row.notes ?? ''),
        }));
    } catch {
        return [];
    }
}

export function EventVendors({
    eventId,
    details,
}: {
    eventId: number;
    details?: Record<string, string | null> | null;
}) {
    const [rows, setRows] = useState(() => parseVendors(details?.vendors_json ?? null));
    const [saving, setSaving] = useState(false);

    const totals = useMemo(() => {
        const quote = rows.reduce((sum, row) => sum + (Number(row.quote) || 0), 0);
        const paid = rows.reduce((sum, row) => sum + (Number(row.paid) || 0), 0);
        return { quote, paid, due: Math.max(0, quote - paid) };
    }, [rows]);

    function persist(next: VendorRow[]): void {
        setRows(next);
        setSaving(true);
        router.put(
            `/events/${eventId}`,
            {
                details: {
                    ...(details ?? {}),
                    vendors_json: JSON.stringify(next),
                },
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSaving(false),
            },
        );
    }

    function update(index: number, patch: Partial<VendorRow>, save = false): void {
        const next = [...rows];
        next[index] = { ...next[index], ...patch };
        setRows(next);
        if (save) {
            persist(next);
        }
    }

    return (
        <section className="mt-5 overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05]">
            <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:px-5">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                        Directory
                    </p>
                    <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950">Vendors</h2>
                    <p className="mt-1 max-w-md text-[13px] leading-relaxed text-zinc-500">
                        Quotes, contacts, and payout tracking — separate from budget line items.
                    </p>
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                    <div className="min-w-0 flex-1 rounded-2xl bg-zinc-50 px-3 py-2 sm:flex-none sm:text-right">
                        <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
                            Due
                        </p>
                        <p className="font-sans text-lg font-semibold tabular-nums text-zinc-950">
                            {totals.due.toLocaleString()}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => persist([...rows, blank()])}
                        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-zinc-950 px-3.5 text-[12px] font-semibold text-white hover:bg-zinc-800"
                    >
                        <Plus className="size-3.5" />
                        Add vendor
                    </button>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                    <Store className="size-8 text-zinc-300" />
                    <p className="mt-3 text-[14px] font-medium text-zinc-700">No vendors yet</p>
                    <p className="mt-1 max-w-sm text-[13px] text-zinc-500">
                        Add photographers, caterers, and venues with quoted amounts and payment status.
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-zinc-100">
                    {rows.map((row, index) => (
                        <li key={row.id} className="space-y-3 px-4 py-4 sm:px-5">
                            <div className="grid gap-2 sm:grid-cols-2">
                                <Input
                                    value={row.name}
                                    onChange={(e) => update(index, { name: e.target.value })}
                                    onBlur={() => persist(rows)}
                                    placeholder="Vendor name"
                                    className="h-10"
                                />
                                <select
                                    value={row.category}
                                    onChange={(e) => {
                                        update(index, { category: e.target.value }, true);
                                    }}
                                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-[13px]"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    value={row.contact}
                                    onChange={(e) => update(index, { contact: e.target.value })}
                                    onBlur={() => persist(rows)}
                                    placeholder="Contact person"
                                    className="h-10"
                                />
                                <select
                                    value={row.status}
                                    onChange={(e) =>
                                        update(
                                            index,
                                            { status: e.target.value as VendorRow['status'] },
                                            true,
                                        )
                                    }
                                    className={cn(
                                        'h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-[13px] capitalize',
                                        row.status === 'booked' && 'text-emerald-800',
                                        row.status === 'paid' && 'text-sky-800',
                                        row.status === 'cancelled' && 'text-rose-700',
                                    )}
                                >
                                    {STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <Input
                                    value={row.phone}
                                    onChange={(e) => update(index, { phone: e.target.value })}
                                    onBlur={() => persist(rows)}
                                    placeholder="Phone"
                                    className="h-10"
                                />
                                <Input
                                    value={row.email}
                                    onChange={(e) => update(index, { email: e.target.value })}
                                    onBlur={() => persist(rows)}
                                    placeholder="Email"
                                    className="h-10"
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    value={row.quote || ''}
                                    onChange={(e) =>
                                        update(index, { quote: Number(e.target.value) || 0 })
                                    }
                                    onBlur={() => persist(rows)}
                                    placeholder="Quote"
                                    className="h-10"
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    value={row.paid || ''}
                                    onChange={(e) =>
                                        update(index, { paid: Number(e.target.value) || 0 })
                                    }
                                    onBlur={() => persist(rows)}
                                    placeholder="Paid"
                                    className="h-10"
                                />
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Input
                                    value={row.notes}
                                    onChange={(e) => update(index, { notes: e.target.value })}
                                    onBlur={() => persist(rows)}
                                    placeholder="Notes — deposit %, delivery, contract link…"
                                    className="h-10 min-w-0 flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => persist(rows.filter((_, i) => i !== index))}
                                    className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 text-[12px] font-semibold text-rose-800 hover:bg-rose-100"
                                >
                                    <Trash2 className="size-3.5" />
                                    Remove
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {saving ? (
                <p className="border-t border-zinc-100 px-5 py-2 text-[11px] text-zinc-400">Saving…</p>
            ) : null}
        </section>
    );
}
