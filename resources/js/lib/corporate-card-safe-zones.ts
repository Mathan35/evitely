/**
 * Per-template blank-panel insets [top, right, bottom, left] as percentages.
 * Tuned card-by-card from artwork so copy stays on empty paper — never under art.
 */
export const CORPORATE_CARD_SAFE_ZONES: Record<string, [number, number, number, number]> = {
    // Blueprint table center; people around edges.
    'boardroom-blueprint': [18, 22, 18, 22],
    // Yellow top band; raised hands + waves bottom.
    'celebration-hands-wave': [14, 12, 28, 12],
    // Purple frame; office team bottom ~30%.
    'purple-office-team': [14, 12, 34, 12],
    // Peach office scene bottom/mid — blank upper.
    'peach-office-desk': [10, 12, 48, 12],
    // Online cert illustration bottom-left.
    'online-cert-desk': [10, 12, 32, 14],
    // Four corner tech/exam icons.
    'corner-tech-exam': [22, 18, 24, 18],
    // Sage math doodle oval frame.
    'math-sage-oval': [18, 16, 20, 16],
    // Book logos top; readers bottom-right.
    'book-forum-readers': [18, 14, 30, 14],
    // Megaphone bottom-right; triangles corners.
    'megaphone-announce': [14, 14, 28, 14],
    // Exam badge top-right; PC bottom-left.
    'exam-pc-corners': [18, 18, 28, 16],
    // Cream card on blue; people bottom-right; binder holes left.
    'blue-binder-circle': [14, 14, 34, 16],
    // Workspace hands bottom ~35%.
    'desk-workspace-hands': [12, 14, 38, 14],
    // Tech desk / headphones bottom; side icons.
    'tech-desk-blue': [18, 16, 36, 16],
    // Skyline + team silhouettes bottom ~45%.
    'skyline-team-v': [10, 12, 48, 12],
    // Handshake flare bottom; silk top.
    'handshake-flare': [18, 12, 40, 12],
    // Stationery corner doodles.
    'stationery-cream-frame': [16, 14, 18, 14],
    // Chart icons corners; growth arrow bottom-right.
    'mint-chart-growth': [16, 14, 28, 14],
    // Ink gadget frame around blank center.
    'ink-desk-gadgets': [18, 16, 22, 16],
    // Gear/bulb/books corner icons.
    'gear-bulb-frame': [16, 14, 22, 14],
    // Presentation header; left icon column; blue footer.
    'presentation-torn-header': [36, 12, 16, 28],
};

/** Fraction of the card face that is blank (0–1), from the safe-zone insets. */
export function corporateBlankArea(styleKey: string | null | undefined): number {
    const [top, right, bottom, left] = CORPORATE_CARD_SAFE_ZONES[styleKey ?? ''] ?? [14, 12, 28, 12];
    const height = Math.max(0.12, (100 - top - bottom) / 100);
    const width = Math.max(0.12, (100 - left - right) / 100);

    return height * width;
}

/**
 * Per-card fit budget: fill larger blanks, denser type in tight panes.
 * maxScale may exceed 1 so type grows into leftover empty space.
 */
export function corporateFitBudget(styleKey: string | null | undefined): {
    cushion: number;
    maxScale: number;
    dense: boolean;
} {
    const area = corporateBlankArea(styleKey);
    const maxScale = Math.min(1.48, Math.max(1.02, 0.78 + area * 1.35));
    const cushion = area < 0.26 ? 0.9 : area < 0.38 ? 0.93 : 0.96;

    return {
        cushion,
        maxScale,
        dense: area < 0.28,
    };
}

export function corporateSafeInset(styleKey: string | null | undefined, compact = false): string {
    const zone = CORPORATE_CARD_SAFE_ZONES[styleKey ?? ''] ?? [14, 12, 28, 12];
    const pad = compact ? 1.0 : 0.8;

    return zone.map((value) => `${(value + pad).toFixed(1)}%`).join(' ');
}
