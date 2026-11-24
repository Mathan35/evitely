import type { CSSProperties } from 'react';

export type SiteBackgroundOption = {
    id: string;
    label: string;
    /** Soft page canvas */
    bg: string;
    /** Slightly deeper panels / cards */
    surface: string;
};

/**
 * Soft backgrounds that stay readable with typical dark ink + template accents.
 * “template” clears the override and restores the design’s default.
 */
export const SITE_BACKGROUND_OPTIONS: SiteBackgroundOption[] = [
    { id: 'template', label: 'Template default', bg: '', surface: '' },
    { id: 'mist', label: 'Soft mist', bg: '#f4f7f5', surface: '#e8eeea' },
    { id: 'cream', label: 'Warm cream', bg: '#faf7f2', surface: '#f0ebe3' },
    { id: 'blush', label: 'Blush wash', bg: '#faf2f0', surface: '#f3e6e3' },
    { id: 'peach', label: 'Soft peach', bg: '#fff5ef', surface: '#fceadf' },
    { id: 'butter', label: 'Soft butter', bg: '#fffbeb', surface: '#f7efd6' },
    { id: 'sage', label: 'Sage mist', bg: '#f2f6f2', surface: '#e4ede5' },
    { id: 'sky', label: 'Powder blue', bg: '#f2f6fa', surface: '#e4ecf4' },
    { id: 'lavender', label: 'Pale lilac', bg: '#f5f2f8', surface: '#ebe6f1' },
    { id: 'sand', label: 'Desert sand', bg: '#f7f3ec', surface: '#ebe3d6' },
    { id: 'slate', label: 'Cool gray', bg: '#f7f7f5', surface: '#ecece8' },
    { id: 'rose', label: 'Muted rose', bg: '#f8f1f3', surface: '#efe3e7' },
];

export type SiteThemeColors = {
    bg: string;
    surface: string;
    ink: string;
    accent: string;
    muted: string;
    buttonInk: string;
};

type Rgb = { r: number; g: number; b: number };

function clampByte(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHex({ r, g, b }: Rgb): string {
    return `#${[r, g, b].map((n) => clampByte(n).toString(16).padStart(2, '0')).join('')}`;
}

/** Parse #rgb / #rrggbb / rgb() / rgba() into sRGB channels. */
export function parseCssColor(color: string | null | undefined): Rgb | null {
    if (!color) {
        return null;
    }
    const value = color.trim().toLowerCase();

    if (value.startsWith('#')) {
        const hex = value.slice(1);
        if (/^[0-9a-f]{3}$/.test(hex)) {
            return {
                r: Number.parseInt(hex[0] + hex[0], 16),
                g: Number.parseInt(hex[1] + hex[1], 16),
                b: Number.parseInt(hex[2] + hex[2], 16),
            };
        }
        if (/^[0-9a-f]{6}$/.test(hex)) {
            return {
                r: Number.parseInt(hex.slice(0, 2), 16),
                g: Number.parseInt(hex.slice(2, 4), 16),
                b: Number.parseInt(hex.slice(4, 6), 16),
            };
        }
        return null;
    }

    const rgbMatch = value.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/);
    if (rgbMatch) {
        return {
            r: clampByte(Number.parseFloat(rgbMatch[1])),
            g: clampByte(Number.parseFloat(rgbMatch[2])),
            b: clampByte(Number.parseFloat(rgbMatch[3])),
        };
    }

    return null;
}

function channelLuminance(channel: number): number {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string | Rgb): number {
    const rgb = typeof color === 'string' ? parseCssColor(color) : color;
    if (!rgb) {
        return 1;
    }
    return 0.2126 * channelLuminance(rgb.r) + 0.7152 * channelLuminance(rgb.g) + 0.0722 * channelLuminance(rgb.b);
}

export function contrastRatio(foreground: string, background: string): number {
    const a = relativeLuminance(foreground);
    const b = relativeLuminance(background);
    const lighter = Math.max(a, b);
    const darker = Math.min(a, b);
    return (lighter + 0.05) / (darker + 0.05);
}

/** Solid ink that stays opaque and readable on the given canvas. */
export function contrastingInk(background: string): string {
    return relativeLuminance(background) > 0.55 ? '#18181b' : '#fafafa';
}

function mutedForInk(ink: string, background: string): string {
    const inkRgb = parseCssColor(ink);
    const bgRgb = parseCssColor(background);
    if (!inkRgb || !bgRgb) {
        return relativeLuminance(background) > 0.55 ? '#57534e' : '#a8a29e';
    }
    // Mix ink toward the canvas (~42%) so muted stays opaque, never translucent CSS opacity.
    return rgbToHex({
        r: inkRgb.r * 0.58 + bgRgb.r * 0.42,
        g: inkRgb.g * 0.58 + bgRgb.g * 0.42,
        b: inkRgb.b * 0.58 + bgRgb.b * 0.42,
    });
}

/**
 * Nudge a color darker/lighter until it clears a contrast floor against the canvas.
 * Falls back to solid ink if the hue cannot be rescued.
 */
export function ensureReadableOn(foreground: string, background: string, minRatio = 3.2): string {
    if (contrastRatio(foreground, background) >= minRatio) {
        return foreground;
    }

    const bgLum = relativeLuminance(background);
    const start = parseCssColor(foreground);
    if (!start) {
        return contrastingInk(background);
    }

    let { r, g, b } = start;
    for (let i = 0; i < 14; i += 1) {
        if (bgLum > 0.55) {
            r *= 0.82;
            g *= 0.82;
            b *= 0.82;
        } else {
            r += (255 - r) * 0.22;
            g += (255 - g) * 0.22;
            b += (255 - b) * 0.22;
        }
        const next = rgbToHex({ r, g, b });
        if (contrastRatio(next, background) >= minRatio) {
            return next;
        }
    }

    return contrastingInk(background);
}

export function siteBackgroundById(id: string | null | undefined): SiteBackgroundOption | null {
    if (!id) {
        return null;
    }
    return SITE_BACKGROUND_OPTIONS.find((option) => option.id === id) ?? null;
}

export function resolveSiteBackgroundOverride(
    siteBgId?: string | null,
    siteBg?: string | null,
    siteSurface?: string | null,
): { bg: string; surface: string } | null {
    const fromId = siteBackgroundById(siteBgId);
    if (fromId && fromId.id !== 'template' && fromId.bg) {
        return { bg: fromId.bg, surface: fromId.surface || fromId.bg };
    }

    const bg = (siteBg || '').trim();
    if (!bg || bg === 'template') {
        return null;
    }

    // Hex (or any CSS color) stored directly.
    if (bg.startsWith('#') || bg.startsWith('rgb') || bg.startsWith('hsl')) {
        const surface = (siteSurface || '').trim() || bg;
        return { bg, surface };
    }

    // Treat unknown ids as template default.
    return null;
}

/**
 * Build CSS vars for gallery website previews.
 * When a soft background override is active, ink / muted / accent / button ink are
 * rematched to the canvas so body copy never washes out or disappears.
 */
export function previewThemeCssVars(
    theme: SiteThemeColors,
    override?: { bg?: string | null; surface?: string | null } | null,
): CSSProperties {
    const hasOverride = Boolean(override?.bg?.trim());
    const bg = override?.bg?.trim() || theme.bg;
    const surface = override?.surface?.trim() || theme.surface || bg;

    if (!hasOverride) {
        return {
            '--w-bg': bg,
            '--w-surface': surface,
            '--w-ink': theme.ink,
            '--w-accent': theme.accent,
            '--w-muted': theme.muted,
            '--w-btn': theme.buttonInk,
        } as CSSProperties;
    }

    const ink =
        contrastRatio(theme.ink, bg) >= 4.5 && contrastRatio(theme.ink, surface) >= 4.2
            ? theme.ink
            : contrastingInk(bg);

    const muted =
        contrastRatio(theme.muted, bg) >= 3.2 && contrastRatio(theme.muted, surface) >= 3
            ? theme.muted
            : mutedForInk(ink, bg);

    const accent = ensureReadableOn(theme.accent, bg, 3.2);
    const accentForButtons = ensureReadableOn(accent, surface, 3);
    const buttonInk =
        contrastRatio(theme.buttonInk, accentForButtons) >= 3.5
            ? theme.buttonInk
            : contrastingInk(accentForButtons);

    return {
        '--w-bg': bg,
        '--w-surface': surface,
        '--w-ink': ink,
        '--w-accent': accentForButtons,
        '--w-muted': muted,
        '--w-btn': buttonInk,
    } as CSSProperties;
}
