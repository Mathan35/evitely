import type { GalleryDesign } from '@/types/gallery';

/**
 * Pair a website template with the matching invitation card from the same occasion.
 * Prefer exact style_key; otherwise map by position in the website list.
 */
export function matchedGalleryCard(
    website: GalleryDesign | null | undefined,
    cards: GalleryDesign[] | null | undefined,
    websiteIndex = 0,
): GalleryDesign | null {
    if (!website || !cards?.length) {
        return null;
    }

    const byKey = cards.find((card) => card.style_key === website.style_key);

    if (byKey) {
        return byKey;
    }

    const index = Math.max(0, websiteIndex);

    return cards[index % cards.length] ?? cards[0] ?? null;
}
