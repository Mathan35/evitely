import { router } from '@inertiajs/react';
import { CalendarRange, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

type Preset = {
    id: string;
    name: string;
    description: string;
    moments: number;
};

/** Wedding / bridal occasions only — Indian multi-day packs do not apply to birthday etc. */
export function isCeremonyPackOccasion(occasion?: string | null): boolean {
    const slug = (occasion || '').trim().toLowerCase().replace(/_/g, '-');
    if (!slug) {
        return true;
    }
    return (
        slug.includes('wedding') ||
        slug.includes('bridal') ||
        slug.includes('engagement') ||
        slug === 'mehendi' ||
        slug === 'sangeet'
    );
}

export function IndianItineraryPacks({
    eventId,
    presets,
    appliedPackId = null,
    occasion = null,
}: {
    eventId: number;
    presets: Preset[];
    /** Last applied pack id from event details (`itinerary_pack_id`). */
    appliedPackId?: string | null;
    occasion?: string | null;
}) {
    const [open, setOpen] = useState(false);
    const [applyingId, setApplyingId] = useState<string | null>(null);
    const [pending, setPending] = useState<Preset | null>(null);
    const busy = applyingId !== null;

    const visible = useMemo(
        () => (isCeremonyPackOccasion(occasion) ? presets : []),
        [occasion, presets],
    );

    const applied = useMemo(() => {
        const id = (appliedPackId || '').trim();
        if (!id) {
            return null;
        }
        return visible.find((p) => p.id === id) ?? null;
    }, [appliedPackId, visible]);

    if (!visible.length) {
        return null;
    }

    function confirmApply(): void {
        if (!pending) {
            return;
        }
        const presetId = pending.id;
        setApplyingId(presetId);
        setPending(null);
        router.post(
            `/events/${eventId}/events/apply-itinerary`,
            { preset: presetId, replace: true },
            {
                preserveScroll: true,
                onFinish: () => setApplyingId(null),
            },
        );
    }

    return (
        <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 mt-3 [animation-delay:160ms]">
            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex w-full items-center gap-3 rounded-[1.35rem] bg-white/90 px-4 py-4 text-left shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05] transition hover:bg-white"
                >
                    <span className="grid size-10 place-items-center rounded-2xl bg-amber-50 text-amber-800 ring-1 ring-amber-100">
                        <CalendarRange className="size-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-zinc-950">Ceremony pack</span>
                        <span className="mt-0.5 block text-[12px] text-zinc-500">
                            {applied
                                ? `${applied.name} applied — tap to change or re-apply.`
                                : 'One-tap Indian itinerary for this wedding. Tap to open.'}
                        </span>
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-zinc-400" />
                </button>
            ) : (
                <div className="overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05]">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-100 px-5 py-4">
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                This wedding only
                            </p>
                            <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950">
                                Ceremony pack
                            </h2>
                            <p className="mt-1 max-w-xl text-[12px] text-zinc-500">
                                Applies to this event’s schedule — not your other events. Mehendi, haldi,
                                ceremony, reception in one click, then editable.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-zinc-500 hover:text-zinc-800"
                        >
                            Close
                            <ChevronDown className="size-3.5 rotate-180" />
                        </button>
                    </div>

                    <ul className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
                        {visible.map((preset) => {
                            const isApplied = applied?.id === preset.id;
                            return (
                                <li
                                    key={preset.id}
                                    className={cn(
                                        'flex flex-col justify-between rounded-2xl border p-3.5',
                                        isApplied
                                            ? 'border-emerald-200 bg-emerald-50/70'
                                            : 'border-zinc-200 bg-zinc-50/80',
                                    )}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-[14px] font-semibold text-zinc-950">
                                                {preset.name}
                                            </p>
                                            {isApplied ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-800 uppercase">
                                                    <Check className="size-3" />
                                                    Applied
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                                            {preset.description}
                                        </p>
                                        <p className="mt-2 text-[11px] font-medium text-zinc-400">
                                            {preset.moments} moments
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant={isApplied ? 'secondary' : 'outline'}
                                        className="mt-3 h-9 rounded-full"
                                        disabled={busy}
                                        onClick={() => setPending(preset)}
                                    >
                                        {applyingId === preset.id ? (
                                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                        ) : null}
                                        {isApplied ? 'Re-apply pack' : 'Apply pack'}
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <ConfirmDialog
                open={pending !== null}
                onOpenChange={(next) => {
                    if (!next && !busy) {
                        setPending(null);
                    }
                }}
                title={
                    pending
                        ? `Apply “${pending.name}”?`
                        : 'Apply ceremony pack?'
                }
                description={
                    pending ? (
                        <>
                            This replaces the current schedule on <strong>this event only</strong> with{' '}
                            {pending.moments} moments. Your other events are untouched. You can still edit
                            each moment after.
                        </>
                    ) : undefined
                }
                confirmLabel={applied?.id === pending?.id ? 'Re-apply pack' : 'Apply pack'}
                cancelLabel="Cancel"
                tone="default"
                loading={busy}
                onConfirm={confirmApply}
            />
        </section>
    );
}
