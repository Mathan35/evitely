function parseDate(value: string): Date | null {
    if (!value) {
        return null;
    }

    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value;
    const date = new Date(normalized);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLongDate(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = parseDate(value);

    if (!date) {
        return value;
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export function ceremonyParts(value: string): {
    weekday: string;
    month: string;
    day: string;
    year: string;
} | null {
    const date = parseDate(value);

    if (!date) {
        return null;
    }

    return {
        weekday: new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
        }).format(date),
        month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
            date,
        ),
        day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date),
        year: new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(
            date,
        ),
    };
}

export function formatCeremonyTime(value: string): string {
    if (!value) {
        return '';
    }

    const [hours, minutes] = value.split(':').map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return value;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}
