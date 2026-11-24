export type PreviewDevice = 'mobile' | 'desktop';

export const PREVIEW_DEVICE_STORAGE_KEY = 'evitely.preview-device';

export const PREVIEW_VIEWPORTS = {
    mobile: {
        widthClass:
            'h-[min(88vh,920px)] w-[min(calc(100%-1.5rem),448px)] max-w-[448px] sm:max-w-[448px] overflow-visible rounded-[1.35rem] bg-transparent shadow-none',
    },
    desktop: {
        widthClass:
            'h-[min(86vh,860px)] w-[min(calc(100%-1.5rem),1140px)] max-w-[1140px] sm:max-w-[1140px] overflow-visible rounded-[1.15rem] bg-transparent shadow-none',
    },
} as const;

export function isPreviewDevice(value: unknown): value is PreviewDevice {
    return value === 'mobile' || value === 'desktop';
}

export function readStoredPreviewDevice(): PreviewDevice {
    if (typeof window === 'undefined') {
        return 'mobile';
    }

    try {
        const stored = window.localStorage.getItem(PREVIEW_DEVICE_STORAGE_KEY);

        return isPreviewDevice(stored) ? stored : 'mobile';
    } catch {
        return 'mobile';
    }
}
