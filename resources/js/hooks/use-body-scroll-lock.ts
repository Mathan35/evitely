import { useEffect } from 'react';
import { acquireDocumentScrollLock } from '@/lib/document-scroll-lock';

/**
 * Freeze background scrolling while a modal / sheet is open.
 * Document + marked preview scrollers lock; the popup itself can still scroll.
 */
export function useBodyScrollLock(locked: boolean): void {
    useEffect(() => {
        if (!locked) {
            return;
        }

        return acquireDocumentScrollLock({
            pin: true,
            freezePreviewScrollers: true,
        });
    }, [locked]);
}
