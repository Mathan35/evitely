/**
 * Per-template blank-center insets [top, right, bottom, left] as percentages.
 * Tuned from artwork detection + visual QA so copy stays in the empty panel only.
 */
export const BIRTHDAY_CARD_SAFE_ZONES: Record<string, [number, number, number, number]> = {
    'neon-glow': [26, 22, 32, 20],
    'midnight-velvet': [24, 16, 36, 22],
    'boho-sunset': [26, 28, 30, 18],
    'y2k-disco': [16, 20, 34, 28],
    'english-garden': [22, 26, 38, 26],
    'gold-leaf-40': [26, 20, 22, 22],
    'comic': [20, 26, 30, 24],
    'safari': [24, 22, 24, 24],
    'typographic': [18, 18, 22, 18],
    'balloon': [26, 22, 28, 26],
    'galaxy': [26, 22, 30, 24],
    'campfire': [22, 26, 30, 26],
    'brunch': [20, 22, 24, 24],
    'carnival': [24, 26, 28, 26],
    'cyberpunk': [22, 16, 28, 20],
    'jubilee': [24, 26, 30, 26],
    'pastel': [26, 26, 30, 26],
    'sea': [20, 24, 26, 24],
    'artsy': [26, 26, 28, 26],
    'ticket': [28, 26, 30, 26],
};

export function birthdaySafeInset(styleKey: string | null | undefined, compact = false): string {
    const zone = BIRTHDAY_CARD_SAFE_ZONES[styleKey ?? ''] ?? [24, 22, 28, 22];
    const pad = compact ? 1.4 : 0.8;

    return zone.map((value) => `${(value + pad).toFixed(1)}%`).join(' ');
}
