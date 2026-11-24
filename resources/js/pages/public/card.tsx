import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import '../../../css/editor-fonts.css';
import { CardCanvas } from '@/components/cards/card-canvas';
import { InvitationIntroGate, buildInvitationIntroContent } from '@/components/invitation/invitation-intro';
import { PlatformBrandBadge, shouldHidePlatformBrand } from '@/components/platform-brand-badge';
import { resolveIntroStyleId } from '@/lib/invitation-intro-styles';
import type { WeddingPage } from '@/types/wedding';

export default function PublicCard({ wedding }: { wedding: WeddingPage }) {
    const hidePlatformBrand = shouldHidePlatformBrand(wedding.site_billing);
    const card = wedding.card;
    const hosts = [wedding.groom_display_name || wedding.groom_name, wedding.bride_display_name || wedding.bride_name]
        .map((part) => (part || '').trim())
        .filter(Boolean)
        .join(' & ');
    const introStyle = resolveIntroStyleId(wedding.details?.intro_style);

    const introContent = useMemo(
        () =>
            buildInvitationIntroContent({
                eventSlug: wedding.occasion || 'wedding',
                hosts: hosts || wedding.headline || 'You are invited',
                paper: wedding.theme?.backgroundColor || '#f9ebe7',
                ink: wedding.theme?.textColor || '#7a514d',
                seal: wedding.theme?.primaryColor || '#a67068',
            }),
        [hosts, wedding.headline, wedding.occasion, wedding.theme],
    );

    return (
        <>
            <Head title={wedding.seo.title} />
            <InvitationIntroGate
                content={introContent}
                style={introStyle}
                sessionKey={`public-card:${wedding.id}:${introStyle}`}
                persistSession={false}
                fullscreen
                className="min-h-svh"
            >
                <main className="flex min-h-svh items-center justify-center bg-[#1c1712] p-6">
                    {card ? (
                        <CardCanvas
                            document={card.document}
                            width={card.width}
                            height={card.height}
                            fitWidth={420}
                            musicUrl={wedding.music_url}
                        />
                    ) : (
                        <p className="text-[#f4efe6]">This invitation does not have a card yet.</p>
                    )}
                </main>
                <PlatformBrandBadge hidden={hidePlatformBrand} href={wedding.create_cta_url || '/register'} />
            </InvitationIntroGate>
        </>
    );
}
