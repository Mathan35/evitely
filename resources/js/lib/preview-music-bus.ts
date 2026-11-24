/** Shared audio for studio library preview + live site unmute. */

type Listener = () => void;

let audio: HTMLAudioElement | null = null;
let activeOwner: 'panel' | 'site' | null = null;
let activeUrl = '';
const listeners = new Set<Listener>();

function emit(): void {
    listeners.forEach((listener) => listener());
}

function ensureAudio(): HTMLAudioElement {
    if (!audio) {
        audio = new Audio();
        audio.preload = 'auto';
        audio.addEventListener('ended', () => {
            if (activeOwner === 'panel') {
                activeOwner = null;
                activeUrl = '';
                emit();
            }
        });
    }
    return audio;
}

function stopInternal(): void {
    if (!audio) {
        return;
    }
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    activeUrl = '';
}

export function subscribePreviewMusic(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getPreviewMusicOwner(): 'panel' | 'site' | null {
    return activeOwner;
}

export function playPanelPreview(url: string): void {
    const src = url.trim();
    if (!src) {
        return;
    }
    const el = ensureAudio();
    stopInternal();
    el.loop = false;
    el.src = src;
    activeUrl = src;
    activeOwner = 'panel';
    emit();
    void el.play().catch(() => {
        activeOwner = null;
        activeUrl = '';
        emit();
    });
}

export function stopPanelPreview(): void {
    if (activeOwner !== 'panel') {
        return;
    }
    stopInternal();
    activeOwner = null;
    emit();
}

export function playSiteMusic(url: string): void {
    const src = url.trim();
    if (!src) {
        return;
    }
    const el = ensureAudio();
    if (activeOwner === 'site' && activeUrl === src) {
        if (el.paused) {
            void el.play().catch(() => {
                activeOwner = null;
                activeUrl = '';
                emit();
            });
        }
        return;
    }
    stopInternal();
    el.loop = true;
    el.src = src;
    activeUrl = src;
    activeOwner = 'site';
    emit();
    void el.play().catch(() => {
        activeOwner = null;
        activeUrl = '';
        emit();
    });
}

export function stopSiteMusic(): void {
    if (activeOwner !== 'site') {
        return;
    }
    stopInternal();
    activeOwner = null;
    emit();
}
