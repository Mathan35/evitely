import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CardCanvas } from '@/components/cards/card-canvas';
import { PreviewLeaves } from '@/components/marketing/preview-effects';
import { PreviewDeviceShell } from '@/components/preview/preview-device-shell';
import { WeddingSiteView, type WeddingSiteUserCard } from '@/components/wedding/wedding-site-view';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { GalleryDesign } from '@/types/gallery';
import type { WeddingPage } from '@/types/wedding';

export default function WeddingPreview({
    wedding,
    gallerySlug = null,
    galleryDesign = null,
    selectedUserCard = null,
    editorHref,
    previewKind = 'site',
}: {
    wedding: WeddingPage;
    gallerySlug?: string | null;
    galleryDesign?: GalleryDesign | null;
    selectedUserCard?: WeddingSiteUserCard;
    editorHref?: string | null;
    previewKind?: 'card' | 'site';
}) {
    const [confirmUnpublish, setConfirmUnpublish] = useState(false);
    const backHref =
        editorHref ||
        (previewKind === 'card' ? `/events/${wedding.id}/card` : `/events/${wedding.id}/edit`);
    const userCard = useMemo<WeddingSiteUserCard>(() => {
        if (!selectedUserCard?.document) {
            return null;
        }
        return selectedUserCard;
    }, [selectedUserCard]);

    const showCardFace = previewKind === 'card' && Boolean(userCard?.document);

    return (
        <>
            <Head title="Preview" />
            <div className="flex min-h-screen flex-col bg-[#1c1814] text-[#f4efe6]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                    <p className="text-sm text-white/70">Preview · guests cannot see a draft</p>
                    <div className="flex items-center gap-3">
                        <Link
                            className="text-sm underline decoration-white/30 underline-offset-4"
                            href={backHref}
                        >
                            Back to editor
                        </Link>
                        {wedding.status === 'published' ? (
                            <button
                                type="button"
                                className="text-sm underline decoration-white/30 underline-offset-4"
                                onClick={() => setConfirmUnpublish(true)}
                            >
                                Unpublish
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="text-sm underline decoration-white/30 underline-offset-4"
                                onClick={() =>
                                    router.post(`/events/${wedding.id}/publish`, {}, {
                                        preserveScroll: true,
                                        preserveState: true,
                                        showProgress: false,
                                    })
                                }
                            >
                                Publish
                            </button>
                        )}
                    </div>
                </div>

                <ConfirmDialog
                    open={confirmUnpublish}
                    onOpenChange={setConfirmUnpublish}
                    title="Unpublish this invitation?"
                    description="Guests will no longer be able to open the public link until you publish again."
                    confirmLabel="Unpublish"
                    tone="danger"
                    onConfirm={() => router.delete(`/events/${wedding.id}/publish`)}
                />

                {showCardFace && userCard?.document ? (
                    <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto px-4 py-8 sm:px-8">
                        <PreviewLeaves />
                        <div className="relative z-[1] w-full max-w-[420px]">
                            <CardCanvas
                                document={userCard.document}
                                width={userCard.width || 1080}
                                height={userCard.height || 1440}
                                fitWidth={420}
                                musicUrl={wedding.music_enabled ? wedding.music_url : null}
                                className="mx-auto"
                            />
                        </div>
                    </main>
                ) : (
                    <div
                        className="flex min-h-0 flex-1 flex-col items-center px-3 py-4 sm:px-6"
                        style={{ ['--preview-accent' as string]: '#c6a36a', ['--preview-btn' as string]: '#2b241c' }}
                    >
                        <div className="relative flex min-h-0 w-full max-w-[1140px] flex-1 flex-col">
                            <PreviewDeviceShell className="h-[min(78vh,840px)] overflow-hidden rounded-[1.15rem] shadow-[0_28px_80px_-24px_rgba(20,16,12,0.45)]">
                                <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white text-[#2b241c]">
                                    <WeddingSiteView
                                        wedding={wedding}
                                        galleryDesign={galleryDesign}
                                        gallerySlug={gallerySlug}
                                        userCard={userCard}
                                        device="desktop"
                                        preview
                                        framed
                                    />
                                </div>
                            </PreviewDeviceShell>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
