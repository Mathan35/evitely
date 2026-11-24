/**
 * Per-template blank-panel insets [top, right, bottom, left] as percentages.
 * Tuned card-by-card from artwork so copy stays on empty paper — never under art.
 */
export const GRADUATION_CARD_SAFE_ZONES: Record<string, [number, number, number, number]> = {
    // Kraft scrap sheet; binder clip top; star + camera bottom-right.
    'kraft-scrap': [16, 16, 22, 16],
    // Beige fade over classroom photo (~bottom 25%).
    'classroom-fade': [10, 12, 30, 12],
    // Grey-blue panel over chalkboard classroom (~bottom 40%).
    'chalkboard-rows': [10, 12, 42, 12],
    // Corner books + side tags around cream panel.
    'autumn-books': [18, 16, 18, 16],
    // Bookshelf sides; book stacks bottom corners.
    'library-shelves': [10, 20, 22, 20],
    // Stationery corners; organic cream center.
    'stationery-desk': [24, 18, 24, 18],
    // Autumn leaves top; backpack + books bottom.
    'backpack-autumn': [18, 16, 28, 16],
    // Bunting + airplanes top; school objects bottom.
    'school-bunting': [20, 16, 22, 16],
    // Students top-right + bottom-left; cloud blank center.
    'students-horizon': [22, 14, 28, 14],
    // Cap top-center; diploma bottom-center; side confetti.
    'cap-diploma': [24, 14, 18, 14],
    // Leaves top; books/glasses/quill bottom.
    'scholarly-desk': [14, 12, 32, 12],
    // Cap/books corners; side banners + pencil cup.
    'doodle-dreams': [16, 22, 22, 22],
    // Leaves top; book-tree + kids bottom ~35%.
    'book-tree': [18, 12, 36, 12],
    // Cap/scroll top; florals + book stack bottom.
    'gold-florals': [26, 16, 24, 16],
    // Floral top; graduate figure bottom-left.
    'yellow-graduate': [22, 12, 32, 14],
    // Cap top-left; gold bow bottom-right; gold frame.
    'gold-ribbon': [20, 14, 18, 14],
    // Cap top-center; florals bottom; embossed frame.
    'damask-cap': [24, 12, 22, 12],
    // Leaves top; books + cap + roses bottom-right.
    'rose-books': [18, 12, 30, 12],
    // Filigree corners; cap + diploma bottom-right heavy.
    'navy-filigree': [16, 14, 32, 12],
    // Green chalkboard panel; desks fill bottom third.
    'chalk-classroom': [20, 16, 40, 16],
};

export function graduationSafeInset(styleKey: string | null | undefined, compact = false): string {
    const zone = GRADUATION_CARD_SAFE_ZONES[styleKey ?? ''] ?? [18, 14, 26, 14];
    const pad = compact ? 1.0 : 0.8;

    return zone.map((value) => `${(value + pad).toFixed(1)}%`).join(' ');
}
