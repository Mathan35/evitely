/**
 * Custom cards use full-bleed website photos (blurred). Copy sits in a centered panel.
 * Insets [top, right, bottom, left] as percentages.
 */
export const CUSTOM_CARD_SAFE_ZONES: Record<string, [number, number, number, number]> = {
    canvas: [14, 12, 14, 12],
    structured: [14, 12, 14, 12],
    collage: [14, 12, 14, 12],
    cyber: [14, 12, 14, 12],
    'sunset-art': [14, 12, 14, 12],
    opulence: [14, 12, 14, 12],
    playroom: [14, 12, 14, 12],
    barn: [14, 12, 14, 12],
    botanicals: [14, 12, 14, 12],
    noir: [14, 12, 14, 12],
    fusion: [14, 12, 14, 12],
    pop: [14, 12, 14, 12],
    loft: [14, 12, 14, 12],
    aviation: [14, 12, 14, 12],
    portfolio: [14, 12, 14, 12],
    silhouette: [14, 12, 14, 12],
    'next-project': [14, 12, 14, 12],
    'ivy-estate': [14, 12, 14, 12],
    splash: [14, 12, 14, 12],
    supper: [14, 12, 14, 12],
};

export function customBlankArea(styleKey: string | null | undefined): number {
    const [top, right, bottom, left] = CUSTOM_CARD_SAFE_ZONES[styleKey ?? ''] ?? [14, 12, 14, 12];
    const height = Math.max(0.12, (100 - top - bottom) / 100);
    const width = Math.max(0.12, (100 - left - right) / 100);

    return height * width;
}

export function customFitBudget(styleKey: string | null | undefined): {
    cushion: number;
    maxScale: number;
    dense: boolean;
} {
    const area = customBlankArea(styleKey);
    const maxScale = Math.min(1.35, Math.max(1.02, 0.82 + area * 1.1));
    const cushion = area < 0.45 ? 0.9 : 0.94;

    return {
        cushion,
        maxScale,
        dense: area < 0.4,
    };
}

export function customSafeInset(styleKey: string | null | undefined, compact = false): string {
    const zone = CUSTOM_CARD_SAFE_ZONES[styleKey ?? ''] ?? [14, 12, 14, 12];
    const pad = compact ? 1.0 : 0.8;

    return zone.map((value) => `${(value + pad).toFixed(1)}%`).join(' ');
}
