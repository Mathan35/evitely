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
                'relative inline-flex h-8 w-[3.75rem] shrink-0 items-center rounded-full border-2 p-0.5 transition-colors duration-300 sm:h-9 sm:w-[4.25rem]',
                dark
                    ? 'border-white/25 bg-[#1a1628] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                    : 'border-[#2b241c]/15 bg-[#fff7e8] shadow-[inset_0_0_0_1px_rgba(43,36,28,0.06)]',
                className,
            )}
        >
            <Sun
                strokeWidth={2.5}
                className={cn(
                    'pointer-events-none absolute top-1/2 left-1.5 h-4 w-4 -translate-y-1/2 text-[#c2410c] transition-opacity duration-200',
                    dark ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden
            />
            <Moon
                strokeWidth={2.5}
                className={cn(
                    'pointer-events-none absolute top-1/2 right-1.5 h-4 w-4 -translate-y-1/2 text-[#1e3a8a] transition-opacity duration-200',
                    dark ? 'opacity-0' : 'opacity-100',
                )}
                aria-hidden
            />
            <span
                className={cn(
                    'relative z-10 grid size-6 place-items-center rounded-full shadow-md transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:size-7',
                    dark
                        ? 'translate-x-[1.7rem] bg-[#0b0a12] text-white ring-1 ring-white/30 sm:translate-x-[2.15rem]'
                        : 'translate-x-0 bg-white text-[#ea580c] ring-1 ring-[#ea580c]/30',
                )}
            >
                {dark ? (
                    <Moon className="size-3.5 fill-white text-white sm:size-4" strokeWidth={2.25} aria-hidden />
                ) : (
                    <Sun className="size-3.5 fill-[#ea580c] text-[#ea580c] sm:size-4" strokeWidth={2.25} aria-hidden />
                )}
            </span>
        </button>
    );
}
