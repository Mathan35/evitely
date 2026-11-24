/** Core site blocks that hosts can turn off in Site editing. */
export const TOGGLEABLE_SITE_SECTIONS = [
    'gallery',
    'venue',
    'guests',
    'story',
    'countdown',
    'rsvp',
    'guestbook',
] as const;

export type ToggleableSiteSection = (typeof TOGGLEABLE_SITE_SECTIONS)[number];

export type SectionNote = {
    title: string;
    body: string;
};

export const SECTION_NOTE_DETAIL_KEYS: Record<
    ToggleableSiteSection,
    { title: string; body: string }
> = {
    gallery: {
        title: 'section_note_gallery_title',
        body: 'section_note_gallery_body',
    },
    venue: {
        title: 'section_note_venue_title',
        body: 'section_note_venue_body',
    },
    guests: {
        title: 'section_note_guests_title',
        body: 'section_note_guests_body',
    },
    story: {
        title: 'section_note_story_title',
        body: 'section_note_story_body',
    },
    countdown: {
        title: 'section_note_countdown_title',
        body: 'section_note_countdown_body',
    },
    rsvp: {
        title: 'section_note_rsvp_title',
        body: 'section_note_rsvp_body',
    },
    guestbook: {
        title: 'section_note_guestbook_title',
        body: 'section_note_guestbook_body',
    },
};

export const SECTION_TOGGLE_META: Record<
    ToggleableSiteSection,
    { label: string; hint: string; noteHint: string }
> = {
    gallery: {
        label: 'Show photos on the site',
        hint: 'Gallery mosaic / photo wall guests see on the invitation.',
        noteHint: 'Optional short message when photos are hidden (e.g. “Album coming soon”).',
    },
    venue: {
        label: 'Show location on the site',
        hint: 'Itinerary and venue cards on the invitation.',
        noteHint: 'Optional short message when location is hidden (e.g. “Venue shared privately”).',
    },
    guests: {
        label: 'Show guest showcase on the site',
        hint: 'Public “Who is coming” list — not your private Guests / RSVP book.',
        noteHint: 'Optional short message when the showcase is hidden.',
    },
    story: {
        label: 'Show our story',
        hint: 'Story / about section on the invitation.',
        noteHint: 'Optional short message when the story is hidden.',
    },
    countdown: {
        label: 'Show countdown',
        hint: 'Live timer guests see counting down to the day.',
        noteHint: 'Optional short message when the countdown is hidden.',
    },
    rsvp: {
        label: 'Show RSVP on the site',
        hint: 'Reply buttons, form, and RSVP CTAs for guests.',
        noteHint: 'Optional short message when RSVP is hidden (e.g. “Reply by WhatsApp”).',
    },
    guestbook: {
        label: 'Show guestbook / wishes',
        hint: 'Public messages and blessings wall for guests.',
        noteHint: 'Optional short message when guestbook is hidden.',
    },
};

/** Sections default ON when unset (existing sites keep current behavior). */
export function isSiteSectionEnabled(
    sections: Record<string, boolean> | null | undefined,
    key: ToggleableSiteSection | string,
    defaultOn = true,
): boolean {
    if (!sections || !(key in sections)) {
        return defaultOn;
    }

    return sections[key] !== false;
}

export function sectionNoteFromDetails(
    details: Record<string, string> | null | undefined,
    key: ToggleableSiteSection,
): SectionNote {
    const keys = SECTION_NOTE_DETAIL_KEYS[key];
    return {
        title: (details?.[keys.title] || '').trim(),
        body: (details?.[keys.body] || '').trim(),
    };
}

export function sectionNotesFromDetails(
    details: Record<string, string> | null | undefined,
): Partial<Record<ToggleableSiteSection, SectionNote>> {
    return {
        gallery: sectionNoteFromDetails(details, 'gallery'),
        venue: sectionNoteFromDetails(details, 'venue'),
        guests: sectionNoteFromDetails(details, 'guests'),
        story: sectionNoteFromDetails(details, 'story'),
        countdown: sectionNoteFromDetails(details, 'countdown'),
        rsvp: sectionNoteFromDetails(details, 'rsvp'),
        guestbook: sectionNoteFromDetails(details, 'guestbook'),
    };
}

/** Location panel also mirrors venue → events/map for classic + gallery layouts. */
export function locationSectionPatch(enabled: boolean): Record<string, boolean> {
    return {
        venue: enabled,
        events: enabled,
        map: enabled,
    };
}

/** Hide gallery / itinerary / venue / guests nav when those site blocks are off. */
export function filterSiteNavItems<T extends { id: string }>(
    items: readonly T[],
    sections: Record<string, boolean> | null | undefined,
): T[] {
    return items.filter((item) => {
        const id = item.id.toLowerCase();

        if (id === 'gallery' || id === 'photos') {
            return isSiteSectionEnabled(sections, 'gallery');
        }

        if (id === 'itinerary' || id === 'venue' || id === 'location' || id === 'schedule') {
            return isSiteSectionEnabled(sections, 'venue');
        }

        if (id === 'guests' || id === 'guest-list' || id === 'guestlist') {
            return isSiteSectionEnabled(sections, 'guests');
        }

        if (id === 'rsvp') {
            return isSiteSectionEnabled(sections, 'rsvp');
        }

        if (id === 'story' || id === 'our-story') {
            return isSiteSectionEnabled(sections, 'story');
        }

        if (id === 'countdown' || id === 'timer') {
            return isSiteSectionEnabled(sections, 'countdown');
        }

        return true;
    });
}
