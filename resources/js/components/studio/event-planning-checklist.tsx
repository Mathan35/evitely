import { router } from '@inertiajs/react';
import { Check, ListChecks } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export type PlanningItem = {
    id: string;
    label: string;
    done: boolean;
};

const DEFAULT_ITEMS: PlanningItem[] = [
    { id: 'venue', label: 'Confirm venue & floor plan', done: false },
    { id: 'catering', label: 'Lock catering headcount & menu', done: false },
    { id: 'invites', label: 'Send invitations', done: false },
    { id: 'rsvp', label: 'Close RSVP & chase pending', done: false },
    { id: 'seating', label: 'Finalize seating chart', done: false },
    { id: 'timeline', label: 'Share day-of timeline with vendors', done: false },
    { id: 'print', label: 'Print QR / programs / place cards', done: false },
];

function parseChecklist(raw: string | null | undefined): PlanningItem[] {
    if (!raw?.trim()) {
        return DEFAULT_ITEMS.map((item) => ({ ...item }));
    }
    try {
        const parsed = JSON.parse(raw) as PlanningItem[];
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return DEFAULT_ITEMS.map((item) => ({ ...item }));
        }
        return parsed
            .filter((row) => row && typeof row === 'object' && typeof row.label === 'string')
            .map((row, index) => ({
                id: String(row.id || `item-${index}`),
                label: String(row.label).trim() || `Task ${index + 1}`,
                done: Boolean(row.done),
            }));
    } catch {
        return DEFAULT_ITEMS.map((item) => ({ ...item }));
    }
}

/** Optional host-only planning checklist on Manage → Overview. */
export function EventPlanningChecklist({
    eventId,
    details,
}: {
    eventId: number;
    details?: Record<string, string | null> | null;
}) {
    const enabled = ['1', 'true', 'yes', 'on'].includes(
        String(details?.planning_checklist_enabled ?? '').trim().toLowerCase(),
    );
    const [items, setItems] = useState<PlanningItem[]>(() =>
        parseChecklist(details?.planning_checklist_json ?? null),
    );
    const [saving, setSaving] = useState(false);

    const doneCount = useMemo(() => items.filter((item) => item.done).length, [items]);

    function persist(next: PlanningItem[], turnOn = enabled): void {
        setItems(next);
        setSaving(true);
        router.put(
            `/events/${eventId}`,
            {
                details: {
                    ...(details ?? {}),
                    planning_checklist_enabled: turnOn ? '1' : '0',
                    planning_checklist_json: JSON.stringify(next),
                },
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSaving(false),
            },
        );
    }

    if (!enabled) {
        return (
            <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 mt-3 [animation-delay:200ms]">
                <button
                    type="button"
                    onClick={() => persist(items, true)}
                    className="flex w-full items-center gap-3 rounded-[1.35rem] bg-white/90 px-4 py-4 text-left shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05] transition hover:bg-white"
                >
                    <span className="grid size-10 place-items-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                        <ListChecks className="size-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-zinc-950">Planning checklist</span>
                        <span className="mt-0.5 block text-[12px] text-zinc-500">
                            Optional host list — venue, catering, invites, print day. Tap to enable.
                        </span>
                    </span>
                </button>
            </section>
        );
    }

    return (
        <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 mt-3 [animation-delay:200ms]">
            <div className="overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05]">
                <div className="flex flex-wrap items-end justify-between gap-2 border-b border-zinc-100 px-5 py-4">
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                            Host only
                        </p>
                        <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950">Planning checklist</h2>
                        <p className="mt-1 text-[12px] text-zinc-500">
                            {doneCount}/{items.length} done{saving ? ' · saving…' : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => persist(items, false)}
                        className="text-[12px] font-semibold text-zinc-500 hover:text-zinc-800"
                    >
                        Hide
                    </button>
                </div>
                <ul className="divide-y divide-zinc-100">
                    {items.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                onClick={() =>
                                    persist(
                                        items.map((row) =>
                                            row.id === item.id ? { ...row, done: !row.done } : row,
                                        ),
                                    )
                                }
                                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-zinc-50/80"
                            >
                                <span
                                    className={cn(
                                        'grid size-7 place-items-center rounded-full ring-1 transition',
                                        item.done
                                            ? 'bg-emerald-600 text-white ring-emerald-600'
                                            : 'bg-white text-transparent ring-zinc-300',
                                    )}
                                >
                                    <Check className="size-3.5" />
                                </span>
                                <span
                                    className={cn(
                                        'text-[14px]',
                                        item.done ? 'text-zinc-400 line-through' : 'font-medium text-zinc-900',
                                    )}
                                >
                                    {item.label}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
