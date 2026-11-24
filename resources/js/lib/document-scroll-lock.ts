/**
 * Reference-counted document scroll lock.
 *
 * Nested loaders / intros / modals used to each save+restore body.overflow, so
 * finishing one often restored `hidden` from another and left pages unscrollable.
 * Only the first acquire applies the lock; only the last release clears it.
 */

export const DOC_SCROLL_LOCK_CLASS = 'doc-scroll-lock';

type LockOptions = {
    /** Pin body with position:fixed (iOS-safe modal sheets). */
    pin?: boolean;
    /** Also freeze framed preview scroll panes. */
    freezePreviewScrollers?: boolean;
};

let lockCount = 0;
let pinCount = 0;
let previewFreezeCount = 0;
let savedScrollY = 0;
let previewPrev: { el: HTMLElement; overflow: string; overscroll: string }[] = [];

function applyOverflowLock(): void {
    if (typeof document === 'undefined') {
        return;
    }

    const html = document.documentElement;
    const body = document.body;
    html.classList.add(DOC_SCROLL_LOCK_CLASS);
    // Clear stale inline overflow from older lock implementations.
    html.style.overflow = '';
    body.style.overflow = '';
    body.style.overscrollBehavior = 'none';
}

function clearOverflowLock(): void {
    if (typeof document === 'undefined') {
        return;
    }

    const html = document.documentElement;
    const body = document.body;
    html.classList.remove(DOC_SCROLL_LOCK_CLASS);
    html.classList.remove('doc-scroll-lock-previews');
    html.classList.remove('popup-scroll-lock');
    html.classList.remove('festive-loader-active');
    html.classList.remove('boot-skeleton-active');
    html.style.overflow = '';
    body.style.overflow = '';
    body.style.overscrollBehavior = '';
}

function applyPin(): void {
    const body = document.body;
    savedScrollY = window.scrollY;
    body.style.position = 'fixed';
    body.style.top = `-${savedScrollY}px`;
    body.style.width = '100%';
}

function clearPin(): void {
    const body = document.body;
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    window.scrollTo(0, savedScrollY);
}

function freezePreviewScrollers(): void {
    previewPrev = Array.from(
        document.querySelectorAll<HTMLElement>('[data-preview-scroll], .preview-scroll-pane'),
    ).map((el) => ({
        el,
        overflow: el.style.overflow,
        overscroll: el.style.overscrollBehavior,
    }));
    previewPrev.forEach(({ el }) => {
        el.style.overflow = 'hidden';
        el.style.overscrollBehavior = 'none';
    });
}

function unfreezePreviewScrollers(): void {
    previewPrev.forEach(({ el, overflow, overscroll }) => {
        el.style.overflow = overflow;
        el.style.overscrollBehavior = overscroll;
    });
    previewPrev = [];
}

/** Current number of active document scroll locks. */
export function getDocumentScrollLockCount(): number {
    return lockCount;
}

/**
 * Acquire a document scroll lock. Returns a release function (safe to call once).
 */
export function acquireDocumentScrollLock(options: LockOptions = {}): () => void {
    if (typeof document === 'undefined') {
        return () => undefined;
    }

    if (lockCount === 0) {
        savedScrollY = window.scrollY;
        applyOverflowLock();
    }

    lockCount += 1;

    if (options.pin) {
        if (pinCount === 0) {
            applyPin();
        }
        pinCount += 1;
    }

    if (options.freezePreviewScrollers) {
        if (previewFreezeCount === 0) {
            document.documentElement.classList.add('doc-scroll-lock-previews', 'popup-scroll-lock');
            freezePreviewScrollers();
        }
        previewFreezeCount += 1;
    }

    let released = false;

    return () => {
        if (released) {
            return;
        }
        released = true;

        if (options.pin) {
            pinCount = Math.max(0, pinCount - 1);
            if (pinCount === 0) {
                clearPin();
            }
        }

        if (options.freezePreviewScrollers) {
            previewFreezeCount = Math.max(0, previewFreezeCount - 1);
            if (previewFreezeCount === 0) {
                document.documentElement.classList.remove('doc-scroll-lock-previews', 'popup-scroll-lock');
                unfreezePreviewScrollers();
            }
        }

        lockCount = Math.max(0, lockCount - 1);
        if (lockCount === 0) {
            clearOverflowLock();
            if (pinCount === 0) {
                // Pin path already restored scroll; otherwise keep place if we never pinned.
                // No-op scroll when already at savedScrollY.
            }
        }
    };
}

/**
 * Drop leftover loader / boot classes and inline overflow when nothing holds a lock.
 * Safe to call after navigation finishes.
 */
export function clearStaleDocumentScrollLocks(): void {
    if (typeof document === 'undefined') {
        return;
    }

    if (lockCount > 0) {
        // Still drop loader-only classes — overflow stays locked via doc-scroll-lock.
        document.documentElement.classList.remove('festive-loader-active', 'boot-skeleton-active');
        document.getElementById('app-boot-skeleton')?.remove();
        return;
    }

    clearOverflowLock();
    document.getElementById('app-boot-skeleton')?.remove();
    if (pinCount === 0) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
    }
    if (previewFreezeCount === 0 && previewPrev.length > 0) {
        unfreezePreviewScrollers();
    }
}
