import { useEffect } from 'react';
import { InvitationCardFace } from '@/components/marketing/invitation-card-face';
import type { GalleryDesign } from '@/types/gallery';
import type { PreviewDevice } from '@/lib/preview-device';

export function CardUnpackPreview({
    design,
    device,
    onReady,
}: {
    design: GalleryDesign;
    device: PreviewDevice;
    onReady?: () => void;
}) {
    const desktop = device === 'desktop';

    useEffect(() => {
        const timer = window.setTimeout(() => onReady?.(), 420);
        return () => window.clearTimeout(timer);
    }, [design.id, device, onReady]);

    return (
        <div
            key={`${design.id}-${device}`}
            className={`mx-auto w-full ${desktop ? 'max-w-[34rem] px-3 py-4' : 'max-w-[30rem] px-2 py-3'}`}
        >
            <InvitationCardFace design={design} device={device} className="card-unpack-face" />
        </div>
    );
}
