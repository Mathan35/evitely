import { useCallback, useEffect, useState } from 'react';
import {
    PREVIEW_DEVICE_STORAGE_KEY,
    readStoredPreviewDevice,
    type PreviewDevice,
} from '@/lib/preview-device';

const TOGGLE_QUERY = '(min-width: 768px)';

function readCanToggle(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia(TOGGLE_QUERY).matches;
}

export function usePreviewDevice() {
    const [device, setDeviceState] = useState<PreviewDevice>(readStoredPreviewDevice);
    const [showToggle, setShowToggle] = useState(readCanToggle);

    useEffect(() => {
        const media = window.matchMedia(TOGGLE_QUERY);
        const sync = () => setShowToggle(media.matches);

        sync();
        media.addEventListener('change', sync);

        return () => media.removeEventListener('change', sync);
    }, []);

    const setDevice = useCallback((next: PreviewDevice) => {
        setDeviceState(next);

        try {
            window.localStorage.setItem(PREVIEW_DEVICE_STORAGE_KEY, next);
        } catch {
            /* private mode */
        }
    }, []);

    return {
        device: showToggle ? device : 'mobile',
        setDevice,
        showToggle,
    };
}
