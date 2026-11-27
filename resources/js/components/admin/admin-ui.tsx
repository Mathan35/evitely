import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AdminPageHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description?: string;
    actions?: ReactNode;
}) {
    return (
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="min-w-0">
                <p className="hidden text-[10px] font-semibold tracking-[0.16em] text-zinc-400 uppercase md:block">
                    Admin
                </p>
                <h1 className="font-serif text-[1.65rem] leading-tight tracking-tight text-zinc-950 sm:mt-1 sm:text-3xl">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-1 max-w-2xl text-[13px] leading-5 text-zinc-500">{description}</p>
                ) : null}
            </div>
            {actions ? (
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>
            ) : null}
        </div>
    );
}

export function AdminCard({
    children,
    className,
    title,
}: {
    children: ReactNode;
    className?: string;
    title?: string;
}) {
    return (
        <section
            className={cn(
                'overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_0_rgba(24,24,27,0.03)]',
                className,
            )}
        >
            {title ? (
                <div className="border-b border-zinc-100 px-3.5 py-3 sm:px-4">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                        {title}
                    </p>
                </div>
            ) : null}
            {children}
        </section>
    );
}

export function AdminStat({ label, value }: { label: string; value: string | number }) {
    return (
        <AdminCard className="px-3.5 py-3 sm:px-4">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                {label}
            </p>
            <p className="mt-1 truncate text-base font-semibold text-zinc-950 sm:text-lg">{value}</p>
        </AdminCard>
    );
}

export function AdminTable({
    headers = [],
    rows = [],
}: {
    headers?: string[];
    rows?: ReactNode[][];
}) {
    const safeHeaders = Array.isArray(headers) ? headers : [];
    const safeRows = Array.isArray(rows) ? rows : [];

    return (
        <div className="-mx-0 overflow-x-auto overscroll-x-contain">
            <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-zinc-100 bg-zinc-50/80 text-[10px] tracking-[0.12em] text-zinc-400 uppercase">
                    <tr>
                        {safeHeaders.map((h) => (
                            <th key={h} className="px-3 py-2.5 font-semibold whitespace-nowrap sm:px-4">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {safeRows.map((cells, i) => (
                        <tr key={i} className="hover:bg-zinc-50/60">
                            {(Array.isArray(cells) ? cells : [cells]).map((cell, j) => (
                                <td
                                    key={j}
                                    className="px-3 py-2.5 align-middle whitespace-nowrap text-zinc-700 sm:px-4"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {safeRows.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-zinc-400">No rows.</p>
            ) : null}
        </div>
    );
}

/** Lightweight multi-series line chart (SVG). */
export function AdminLineChart({
    series,
    height = 160,
}: {
    series: Array<{ key: string; label: string; color: string; points: Array<{ date: string; value: number }> }>;
    height?: number;
}) {
    const width = 640;
    const pad = 24;
    const all = series.flatMap((s) => s.points.map((p) => p.value));
    const max = Math.max(1, ...all);
    const len = Math.max(1, series[0]?.points.length ?? 1);

    function x(i: number): number {
        return pad + (i / Math.max(1, len - 1)) * (width - pad * 2);
    }
    function y(v: number): number {
        return height - pad - (v / max) * (height - pad * 2);
    }

    return (
        <div className="w-full overflow-x-auto px-1 py-3 sm:px-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full min-w-[280px] sm:h-40 sm:min-w-[320px]">
                {series.map((s) => {
                    const d = s.points
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
                        .join(' ');
                    return <path key={s.key} d={d} fill="none" stroke={s.color} strokeWidth="2" />;
                })}
            </svg>
            <div className="mt-1 flex flex-wrap gap-3 px-2 text-[11px] text-zinc-500">
                {series.map((s) => (
                    <span key={s.key} className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: s.color }} />
                        {s.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function AdminBarChart({
    items,
    valueKey = 'count',
    labelKey = 'label',
}: {
    items: Array<Record<string, string | number>>;
    valueKey?: string;
    labelKey?: string;
}) {
    const max = Math.max(1, ...items.map((i) => Number(i[valueKey] || 0)));
    return (
        <div className="space-y-2 px-3.5 py-3 sm:px-4">
            {items.map((item) => {
                const label = String(item[labelKey] ?? '');
                const value = Number(item[valueKey] || 0);
                return (
                    <div
                        key={label}
                        className="grid grid-cols-[minmax(0,5.5rem)_1fr_2.5rem] items-center gap-2 text-[12px] sm:grid-cols-[7rem_1fr_3rem]"
                    >
                        <span className="truncate text-zinc-500">{label}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                            <div
                                className="h-full rounded-full bg-zinc-900"
                                style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
                            />
                        </div>
                        <span className="text-right font-medium text-zinc-800">{value}</span>
                    </div>
                );
            })}
            {items.length === 0 ? <p className="text-[13px] text-zinc-400">No data.</p> : null}
        </div>
    );
}

/** Shared mobile-friendly filter toolbar shell. */
export function AdminFilters({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'mb-4 grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200 bg-white p-3 sm:flex sm:flex-wrap sm:items-end',
                className,
            )}
        >
            {children}
        </div>
    );
}
