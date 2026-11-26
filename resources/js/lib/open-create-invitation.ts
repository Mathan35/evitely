import { router } from '@inertiajs/react';

export const OPEN_CREATE_INVITATION_EVENT = 'invidora:open-create-invitation';

type CreateInvitationOpener = () => void;

let opener: CreateInvitationOpener | null = null;

/** My Events registers this so Create opens the dialog without an Inertia visit. */
export function registerCreateInvitationOpener(handler: CreateInvitationOpener | null): void {
    opener = handler;
}

/**
 * Open Create Invitation without remounting My Events when that page is live.
 * From other pages, navigate once to /events?create=1.
 */
export function openCreateInvitation(): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (opener) {
        opener();
        return;
    }

    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path === '/events') {
        window.dispatchEvent(new CustomEvent(OPEN_CREATE_INVITATION_EVENT));
        return;
    }

    router.visit('/events?create=1', {
        preserveScroll: true,
        showProgress: false,
    });
}
