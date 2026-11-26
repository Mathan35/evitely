import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type AppNotificationItem = {
    id: number;
    type: string;
    title: string;
    body?: string | null;
    count: number;
    href?: string | null;
    actor_name?: string | null;
    read: boolean;
    cleared?: boolean;
    last_occurred_at?: string | null;
    data?: Record<string, unknown>;
};

type NotificationsSnapshot = {
    unread: number;
    recent: AppNotificationItem[];
    cursor?: string | null;
};

type PageProps = {
    notifications?: NotificationsSnapshot | AppNotificationItem[] | null;
    unread?: number;
};

function isSnapshot(value: unknown): value is NotificationsSnapshot {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const record = value as Record<string, unknown>;
    return Array.isArray(record.recent);
}

/** Shared bell feed uses a snapshot object; the /notifications page must not overwrite it with a list. */
function resolveSnapshot(props: PageProps): NotificationsSnapshot {
    const raw = props.notifications;
    if (isSnapshot(raw)) {
        return {
            unread: typeof raw.unread === 'number' ? raw.unread : 0,
            recent: raw.recent.filter(Boolean),
            cursor: typeof raw.cursor === 'string' ? raw.cursor : null,
        };
    }

    // Page rendered a list under the same key — keep the bell safe and rely on feed polling.
    return {
        unread: typeof props.unread === 'number' ? props.unread : 0,
        recent: [],
        cursor: null,
    };
}

/**
 * Realtime-ish in-app feed: polls while the tab is visible and merges updates
 * without spamming duplicate celebrate/RSVP rows (server aggregates by group_key).
 */
export function useNotificationsFeed() {
    const page = usePage<PageProps>();
    const initial = resolveSnapshot(page.props);
    const [unread, setUnread] = useState(() => initial.unread);
    const [recent, setRecent] = useState<AppNotificationItem[]>(() => initial.recent);
    const [pulse, setPulse] = useState(false);
    const cursorRef = useRef<string | null>(initial.cursor ?? null);
    const knownIdsRef = useRef<Set<number>>(new Set(initial.recent.map((n) => n.id)));
    const bootstrappedFromListRef = useRef(!isSnapshot(page.props.notifications));

    useEffect(() => {
        const next = resolveSnapshot(page.props);
        // Only sync from Inertia shared snapshot shape — never from a page list collision.
        if (!isSnapshot(page.props.notifications)) {
            if (typeof page.props.unread === 'number') {
                setUnread(page.props.unread);
            }
            bootstrappedFromListRef.current = true;
            return;
        }

        bootstrappedFromListRef.current = false;
        setUnread(next.unread);
        setRecent(next.recent);
        cursorRef.current = next.cursor ?? null;
        knownIdsRef.current = new Set(next.recent.map((n) => n.id));
    }, [page.props]);

    const applySnapshot = useCallback((payload: {
        unread?: number;
        recent?: AppNotificationItem[];
        items?: AppNotificationItem[];
        cursor?: string | null;
    }) => {
        if (typeof payload.unread === 'number') {
            setUnread(payload.unread);
        }
        if (Array.isArray(payload.recent)) {
            setRecent(payload.recent);
        }
        if (payload.cursor) {
            cursorRef.current = payload.cursor;
        }

        const incoming = Array.isArray(payload.items) ? payload.items : [];
        let foundNew = false;
        for (const item of incoming) {
            if (!item || typeof item.id !== 'number') {
                continue;
            }
            if (!knownIdsRef.current.has(item.id) || item.count > 1) {
                foundNew = true;
            }
            knownIdsRef.current.add(item.id);
        }
        if (foundNew && incoming.length > 0) {
            setPulse(true);
            window.setTimeout(() => setPulse(false), 900);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        let timer: number | null = null;

        const poll = async () => {
            if (document.visibilityState !== 'visible') {
                return;
            }
            try {
                // After a list-page collision, always take a full recent snapshot first.
                const qs =
                    cursorRef.current && !bootstrappedFromListRef.current
                        ? `?after=${encodeURIComponent(cursorRef.current)}`
                        : '';
                const res = await fetch(`/notifications/feed${qs}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                if (!res.ok || cancelled) {
                    return;
                }
                const data = (await res.json()) as {
                    unread: number;
                    recent: AppNotificationItem[];
                    items: AppNotificationItem[];
                    cursor?: string | null;
                };
                if (!cancelled) {
                    bootstrappedFromListRef.current = false;
                    applySnapshot(data);
                }
            } catch {
                // ignore transient network errors
            }
        };

        const schedule = () => {
            timer = window.setTimeout(async () => {
                await poll();
                if (!cancelled) {
                    schedule();
                }
            }, document.visibilityState === 'visible' ? 2800 : 12000);
        };

        void poll();
        schedule();

        const onVis = () => {
            if (document.visibilityState === 'visible') {
                void poll();
            }
        };
        document.addEventListener('visibilitychange', onVis);

        return () => {
            cancelled = true;
            if (timer) {
                window.clearTimeout(timer);
            }
            document.removeEventListener('visibilitychange', onVis);
        };
    }, [applySnapshot]);

    const markAllRead = useCallback(async () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        try {
            await fetch('/notifications/read-all', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
                credentials: 'same-origin',
                body: '{}',
            });
            setUnread(0);
            setRecent((rows) => rows.map((row) => ({ ...row, read: true })));
        } catch {
            // no-op
        }
    }, []);

    const markRead = useCallback(async (id: number) => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        try {
            const res = await fetch(`/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
                credentials: 'same-origin',
                body: '{}',
            });
            if (!res.ok) {
                return;
            }
            const data = (await res.json()) as { unread?: number };
            setRecent((rows) => rows.map((row) => (row.id === id ? { ...row, read: true } : row)));
            if (typeof data.unread === 'number') {
                setUnread(data.unread);
            } else {
                setUnread((n) => Math.max(0, n - 1));
            }
        } catch {
            // no-op
        }
    }, []);

    const clearAll = useCallback(async () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        try {
            await fetch('/notifications/clear', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
                credentials: 'same-origin',
                body: '{}',
            });
            setUnread(0);
            setRecent([]);
        } catch {
            // no-op
        }
    }, []);

    return { unread, recent, pulse, markAllRead, markRead, clearAll };
}
