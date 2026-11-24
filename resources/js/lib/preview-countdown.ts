/**
 * Marketing samples roll a past month/day into the next year so demos never look expired.
 * Editor live dates must stay exact so countdown tracks the form.
 */
export function resolveCountdownDate(iso: string | undefined | null, exact = false): string {
    const value = (iso || '').trim();
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }
    if (exact) {
        return value;
    }

    const [year, month, day] = value.split('-').map(Number);
    const now = new Date();
    let next = year;
    const asLocal = new Date(next, month - 1, day, 12, 0, 0);

    if (asLocal.getTime() < now.getTime()) {
        next = now.getFullYear();
        const retry = new Date(next, month - 1, day, 12, 0, 0);
        if (retry.getTime() < now.getTime()) {
            next += 1;
        }
    }

    return `${next}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function resolveCountdownClock(
    liveTime: string | undefined | null,
    fallbackTime: string,
): string {
    const value = (liveTime || '').trim();
    if (/^\d{1,2}:\d{2}/.test(value)) {
        return value.slice(0, 5);
    }
    return fallbackTime;
}
