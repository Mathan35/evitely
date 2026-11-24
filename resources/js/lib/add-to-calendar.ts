/** Open Google Calendar in a new tab instead of forcing an .ics download. */

type CalendarEventInput = {
    title: string;
    /** YYYY-MM-DD */
    date: string;
    /** HH:mm — defaults to 16:00 */
    startTime?: string | null;
    /** HH:mm — defaults to start + 3 hours */
    endTime?: string | null;
    location?: string | null;
    details?: string | null;
    /** Prefer this when the live API already built it. */
    googleUrl?: string | null;
};

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

function parseClock(value?: string | null, fallback = '16:00'): { h: number; m: number } {
    const raw = (value || fallback).trim();
    const match = /^(\d{1,2}):(\d{2})/.exec(raw);
    if (!match) {
        return { h: 16, m: 0 };
    }
    return { h: Math.min(23, Number(match[1])), m: Math.min(59, Number(match[2])) };
}

function toUtcStamp(date: string, time?: string | null): string | null {
    const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    if (!day) {
        return null;
    }
    const { h, m } = parseClock(time);
    const local = new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]), h, m, 0);
    if (Number.isNaN(local.getTime())) {
        return null;
    }
    return (
        `${local.getUTCFullYear()}${pad(local.getUTCMonth() + 1)}${pad(local.getUTCDate())}` +
        `T${pad(local.getUTCHours())}${pad(local.getUTCMinutes())}${pad(local.getUTCSeconds())}Z`
    );
}

function endStamp(date: string, startTime?: string | null, endTime?: string | null): string | null {
    if (endTime) {
        return toUtcStamp(date, endTime);
    }
    const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    if (!day) {
        return null;
    }
    const { h, m } = parseClock(startTime);
    const local = new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]), h, m, 0);
    local.setHours(local.getHours() + 3);
    return (
        `${local.getUTCFullYear()}${pad(local.getUTCMonth() + 1)}${pad(local.getUTCDate())}` +
        `T${pad(local.getUTCHours())}${pad(local.getUTCMinutes())}${pad(local.getUTCSeconds())}Z`
    );
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string | null {
    const start = toUtcStamp(input.date, input.startTime);
    const end = endStamp(input.date, input.startTime, input.endTime);
    if (!start || !end) {
        return null;
    }

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: input.title,
        dates: `${start}/${end}`,
    });
    if (input.location?.trim()) {
        params.set('location', input.location.trim());
    }
    if (input.details?.trim()) {
        params.set('details', input.details.trim());
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Opens Google Calendar for the event. Prefer a server-provided googleUrl when available.
 */
export function openAddToCalendar(input: CalendarEventInput): boolean {
    const href = (input.googleUrl || '').trim() || buildGoogleCalendarUrl(input);
    if (!href) {
        return false;
    }

    window.open(href, '_blank', 'noopener,noreferrer');
    return true;
}
