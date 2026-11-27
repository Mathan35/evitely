import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import { RsvpThankYouOverlay } from '@/components/wedding/rsvp-thank-you-overlay';
import { WeddingSiteView, type WeddingSiteUserCard } from '@/components/wedding/wedding-site-view';
import type { GalleryDesign } from '@/types/gallery';
import type { WeddingPage } from '@/types/wedding';

export default function PublicWedding({
    wedding,
    preview = false,
    gallerySlug = null,
    galleryDesign = null,
    selectedUserCard = null,
}: {
    wedding: WeddingPage;
    preview?: boolean;
    gallerySlug?: string | null;
    galleryDesign?: GalleryDesign | null;
    selectedUserCard?: WeddingSiteUserCard;
}) {
    const userCard = useMemo<WeddingSiteUserCard>(() => {
        if (!selectedUserCard?.document) {
            return null;
        }
        return selectedUserCard;
    }, [selectedUserCard]);

    const siteBilling = (wedding as { site_billing?: { is_view_only?: boolean; status?: string; upgrade_url?: string } })
        .site_billing;
    const viewOnly = Boolean(siteBilling?.is_view_only || siteBilling?.status === 'expired');
    const guestName = wedding.guest?.name?.trim();

    return (
        <>
            <Head title={wedding.seo.title} />
            {guestName && !preview ? (
                <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center p-3">
                    <p className="animate-in fade-in slide-in-from-top-2 rounded-full bg-zinc-950/70 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white/90 shadow-lg backdrop-blur duration-700">
                        Welcome, {guestName}
                    </p>
                </div>
            ) : null}
            {viewOnly ? (
                <div className="sticky top-0 z-40 border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-center text-[13px] text-amber-950">
                    This invitation is view-only while the site plan is inactive.
                    {siteBilling?.upgrade_url ? (
                        <>
                            {' '}
                            <a href={siteBilling.upgrade_url} className="font-semibold underline underline-offset-2">
                                Extend plan
                            </a>
                        </>
                    ) : null}
                </div>
            ) : null}
            <div className="wedding-premium-shell animate-in fade-in duration-700">
                <WeddingSiteView
                    wedding={wedding}
                    galleryDesign={galleryDesign}
                    gallerySlug={gallerySlug}
                    userCard={userCard}
                    preview={preview}
                    framed={preview}
                />
            </div>
            {!preview ? <RsvpThankYouOverlay /> : null}
        </>
    );
}
