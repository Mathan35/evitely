import { useEffect, useState, useSyncExternalStore } from 'react';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type PwaInstallSnapshot = {
    deferred: BeforeInstallPromptEvent | null;
    installed: boolean;
};

export type PwaInstallResult = 'accepted' | 'dismissed' | 'unavailable' | 'insecure' | 'ios';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let listening = false;
let swRegisterPromise: Promise<ServiceWorkerRegistration | null> | null = null;
const listeners = new Set<() => void>();

const SERVER_SNAPSHOT: PwaInstallSnapshot = Object.freeze({
    deferred: null,
    installed: false,
});

let clientSnapshot: PwaInstallSnapshot = SERVER_SNAPSHOT;

function refreshClientSnapshot(): void {
    clientSnapshot = { deferred: deferredPrompt, installed };
}

function emit(): void {
    refreshClientSnapshot();
    for (const listener of listeners) {
        listener();
    }
}

function isStandaloneDisplay(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    const media = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone =
        'standalone' in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    return media || iosStandalone;
}

export function isIosDevice(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isPwaSecureContext(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    // Chromium only fires beforeinstallprompt on secure contexts (https / localhost / 127.0.0.1).
    return window.isSecureContext;
}

function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return Promise.resolve(null);
    }

    if (!swRegisterPromise) {
        swRegisterPromise = navigator.serviceWorker
            .register('/sw.js')
            .then(async (registration) => {
                // Wait until a worker is ready so installability can resolve.
                await navigator.serviceWorker.ready;
                return registration;
            })
            .catch(() => null);
    }

    return swRegisterPromise;
}

function waitForDeferredPrompt(timeoutMs: number): Promise<BeforeInstallPromptEvent | null> {
    if (deferredPrompt) {
        return Promise.resolve(deferredPrompt);
    }

    return new Promise((resolve) => {
        const started = Date.now();

        const check = () => {
            if (deferredPrompt) {
                resolve(deferredPrompt);
                return;
            }
            if (Date.now() - started >= timeoutMs) {
                resolve(null);
                return;
            }
            window.setTimeout(check, 100);
        };

        check();
    });
}

/** Call once at app boot so we never miss Chrome's beforeinstallprompt. */
export function capturePwaInstallPrompt(): void {
    if (typeof window === 'undefined' || listening) {
        return;
    }

    listening = true;

    if (isStandaloneDisplay()) {
        installed = true;
        emit();
        return;
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event as BeforeInstallPromptEvent;
        emit();
    });

    window.addEventListener('appinstalled', () => {
        installed = true;
        deferredPrompt = null;
        emit();
    });

    // Register SW immediately (don't wait for window load) so Chrome can offer install sooner.
    void registerServiceWorker();
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function getSnapshot(): PwaInstallSnapshot {
    return clientSnapshot;
}

function getServerSnapshot(): PwaInstallSnapshot {
    return SERVER_SNAPSHOT;
}

/**
 * Must be invoked from a click/tap handler (user activation).
 * Do not close menus/sheets before this resolves.
 */
export async function promptPwaInstall(): Promise<PwaInstallResult> {
    if (typeof window === 'undefined') {
        return 'unavailable';
    }

    if (installed || isStandaloneDisplay()) {
        installed = true;
        emit();
        return 'accepted';
    }

    if (isIosDevice()) {
        return 'ios';
    }

    if (!isPwaSecureContext()) {
        return 'insecure';
    }

    // Ensure SW is up, then briefly wait for Chrome's deferred prompt if it hasn't arrived yet.
    void registerServiceWorker();
    const promptEvent = deferredPrompt ?? (await waitForDeferredPrompt(1200));

    if (!promptEvent) {
        return 'unavailable';
    }

    try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        deferredPrompt = null;
        if (outcome === 'accepted') {
            installed = true;
        }
        emit();
        return outcome;
    } catch {
        deferredPrompt = null;
        emit();
        return 'unavailable';
    }
}

export function usePwaInstall() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const [iosHint, setIosHint] = useState(false);
    const [secure, setSecure] = useState(true);

    useEffect(() => {
        capturePwaInstallPrompt();
        setIosHint(isIosDevice() && !isStandaloneDisplay());
        setSecure(isPwaSecureContext());
    }, []);

    return {
        canInstall: Boolean(snapshot.deferred) && !snapshot.installed,
        installed: snapshot.installed,
        iosHint,
        secure,
        install: promptPwaInstall,
    };
}
