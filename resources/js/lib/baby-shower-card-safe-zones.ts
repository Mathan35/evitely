/**
 * Per-template blank-panel insets [top, right, bottom, left] as percentages.
 * Tuned card-by-card from artwork so copy stays on empty paper — never under art.
 */
export const BABY_SHOWER_CARD_SAFE_ZONES: Record<string, [number, number, number, number]> = {
    // Dashed white panel; animals/paws hug the frame.
    woodland: [28, 26, 28, 26],
    // Purple border art; heavy bottom band.
    cloudland: [20, 20, 36, 20],
    olive: [22, 14, 30, 14],
    // Bow top-center; family covers bottom-right of arch.
    terracotta: [20, 14, 28, 12],
    safari: [14, 12, 32, 14],
    celestial: [18, 10, 28, 14],
    'minimal-teddy': [16, 16, 28, 18],
    balloon: [20, 10, 22, 18],
    // Balloons top corners; family + nursery scene dominate bottom half.
    eucalyptus: [14, 10, 44, 10],
    stars: [14, 10, 26, 18],
    // Clothesline top; children + bassinet bottom.
    jungle: [18, 10, 42, 10],
    'retro-love': [24, 10, 30, 10],
    // Hammock/baby top; balloon + florals bottom.
    picnic: [22, 10, 36, 10],
    giraffe: [12, 16, 22, 16],
    'floral-bloom': [20, 10, 32, 10],
    // Hanging branches top; rug / balloons / pumpkins bottom.
    geometric: [14, 12, 34, 12],
    // Woman left; ornate right frame; teddy/flowers under frame.
    ocean: [12, 8, 30, 36],
    // Balloon/cloud border; teddy on bottom cloud.
    forest: [12, 12, 26, 12],
    sage: [16, 16, 28, 18],
    // Side clouds; teddy + BOY blocks at bottom.
    watercolor: [14, 14, 26, 14],
};

export function babyShowerSafeInset(styleKey: string | null | undefined, compact = false): string {
    const zone = BABY_SHOWER_CARD_SAFE_ZONES[styleKey ?? ''] ?? [18, 12, 28, 12];
    const pad = compact ? 1.0 : 0.8;

    return zone.map((value) => `${(value + pad).toFixed(1)}%`).join(' ');
}
