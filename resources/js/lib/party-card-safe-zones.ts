/**
 * Per-template blank-panel insets [top, right, bottom, left] as percentages.
 * Tuned card-by-card from artwork so copy stays on empty paper — never under art.
 */
export const PARTY_CARD_SAFE_ZONES: Record<string, [number, number, number, number]> = {
    // Party hats + confetti frame; open teardrop center.
    'confetti-hats': [16, 18, 18, 18],
    // Rainbow ribbons/stars border; thin white frame.
    'ribbon-stars': [14, 16, 16, 16],
    // Bunting top; side balloons; corner bouquets.
    'bunting-balloons': [20, 18, 22, 18],
    // Ribbon bows top; dinner table bottom-left.
    'sketch-dinner': [16, 14, 32, 16],
    // Dense gold/pink balloons top & sides; floor confetti.
    'balloon-blush': [26, 22, 18, 22],
    // Disco balls + ribbon top; side icons; table bottom.
    'disco-sketch': [22, 22, 28, 22],
    // Empty linen top; table + roses bottom ~30%.
    'linen-feast': [12, 12, 32, 12],
    // Leaf top-left; formal table bottom ~25%.
    'garden-table': [12, 12, 28, 12],
    // Arch peak + hanging lanterns; floor lanterns/urns.
    'classical-arch': [18, 16, 22, 16],
    // Disco/glasses corners; bottle + pasta bottom.
    'navy-icons': [20, 14, 26, 14],
    // Balloons top; gift + cake bottom.
    'gift-cake': [24, 14, 26, 14],
    // Rose-gold frame; champagne bottle bottom-left.
    'rose-gold': [14, 14, 18, 14],
    // Bunting + balloons top; gifts/cupcakes bottom.
    'watercolor-gifts': [20, 14, 30, 14],
    // Cherry blossom arch; florals intrude sides/corners.
    'blossom-arch': [18, 18, 22, 18],
    // Gold arch + hanging lanterns; floor lanterns.
    'lantern-drape': [28, 18, 22, 18],
    // Glowing scalloped arch; florals + floor candles.
    'peach-arch': [24, 16, 20, 16],
    // Pink bunting; cake/hat/lollipops bottom.
    'pink-party': [16, 14, 32, 14],
    // Grazing table bottom-left heavy; cocktails sides.
    'cocktail-spread': [16, 14, 28, 18],
    // Banner lights top; charcuterie/bottles bottom.
    'feast-lights': [24, 18, 28, 18],
    // Baked "You are Invited!" header — start below swoosh.
    'confetti-flags': [28, 14, 12, 14],
};

export function partySafeInset(styleKey: string | null | undefined, compact = false): string {
    const zone = PARTY_CARD_SAFE_ZONES[styleKey ?? ''] ?? [18, 14, 24, 14];
    const pad = compact ? 1.0 : 0.8;

    return zone.map((value) => `${(value + pad).toFixed(1)}%`).join(' ');
}
