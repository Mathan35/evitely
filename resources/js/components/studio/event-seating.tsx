import { router, useForm } from '@inertiajs/react';
import { Armchair, Plus, Printer, Sparkles, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { WeddingGuestRow } from '@/types/wedding';

export type EventTableRow = {
    id: number;
    name: string;
    capacity: number;
    sort_order?: number;
    seated?: number;
};

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function EventSeating({
    eventId,
    tables = [],
    guests = [],
}: {
    eventId: number;
    tables?: EventTableRow[] | null;
    guests?: WeddingGuestRow[] | null;
}) {
    const tableRows = Array.isArray(tables) ? tables : [];
    const guestRows = Array.isArray(guests) ? guests : [];
    const [busy, setBusy] = useState(false);
    const [assignKey, setAssignKey] = useState(0);
    const form = useForm({ name: '', capacity: 8 });

    const attending = useMemo(
        () =>
            guestRows.filter(
                (guest) => guest.rsvp_status === 'attending' || guest.rsvp_status === 'pending',
            ),
        [guestRows],
    );

    const occupancy = useMemo(() => {
        const map = new Map<number, number>();
        for (const table of tableRows) {
            map.set(table.id, 0);
        }
        for (const guest of attending) {
            if (!guest.table_id) {
                continue;
            }
            map.set(
                guest.table_id,
                (map.get(guest.table_id) ?? 0) + Math.max(1, guest.number_of_guests || 1),
            );
        }
        return map;
    }, [attending, tableRows]);

    const unassigned = attending.filter((guest) => !guest.table_id);
    const seatedTotal = attending.length - unassigned.length;

    function assign(guestId: number, tableId: number | null): void {
        setBusy(true);
        router.post(
            `/events/${eventId}/tables/assign`,
            { guest_id: guestId, table_id: tableId },
            {
                preserveScroll: true,
                onFinish: () => {
                    setBusy(false);
                    setAssignKey((value) => value + 1);
                },
            },
        );
    }

    function openPrintWindow(title: string, bodyHtml: string, styles: string): void {
        const html = `<!doctype html><html><head><title>${title}</title>
          <style>${styles}</style></head><body>
          ${bodyHtml}
          <script>window.onload=()=>{window.print()}</script></body></html>`;
        const win = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');
        if (!win) {
            return;
        }
        win.document.write(html);
        win.document.close();
    }

    function printChart(): void {
        const rows = tableRows
            .map((table) => {
                const seated = attending.filter((guest) => guest.table_id === table.id);
                const seats = seated.reduce((sum, guest) => sum + Math.max(1, guest.number_of_guests || 1), 0);
                const people =
                    seated.length === 0
                        ? '<p style="color:#71717a;font-size:13px">No guests seated yet</p>'
                        : `<ul style="margin:8px 0 0;padding:0;list-style:none">${seated
                              .map(
                                  (guest) =>
                                      `<li style="padding:4px 0;border-bottom:1px solid #f4f4f5;font-size:14px"><strong>${guest.name}</strong>${
                                          guest.number_of_guests > 1 ? ` · party of ${guest.number_of_guests}` : ''
                                      }</li>`,
                              )
                              .join('')}</ul>`;
                return `<section style="break-inside:avoid;margin:0 0 18px;padding:14px 16px;border:1px solid #e4e4e7;border-radius:16px">
                  <div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline">
                    <h2 style="margin:0;font:600 20px/1.2 Georgia,serif">${table.name}</h2>
                    <span style="font:600 12px/1 system-ui;color:#71717a">${seats}/${table.capacity} seats</span>
                  </div>
                  ${people}
                </section>`;
            })
            .join('');
        const open = unassigned
            .map(
                (guest) =>
                    `<li style="padding:4px 0;font-size:14px">${guest.name}${
                        guest.number_of_guests > 1 ? ` · party of ${guest.number_of_guests}` : ''
                    }</li>`,
            )
            .join('');
        openPrintWindow(
            'Seating chart',
            `<h1>Seating chart</h1>
          <p class="meta">${seatedTotal} seated · ${unassigned.length} unassigned · ${tableRows.length} tables</p>
          ${rows || '<p>Add tables to print a chart.</p>'}
          ${
              unassigned.length
                  ? `<section style="margin-top:24px"><h2 style="font:600 18px Georgia,serif">Unassigned</h2><ul style="padding-left:18px">${open}</ul></section>`
                  : ''
          }`,
            `body{font-family:system-ui,sans-serif;color:#18181b;margin:24px;max-width:720px}
          h1{font:600 28px/1.15 Georgia,serif;margin:0 0 6px}p.meta{color:#71717a;margin:0 0 22px;font-size:13px}
          @media print{body{margin:12mm}}`,
        );
    }

    function printPlaceCards(): void {
        const seated = attending.filter((guest) => guest.table_id);
        if (seated.length === 0) {
            return;
        }
        const tableName = (id: number | null | undefined) =>
            tableRows.find((table) => table.id === id)?.name || 'Table';
        const cards = seated
            .map((guest) => {
                const table = tableName(guest.table_id);
                return `<article class="card">
                  <p class="table">${table}</p>
                  <h2 class="name">${guest.name}</h2>
                  ${
                      guest.number_of_guests > 1
                          ? `<p class="party">Party of ${guest.number_of_guests}</p>`
                          : '<p class="party">&nbsp;</p>'
                  }
                </article>`;
            })
            .join('');
        openPrintWindow(
            'Place cards',
            `<h1 class="sr">Place cards</h1><div class="sheet">${cards}</div>`,
            `body{font-family:Georgia,serif;color:#18181b;margin:12mm}
            .sr{position:absolute;left:-9999px}
            .sheet{display:grid;grid-template-columns:repeat(2,1fr);gap:8mm}
            .card{break-inside:avoid;min-height:48mm;padding:10mm 8mm;border:1px solid #d4d4d8;border-radius:4mm;text-align:center;display:flex;flex-direction:column;justify-content:center}
            .table{margin:0;font:600 11px/1.2 system-ui,sans-serif;letter-spacing:0.14em;text-transform:uppercase;color:#71717a}
            .name{margin:10px 0 0;font:600 26px/1.15 Georgia,serif}
            .party{margin:8px 0 0;font:400 12px/1.3 system-ui,sans-serif;color:#52525b}
            @media print{.card{border-color:#a1a1aa}}`,
        );
    }

    return (
        <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
            <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_60px_-40px_rgba(24,24,27,0.45)] ring-1 ring-zinc-950/[0.06]">
                <div className="relative border-b border-zinc-100 px-5 py-6 sm:px-7">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_200px_at_100%_0%,rgba(16,185,129,0.12),transparent_55%)]"
                    />
                    <div className="relative space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 max-w-lg">
                                <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-700/80 uppercase">
                                    Reception floor
                                </p>
                                <h2 className="mt-1.5 font-serif text-[1.75rem] leading-none tracking-tight text-zinc-950 sm:text-[2rem]">
                                    Seating
                                </h2>
                                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                                    Build tables, then seat each party — or auto-assign by group and party
                                    size. Capacity counts every guest in the party.
                                </p>
                            </div>
                            <div className="flex w-full gap-2 sm:w-auto">
                                <div className="min-w-0 flex-1 rounded-2xl bg-zinc-950 px-3.5 py-2.5 text-white sm:flex-none">
                                    <p className="text-[10px] font-semibold tracking-[0.14em] text-white/55 uppercase">
                                        Seated
                                    </p>
                                    <p className="mt-0.5 font-sans text-2xl font-semibold tabular-nums leading-none">
                                        {seatedTotal}
                                        <span className="text-base font-medium text-white/45">
                                            /{attending.length}
                                        </span>
                                    </p>
                                </div>
                                <div className="min-w-0 flex-1 rounded-2xl bg-emerald-50 px-3.5 py-2.5 text-emerald-950 ring-1 ring-emerald-200/70 sm:flex-none">
                                    <p className="text-[10px] font-semibold tracking-[0.14em] text-emerald-700/70 uppercase">
                                        Tables
                                    </p>
                                    <p className="mt-0.5 font-sans text-2xl font-semibold tabular-nums leading-none">
                                        {tableRows.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                            <button
                                type="button"
                                onClick={() => {
                                    if (tableRows.length === 0 || busy) {
                                        return;
                                    }
                                    setBusy(true);
                                    router.post(
                                        `/events/${eventId}/tables/auto-assign`,
                                        { reset: false },
                                        {
                                            preserveScroll: true,
                                            onFinish: () => setBusy(false),
                                        },
                                    );
                                }}
                                disabled={tableRows.length === 0 || unassigned.length === 0 || busy}
                                className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-700 px-3 text-[12px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-40 sm:px-3.5"
                            >
                                <Sparkles className="size-3.5 shrink-0" />
                                Auto-assign
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (tableRows.length === 0 || busy) {
                                        return;
                                    }
                                    if (
                                        !window.confirm(
                                            'Clear all seats and re-assign everyone by group and party size?',
                                        )
                                    ) {
                                        return;
                                    }
                                    setBusy(true);
                                    router.post(
                                        `/events/${eventId}/tables/auto-assign`,
                                        { reset: true },
                                        {
                                            preserveScroll: true,
                                            onFinish: () => setBusy(false),
                                        },
                                    );
                                }}
                                disabled={tableRows.length === 0 || attending.length === 0 || busy}
                                className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 sm:px-3.5"
                            >
                                Re-seat all
                            </button>
                            <button
                                type="button"
                                onClick={printChart}
                                disabled={tableRows.length === 0}
                                className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 sm:px-3.5"
                            >
                                <Printer className="size-3.5 shrink-0" />
                                Print chart
                            </button>
                            <button
                                type="button"
                                onClick={printPlaceCards}
                                disabled={seatedTotal === 0}
                                className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 sm:px-3.5"
                            >
                                <Printer className="size-3.5 shrink-0" />
                                Place cards
                            </button>
                        </div>
                    </div>
                </div>

                <form
                    className="grid gap-3 border-b border-zinc-100 bg-zinc-50/60 px-5 py-4 sm:grid-cols-[1fr_7rem_auto] sm:items-end sm:px-7"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!form.data.name.trim()) {
                            return;
                        }
                        form.post(`/events/${eventId}/tables`, {
                            preserveScroll: true,
                            onSuccess: () => form.reset('name'),
                        });
                    }}
                >
                    <label className="grid gap-1.5">
                        <span className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                            Table name
                        </span>
                        <Input
                            className="h-11 rounded-2xl border-zinc-200 bg-white shadow-sm"
                            placeholder="Head table, Table 3…"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                        />
                    </label>
                    <label className="grid gap-1.5">
                        <span className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                            Seats
                        </span>
                        <Input
                            type="number"
                            min={1}
                            max={50}
                            className="h-11 rounded-2xl border-zinc-200 bg-white shadow-sm"
                            value={form.data.capacity}
                            onChange={(event) => form.setData('capacity', Number(event.target.value) || 8)}
                        />
                    </label>
                    <Button
                        type="submit"
                        disabled={form.processing || !form.data.name.trim()}
                        className="h-11 rounded-full bg-zinc-950 px-5 text-white shadow-lg shadow-zinc-950/20 hover:bg-zinc-800"
                    >
                        <Plus className="mr-1.5 size-3.5" />
                        Add table
                    </Button>
                </form>

                {tableRows.length === 0 ? (
                    <div className="px-5 py-14 text-center sm:px-7">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-zinc-100 text-zinc-400 ring-1 ring-zinc-950/5">
                            <Armchair className="size-6" />
                        </div>
                        <p className="mt-5 font-serif text-3xl text-zinc-950">No tables yet</p>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                            Add your first table, then assign unseated guests from the list below.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                        {tableRows.map((table) => {
                            const seatedGuests = attending.filter((guest) => guest.table_id === table.id);
                            const seated = occupancy.get(table.id) ?? 0;
                            const remaining = Math.max(0, table.capacity - seated);
                            const over = seated > table.capacity;
                            const fill = Math.min(100, Math.round((seated / Math.max(1, table.capacity)) * 100));

                            return (
                                <div
                                    key={table.id}
                                    className="group relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-white to-zinc-50 p-4 ring-1 ring-zinc-950/8 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-950">
                                                {table.name}
                                            </p>
                                            <p
                                                className={cn(
                                                    'mt-1 text-[12px] font-medium tabular-nums',
                                                    over ? 'text-rose-600' : 'text-zinc-500',
                                                )}
                                            >
                                                {seated} of {table.capacity} seats
                                                {!over ? ` · ${remaining} open` : ' · over capacity'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() =>
                                                router.delete(`/events/${eventId}/tables/${table.id}`, {
                                                    preserveScroll: true,
                                                })
                                            }
                                            className="rounded-full p-2 text-zinc-400 opacity-70 transition hover:bg-white hover:text-rose-600 hover:opacity-100"
                                            aria-label={`Remove ${table.name}`}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200/80">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all',
                                                over
                                                    ? 'bg-gradient-to-r from-rose-500 to-orange-400'
                                                    : 'bg-gradient-to-r from-emerald-500 to-teal-400',
                                            )}
                                            style={{ width: `${Math.max(fill, seated > 0 ? 8 : 0)}%` }}
                                        />
                                    </div>
                                    <ul className="mt-3 space-y-2">
                                        {seatedGuests.length === 0 ? (
                                            <li className="rounded-xl border border-dashed border-zinc-200 px-3 py-3 text-center text-[12px] text-zinc-400">
                                                Empty — assign from the list below
                                            </li>
                                        ) : (
                                            seatedGuests.map((guest) => (
                                                <li
                                                    key={guest.id}
                                                    className="flex items-center justify-between gap-2 rounded-xl bg-white/90 px-2.5 py-2 ring-1 ring-zinc-950/5"
                                                >
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-[11px] font-semibold text-white">
                                                            {initials(guest.name)}
                                                        </span>
                                                        <span className="min-w-0 truncate text-[13px] font-medium text-zinc-800">
                                                            {guest.name}
                                                            <span className="font-normal text-zinc-400">
                                                                {' '}
                                                                · {guest.number_of_guests || 1}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => assign(guest.id, null)}
                                                        className="shrink-0 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900"
                                                    >
                                                        Unseat
                                                    </button>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="border-t border-zinc-100 bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_40%)] px-5 py-5 sm:px-7">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                Unassigned
                            </p>
                            <p className="mt-1 text-sm text-zinc-500">
                                {unassigned.length === 0
                                    ? 'Everyone eligible is seated.'
                                    : `${unassigned.length} ${unassigned.length === 1 ? 'party' : 'parties'} waiting for a table.`}
                            </p>
                        </div>
                        {unassigned.length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200/80">
                                <Users className="size-3.5" />
                                Needs seating
                            </span>
                        ) : null}
                    </div>

                    {unassigned.length === 0 ? null : (
                        <ul className="mt-4 space-y-2">
                            {unassigned.map((guest) => {
                                const party = Math.max(1, guest.number_of_guests || 1);

                                return (
                                    <li
                                        key={`${guest.id}-${assignKey}`}
                                        className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-950/6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-sm font-semibold text-white shadow-md">
                                                {initials(guest.name)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-[14px] font-semibold text-zinc-950">
                                                    {guest.name}
                                                </p>
                                                <p className="mt-0.5 text-[12px] text-zinc-500 capitalize">
                                                    {guest.rsvp_status}
                                                    <span className="text-zinc-300"> · </span>
                                                    party of {party}
                                                    {guest.group ? (
                                                        <>
                                                            <span className="text-zinc-300"> · </span>
                                                            {guest.group}
                                                        </>
                                                    ) : null}
                                                </p>
                                            </div>
                                        </div>

                                        {tableRows.length > 0 ? (
                                            <Select
                                                disabled={busy}
                                                onValueChange={(value) => {
                                                    if (!value) {
                                                        return;
                                                    }
                                                    assign(guest.id, Number(value));
                                                }}
                                            >
                                                <SelectTrigger
                                                    size="default"
                                                    className="h-11 w-full max-w-full rounded-2xl border-zinc-200 bg-zinc-50 px-3.5 text-[13px] font-semibold text-zinc-900 shadow-none ring-0 focus-visible:ring-2 focus-visible:ring-emerald-500/30 sm:w-[16rem] sm:max-w-[16rem]"
                                                >
                                                    <SelectValue placeholder="Choose a table…" />
                                                </SelectTrigger>
                                                <SelectContent
                                                    align="end"
                                                    className="min-w-[16rem] rounded-2xl border-zinc-200 p-1.5 shadow-xl"
                                                >
                                                    {tableRows.map((table) => {
                                                        const seated = occupancy.get(table.id) ?? 0;
                                                        const remaining = table.capacity - seated;
                                                        const fits = remaining >= party;
                                                        const label = fits
                                                            ? `${remaining} open`
                                                            : remaining <= 0
                                                              ? 'Full'
                                                              : `Only ${remaining} left`;

                                                        return (
                                                            <SelectItem
                                                                key={table.id}
                                                                value={String(table.id)}
                                                                disabled={!fits}
                                                                className="rounded-xl py-2.5 pr-8 pl-2 text-[13px]"
                                                            >
                                                                <span className="flex w-full items-center justify-between gap-4">
                                                                    <span className="font-semibold text-zinc-900">
                                                                        {table.name}
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            'text-[11px] font-semibold tabular-nums',
                                                                            fits
                                                                                ? 'text-emerald-700'
                                                                                : 'text-zinc-400',
                                                                        )}
                                                                    >
                                                                        {label}
                                                                    </span>
                                                                </span>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <p className="text-[12px] font-medium text-zinc-400">
                                                Add a table first
                                            </p>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
