import { ChevronDown } from 'lucide-react';
import { ResponsiveCardCanvas } from '@/components/cards/responsive-card-canvas';
import { PreviewInvitationCard } from '@/components/marketing/site-previews/preview-invitation-card';
import { cn } from '@/lib/utils';
import type { GalleryDesign } from '@/types/gallery';
import type { CardDocument } from '@/types/wedding';

export type PreviewUserCard = {
    event_id?: number | string;
    document: CardDocument | null;
    width?: number;
    height?: number;
};

export function PreviewSiteCard({
    title,
    invitationCard,
    userCard,
    fallbackSrc,
    designName,
    outlineBtn,
    open,
    onToggle,
    desktop = false,
    sectionId = 'gh-card',
}: {
    title: string;
    invitationCard?: GalleryDesign | null;
    userCard?: PreviewUserCard | null;
    fallbackSrc: string;
    designName: string;
    outlineBtn: string;
    open: boolean;
    onToggle: () => void;
    desktop?: boolean;
    sectionId?: string;
}) {
    const hasUserCard = Boolean(userCard?.document);
    const cardW = userCard?.width || 1080;
    const cardH = userCard?.height || 1440;

    return (
        <section id={sectionId} data-preview-reveal className={cn('preview-reveal relative px-5 pt-12 pb-6 text-center', desktop && 'px-10 pt-16')}>
            <p className="text-[10px] tracking-[0.34em] text-[var(--w-accent)] uppercase">The Card</p>
            <h3 className="mt-3 font-serif text-4xl font-light tracking-tight">{title}</h3>
            <div className="relative mx-auto mt-10 flex w-full max-w-[13.5rem] items-center justify-center">
                {hasUserCard && userCard?.document ? (
                    <ResponsiveCardCanvas
                        document={userCard.document}
                        width={cardW}
                        height={cardH}
                        frameClassName="rounded-[1.2rem] border border-[var(--w-accent)]/25 bg-[var(--w-surface)] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.35)]"
                    />
                ) : (
                    <PreviewInvitationCard card={invitationCard} fallbackSrc={fallbackSrc} alt="" compact />
                )}
            </div>
            <button
                type="button"
                onClick={onToggle}
                className={cn('mx-auto mt-8 inline-flex items-center gap-2 px-7 py-2.5 text-[11px] tracking-[0.22em] uppercase', outlineBtn)}
            >
                <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
                {open ? 'Hide invitation' : 'View invitation'}
            </button>
            {open ? (
                <div className="invite-open-stage mt-8">
                    <div className="preview-envelope-flap mx-auto mb-[-8px] h-10 w-full max-w-sm origin-top rounded-t-[1.2rem] bg-[var(--w-accent)]/35" aria-hidden />
                    {hasUserCard && userCard?.document ? (
                        <ResponsiveCardCanvas
                            document={userCard.document}
                            width={cardW}
                            height={cardH}
                            frameClassName="invite-open-card rounded-[1.4rem] border border-[var(--w-accent)]/25 bg-[var(--w-surface)] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.35)] max-w-sm"
                        />
                    ) : (
                        <div className="invite-open-card">
                            <PreviewInvitationCard
                                card={invitationCard}
                                fallbackSrc={fallbackSrc}
                                alt={`${designName} invitation card`}
                            />
                        </div>
                    )}
                </div>
            ) : null}
        </section>
    );
}
