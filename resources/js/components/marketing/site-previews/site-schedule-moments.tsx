import { CalendarPlus, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ScheduleMoment = {
    time: string;
    title: string;
    map_url?: string | null;
    google_calendar_url?: string | null;
    ics_url?: string | null;
};

/** Gallery itinerary chips with optional per-moment map / calendar links. */
export function SiteScheduleMoments({
    items,
    desktop = false,
    className,
}: {
    items: ScheduleMoment[];
    desktop?: boolean;
    className?: string;
}) {
    if (!items.length) {
        return null;
    }

    return (
        <ul
            className={cn(
                'mx-auto mt-8 max-w-md space-y-3',
                desktop && 'max-w-2xl grid grid-cols-3 gap-3 space-y-0',
                className,
            )}
        >
            {items.map((item) => {
                const hasLinks = Boolean(item.map_url || item.google_calendar_url || item.ics_url);
                return (
                    <li
                        key={`${item.time}-${item.title}`}
                        className="rounded-2xl border border-[var(--w-accent)]/20 bg-[var(--w-surface)] px-4 py-3 text-center"
                    >
                        <p className="text-[10px] tracking-[0.2em] text-[var(--w-accent)] uppercase">
                            {item.time}
                        </p>
                        <p className="mt-1 font-serif text-lg font-light">{item.title}</p>
                        {hasLinks ? (
                            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] tracking-wide text-[var(--w-muted)]">
                                {item.map_url ? (
                                    <a
                                        href={item.map_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 underline decoration-[var(--w-accent)]/40 underline-offset-2 hover:text-[var(--w-ink)]"
                                    >
                                        <MapPin className="size-3" aria-hidden />
                                        Map
                                    </a>
                                ) : null}
                                {item.google_calendar_url ? (
                                    <a
                                        href={item.google_calendar_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 underline decoration-[var(--w-accent)]/40 underline-offset-2 hover:text-[var(--w-ink)]"
                                    >
                                        <CalendarPlus className="size-3" aria-hidden />
                                        Calendar
                                    </a>
                                ) : null}
                                {item.ics_url ? (
                                    <a
                                        href={item.ics_url}
                                        className="inline-flex items-center gap-1 underline decoration-[var(--w-accent)]/40 underline-offset-2 hover:text-[var(--w-ink)]"
                                    >
                                        .ics
                                    </a>
                                ) : null}
                            </div>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}
