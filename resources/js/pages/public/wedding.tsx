import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
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

    return (
        <>
            <Head title={wedding.seo.title} />
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
            <WeddingSiteView
                wedding={wedding}
                galleryDesign={galleryDesign}
                gallerySlug={gallerySlug}
                userCard={userCard}
                preview={preview}
                framed={preview}
            />
        </>
    );
}
