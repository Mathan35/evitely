import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type StudioFilterOption = {
    value: string;
    label: string;
    hint?: string;
    badge?: string;
};

/** Advanced filter select used on My Events, Analytics, and Guests. */
export function StudioFilterSelect({
    value,
    onValueChange,
    options,
    placeholder = 'Choose…',
    label,
    className,
    triggerClassName,
    wide = false,
}: {
    value: string;
    onValueChange: (value: string) => void;
    options: StudioFilterOption[];
    placeholder?: string;
    label?: string;
    className?: string;
    triggerClassName?: string;
    wide?: boolean;
}) {
    const selected = options.find((option) => option.value === value);

    return (
        <label className={cn('flex min-w-0 flex-col gap-1.5', className)}>
            {label ? (
                <span className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                    {label}
                </span>
            ) : null}
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger
                    className={cn(
                        'h-11 w-full rounded-2xl border-zinc-200/90 bg-white/90 px-3.5 text-left text-[13px] font-semibold text-zinc-900 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.04] transition hover:bg-white focus:ring-2 focus:ring-emerald-500/25 data-[size=default]:h-11 dark:border-white/10 dark:bg-zinc-950/70 dark:text-white',
                        // Hide auto ItemText mirror (hints/badges); we paint a clean label+badge face.
                        '*:data-[slot=select-value]:sr-only *:data-[slot=select-value]:absolute *:data-[slot=select-value]:size-px *:data-[slot=select-value]:overflow-hidden *:data-[slot=select-value]:whitespace-nowrap *:data-[slot=select-value]:border-0 *:data-[slot=select-value]:p-0 *:data-[slot=select-value]:[clip:rect(0,0,0,0)]',
                        // Keep a stable width so Format/Status triggers align in a row
                        wide ? 'sm:w-[16rem]' : 'sm:w-[13.5rem]',
                        triggerClassName,
                    )}
                >
                    <SelectValue placeholder={placeholder} />
                    <span
                        aria-hidden
                        className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
                    >
                        <span className="min-w-0 flex-1 truncate text-left leading-none">
                            {selected?.label ?? placeholder}
                        </span>
                        {selected?.badge ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-emerald-800 tabular-nums ring-1 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20">
                                {selected.badge}
                            </span>
                        ) : null}
                    </span>
                </SelectTrigger>
                <SelectContent
                    align="start"
                    position="popper"
                    className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border-zinc-200/80 bg-white/95 p-1.5 shadow-[0_24px_60px_-28px_rgba(24,24,27,0.45)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/95"
                >
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            textValue={option.label}
                            className="cursor-pointer rounded-xl py-2.5 pr-9 pl-3 text-[13px] font-medium focus:bg-emerald-50 focus:text-emerald-950 data-[state=checked]:bg-emerald-50/80 dark:focus:bg-emerald-500/15 dark:focus:text-emerald-50 dark:data-[state=checked]:bg-emerald-500/10"
                        >
                            <span className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                                <span className="min-w-0">
                                    <span className="block truncate leading-5">{option.label}</span>
                                    {option.hint ? (
                                        <span className="mt-0.5 block truncate text-[11px] leading-4 font-normal text-zinc-400">
                                            {option.hint}
                                        </span>
                                    ) : null}
                                </span>
                                {option.badge ? (
                                    <span className="shrink-0 self-center rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-zinc-600 tabular-nums dark:bg-white/10 dark:text-zinc-300">
                                        {option.badge}
                                    </span>
                                ) : null}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </label>
    );
}
