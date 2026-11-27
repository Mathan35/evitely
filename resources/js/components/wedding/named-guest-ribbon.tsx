import { cn } from '@/lib/utils';

/**
 * Soft personalization strip for /invite/{slug}/g/{token} opens —
 * reinforces that this link was prepared for a named guest.
 */
export function NamedGuestRibbon({
    guestName,
    className,
}: {
    guestName?: string | null;
    className?: string;
}) {
    const name = (guestName || '').trim();
    if (!name) {
        return null;
    }

    return (
        <div
            className={cn(
                'pointer-events-none fixed inset-x-0 top-0 z-[45] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]',
                className,
            )}
            role="status"
            aria-live="polite"
        >
            <p className="animate-in fade-in slide-in-from-top-2 rounded-full border border-white/25 bg-zinc-950/70 px-4 py-1.5 text-[11px] font-medium tracking-wide text-white shadow-lg backdrop-blur-md duration-700">
                Prepared for <span className="font-semibold">{name}</span>
            </p>
        </div>
    );
}
