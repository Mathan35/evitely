import { useEffect, useState } from 'react';

export type CountdownState = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    /** Milliseconds until (or since) the target — for live animation progress. */
    remainingMs: number;
    past: boolean;
    today: boolean;
    ready: boolean;
};

const empty: CountdownState = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    remainingMs: 0,
    past: false,
    today: false,
    ready: false,
};

function zoneOffset(utcMillis: number, timeZone: string): number {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).formatToParts(new Date(utcMillis));

    const value = (type: Intl.DateTimeFormatPartTypes): number =>
        Number(parts.find((part) => part.type === type)?.value ?? '0');

    const hour = value('hour') === 24 ? 0 : value('hour');
    const asUtc = Date.UTC(
        value('year'),
        value('month') - 1,
        value('day'),
        hour,
        value('minute'),
        value('second'),
    );

    return asUtc - utcMillis;
}

function wallClockToUtc(date: string, time: string, timeZone: string): number {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
    let utc = desired;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        utc = desired - zoneOffset(utc, timeZone);
    }

    return utc;
}

function zoneDate(millis: number, timeZone: string): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(millis));
}

export function useCountdown(
    date: string | null,
    time: string | null,
    timeZone: string,
): CountdownState {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const tick = (): void => setNow(Date.now());
        const interval = window.setInterval(tick, media.matches ? 60_000 : 1_000);
        const onChange = (): void => {
            window.clearInterval(interval);
        };

        media.addEventListener('change', onChange);
        tick();

        return () => {
            window.clearInterval(interval);
            media.removeEventListener('change', onChange);
        };
    }, []);

    if (!date) {
        return empty;
    }

    let target = now;

    try {
        target = wallClockToUtc(date, time ?? '00:00', timeZone || 'UTC');
    } catch {
        return empty;
    }

    const difference = target - now;
    const past = difference < 0;
    const abs = Math.abs(difference);
    const today = zoneDate(now, timeZone || 'UTC') === date;

    return {
        days: Math.floor(abs / 86_400_000),
        hours: Math.floor(abs / 3_600_000) % 24,
        minutes: Math.floor(abs / 60_000) % 60,
        seconds: Math.floor(abs / 1_000) % 60,
        remainingMs: Math.max(0, difference),
        past,
        today: today && !past,
        ready: true,
    };
}
