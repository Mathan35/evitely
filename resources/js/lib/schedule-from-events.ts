import type { TemplateScheduleItem } from '@/lib/template-preview-model';

type ScheduleEventLike = {
    id?: number | string | null;
    title?: string | null;
    start_time?: string | null;
    is_public?: boolean | null;
    sort_order?: number | null;
    map_url?: string | null;
    google_calendar_url?: string | null;
    ics_url?: string | null;
};

/** Format DB time (HH:mm[:ss]) to itinerary display ("4:00 PM"). */
export function formatScheduleClock(storage?: string | null): string {
    const raw = (storage || '').trim();
    if (!raw) {
        return '';
    }

    const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) {
        return raw;
    }

    let hour = Number(match[1]);
    const minute = match[2];
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
        return raw;
    }

    const suffix = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) {
        hour = 12;
    }

    return `${hour}:${minute} ${suffix}`;
}

/**
 * Project relational WeddingEvent rows into the gallery itinerary shape.
 * Public rows only, sorted by sort_order — includes per-event map/calendar URLs.
 */
export function scheduleFromEvents(
    events: ScheduleEventLike[] | null | undefined,
): TemplateScheduleItem[] {
    if (!Array.isArray(events) || events.length === 0) {
        return [];
    }

    return [...events]
        .filter((event) => event?.is_public !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((event) => {
            const id = event.id != null ? Number(event.id) : null;
            return {
                time: formatScheduleClock(event.start_time),
                title: (event.title || '').trim(),
                map_url: event.map_url || null,
                google_calendar_url: event.google_calendar_url || null,
                ics_url: event.ics_url || null,
                event_id: Number.isFinite(id) ? id : null,
            };
        })
        .filter((item) => item.title !== '');
}
