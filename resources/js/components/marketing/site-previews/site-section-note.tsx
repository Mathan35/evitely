import type { ReactNode } from 'react';
import { usePreviewLive } from '@/components/marketing/site-previews/preview-live';
import {
    isSiteSectionEnabled,
    type SectionNote,
    type ToggleableSiteSection,
} from '@/lib/site-section-visibility';
import { cn } from '@/lib/utils';

/** Compact note shown when a main site section is turned off. */
export function SiteSectionNote({
    desktop = false,
    title,
    body,
    sectionId,
}: {
    desktop?: boolean;
    title?: string;
    body?: string;
    sectionId?: string;
}) {
    const heading = (title || '').trim();
    const copy = (body || '').trim();

    if (!heading && !copy) {
        return null;
    }

    return (
        <section
            id={sectionId}
            data-preview-reveal
            className={cn(
                'preview-reveal relative mx-auto max-w-xl px-5 py-10 text-center',
                desktop && 'px-10 py-12',
            )}
        >
            <div className="rounded-[1.5rem] border border-dashed border-[var(--w-accent)]/30 bg-[var(--w-surface)]/80 px-6 py-7">
                {heading ? (
                    <h3 className="font-serif text-[1.85rem] leading-tight font-light tracking-tight text-[var(--w-ink)]">
                        {heading}
                    </h3>
                ) : null}
                {copy ? (
                    <p
                        className={cn(
                            'text-sm leading-relaxed text-[var(--w-muted)]',
                            heading ? 'mt-3' : 'mt-0',
                        )}
                    >
                        {copy}
                    </p>
                ) : null}
            </div>
        </section>
    );
}

export function useSiteSectionState(key: ToggleableSiteSection): {
    enabled: boolean;
    note: SectionNote;
} {
    const live = usePreviewLive();
    const note = live?.sectionNotes?.[key] ?? { title: '', body: '' };

    return {
        enabled: isSiteSectionEnabled(live?.sections, key, true),
        note: {
            title: note.title || '',
            body: note.body || '',
        },
    };
}

/** Renders children when enabled; otherwise optional note. */
export function SiteSectionGate({
    sectionKey,
    desktop = false,
    sectionId,
    children,
}: {
    sectionKey: ToggleableSiteSection;
    desktop?: boolean;
    sectionId?: string;
    children: ReactNode;
}) {
    const { enabled, note } = useSiteSectionState(sectionKey);

    if (enabled) {
        return <>{children}</>;
    }

    return (
        <SiteSectionNote
            desktop={desktop}
            title={note.title}
            body={note.body}
            sectionId={sectionId}
        />
    );
}
