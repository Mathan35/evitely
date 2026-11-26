import { Download, Home } from 'lucide-react';
import { useState } from 'react';
import { usePwaInstall, type PwaInstallResult } from '@/hooks/use-pwa-install';
import { cn } from '@/lib/utils';

type InstallAppButtonProps = {
    className?: string;
    /** Visual weight for different placements. */
    variant?: 'primary' | 'outline' | 'nav' | 'sheet';
    /**
     * Runs after the install attempt finishes.
     * Kept after prompt() so we don't break Chrome's user-activation requirement.
     */
    onAfterClick?: () => void;
    /** Show inline help under the button when the native prompt isn't available. */
    showHint?: boolean;
};

function hintFor(result: PwaInstallResult, iosHint: boolean): string {
    if (result === 'ios' || iosHint) {
        return 'On iPhone: Share → Add to Home Screen';
    }
    if (result === 'insecure') {
        return 'Install needs HTTPS (or localhost). Open the live site to install.';
    }
    if (result === 'dismissed') {
        return 'Install dismissed — you can try again anytime.';
    }
    return 'Chrome menu (⋮) → Install app / Add to Home screen';
}

export function InstallAppButton({
    className,
    variant = 'primary',
    onAfterClick,
    showHint = true,
}: InstallAppButtonProps) {
    const { canInstall, installed, iosHint, install } = usePwaInstall();
    const [busy, setBusy] = useState(false);
    const [hint, setHint] = useState<string | null>(null);

    async function onClick(): Promise<void> {
        if (installed || busy) {
            return;
        }

        setBusy(true);
        setHint(null);

        let result: PwaInstallResult = 'unavailable';
        try {
            // Must stay inside the click stack until prompt() — don't close UI first.
            result = await install();
        } finally {
            setBusy(false);
            onAfterClick?.();
        }

        if (result === 'accepted') {
            setHint(null);
            return;
        }

        if (result === 'dismissed') {
            setHint(hintFor(result, iosHint));
            return;
        }

        setHint(hintFor(result, iosHint));

        // Soft fallback: guide people to the homepage install section when not already there.
        if (typeof window !== 'undefined' && result !== 'ios') {
            const target = document.getElementById('get-app');
            if (target) {
                window.setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
            }
        }
    }

    const label = installed ? 'Installed' : busy ? 'Installing…' : 'Install app';

    const styles = {
        primary:
            'h-12 rounded-full bg-[#c6a36a] px-5 text-sm font-semibold text-[#241c16] transition hover:bg-[#d4b57a] disabled:opacity-60',
        outline:
            'h-10 rounded-full border border-zinc-950/12 bg-white/80 px-3.5 text-sm font-medium text-zinc-800 transition hover:border-[#c6a36a]/50 hover:bg-[#fbf8f3] dark:border-white/12 dark:bg-zinc-900/60 dark:text-zinc-100',
        nav: 'h-9 rounded-full border border-zinc-950/10 bg-transparent px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-950/5 hover:text-zinc-950 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white',
        sheet:
            'h-11 w-full rounded-full border border-zinc-950/10 bg-white/90 text-sm font-medium text-zinc-900 transition hover:bg-white dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-50',
    } as const;

    return (
        <div
            className={cn(
                variant === 'sheet' ? 'w-full' : 'inline-flex flex-col items-stretch gap-1',
                className,
            )}
        >
            <button
                type="button"
                data-ripple="off"
                disabled={installed || busy}
                onClick={() => void onClick()}
                className={cn(
                    'inline-flex items-center justify-center gap-2',
                    styles[variant],
                    installed && 'opacity-70',
                    canInstall && variant === 'primary' && 'ring-2 ring-[#c6a36a]/35 ring-offset-2 ring-offset-[#241c16]',
                )}
                aria-label={installed ? 'Invidora is installed' : 'Install Invidora app'}
            >
                {installed ? (
                    <Home className="size-4 shrink-0" aria-hidden />
                ) : (
                    <Download className="size-4 shrink-0" aria-hidden />
                )}
                {label}
            </button>
            {showHint && hint && !installed ? (
                <p
                    className={cn(
                        'text-[11px] leading-4',
                        variant === 'sheet' || variant === 'primary'
                            ? 'mt-2 text-center text-zinc-500 dark:text-zinc-400'
                            : 'mt-1 max-w-[14rem] text-zinc-500 dark:text-zinc-400',
                        variant === 'primary' && 'text-left text-white/55',
                    )}
                    role="status"
                >
                    {hint}
                </p>
            ) : null}
        </div>
    );
}
