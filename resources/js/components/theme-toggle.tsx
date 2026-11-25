import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const dark = resolvedAppearance === 'dark';

    return (
        <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label={dark ? 'Turn off dark mode' : 'Turn on dark mode'}
            title={dark ? 'Dark mode on' : 'Dark mode off'}
            onClick={() => updateAppearance(dark ? 'light' : 'dark')}
            className={cn(
                // Mobile: circular control matching menu/CTA hit targets
                'relative inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
                // sm+: classic pill switch
                'sm:h-9 sm:w-[4.25rem] sm:justify-start sm:border-2 sm:p-0.5',
                dark
                    ? 'border-zinc-950/10 bg-zinc-950 text-white sm:border-white/25 sm:bg-[#1a1628] sm:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] dark:border-white/15'
                    : 'border-zinc-950/10 bg-white text-[#ea580c] sm:border-[#2b241c]/15 sm:bg-[#fff7e8] sm:shadow-[inset_0_0_0_1px_rgba(43,36,28,0.06)]',
                className,
            )}
        >
            <Sun
                strokeWidth={2.5}
                className={cn(
                    'pointer-events-none absolute top-1/2 left-1.5 hidden h-4 w-4 -translate-y-1/2 text-[#c2410c] transition-opacity duration-200 sm:block',
                    dark ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden
            />
            <Moon
                strokeWidth={2.5}
                className={cn(
                    'pointer-events-none absolute top-1/2 right-1.5 hidden h-4 w-4 -translate-y-1/2 text-[#1e3a8a] transition-opacity duration-200 sm:block',
                    dark ? 'opacity-0' : 'opacity-100',
                )}
                aria-hidden
            />
            <span
                className={cn(
                    'relative z-10 grid place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    // Mobile: fill the circle; sm+: sliding knob
                    'size-full sm:size-7 sm:shadow-md',
                    dark
                        ? 'bg-transparent text-white sm:translate-x-[2.15rem] sm:bg-[#0b0a12] sm:ring-1 sm:ring-white/30'
                        : 'bg-transparent text-[#ea580c] sm:translate-x-0 sm:bg-white sm:ring-1 sm:ring-[#ea580c]/30',
                )}
            >
                {dark ? (
                    <Moon className="size-4 fill-white text-white sm:size-3.5" strokeWidth={2.25} aria-hidden />
                ) : (
                    <Sun className="size-4 fill-[#ea580c] text-[#ea580c] sm:size-3.5" strokeWidth={2.25} aria-hidden />
                )}
            </span>
        </button>
    );
}
