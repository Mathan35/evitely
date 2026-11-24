import { useEffect } from 'react';
import {
    getPreviewMusicOwner,
    playSiteMusic,
    stopSiteMusic,
    subscribePreviewMusic,
} from '@/lib/preview-music-bus';

/**
 * Plays looping background music in site/gallery previews when unmuted.
 * Mirrors the floating Volume control already on each occasion template.
 */
export function usePreviewMusic(musicUrl: string | null | undefined, muted: boolean): void {
    useEffect(() => {
        const src = typeof musicUrl === 'string' ? musicUrl.trim() : '';

        const sync = () => {
            if (!src || muted) {
                stopSiteMusic();
                return;
            }
            // Panel library preview owns the shared audio until it ends or is paused.
            if (getPreviewMusicOwner() === 'panel') {
                return;
            }
            playSiteMusic(src);
        };

        sync();
        const unsubscribe = subscribePreviewMusic(sync);

        return () => {
            unsubscribe();
            stopSiteMusic();
        };
    }, [musicUrl, muted]);
}
