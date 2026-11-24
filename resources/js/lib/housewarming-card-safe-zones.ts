/**
 * Per-template blank-panel insets [top, right, bottom, left] as percentages.
 * Tuned card-by-card from artwork so copy stays on empty paper — never under art.
 */
export const HOUSEWARMING_CARD_SAFE_ZONES: Record<string, [number, number, number, number]> = {
    // House + key top-left; gold filigree corners.
    'key-corner-filigree': [20, 12, 12, 14],
    // Split peach/grey; cottage + trees bottom ~30%.
    'split-peach-cottage': [10, 12, 32, 12],
    // Keys/hands top-left; house bottom-right; gold frame.
    'keys-gold-frame': [22, 12, 26, 12],
    // Watercolor cottage header; blank lower ~45% — clear of fence/grass.
    'top-cottage-watercolor': [52, 12, 8, 12],
    // Palm villa bottom ~22%.
    'palm-villa': [10, 12, 26, 12],
    // Pink flowers top; pink house bottom.
    'pink-floral-cottage': [22, 12, 28, 12],
    // Linen; modern house + florals bottom.
    'linen-modern-house': [10, 12, 30, 12],
    // Linen; line-art house bottom-right.
    'linen-sketch-house': [10, 12, 36, 12],
    // Gold mandala top-right; garden home bottom.
    'mandala-garden-home': [16, 14, 34, 12],
    // Arched window panes as text panel; clear pink foliage on top-right.
    'foliage-gold-outline': [34, 34, 20, 22],
    // Parchment; sun top-right; family hearth bottom-left.
    'parchment-family-hearth': [14, 14, 30, 12],
    // Navy roses corners; blue house bottom.
    'navy-rose-bluehouse': [16, 14, 34, 14],
    // Blush canopy top; heart cottage bottom.
    'blush-heart-cottage': [22, 12, 28, 12],
    // Ink frame; leafy corner; house bottom-center.
    'ink-line-cottage': [16, 12, 24, 14],
    // Gold filigree top; country cottage bottom ~38%.
    'country-cottage-gold': [16, 12, 36, 12],
    // Upper cream blank; blue door scene bottom ~45%.
    'mediterranean-blue-door': [8, 12, 44, 12],
    // Mint arch; cottage bottom-right + foliage.
    'mint-arch-cottage': [18, 14, 32, 14],
    // Night cottage + moon/stars bottom.
    'night-moon-cottage': [10, 12, 28, 12],
    // Chimney cloud text bubble; house bottom.
    'chimney-cloud-cottage': [12, 12, 36, 12],
    // Peach blooms corners; cottage bottom-right.
    'peach-bloom-cottage': [16, 18, 26, 16],
};

/** Fraction of the card face that is blank (0–1), from the safe-zone insets. */
export function housewarmingBlankArea(styleKey: string | null | undefined): number {
    const [top, right, bottom, left] = HOUSEWARMING_CARD_SAFE_ZONES[styleKey ?? ''] ?? [14, 12, 28, 12];
    const height = Math.max(0.12, (100 - top - bottom) / 100);
    const width = Math.max(0.12, (100 - left - right) / 100);

    return height * width;
}

/**
 * Per-card fit budget: fill larger blanks, denser type in tight panes.
 * maxScale may exceed 1 so type grows into leftover empty space.
 */
export function housewarmingFitBudget(styleKey: string | null | undefined): {
    cushion: number;
    maxScale: number;
    dense: boolean;
} {
    const area = housewarmingBlankArea(styleKey);
    // area ~0.20 (window) → max ~1.05; ~0.50 (open field) → max ~1.45
    const maxScale = Math.min(1.48, Math.max(1.02, 0.78 + area * 1.35));
    const cushion = area < 0.26 ? 0.9 : area < 0.38 ? 0.93 : 0.96;

    return {
        cushion,
        maxScale,
        dense: area < 0.28,
    };
}

export function housewarmingSafeInset(styleKey: string | null | undefined, compact = false): string {
    const zone = HOUSEWARMING_CARD_SAFE_ZONES[styleKey ?? ''] ?? [14, 12, 28, 12];
    const pad = compact ? 1.0 : 0.8;

    return zone.map((value) => `${(value + pad).toFixed(1)}%`).join(' ');
}
