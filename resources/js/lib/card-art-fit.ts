/**
 * Background object-fit for gallery invitation arts — mirrors InvitationCardFace / app.css.
 * Wedding + custom: cover. Blank-center occasions (birthday, …, corporate): contain.
 */
export function cardArtObjectFit(src: string | null | undefined): 'contain' | 'cover' {
    const path = (src || '').split('?')[0].toLowerCase();

    if (!path) {
        return 'cover';
    }

    // Custom website-photo cards always cover (blurred fill in InvitationCardFace).
    if (path.includes('/gallery/custom/') || path.includes('/custom/')) {
        return 'cover';
    }

    // Wedding blank / photo arts cover a 3∶4 face.
    if (path.includes('/gallery/wedding/') || path.includes('/wedding/')) {
        return 'cover';
    }

    // Blank-center occasions: contain so the full art (and writing panel) stays visible.
    if (
        /\/gallery\/(?:birthday|baby-shower|party|graduation|bridal-shower|housewarming|corporate)\//.test(path) ||
        /\/(?:birthday|baby-shower|party|graduation|bridal-shower|housewarming|corporate)\/blank\//.test(path)
    ) {
        return 'contain';
    }

    // Generic /blank/ under unknown trees — prefer contain (writing panel).
    if (path.includes('/blank/')) {
        return 'contain';
    }

    return 'cover';
}
