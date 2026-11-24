import type { LucideIcon } from 'lucide-react';
import {
    Download,
    ImageIcon,
    LayoutTemplate,
    Palette,
    Type,
    TypeOutline,
} from 'lucide-react';
import type { CardDocument, CardElement } from '@/types/wedding';

export type CardEditorSectionId =
    | 'content'
    | 'typography'
    | 'colors'
    | 'layout'
    | 'background'
    | 'export';

export type CardEditorSection = {
    id: CardEditorSectionId;
    label: string;
    hint: string;
    icon: LucideIcon;
};

export const CARD_EDITOR_SECTIONS: CardEditorSection[] = [
    { id: 'content', label: 'Content', hint: 'Text and selected layer copy', icon: Type },
    { id: 'typography', label: 'Typography', hint: 'Fonts, size, weight, align', icon: TypeOutline },
    { id: 'colors', label: 'Colors', hint: 'Ink, fills, and accents', icon: Palette },
    { id: 'layout', label: 'Layout', hint: 'Size, position, card format', icon: LayoutTemplate },
    { id: 'background', label: 'Background', hint: 'Background art image', icon: ImageIcon },
    { id: 'export', label: 'Export', hint: 'Download, generate, share', icon: Download },
];

/**
 * Remap layers when the card canvas size changes.
 * Maps the content bounding box into the new format's safe zone with
 * uniform scale (no squash) so every preset stays filled and readable.
 */
export function scaleCardDocument(
    document: CardDocument,
    fromWidth: number,
    fromHeight: number,
    toWidth: number,
    toHeight: number,
): CardDocument {
    if (fromWidth <= 0 || fromHeight <= 0 || toWidth <= 0 || toHeight <= 0) {
        return document;
    }
    if (fromWidth === toWidth && fromHeight === toHeight) {
        return document;
    }

    const layers = document.elements ?? [];
    if (layers.length === 0) {
        return document;
    }

    const minX = Math.min(...layers.map((element) => element.x));
    const minY = Math.min(...layers.map((element) => element.y));
    const maxX = Math.max(...layers.map((element) => element.x + element.width));
    const maxY = Math.max(...layers.map((element) => element.y + element.height));
    const contentWidth = Math.max(1, maxX - minX);
    const contentHeight = Math.max(1, maxY - minY);

    // Match invitation safe padding (~8%) so copy sits in the writing panel.
    const insetX = toWidth * 0.08;
    const insetY = toHeight * 0.08;
    const usableWidth = Math.max(1, toWidth - insetX * 2);
    const usableHeight = Math.max(1, toHeight - insetY * 2);
    const scale = Math.min(usableWidth / contentWidth, usableHeight / contentHeight);

    const scaledWidth = contentWidth * scale;
    const scaledHeight = contentHeight * scale;
    const offsetX = insetX + (usableWidth - scaledWidth) / 2;
    const offsetY = insetY + (usableHeight - scaledHeight) / 2;

    return {
        ...document,
        elements: layers.map((element) => ({
            ...element,
            x: Math.round((element.x - minX) * scale + offsetX),
            y: Math.round((element.y - minY) * scale + offsetY),
            width: Math.max(8, Math.round(element.width * scale)),
            height: Math.max(8, Math.round(element.height * scale)),
            fontSize:
                element.fontSize != null ? Math.max(8, Math.round(element.fontSize * scale)) : element.fontSize,
            letterSpacing:
                element.letterSpacing != null
                    ? Number((element.letterSpacing * scale).toFixed(2))
                    : element.letterSpacing,
        })),
    };
}

/** Fit a card into the editor stage without cropping tall or wide formats. */
export function cardStageFit(
    width: number,
    height: number,
    available?: { width?: number; height?: number } | null,
): { fitWidth: number; stageMaxWidth: number } {
    // Prefer filling the measured stage so invitation art isn't drowned in empty chrome.
    const maxW = Math.max(160, available?.width && available.width > 80 ? available.width : 820);
    const maxH = Math.max(180, available?.height && available.height > 80 ? available.height : 980);
    const scale = Math.min(1, maxW / Math.max(width, 1), maxH / Math.max(height, 1));
    const fitWidth = Math.max(120, Math.round(width * scale));
    return {
        fitWidth,
        stageMaxWidth: Math.max(fitWidth + 16, Math.min(maxW, fitWidth + 80)),
    };
}

export const CARD_FONT_OPTIONS = [
    { id: 'serif', label: 'Classic serif', stack: '"Cormorant Garamond", Georgia, serif' },
    { id: 'display', label: 'Display', stack: 'Fraunces, Georgia, serif' },
    { id: 'script', label: 'Script', stack: '"Segoe Script", "Apple Chancery", cursive' },
    { id: 'sans', label: 'Clean sans', stack: '"Instrument Sans", ui-sans-serif, system-ui, sans-serif' },
    { id: 'modern', label: 'Modern', stack: 'ui-sans-serif, system-ui, sans-serif' },
    { id: 'mono', label: 'Mono', stack: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
    { id: 'playfair', label: 'Playfair', stack: '"Playfair Display", Georgia, serif' },
    { id: 'vibes', label: 'Great Vibes', stack: '"Great Vibes", "Segoe Script", cursive' },
    { id: 'lora', label: 'Lora', stack: 'Lora, Georgia, serif' },
    { id: 'baskerville', label: 'Baskerville', stack: '"Libre Baskerville", Georgia, serif' },
    { id: 'cinzel', label: 'Cinzel', stack: 'Cinzel, "Times New Roman", serif' },
    { id: 'pinyon', label: 'Pinyon script', stack: '"Pinyon Script", "Segoe Script", cursive' },
    { id: 'montserrat', label: 'Montserrat', stack: 'Montserrat, ui-sans-serif, system-ui, sans-serif' },
    { id: 'josefin', label: 'Josefin', stack: '"Josefin Sans", ui-sans-serif, system-ui, sans-serif' },
    { id: 'garamond', label: 'EB Garamond', stack: '"EB Garamond", Georgia, serif' },
    { id: 'dancing', label: 'Dancing Script', stack: '"Dancing Script", "Segoe Script", cursive' },
    { id: 'parisienne', label: 'Parisienne', stack: 'Parisienne, "Segoe Script", cursive' },
    { id: 'italiana', label: 'Italiana', stack: 'Italiana, Georgia, serif' },
    { id: 'spectral', label: 'Spectral', stack: 'Spectral, Georgia, serif' },
    { id: 'alex', label: 'Alex Brush', stack: '"Alex Brush", "Segoe Script", cursive' },
] as const;

export const CARD_SIZE_PRESETS = [
    { label: 'Caption', value: 18 },
    { label: 'Body', value: 24 },
    { label: 'Lead', value: 32 },
    { label: 'Title', value: 44 },
    { label: 'Display', value: 64 },
    { label: 'Hero', value: 88 },
] as const;

export const CARD_WEIGHT_OPTIONS = [
    { label: 'Light', value: 300 },
    { label: 'Regular', value: 400 },
    { label: 'Medium', value: 500 },
    { label: 'Semibold', value: 600 },
    { label: 'Bold', value: 700 },
] as const;

export const CARD_INK_COLORS = [
    '#1c1712',
    '#2b241c',
    '#4a4036',
    '#7a7168',
    '#c6a36a',
    '#b08d57',
    '#8b3a3a',
    '#6b2d3c',
    '#2f4a3c',
    '#1e3a5f',
    '#ffffff',
    '#f4efe6',
] as const;

export const CARD_PAPER_COLORS = [
    '#f4efe6',
    '#fbf7f0',
    '#efe6d8',
    '#e8d7c0',
    '#f8f5f1',
    '#f3ebe3',
    '#1a1e28',
    '#2b241c',
    '#15201b',
    '#ffffff',
] as const;

export const CARD_COLOR_PALETTES = [
    { id: 'ivory-gold', name: 'Ivory & gold', paper: '#f4efe6', ink: '#1c1712', accent: '#c6a36a' },
    { id: 'blush', name: 'Blush soft', paper: '#f8f1ed', ink: '#5c3a3a', accent: '#d4a59a' },
    { id: 'sage', name: 'Garden sage', paper: '#f3f6f2', ink: '#24352c', accent: '#7a9a7e' },
    { id: 'navy', name: 'Midnight navy', paper: '#141a24', ink: '#f4efe6', accent: '#c6a36a' },
    { id: 'champagne', name: 'Champagne', paper: '#f7f0e4', ink: '#3a2f24', accent: '#b08d57' },
    { id: 'ink-white', name: 'Clean ink', paper: '#ffffff', ink: '#18181b', accent: '#71717a' },
] as const;

export function cardFontStack(font?: string | null): string {
    const match = CARD_FONT_OPTIONS.find((option) => option.id === font || option.stack === font);
    if (match) {
        return match.stack;
    }
    if (font && font.includes(',')) {
        return font;
    }
    return CARD_FONT_OPTIONS[0].stack;
}

export function elementLabel(element: CardElement): string {
    if (element.type === 'text') {
        const text = (element.text || 'Text').trim().replace(/\s+/g, ' ');
        return text.length > 28 ? `${text.slice(0, 28)}…` : text || 'Text';
    }
    if (element.type === 'qr') {
        return 'QR code';
    }
    return element.type.charAt(0).toUpperCase() + element.type.slice(1);
}
