import { router, usePage } from '@inertiajs/react';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    acquireDocumentScrollLock,
    clearStaleDocumentScrollLocks,
} from '@/lib/document-scroll-lock';
import { resolveSkeletonKind, type PageSkeletonKind } from '@/lib/page-skeleton';

export type { PageSkeletonKind };

type NavigatingState = {
    navigating: boolean;
    /** Destination path while a visit is in flight. */
    to: string | null;
    kind: PageSkeletonKind;
};

const NavigatingContext = createContext<NavigatingState>({
    navigating: false,
    to: null,
    kind: 'generic',
});

function pathFromVisitUrl(url: unknown): string {
    if (!url) {
        return window.location.pathname;
    }

    if (typeof url === 'string') {
        try {
            return new URL(url, window.location.origin).pathname;
        } catch {
            return url.split('?')[0] || window.location.pathname;
        }
    }

    if (typeof URL !== 'undefined' && url instanceof URL) {
        return url.pathname;
    }

    if (url && typeof url === 'object') {
        const record = url as {
            pathname?: string;
            href?: string;
            url?: unknown;
            toString?: () => string;
        };

        if (typeof record.pathname === 'string' && record.pathname.length > 0) {
            return record.pathname;
        }

        if (typeof record.href === 'string') {
            return pathFromVisitUrl(record.href);
        }

        if (record.url != null) {
            return pathFromVisitUrl(record.url);
        }

        if (typeof record.toString === 'function') {
            const asString = record.toString();
            if (asString && asString !== '[object Object]') {
                return pathFromVisitUrl(asString);
            }
        }
    }

    return window.location.pathname;
}

type VisitLike = {
    url?: unknown;
    prefetch?: boolean;
    showProgress?: boolean;
    method?: string;
    preserveState?: boolean;
};

function readVisit(event: Event): VisitLike | null {
    const detail = (event as CustomEvent).detail as { visit?: VisitLike } | VisitLike | undefined;

    if (!detail) {
        return null;
    }

    if ('visit' in detail && detail.visit) {
        return detail.visit;
    }

    if ('url' in detail) {
        return detail as VisitLike;
    }

    return null;
}

function visitIsBackground(visit: VisitLike | null): boolean {
    if (!visit) {
        return false;
    }

    if (visit.prefetch) {
        return true;
    }

    if (visit.showProgress === false) {
        return true;
    }

    // Same-page mutations (save / publish / autosave) must not swap the editor chrome
    // for a destination-URL skeleton (e.g. PUT /events/{id} → events-show).
    const method = (visit.method || 'get').toLowerCase();
    if (method !== 'get' && visit.preserveState) {
        return true;
    }

    return false;
}

export function InertiaNavigatingProvider({ children }: { children: ReactNode }) {
    const page = usePage();
    const [navigating, setNavigating] = useState(false);
    const [to, setTo] = useState<string | null>(null);

    useEffect(() => {
        clearStaleDocumentScrollLocks();
    }, []);

    useEffect(() => {
        let showTimer = 0;
        let active = false;

        let safetyTimer = 0;

        const begin = (visit: VisitLike | null): void => {
            if (visitIsBackground(visit)) {
                return;
            }

            const nextPath = pathFromVisitUrl(visit?.url);
            setTo(nextPath);
            active = true;

            window.clearTimeout(showTimer);
            window.clearTimeout(safetyTimer);
            // Tiny delay avoids flicker on instant cache hits, but keeps kind correct.
            showTimer = window.setTimeout(() => {
                if (active) {
                    setNavigating(true);
                }
            }, 80);
            // Hard cap — never leave the fullscreen click-blocker up if finish is missed.
            safetyTimer = window.setTimeout(() => {
                if (active) {
                    clear();
                }
            }, 12000);
        };

        const clear = (): void => {
            active = false;
            window.clearTimeout(showTimer);
            window.clearTimeout(safetyTimer);
            showTimer = 0;
            safetyTimer = 0;
            setNavigating(false);
            setTo(null);
            // Drop leftover loader classes even if another lock (intro/modal) is still held.
            clearStaleDocumentScrollLocks();
        };

        // Only arm the loader on `start`. Doing it on `before` left a stuck
        // fullscreen overlay (pointer-events-none) when the visit was cancelled
        // in before — finish never fires for those, so clicks died until refresh.
        const offStart = router.on('start', (event) => {
            begin(readVisit(event as Event));
        });

        const offFinish = router.on('finish', clear);
        const offError = router.on('error', clear);
        const offSuccess = router.on('success', clear);
        const offNetworkError = router.on('networkError', clear);
        const offHttpException = router.on('httpException', clear);
        return () => {
            active = false;
            window.clearTimeout(showTimer);
            window.clearTimeout(safetyTimer);
            offStart();
            offFinish();
            offError();
            offSuccess();
            offNetworkError();
            offHttpException();
        };
    }, []);

    useEffect(() => {
        setNavigating(false);
        setTo(null);
        clearStaleDocumentScrollLocks();
    }, [page.component, page.url]);

    // Freeze page scroll while the festive loader is up (viewport-centered, no drift).
    useEffect(() => {
        if (!navigating) {
            return;
        }

        document.documentElement.classList.add('festive-loader-active');
        const release = acquireDocumentScrollLock();

        return () => {
            document.documentElement.classList.remove('festive-loader-active');
            release();
            clearStaleDocumentScrollLocks();
        };
    }, [navigating]);

    const kind = useMemo(() => {
        if (to) {
            return resolveSkeletonKind(to);
        }

        return resolveSkeletonKind(page.component || page.url);
    }, [to, page.component, page.url]);

    const value = useMemo<NavigatingState>(
        () => ({ navigating, to, kind }),
        [navigating, to, kind],
    );

    return <NavigatingContext.Provider value={value}>{children}</NavigatingContext.Provider>;
}

export function useInertiaNavigating(): NavigatingState {
    return useContext(NavigatingContext);
}

export { resolveSkeletonKind, skeletonShell } from '@/lib/page-skeleton';
