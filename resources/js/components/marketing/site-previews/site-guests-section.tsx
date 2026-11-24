import { Users } from 'lucide-react';
import { useMemo } from 'react';
import { usePreviewLive } from '@/components/marketing/site-previews/preview-live';
import { SiteSectionChrome } from '@/components/marketing/site-previews/site-section-chrome';
import { SiteSectionGate } from '@/components/marketing/site-previews/site-section-note';
import { useInvitationCopy } from '@/hooks/use-invitation-copy';
import {
    DEFAULT_TEMPLATE_GUESTS,
    type TemplateGuestItem,
} from '@/lib/template-preview-model';
import { cn } from '@/lib/utils';

/** Prefer editor/live showcase guests; fall back to samples only when unset. */
export function resolveLiveGuests(
    liveGuests: TemplateGuestItem[] | null | undefined,
): TemplateGuestItem[] {
    if (Array.isArray(liveGuests)) {
        return liveGuests.map((guest, index) => ({
            id: guest.id || `guest-${index}`,
            name: guest.name || 'Guest',
            party: guest.party || '1 guest',
            status: guest.status || 'Attending',
        }));
    }

    return DEFAULT_TEMPLATE_GUESTS.map((guest) => ({ ...guest }));
}

export function useLiveShowcaseGuests(): TemplateGuestItem[] {
    const live = usePreviewLive();
    const fingerprint = Array.isArray(live?.guests)
        ? live.guests.map((guest) => `${guest.id}|${guest.name}|${guest.party}|${guest.status}`).join('||')
        : 'unset';

    return useMemo(
        () => resolveLiveGuests(live?.guests),
        // Fingerprint so add / edit / remove always re-renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [fingerprint],
    );
}

function guestInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function statusTone(status: string): string {
    const value = status.toLowerCase();
    if (value.includes('attend') && !value.includes('not')) {
        return 'is-attending';
    }
    if (value.includes('maybe') || value.includes('decid')) {
        return 'is-maybe';
    }
    if (value.includes('regret') || value.includes('declin') || value.includes('unable') || value.includes('not')) {
        return 'is-declined';
    }
    return 'is-neutral';
}

/** Product-level “Who is coming” block — driven by site-editor showcase guests. */
export function SiteGuestsSection({
    desktop = false,
    intro,
    guests,
    sectionId = 'gh-guests',
}: {
    desktop?: boolean;
    intro: string;
    guests: TemplateGuestItem[];
    sectionId?: string;
}) {
    const ui = useInvitationCopy();

    return (
        <SiteSectionGate sectionKey="guests" desktop={desktop} sectionId={sectionId}>
            {guests.length === 0 ? null : (
                <section
                    id={sectionId}
                    data-preview-reveal
                    className={cn('site-guests-section preview-reveal relative px-5 py-14', desktop && 'px-10 py-16')}
                >
                    <SiteSectionChrome
                        eyebrow={ui.guestList}
                        title={ui.whoIsComing}
                        subtitle={
                            intro.trim() ? (
                                <p className="max-w-md text-sm leading-relaxed text-[var(--w-muted)]">{intro}</p>
                            ) : null
                        }
                    />
                    <ul
                        className={cn(
                            'site-guests-section__list mx-auto mt-10 max-w-md space-y-2.5',
                            desktop && 'max-w-none grid grid-cols-2 gap-3.5 space-y-0',
                        )}
                    >
                        {guests.map((guest, index) => (
                            <li
                                key={guest.id || `${guest.name}-${index}`}
                                data-preview-reveal
                                className={cn(
                                    'site-guest-card preview-reveal',
                                    statusTone(guest.status),
                                )}
                                style={{ ['--reveal-delay' as string]: `${index * 70}ms` }}
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="site-guest-card__avatar" aria-hidden>
                                        {guestInitials(guest.name)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-[var(--w-ink)]">
                                            {guest.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-[11px] text-[var(--w-muted)]">
                                            <Users className="mr-1 inline size-3 opacity-70" aria-hidden />
                                            {guest.party}
                                        </p>
                                    </div>
                                </div>
                                <span className="site-guest-card__status">{guest.status}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </SiteSectionGate>
    );
}
