import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    ChevronDown,
    ChevronUp,
    Plus,
    Sparkles,
    Trash2,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type BudgetLine = {
    id: string;
    label: string;
    category: string;
    planned: number;
    actual: number;
    paid: number;
    vendor: string;
    due_date: string;
    notes: string;
    suggested_pct: number;
};

type TemplateLine = Omit<BudgetLine, 'planned' | 'actual' | 'paid' | 'vendor' | 'due_date' | 'notes'> & {
    tip?: string;
};

const WEDDING_TEMPLATE: TemplateLine[] = [
    { id: 'venue', label: 'Venue & hospitality', category: 'Venue', suggested_pct: 25 },
    { id: 'catering', label: 'Catering & beverages', category: 'Food', suggested_pct: 25 },
    { id: 'decor', label: 'Decor, flowers & lighting', category: 'Decor', suggested_pct: 12 },
    { id: 'photo', label: 'Photography & videography', category: 'Media', suggested_pct: 10 },
    { id: 'attire', label: 'Attire, jewellery & beauty', category: 'Attire', suggested_pct: 10 },
    { id: 'entertainment', label: 'Music & entertainment', category: 'Entertainment', suggested_pct: 5 },
    { id: 'hospitality', label: 'Guest stay & transport', category: 'Hospitality', suggested_pct: 5 },
    { id: 'stationery', label: 'Invites, gifts & favours', category: 'Stationery', suggested_pct: 3 },
    { id: 'rituals', label: 'Rituals, pandit & misc', category: 'Rituals', suggested_pct: 2 },
    { id: 'buffer', label: 'Contingency buffer', category: 'Buffer', suggested_pct: 8 },
];

const PARTY_TEMPLATE: TemplateLine[] = [
    { id: 'venue', label: 'Venue / space', category: 'Venue', suggested_pct: 30 },
    { id: 'catering', label: 'Food & drinks', category: 'Food', suggested_pct: 30 },
    { id: 'cake', label: 'Cake & desserts', category: 'Food', suggested_pct: 5 },
    { id: 'decor', label: 'Decor & setup', category: 'Decor', suggested_pct: 12 },
    { id: 'photo', label: 'Photo & video', category: 'Media', suggested_pct: 8 },
    { id: 'entertainment', label: 'Music / DJ / activities', category: 'Entertainment', suggested_pct: 8 },
    { id: 'favors', label: 'Favours & gifts', category: 'Stationery', suggested_pct: 4 },
    { id: 'buffer', label: 'Contingency buffer', category: 'Buffer', suggested_pct: 8 },
];

const CORPORATE_TEMPLATE: TemplateLine[] = [
    { id: 'venue', label: 'Venue & A/V', category: 'Venue', suggested_pct: 35 },
    { id: 'catering', label: 'Catering & hospitality', category: 'Food', suggested_pct: 25 },
    { id: 'speakers', label: 'Speakers / talent', category: 'Program', suggested_pct: 12 },
    { id: 'branding', label: 'Branding & production', category: 'Decor', suggested_pct: 10 },
    { id: 'photo', label: 'Photo / coverage', category: 'Media', suggested_pct: 6 },
    { id: 'staff', label: 'Staff & logistics', category: 'Hospitality', suggested_pct: 5 },
    { id: 'buffer', label: 'Contingency buffer', category: 'Buffer', suggested_pct: 7 },
];

const TIPS = [
    'Set a total first, then slice categories — don’t add wish-list numbers upward.',
    'Vendors usually take 25–50% deposit; final balance is often due 2–4 weeks before the day.',
    'Keep the contingency buffer untouched until the last month — surprises always appear.',
    'Track tips, overtime, taxes, postage, alterations, and vendor meals — they quietly add 5–10%.',
    'Review planned vs contracted monthly; flag any line over 90% of its allocation early.',
];

function blankFromTemplate(row: TemplateLine): BudgetLine {
    return {
        id: row.id,
        label: row.label,
        category: row.category,
        suggested_pct: row.suggested_pct,
        planned: 0,
        actual: 0,
        paid: 0,
        vendor: '',
        due_date: '',
        notes: '',
    };
}

function templateForOccasion(occasion?: string | null): TemplateLine[] {
    const key = (occasion || '').toLowerCase();
    if (
        key.includes('corporate') ||
        key.includes('conference') ||
        key.includes('seminar') ||
        key.includes('meetup')
    ) {
        return CORPORATE_TEMPLATE;
    }
    if (
        key.includes('wedding') ||
        key.includes('engagement') ||
        key.includes('bridal') ||
        key.includes('reception') ||
        key === ''
    ) {
        return WEDDING_TEMPLATE;
    }
    return PARTY_TEMPLATE;
}

function parseBudget(raw: string | null | undefined, occasion?: string | null): BudgetLine[] {
    const fallback = () => templateForOccasion(occasion).map(blankFromTemplate);
    if (!raw?.trim()) {
        return fallback();
    }
    try {
        const parsed = JSON.parse(raw) as BudgetLine[];
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return fallback();
        }
        return parsed
            .filter((row) => row && typeof row === 'object')
            .map((row, index) => {
                const actual = Math.max(0, Number(row.actual) || 0);
                const paidRaw = (row as { paid?: unknown }).paid;
                const paid =
                    paidRaw === undefined || paidRaw === null
                        ? actual
                        : Math.max(0, Number(paidRaw) || 0);
                return {
                    id: String(row.id || `line-${index}`),
                    label: String(row.label || `Item ${index + 1}`).trim() || `Item ${index + 1}`,
                    category: String(row.category || 'General').trim() || 'General',
                    planned: Math.max(0, Number(row.planned) || 0),
                    actual,
                    paid,
                    vendor: String((row as { vendor?: string }).vendor || '').trim(),
                    due_date: String((row as { due_date?: string }).due_date || '').trim(),
                    notes: String((row as { notes?: string }).notes || '').trim(),
                    suggested_pct: Math.max(
                        0,
                        Number((row as { suggested_pct?: number }).suggested_pct) || 0,
                    ),
                };
            });
    } catch {
        return fallback();
    }
}

function money(value: number, currency: string): string {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency || 'INR',
            maximumFractionDigits: 0,
        }).format(value);
    } catch {
        return `${currency} ${value}`;
    }
}

function daysUntil(due: string): number | null {
    if (!due) {
        return null;
    }
    const target = new Date(`${due}T12:00:00`);
    if (Number.isNaN(target.getTime())) {
        return null;
    }
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function committed(line: BudgetLine): number {
    return line.actual > 0 ? line.actual : line.planned;
}

function owed(line: BudgetLine): number {
    return Math.max(0, committed(line) - line.paid);
}

/** Optional host-only budget planner on Manage → Overview. */
export function EventBudgetTracker({
    eventId,
    details,
    occasion,
    guestCount = 0,
    eventDate,
}: {
    eventId: number;
    details?: Record<string, string | null> | null;
    occasion?: string | null;
    guestCount?: number;
    eventDate?: string | null;
}) {
    const enabled = ['1', 'true', 'yes', 'on'].includes(
        String(details?.budget_enabled ?? '').trim().toLowerCase(),
    );
    const currency = (details?.budget_currency || 'INR').trim() || 'INR';
    const [lines, setLines] = useState<BudgetLine[]>(() =>
        parseBudget(details?.budget_json ?? null, occasion),
    );
    const [totalBudget, setTotalBudget] = useState(
        () => Math.max(0, Number(details?.budget_total) || 0),
    );
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'due' | 'over' | 'unpaid'>('all');
    const tip = useMemo(() => TIPS[eventId % TIPS.length], [eventId]);

    const totals = useMemo(() => {
        const planned = lines.reduce((sum, line) => sum + line.planned, 0);
        const contracted = lines.reduce((sum, line) => sum + committed(line), 0);
        const paid = lines.reduce((sum, line) => sum + line.paid, 0);
        const balance = lines.reduce((sum, line) => sum + owed(line), 0);
        const ceiling = totalBudget > 0 ? totalBudget : planned;
        return {
            planned,
            contracted,
            paid,
            balance,
            remainingPlan: planned - contracted,
            vsCeiling: ceiling - contracted,
            ceiling,
            pctUsed: ceiling > 0 ? Math.min(999, Math.round((contracted / ceiling) * 100)) : 0,
            pctPaid: contracted > 0 ? Math.min(100, Math.round((paid / contracted) * 100)) : 0,
        };
    }, [lines, totalBudget]);

    const dueSoon = useMemo(
        () =>
            lines
                .map((line) => ({ line, days: daysUntil(line.due_date) }))
                .filter(
                    (row) =>
                        row.days !== null &&
                        row.days <= 45 &&
                        owed(row.line) > 0,
                )
                .sort((a, b) => (a.days ?? 0) - (b.days ?? 0)),
        [lines],
    );

    const visible = useMemo(() => {
        return lines.filter((line) => {
            if (filter === 'due') {
                const days = daysUntil(line.due_date);
                return days !== null && days <= 45 && owed(line) > 0;
            }
            if (filter === 'over') {
                return line.actual > 0 && line.planned > 0 && line.actual > line.planned;
            }
            if (filter === 'unpaid') {
                return owed(line) > 0;
            }
            return true;
        });
    }, [filter, lines]);

    const cateringPerGuest = useMemo(() => {
        if (guestCount < 1) {
            return null;
        }
        const catering = lines.find((line) =>
            /cater|food|beverage/i.test(`${line.label} ${line.category}`),
        );
        if (!catering || catering.planned <= 0) {
            return null;
        }
        return Math.round(catering.planned / guestCount);
    }, [guestCount, lines]);

    function persist(
        next: BudgetLine[],
        turnOn = enabled,
        nextCurrency = currency,
        nextTotal = totalBudget,
    ): void {
        setLines(next);
        setTotalBudget(nextTotal);
        setSaving(true);
        router.put(
            `/events/${eventId}`,
            {
                details: {
                    ...(details ?? {}),
                    budget_enabled: turnOn ? '1' : '0',
                    budget_currency: nextCurrency,
                    budget_total: String(Math.max(0, Math.round(nextTotal))),
                    budget_json: JSON.stringify(next),
                },
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSaving(false),
            },
        );
    }

    function updateLine(index: number, patch: Partial<BudgetLine>, save = false): void {
        const next = [...lines];
        next[index] = { ...next[index], ...patch };
        setLines(next);
        if (save) {
            persist(next);
        }
    }

    function applySuggestedSplit(): void {
        const ceiling = totalBudget > 0 ? totalBudget : totals.planned;
        if (ceiling <= 0) {
            return;
        }
        const template = templateForOccasion(occasion);
        const byId = new Map(template.map((row) => [row.id, row.suggested_pct]));
        const next = lines.map((line) => {
            const pct =
                line.suggested_pct > 0
                    ? line.suggested_pct
                    : byId.get(line.id) || Math.round(100 / Math.max(1, lines.length));
            return {
                ...line,
                suggested_pct: pct,
                planned: Math.round((ceiling * pct) / 100),
            };
        });
        const plannedSum = next.reduce((sum, line) => sum + line.planned, 0);
        if (plannedSum !== ceiling && next.length > 0) {
            next[0] = { ...next[0], planned: next[0].planned + (ceiling - plannedSum) };
        }
        persist(next, true, currency, ceiling);
    }

    function resetTemplate(): void {
        persist(
            templateForOccasion(occasion).map(blankFromTemplate),
            true,
            currency,
            totalBudget,
        );
        setExpanded(null);
        setFilter('all');
    }

    if (!enabled) {
        return (
            <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 mt-3 [animation-delay:220ms]">
                <button
                    type="button"
                    onClick={() => persist(lines, true)}
                    className="flex w-full items-center gap-3 rounded-[1.35rem] bg-white/90 px-4 py-4 text-left shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05] transition hover:bg-white"
                >
                    <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                        <Wallet className="size-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-zinc-950">
                            Budget planner
                        </span>
                        <span className="mt-0.5 block text-[12px] text-zinc-500">
                            Total ceiling, category splits, deposits, balances due, and a contingency
                            buffer — host only.
                        </span>
                    </span>
                </button>
            </section>
        );
    }

    return (
        <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 mt-3 [animation-delay:220ms]">
            <div className="overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05]">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-100 px-5 py-4">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                            Host only
                        </p>
                        <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950">
                            Budget planner
                        </h2>
                        <p className="mt-1 text-[12px] text-zinc-500">
                            {money(totals.paid, currency)} paid · {money(totals.balance, currency)} still
                            owed
                            {saving ? ' · saving…' : ''}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={currency}
                            onChange={(event) => persist(lines, true, event.target.value)}
                            className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold"
                        >
                            {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'].map((code) => (
                                <option key={code} value={code}>
                                    {code}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => persist(lines, false)}
                            className="text-[12px] font-semibold text-zinc-500 hover:text-zinc-800"
                        >
                            Hide
                        </button>
                    </div>
                </div>

                <div className="grid gap-3 border-b border-zinc-100 px-5 py-4 sm:grid-cols-[1.1fr_auto]">
                    <label className="block">
                        <span className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                            Total budget ceiling
                        </span>
                        <Input
                            type="number"
                            min={0}
                            className="mt-1.5 h-10 rounded-xl"
                            value={totalBudget || ''}
                            placeholder="e.g. 1500000"
                            onChange={(event) =>
                                setTotalBudget(Math.max(0, Number(event.target.value) || 0))
                            }
                            onBlur={() => persist(lines, true, currency, totalBudget)}
                        />
                        <span className="mt-1 block text-[11px] text-zinc-500">
                            Lock this number first. Suggested % below slices this pie — not a wish list.
                        </span>
                    </label>
                    <div className="flex flex-wrap items-end gap-2 sm:justify-end">
                        <button
                            type="button"
                            disabled={totalBudget <= 0 && totals.planned <= 0}
                            onClick={applySuggestedSplit}
                            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-zinc-950 px-3.5 text-[12px] font-semibold text-white disabled:opacity-40"
                        >
                            <Sparkles className="size-3.5" />
                            Apply suggested %
                        </button>
                        <button
                            type="button"
                            onClick={resetTemplate}
                            className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-3.5 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50"
                        >
                            Reset categories
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-zinc-100 px-5 py-3 sm:grid-cols-4">
                    {(
                        [
                            { label: 'Planned', value: totals.planned },
                            { label: 'Committed', value: totals.contracted },
                            { label: 'Paid', value: totals.paid },
                            { label: 'Still owed', value: totals.balance },
                        ] as const
                    ).map((stat) => (
                        <div key={stat.label} className="rounded-2xl bg-zinc-50 px-3 py-2.5">
                            <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                {stat.label}
                            </p>
                            <p className="mt-1 font-serif text-lg tabular-nums tracking-tight text-zinc-950">
                                {money(stat.value, currency)}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="border-b border-zinc-100 px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                        <p className="font-medium text-zinc-700">
                            {totals.pctUsed}% of{' '}
                            {money(totals.ceiling || totals.planned || 0, currency)} ceiling committed
                        </p>
                        <p
                            className={cn(
                                'font-semibold tabular-nums',
                                totals.vsCeiling < 0 ? 'text-rose-700' : 'text-emerald-700',
                            )}
                        >
                            {totals.vsCeiling < 0 ? 'Over by ' : 'Left '}
                            {money(Math.abs(totals.vsCeiling), currency)}
                        </p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all',
                                totals.pctUsed > 100
                                    ? 'bg-rose-500'
                                    : totals.pctUsed > 90
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-600',
                            )}
                            style={{ width: `${Math.min(100, totals.pctUsed)}%` }}
                        />
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-500">
                        {totals.pctPaid}% of committed amount already paid
                        {cateringPerGuest != null
                            ? ` · catering ≈ ${money(cateringPerGuest, currency)} / guest (${guestCount} guests)`
                            : guestCount > 0
                              ? ` · ${guestCount} guests on list`
                              : ''}
                        {eventDate ? ` · event ${eventDate}` : ''}
                    </p>
                </div>

                {dueSoon.length > 0 ? (
                    <div className="border-b border-amber-100 bg-amber-50/70 px-5 py-3">
                        <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-950">
                            <CalendarClock className="size-3.5" />
                            Payments due soon
                        </p>
                        <ul className="mt-1.5 space-y-1">
                            {dueSoon.slice(0, 4).map(({ line, days }) => (
                                <li
                                    key={line.id}
                                    className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-amber-950/90"
                                >
                                    <span>
                                        {line.label}
                                        {line.vendor ? ` · ${line.vendor}` : ''}
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {money(owed(line), currency)}
                                        {days !== null
                                            ? days < 0
                                                ? ` · ${Math.abs(days)}d overdue`
                                                : days === 0
                                                  ? ' · due today'
                                                  : ` · in ${days}d`
                                            : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-100 px-5 py-3">
                    {(
                        [
                            { id: 'all' as const, label: 'All' },
                            { id: 'unpaid' as const, label: 'Balance due' },
                            { id: 'due' as const, label: 'Due ≤45d' },
                            { id: 'over' as const, label: 'Over plan' },
                        ] as const
                    ).map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setFilter(item.id)}
                            className={cn(
                                'inline-flex h-8 items-center rounded-full px-3 text-[11px] font-semibold',
                                filter === item.id
                                    ? 'bg-zinc-950 text-white'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80',
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="hidden grid-cols-[minmax(0,1.35fr)_0.7fr_0.7fr_0.7fr_auto] gap-2 border-b border-zinc-100 px-5 py-2 text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase sm:grid">
                    <span>Category</span>
                    <span>Planned</span>
                    <span>Contracted</span>
                    <span>Paid</span>
                    <span className="w-8" />
                </div>

                <ul className="divide-y divide-zinc-100">
                    {visible.length === 0 ? (
                        <li className="px-5 py-8 text-center text-sm text-zinc-500">
                            No lines match this filter.
                        </li>
                    ) : (
                        visible.map((line) => {
                            const index = lines.findIndex((row) => row.id === line.id);
                            if (index < 0) {
                                return null;
                            }
                            const open = expanded === line.id;
                            const balance = owed(line);
                            const over =
                                line.actual > 0 && line.planned > 0 && line.actual > line.planned;
                            const share =
                                totals.planned > 0
                                    ? Math.round((line.planned / totals.planned) * 100)
                                    : line.suggested_pct;
                            const days = daysUntil(line.due_date);

                            return (
                                <li key={line.id} className="px-5 py-3">
                                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1.35fr)_0.7fr_0.7fr_0.7fr_auto] sm:items-center">
                                        <div className="min-w-0">
                                            <Input
                                                className="h-9 rounded-xl"
                                                value={line.label}
                                                onChange={(event) =>
                                                    updateLine(index, { label: event.target.value })
                                                }
                                                onBlur={() => persist(lines)}
                                            />
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-zinc-500">
                                                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5">
                                                    {line.category}
                                                </span>
                                                {share > 0 ? (
                                                    <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 tabular-nums">
                                                        {share}% of plan
                                                        {line.suggested_pct > 0
                                                            ? ` · suggest ${line.suggested_pct}%`
                                                            : ''}
                                                    </span>
                                                ) : null}
                                                {over ? (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-rose-700">
                                                        <AlertTriangle className="size-3" />
                                                        Over plan
                                                    </span>
                                                ) : null}
                                                {balance > 0 && days !== null && days <= 45 ? (
                                                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-800">
                                                        Due soon
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <Input
                                            type="number"
                                            min={0}
                                            className="h-9 rounded-xl"
                                            value={line.planned || ''}
                                            placeholder="Planned"
                                            onChange={(event) =>
                                                updateLine(index, {
                                                    planned: Math.max(
                                                        0,
                                                        Number(event.target.value) || 0,
                                                    ),
                                                })
                                            }
                                            onBlur={() => persist(lines)}
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            className="h-9 rounded-xl"
                                            value={line.actual || ''}
                                            placeholder="Contracted"
                                            onChange={(event) =>
                                                updateLine(index, {
                                                    actual: Math.max(
                                                        0,
                                                        Number(event.target.value) || 0,
                                                    ),
                                                })
                                            }
                                            onBlur={() => persist(lines)}
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            className="h-9 rounded-xl"
                                            value={line.paid || ''}
                                            placeholder="Paid"
                                            onChange={(event) =>
                                                updateLine(index, {
                                                    paid: Math.max(
                                                        0,
                                                        Number(event.target.value) || 0,
                                                    ),
                                                })
                                            }
                                            onBlur={() => persist(lines)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpanded(open ? null : line.id)
                                            }
                                            className="inline-flex size-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
                                            aria-label={open ? 'Collapse' : 'Expand'}
                                        >
                                            {open ? (
                                                <ChevronUp className="size-4" />
                                            ) : (
                                                <ChevronDown className="size-4" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                                        <span>
                                            Balance due{' '}
                                            <span
                                                className={cn(
                                                    'font-semibold tabular-nums',
                                                    balance > 0 ? 'text-zinc-800' : 'text-emerald-700',
                                                )}
                                            >
                                                {money(balance, currency)}
                                            </span>
                                        </span>
                                        {line.due_date ? (
                                            <span className="tabular-nums">
                                                Due {line.due_date}
                                                {days !== null
                                                    ? days < 0
                                                        ? ` · ${Math.abs(days)}d overdue`
                                                        : ` · ${days}d left`
                                                    : ''}
                                            </span>
                                        ) : null}
                                    </div>

                                    {open ? (
                                        <div className="mt-3 grid gap-2 rounded-2xl bg-zinc-50/80 p-3 sm:grid-cols-2">
                                            <label className="block text-[11px] font-semibold text-zinc-500">
                                                Vendor
                                                <Input
                                                    className="mt-1 h-9 rounded-xl bg-white"
                                                    value={line.vendor}
                                                    placeholder="Studio / caterer / venue"
                                                    onChange={(event) =>
                                                        updateLine(index, {
                                                            vendor: event.target.value,
                                                        })
                                                    }
                                                    onBlur={() => persist(lines)}
                                                />
                                            </label>
                                            <label className="block text-[11px] font-semibold text-zinc-500">
                                                Next payment due
                                                <Input
                                                    type="date"
                                                    className="mt-1 h-9 rounded-xl bg-white"
                                                    value={line.due_date}
                                                    onChange={(event) =>
                                                        updateLine(index, {
                                                            due_date: event.target.value,
                                                        })
                                                    }
                                                    onBlur={() => persist(lines)}
                                                />
                                            </label>
                                            <label className="block text-[11px] font-semibold text-zinc-500 sm:col-span-2">
                                                Notes (tips, taxes, what’s included)
                                                <Input
                                                    className="mt-1 h-9 rounded-xl bg-white"
                                                    value={line.notes}
                                                    placeholder="Deposit %, tip %, overtime, GST…"
                                                    onChange={(event) =>
                                                        updateLine(index, {
                                                            notes: event.target.value,
                                                        })
                                                    }
                                                    onBlur={() => persist(lines)}
                                                />
                                            </label>
                                            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const deposit = Math.round(
                                                            committed(line) * 0.3,
                                                        );
                                                        updateLine(
                                                            index,
                                                            {
                                                                paid: Math.max(line.paid, deposit),
                                                            },
                                                            true,
                                                        );
                                                    }}
                                                    className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-700"
                                                >
                                                    Mark ~30% deposit paid
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateLine(
                                                            index,
                                                            { paid: committed(line) },
                                                            true,
                                                        )
                                                    }
                                                    className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-700"
                                                >
                                                    Mark fully paid
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = lines.filter(
                                                            (row) => row.id !== line.id,
                                                        );
                                                        persist(
                                                            next.length
                                                                ? next
                                                                : templateForOccasion(occasion).map(
                                                                      blankFromTemplate,
                                                                  ),
                                                        );
                                                        setExpanded(null);
                                                    }}
                                                    className="ml-auto inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="size-3" />
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </li>
                            );
                        })
                    )}
                </ul>

                <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-5 py-3">
                    <button
                        type="button"
                        onClick={() =>
                            persist([
                                ...lines,
                                {
                                    id: `line-${Date.now()}`,
                                    label: 'New line',
                                    category: 'General',
                                    planned: 0,
                                    actual: 0,
                                    paid: 0,
                                    vendor: '',
                                    due_date: '',
                                    notes: '',
                                    suggested_pct: 0,
                                },
                            ])
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                        <Plus className="size-3.5" />
                        Add line
                    </button>
                    <p className="max-w-xl text-[11px] leading-relaxed text-zinc-500">{tip}</p>
                </div>
            </div>
        </section>
    );
}
