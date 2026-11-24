import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string; hint: string }[] = [
        { value: 'light', icon: Sun, label: 'Light', hint: 'Bright studio canvas' },
        { value: 'dark', icon: Moon, label: 'Dark', hint: 'Low-light editing' },
        { value: 'system', icon: Monitor, label: 'System', hint: 'Match device setting' },
    ];

    return (
        <div
            className={cn(
                'grid gap-2 sm:grid-cols-3',
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label, hint }) => {
                const active = appearance === value;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition sm:flex-col sm:items-start sm:gap-2.5 sm:px-4 sm:py-4',
                            active
                                ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-950/15 dark:border-white dark:bg-white dark:text-zinc-950'
                                : 'border-zinc-950/8 bg-zinc-50/80 text-zinc-700 hover:border-zinc-950/15 hover:bg-white dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:bg-white/5',
                        )}
                    >
                        <span
                            className={cn(
                                'grid size-9 place-items-center rounded-xl',
                                active
                                    ? 'bg-white/15 dark:bg-zinc-950/10'
                                    : 'bg-white ring-1 ring-zinc-950/5 dark:bg-zinc-950 dark:ring-white/10',
                            )}
                        >
                            <Icon className="size-4" aria-hidden />
                        </span>
                        <span>
                            <span className="block text-sm font-semibold">{label}</span>
                            <span
                                className={cn(
                                    'mt-0.5 block text-xs',
                                    active ? 'text-white/70 dark:text-zinc-600' : 'text-zinc-500',
                                )}
                            >
                                {hint}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
