import { Lock } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export function StudioToggle({
    checked,
    onCheckedChange,
    label,
    description,
    tone = 'light',
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label: string;
    description: string;
    tone?: 'light' | 'ink';
}) {
    const labelId = useId();
    const descId = useId();

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-labelledby={labelId}
            aria-describedby={descId}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'group flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3.5 text-left transition-all duration-300',
                tone === 'light' &&
                    'bg-zinc-100/80 ring-1 ring-zinc-950/6 hover:bg-white hover:ring-zinc-950/10 hover:shadow-sm',
                tone === 'ink' &&
                    'bg-[color-mix(in_oklab,var(--pref-paper)_88%,white)] ring-1 ring-[color-mix(in_oklab,var(--pref-ink)_12%,transparent)] hover:bg-[color-mix(in_oklab,var(--pref-paper)_96%,white)]',
                checked && tone === 'light' && 'bg-white ring-zinc-900/12 shadow-sm',
                checked &&
                    tone === 'ink' &&
                    'bg-white/90 ring-[color-mix(in_oklab,var(--pref-seal)_35%,transparent)] shadow-[0_10px_28px_-18px_color-mix(in_oklab,var(--pref-ink)_45%,transparent)]',
            )}
        >
            <span className="min-w-0 flex-1">
                <span id={labelId} className="block text-[13px] font-semibold tracking-tight text-zinc-900">
                    {label}
                </span>
                <span id={descId} className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">
                    {description}
                </span>
            </span>
            <span
                aria-hidden
                className={cn(
                    'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300',
                    checked
                        ? tone === 'ink'
                            ? 'bg-[var(--pref-seal)]'
                            : 'bg-zinc-900'
                        : 'bg-zinc-300/90',
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 left-0.5 flex size-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        checked && 'translate-x-5',
                    )}
                >
                    {checked ? (
                        <Lock className="size-3 text-[var(--pref-seal,#3f3f46)] opacity-80" />
                    ) : (
                        <span className="size-1.5 rounded-full bg-zinc-300" />
                    )}
                </span>
            </span>
        </button>
    );
}
