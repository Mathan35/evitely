/**
 * Per-template blank-panel insets [top, right, bottom, left] as percentages.
 * Tuned card-by-card from artwork so copy stays on empty paper — never under art.
 */
export const BRIDAL_SHOWER_CARD_SAFE_ZONES: Record<string, [number, number, number, number]> = {
    // Blush filigree oval; corner blossoms.
    'blush-filigree': [16, 16, 18, 16],
    // Crystal oval; roses top-left + figurine bottom-right.
    'gold-crystal-oval': [18, 16, 24, 16],
    // Pink oval; flowers on oval edges.
    'pink-oval-rose': [16, 16, 22, 16],
    // Pearl/flower corners on champagne field.
    'pearl-vine': [18, 16, 22, 14],
    // Embossed left border + corner filigree in gold frame.
    'emboss-gold-panel': [16, 12, 16, 22],
    // Cream sculpted oval florals.
    'cream-oval-sculpt': [16, 16, 20, 16],
    // Ivory capsule with ornate corner flourishes.
    'ivory-capsule': [18, 14, 18, 14],
    // Anime bride left/mid; florals bottom — text top/right.
    'anime-bride': [10, 12, 42, 28],
    // Top florals; bride bottom-right; tulips bottom.
    'tulip-bride': [18, 14, 36, 14],
    // Pearl border; couple bottom-left.
    'pearl-couple': [16, 16, 28, 16],
    // Dense pearl/gold frame.
    'pearl-gold-frame': [14, 18, 14, 18],
    // Bride + rose bouquets bottom ~40%.
    'veil-roses': [10, 12, 42, 12],
    // Pink pajama party bottom; roses top corners.
    'pajama-blush': [18, 12, 34, 12],
    // Florals + pearl bow bottom half.
    'pearl-bow': [10, 12, 40, 12],
    // Ribbon/roses right & bottom — clear upper-left.
    'ribbon-right': [12, 32, 22, 12],
    // Cream floating panel; soft florals corners.
    'cream-panel': [14, 12, 18, 14],
    // Heavy left ribbon/rose column — blank on right.
    'left-ribbon': [10, 8, 12, 36],
    // Rose + pearl corner border.
    'rose-pearl': [18, 16, 18, 14],
    // Burgundy pajama group bottom-right; roses corners.
    'pajama-burgundy': [16, 14, 34, 16],
    // Marble + ribbon/pearl corners.
    'marble-ribbon': [16, 14, 18, 14],
};

export function bridalShowerSafeInset(styleKey: string | null | undefined, compact = false): string {
    const zone = BRIDAL_SHOWER_CARD_SAFE_ZONES[styleKey ?? ''] ?? [16, 14, 22, 14];
    const pad = compact ? 1.0 : 0.8;

    return zone.map((value) => `${(value + pad).toFixed(1)}%`).join(' ');
}
