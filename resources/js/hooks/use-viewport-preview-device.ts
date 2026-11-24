import { useEffect, useState } from 'react';
import type { PreviewDevice } from '@/lib/preview-device';

/** Matches Tailwind `md` — phone layout below, desktop layout at/above. */
export const LIVE_SITE_DESKTOP_MIN = 768;

/**
 * Viewport-driven device for public / unframed invitation sites.
 * Editor frames keep using the explicit `device` prop instead.
 */
export function useViewportPreviewDevice(minDesktopPx = LIVE_SITE_DESKTOP_MIN): PreviewDevice {
    const [device, setDevice] = useState<PreviewDevice>(() => {
        if (typeof window === 'undefined') {
            return 'mobile';
        }

        return window.matchMedia(`(min-width: ${minDesktopPx}px)`).matches ? 'desktop' : 'mobile';
    });

    useEffect(() => {
        const media = window.matchMedia(`(min-width: ${minDesktopPx}px)`);
        const sync = () => setDevice(media.matches ? 'desktop' : 'mobile');

        sync();
        media.addEventListener('change', sync);

        return () => media.removeEventListener('change', sync);
    }, [minDesktopPx]);

    return device;
}
