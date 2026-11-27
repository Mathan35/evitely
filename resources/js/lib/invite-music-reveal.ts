export const INVITE_MUSIC_REVEAL_EVENT = 'invite-music:reveal';

function emitReveal(ok: boolean): void {
    if (typeof window === 'undefined') {
        return;
    }
    window.dispatchEvent(new CustomEvent(INVITE_MUSIC_REVEAL_EVENT, { detail: { ok } }));
}

/**
 * After the guest opens the wax seal — unmute gallery sites + classic `#wedding-music`.
 * Gesture-linked so browsers allow playback.
 */
export function revealInviteMusic(audioId = 'wedding-music'): void {
    emitReveal(true);

    if (typeof document === 'undefined') {
        return;
    }

    const audio = document.getElementById(audioId) as HTMLAudioElement | null;
    if (!audio?.src) {
        return;
    }

    audio.volume = Math.min(1, Math.max(0, audio.volume || 0.85));
    void audio.play().catch(() => {
        // Guest can still use the floating music control.
    });
}
