import { useEffect, useId, useState } from 'react';
import {
    AlignCenter,
    AlignCenterHorizontal,
    AlignCenterVertical,
    AlignLeft,
    AlignRight,
    Check,
    Minus,
    MoveHorizontal,
    MoveVertical,
    Pipette,
    Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    CARD_COLOR_PALETTES,
    CARD_FONT_OPTIONS,
    CARD_INK_COLORS,
    CARD_SIZE_PRESETS,
    CARD_WEIGHT_OPTIONS,
    cardFontStack,
    elementLabel,
} from '@/lib/card-editor';
import {
    EditorField,
    EditorNotice,
    EditorSelect,
    EditorTextArea,
    EditorTextInput,
} from '@/components/studio/editor-fields';
import { EditorColorControl, EditorPaletteCard } from '@/components/studio/editor-color-control';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import type { CardDocument, CardElement } from '@/types/wedding';

function normalizeContentHex(value?: string | null): string {
    if (!value) {
        return '#1c1712';
    }
    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
        return trimmed.toLowerCase();
    }
    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
        const [, a, b, c] = trimmed;
        return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
    }
    return /^#/.test(trimmed) ? trimmed : '#1c1712';
}

function isContentHex(value: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(value);
}

const toolbarControl = cn(
    'h-9 rounded-xl border-0 bg-white text-[12px] text-zinc-800 shadow-sm',
    'ring-1 ring-zinc-950/8 transition',
    'hover:bg-zinc-50 hover:ring-zinc-950/12',
    'focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-zinc-900/15',
);

function ContentFormatToolbar({
    current,
    onPatch,
}: {
    current: CardElement;
    onPatch: (id: string, values: Partial<CardElement>) => void;
}) {
    const colorInputId = useId();
    const pickerId = useId();
    const ink = normalizeContentHex(current.color);
    const [hexDraft, setHexDraft] = useState(ink);
    const fontOption =
        CARD_FONT_OPTIONS.find((option) => option.id === current.font || option.stack === current.font) ??
        CARD_FONT_OPTIONS[0];
    const fontSize = current.fontSize ?? 32;
    const align = current.align ?? 'center';
    const isBold = Number(current.fontWeight ?? 400) >= 600;
    useEffect(() => {
        setHexDraft(ink);
    }, [ink]);

    async function pickFromScreen(): Promise<void> {
        const EyeDropperCtor = (window as Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } })
            .EyeDropper;
        if (!EyeDropperCtor) {
            document.getElementById(pickerId)?.click();
            return;
        }
        try {
            const result = await new EyeDropperCtor().open();
            const next = normalizeContentHex(result.sRGBHex);
            setHexDraft(next);
            onPatch(current.id, { color: next });
        } catch {
            // cancelled
        }
    }

    function nudgeSize(delta: number): void {
        onPatch(current.id, { fontSize: Math.min(160, Math.max(10, fontSize + delta)) });
    }

    function applyColor(nextRaw: string): void {
        const next = normalizeContentHex(nextRaw);
        setHexDraft(next);
        onPatch(current.id, { color: next });
    }

    return (
        <div className="min-w-0 space-y-2.5 border-b border-zinc-100 bg-[#fafafa] px-3 py-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">Type</p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 uppercase">
                    Live
                </span>
            </div>

            <EditorSelect
                value={fontOption.id}
                onValueChange={(value) => onPatch(current.id, { font: value })}
                triggerStyle={{ fontFamily: fontOption.stack }}
                className={cn(toolbarControl, '!w-full min-w-0 justify-between px-3 text-[13px]')}
                options={CARD_FONT_OPTIONS.map((option) => ({
                    value: option.id,
                    label: option.label,
                    previewStyle: { fontFamily: option.stack, fontSize: 15 },
                }))}
            />

            <div className="grid min-w-0 grid-cols-2 gap-2">
                <EditorSelect
                    value={String(current.fontWeight ?? 400)}
                    onValueChange={(value) => onPatch(current.id, { fontWeight: Number(value) })}
                    className={cn(toolbarControl, '!w-full min-w-0 justify-between px-2.5')}
                    options={CARD_WEIGHT_OPTIONS.map((option) => ({
                        value: String(option.value),
                        label: option.label,
                    }))}
                />
                <div className="inline-flex h-9 min-w-0 items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-950/8">
                    <button
                        type="button"
                        aria-label="Decrease size"
                        className="inline-flex size-9 shrink-0 items-center justify-center text-zinc-600 transition hover:bg-zinc-50"
                        onClick={() => nudgeSize(-2)}
                    >
                        <Minus className="size-3.5" />
                    </button>
                    <EditorTextInput
                        className="h-9 min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 text-center text-[13px] font-semibold tabular-nums shadow-none ring-0 focus-visible:ring-0"
                        type="number"
                        min={10}
                        max={160}
                        value={fontSize}
                        onChange={(event) => onPatch(current.id, { fontSize: Number(event.target.value) })}
                    />
                    <span className="pr-1 text-[10px] font-medium tracking-wide text-zinc-400 uppercase">px</span>
                    <button
                        type="button"
                        aria-label="Increase size"
                        className="inline-flex size-9 shrink-0 items-center justify-center text-zinc-600 transition hover:bg-zinc-50"
                        onClick={() => nudgeSize(2)}
                    >
                        <Plus className="size-3.5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
                {CARD_SIZE_PRESETS.map((preset) => {
                    const active = fontSize === preset.value;
                    return (
                        <button
                            key={preset.value}
                            type="button"
                            title={`${preset.label} · ${preset.value}px`}
                            onClick={() => onPatch(current.id, { fontSize: preset.value })}
                            className={cn(
                                'inline-flex h-8 items-center justify-center rounded-lg text-[11px] font-semibold tracking-wide transition',
                                active
                                    ? 'bg-zinc-900 text-white shadow-sm'
                                    : 'bg-white text-zinc-600 ring-1 ring-zinc-950/8 hover:bg-zinc-50 hover:text-zinc-900',
                            )}
                        >
                            {preset.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex min-w-0 items-center gap-1.5">
                <label
                    htmlFor={pickerId}
                    className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-sm ring-1 ring-zinc-950/10 transition hover:ring-zinc-950/20"
                    title="Open color picker"
                >
                    <span className="absolute inset-0" style={{ backgroundColor: ink }} />
                    <input
                        id={pickerId}
                        type="color"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        value={isContentHex(ink) ? ink : '#1c1712'}
                        onChange={(event) => applyColor(event.target.value)}
                    />
                </label>
                <EditorTextInput
                    id={colorInputId}
                    value={hexDraft}
                    spellCheck={false}
                    className={cn(toolbarControl, 'min-w-[5.5rem] flex-1 px-2.5 font-mono text-[11px] uppercase')}
                    placeholder="#1C1712"
                    onChange={(event) => {
                        const next = event.target.value;
                        setHexDraft(next);
                        const normalized = normalizeContentHex(next);
                        if (isContentHex(normalized)) {
                            onPatch(current.id, { color: normalized });
                        }
                    }}
                    onBlur={() => {
                        const normalized = normalizeContentHex(hexDraft);
                        if (isContentHex(normalized)) {
                            setHexDraft(normalized);
                            onPatch(current.id, { color: normalized });
                        } else {
                            setHexDraft(ink);
                        }
                    }}
                />
                <button
                    type="button"
                    title="Pick from screen"
                    aria-label="Pick color from screen"
                    className={cn(toolbarControl, 'inline-flex size-9 shrink-0 items-center justify-center text-zinc-700')}
                    onClick={() => void pickFromScreen()}
                >
                    <Pipette className="size-3.5" />
                </button>
                <button
                    type="button"
                    title="Bold"
                    aria-label="Toggle bold"
                    aria-pressed={isBold}
                    onClick={() => onPatch(current.id, { fontWeight: isBold ? 400 : 700 })}
                    className={cn(
                        'inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold ring-1 transition',
                        isBold
                            ? 'bg-zinc-900 text-white ring-zinc-900'
                            : 'bg-white text-zinc-700 ring-zinc-950/8 hover:bg-zinc-50',
                    )}
                >
                    B
                </button>
                <div className="inline-flex h-9 shrink-0 items-center rounded-xl bg-white p-0.5 ring-1 ring-zinc-950/8">
                    {(
                        [
                            ['left', AlignLeft],
                            ['center', AlignCenter],
                            ['right', AlignRight],
                        ] as const
                    ).map(([value, Icon]) => (
                        <button
                            key={value}
                            type="button"
                            title={`Align ${value}`}
                            aria-label={`Align ${value}`}
                            aria-pressed={align === value}
                            onClick={() => onPatch(current.id, { align: value })}
                            className={cn(
                                'inline-flex size-7 items-center justify-center rounded-lg transition',
                                align === value
                                    ? 'bg-zinc-900 text-white'
                                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800',
                            )}
                        >
                            <Icon className="size-3.5" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
                {CARD_INK_COLORS.map((color) => {
                    const active = normalizeContentHex(current.color) === normalizeContentHex(color);
                    return (
                        <button
                            key={color}
                            type="button"
                            title={color}
                            aria-label={`Use ${color}`}
                            onClick={() => applyColor(color)}
                            className={cn(
                                'aspect-square w-full rounded-lg ring-1 transition',
                                active ? 'ring-2 ring-zinc-900 ring-offset-1' : 'ring-zinc-950/10 hover:ring-zinc-400',
                            )}
                            style={{ backgroundColor: color }}
                        >
                            {active ? <Check className="mx-auto size-2.5 stroke-[2.5] text-white mix-blend-difference" /> : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function NeedsSelection({ label }: { label: string }) {
    return (
        <EditorNotice>
            Select a layer on the card to edit {label}. Click any text or object in the canvas.
        </EditorNotice>
    );
}

function SelectedLayerChip({ current }: { current: CardElement | null }) {
    if (!current) {
        return null;
    }

    return (
        <div
            key={current.id}
            className="flex items-center gap-2.5 rounded-2xl bg-zinc-50 px-3.5 py-2.5 text-zinc-900 shadow-sm ring-1 ring-zinc-950/8 animate-in fade-in slide-in-from-top-1 zoom-in-95 fill-mode-both duration-300"
        >
            <span
                className="size-3.5 rounded-full ring-1 ring-zinc-950/10 transition-[background-color] duration-300"
                style={{ backgroundColor: current.color ?? current.background ?? '#c6a36a' }}
            />
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Selected layer</p>
                <p className="truncate text-[13px] font-semibold">{elementLabel(current)}</p>
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase ring-1 ring-zinc-950/8">
                {current.type}
            </span>
        </div>
    );
}

export function CardContentPanel({
    current,
    elements,
    selectedId,
    onSelect,
    onPatch,
    onDelete,
    onAddText,
}: {
    current: CardElement | null;
    elements: CardElement[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onPatch: (id: string, values: Partial<CardElement>) => void;
    onDelete: (id: string) => void;
    onAddText?: () => void;
}) {
    const editableLayers = elements.filter((element) => element.id !== 'art');
    const [pendingDelete, setPendingDelete] = useState<CardElement | null>(null);
    const editorKey = current?.id ?? 'none';

    return (
        <div className="mt-3 grid min-w-0 gap-3.5">
            <SelectedLayerChip current={current} />

            {current && (current.type === 'text' || current.type === 'qr' || current.type === 'video') ? (
                <div
                    key={editorKey}
                    className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-950/10"
                >
                    {current.type === 'text' ? (
                        <div>
                            <ContentFormatToolbar current={current} onPatch={onPatch} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3.5 py-2.5">
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                {current.type === 'qr' ? 'QR URL' : 'Video URL'}
                            </p>
                        </div>
                    )}

                    <div className="bg-white p-2.5">
                        <EditorTextArea
                            rows={current.type === 'text' ? 5 : 2}
                            value={current.text ?? ''}
                            onChange={(event) => onPatch(current.id, { text: event.target.value })}
                            className={cn(
                                'min-w-0 border-0 bg-[#fcfcfc] text-zinc-900 shadow-none ring-1 ring-zinc-950/6 transition duration-200',
                                'placeholder:text-zinc-400 focus-visible:bg-white focus-visible:ring-zinc-900/15',
                                current.type === 'text' && 'min-h-28 rounded-xl',
                            )}
                            style={
                                current.type === 'text'
                                    ? {
                                          fontFamily: cardFontStack(current.font),
                                          fontSize: Math.min(22, Math.max(14, Math.round((current.fontSize ?? 32) * 0.42))),
                                          color: current.color ?? '#1c1712',
                                          fontWeight: current.fontWeight ?? 400,
                                          textAlign: current.align ?? 'center',
                                          lineHeight: 1.45,
                                      }
                                    : undefined
                            }
                        />
                    </div>
                </div>
            ) : current ? (
                <div key={editorKey} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                    <EditorNotice>This layer has no text content. Switch to Colors or Layout.</EditorNotice>
                </div>
            ) : (
                <NeedsSelection label="content" />
            )}

            <div className="min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2 px-0.5">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Layers</p>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400">{editableLayers.length}</span>
                        {onAddText ? (
                            <button
                                type="button"
                                onClick={onAddText}
                                className="inline-flex h-7 items-center gap-1 rounded-full bg-zinc-900 px-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-zinc-800"
                            >
                                + Add text
                            </button>
                        ) : null}
                    </div>
                </div>
                <div className="max-h-56 min-w-0 space-y-1.5 overflow-y-auto overscroll-contain pr-0.5">
                    {editableLayers.length === 0 ? (
                        <p className="text-[12px] text-zinc-500">
                            No layers yet — tap <span className="font-semibold text-zinc-700">Add text</span> or use Export → Generate.
                        </p>
                    ) : (
                        editableLayers.map((element, index) => {
                            const active = element.id === selectedId;
                            return (
                                <div
                                    key={element.id}
                                    style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                                    className={cn(
                                        'flex items-center gap-2 rounded-2xl px-2.5 py-2 ring-1 transition-all duration-250',
                                        'animate-in fade-in slide-in-from-right-1 fill-mode-both',
                                        active
                                            ? 'scale-[1.01] bg-zinc-900 text-white shadow-md shadow-zinc-900/20 ring-zinc-900'
                                            : 'bg-zinc-50 ring-zinc-950/5 hover:bg-white hover:ring-zinc-950/10',
                                    )}
                                >
                                    <span
                                        className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10 transition-[background-color,transform] duration-300"
                                        style={{
                                            backgroundColor: element.color ?? element.background ?? '#d4d4d8',
                                            transform: active ? 'scale(1.25)' : undefined,
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="min-w-0 flex-1 truncate text-left text-[12px] font-semibold"
                                        onClick={() => onSelect(element.id)}
                                    >
                                        {elementLabel(element)}
                                    </button>
                                    <button
                                        type="button"
                                        className={cn('text-[11px] font-medium', active ? 'text-rose-200' : 'text-rose-600')}
                                        onClick={() => setPendingDelete(element)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={pendingDelete != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDelete(null);
                    }
                }}
                title="Remove this layer?"
                description={
                    pendingDelete
                        ? `“${elementLabel(pendingDelete)}” will be removed from the card. You can undo afterward.`
                        : undefined
                }
                confirmLabel="Remove layer"
                tone="danger"
                onConfirm={() => {
                    if (pendingDelete) {
                        onDelete(pendingDelete.id);
                        setPendingDelete(null);
                    }
                }}
            />
        </div>
    );
}

export function CardTypographyPanel({
    current,
    onPatch,
}: {
    current: CardElement | null;
    onPatch: (id: string, values: Partial<CardElement>) => void;
}) {
    if (!current || current.type !== 'text') {
        return (
            <div className="mt-4">
                <NeedsSelection label="typography on a text layer" />
            </div>
        );
    }

    const fontId =
        CARD_FONT_OPTIONS.find((option) => option.id === current.font || option.stack === current.font)?.id ??
        (current.font === 'serif' ? 'serif' : 'serif');

    const fontStack = cardFontStack(current.font);
    const fontSize = current.fontSize ?? 32;
    const sizePreset = CARD_SIZE_PRESETS.find((preset) => preset.value === fontSize);

    return (
        <div className="mt-4 grid gap-4">
            <SelectedLayerChip current={current} />

            <EditorField label="Font style">
                <EditorSelect
                    value={fontId}
                    onValueChange={(value) => onPatch(current.id, { font: value })}
                    triggerStyle={{ fontFamily: fontStack }}
                    options={CARD_FONT_OPTIONS.map((option) => ({
                        value: option.id,
                        label: option.label,
                        previewStyle: { fontFamily: option.stack, fontSize: 17 },
                    }))}
                />
            </EditorField>

            <EditorField label="Letter size">
                <EditorSelect
                    value={sizePreset ? String(sizePreset.value) : 'custom'}
                    onValueChange={(value) => {
                        if (value === 'custom') {
                            return;
                        }
                        onPatch(current.id, { fontSize: Number(value) });
                    }}
                    options={[
                        ...CARD_SIZE_PRESETS.map((preset) => ({
                            value: String(preset.value),
                            label: `${preset.label} · ${preset.value}px`,
                        })),
                        ...(!sizePreset ? [{ value: 'custom', label: `Custom · ${fontSize}px` }] : []),
                    ]}
                />
                <div className="mt-2 flex items-center gap-2">
                    <input
                        type="range"
                        min={10}
                        max={160}
                        value={fontSize}
                        onChange={(event) => onPatch(current.id, { fontSize: Number(event.target.value) })}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
                    />
                    <EditorTextInput
                        className="w-20"
                        type="number"
                        min={10}
                        max={160}
                        value={fontSize}
                        onChange={(event) => onPatch(current.id, { fontSize: Number(event.target.value) })}
                    />
                </div>
            </EditorField>

            <EditorField label="Weight">
                <EditorSelect
                    value={String(current.fontWeight ?? 400)}
                    options={CARD_WEIGHT_OPTIONS.map((option) => ({
                        value: String(option.value),
                        label: option.label,
                    }))}
                    onValueChange={(value) => onPatch(current.id, { fontWeight: Number(value) })}
                />
            </EditorField>

            <EditorField label="Align">
                <div className="grid grid-cols-3 gap-2">
                    {(
                        [
                            ['left', AlignLeft],
                            ['center', AlignCenter],
                            ['right', AlignRight],
                        ] as const
                    ).map(([align, Icon]) => (
                        <button
                            key={align}
                            type="button"
                            onClick={() => onPatch(current.id, { align })}
                            className={cn(
                                'inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[12px] font-semibold capitalize ring-1',
                                (current.align ?? 'center') === align
                                    ? 'bg-zinc-900 text-white ring-zinc-900'
                                    : 'bg-zinc-50 text-zinc-700 ring-zinc-950/5 hover:bg-white',
                            )}
                        >
                            <Icon className="size-3.5" />
                            {align}
                        </button>
                    ))}
                </div>
            </EditorField>

            <EditorField label="Letter spacing">
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min={-2}
                        max={24}
                        step={0.5}
                        value={current.letterSpacing ?? 0}
                        onChange={(event) => onPatch(current.id, { letterSpacing: Number(event.target.value) })}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
                    />
                    <EditorTextInput
                        className="w-20"
                        type="number"
                        step={0.5}
                        value={current.letterSpacing ?? 0}
                        onChange={(event) => onPatch(current.id, { letterSpacing: Number(event.target.value) })}
                    />
                </div>
            </EditorField>

            <p
                className="rounded-2xl bg-zinc-50 px-3.5 py-4 text-[15px] leading-relaxed ring-1 ring-zinc-950/5"
                style={{
                    fontFamily: cardFontStack(current.font),
                    fontWeight: current.fontWeight ?? 400,
                    letterSpacing: current.letterSpacing != null ? `${current.letterSpacing}px` : undefined,
                    color: current.color ?? '#1c1712',
                    textAlign: current.align ?? 'center',
                }}
            >
                {current.text?.slice(0, 72) || 'Your invitation line'}
            </p>
        </div>
    );
}

export function CardColorsPanel({
    current,
    document,
    onPatch,
    onDocument,
}: {
    current: CardElement | null;
    document: CardDocument;
    onPatch: (id: string, values: Partial<CardElement>) => void;
    onDocument: (next: CardDocument) => void;
}) {
    const sampleInk =
        current?.color ??
        (document.elements ?? []).find((element) => element.type === 'text' && element.color)?.color ??
        null;
    const activePalette = CARD_COLOR_PALETTES.find(
        (palette) => sampleInk != null && palette.ink.toLowerCase() === sampleInk.toLowerCase(),
    );

    function applyPalette(ink: string, accent: string): void {
        const nextElements = (document.elements ?? []).map((element) => {
            if (element.type === 'text' || element.type === 'qr' || element.type === 'video') {
                return { ...element, color: ink };
            }
            if (element.type === 'shape' || element.type === 'decoration' || element.type === 'icon') {
                return { ...element, background: accent };
            }
            return element;
        });
        onDocument({ ...document, elements: nextElements });
    }

    return (
        <div className="mt-4 grid gap-5">
            <SelectedLayerChip current={current} />

            <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Curated palettes</p>
                <div className="grid grid-cols-2 gap-2">
                    {CARD_COLOR_PALETTES.map((palette) => (
                        <EditorPaletteCard
                            key={palette.id}
                            name={palette.name}
                            paper={palette.paper}
                            ink={palette.ink}
                            accent={palette.accent}
                            active={activePalette?.id === palette.id}
                            onApply={() => applyPalette(palette.ink, palette.accent)}
                        />
                    ))}
                </div>
                <p className="px-0.5 text-[11px] leading-relaxed text-zinc-400">
                    Applies ink and accent fills across text and shape layers.
                </p>
            </div>

            {current ? (
                <>
                    <div className="h-px bg-zinc-100" />
                    {(current.type === 'text' || current.type === 'qr' || current.type === 'video') && (
                        <EditorColorControl
                            label="Ink / text color"
                            value={current.color}
                            presets={CARD_INK_COLORS}
                            hint="Selected layer"
                            onChange={(color) => onPatch(current.id, { color })}
                        />
                    )}

                    {(current.type === 'shape' || current.type === 'decoration' || current.type === 'icon') && (
                        <EditorColorControl
                            label="Fill color"
                            value={current.background}
                            presets={CARD_INK_COLORS}
                            hint="Selected layer"
                            onChange={(background) => onPatch(current.id, { background })}
                        />
                    )}

                    {current.type === 'image' && (
                        <EditorNotice>Image layers use their photo for color. Select text or a shape to recolor.</EditorNotice>
                    )}
                </>
            ) : (
                <EditorNotice>Select a text or shape layer to fine-tune ink and fills, or apply a palette above.</EditorNotice>
            )}
        </div>
    );
}

export function CardLayoutPanel({
    current,
    format,
    width,
    height,
    presets,
    onPatch,
    onFormat,
    onWidth,
    onHeight,
}: {
    current: CardElement | null;
    format: string;
    width: number;
    height: number;
    presets: { format: string; width: number; height: number; label: string }[];
    onPatch: (id: string, values: Partial<CardElement>) => void;
    onFormat: (format: string) => void;
    onWidth: (value: number) => void;
    onHeight: (value: number) => void;
}) {
    return (
        <div className="mt-4 grid gap-4">
            <SelectedLayerChip current={current} />

            <EditorField label="Card format" hint={`${width}×${height}`}>
                <EditorSelect
                    value={format}
                    options={presets.map((preset) => ({
                        value: preset.format,
                        label:
                            preset.format === 'custom'
                                ? preset.label
                                : `${preset.label} (${preset.width}×${preset.height})`,
                    }))}
                    onValueChange={onFormat}
                />
            </EditorField>
            <p className="rounded-2xl bg-zinc-50 px-3.5 py-3 text-[12px] leading-relaxed text-zinc-500 ring-1 ring-zinc-950/5">
                Switching format rebuilds the invitation layout for that size so copy stays clear and centered.
            </p>
            {format === 'custom' ? (
                <div className="grid grid-cols-2 gap-2">
                    <EditorField label="Width">
                        <EditorTextInput type="number" value={width} onChange={(event) => onWidth(Number(event.target.value))} />
                    </EditorField>
                    <EditorField label="Height">
                        <EditorTextInput type="number" value={height} onChange={(event) => onHeight(Number(event.target.value))} />
                    </EditorField>
                </div>
            ) : null}

            {current ? (
                <>
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Snap to card</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 justify-start gap-2 rounded-2xl"
                                onClick={() => onPatch(current.id, { x: Math.round((width - current.width) / 2) })}
                            >
                                <AlignCenterHorizontal className="size-3.5" />
                                Center X
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 justify-start gap-2 rounded-2xl"
                                onClick={() => onPatch(current.id, { y: Math.round((height - current.height) / 2) })}
                            >
                                <AlignCenterVertical className="size-3.5" />
                                Center Y
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 justify-start gap-2 rounded-2xl"
                                onClick={() => onPatch(current.id, { x: 48 })}
                            >
                                <MoveHorizontal className="size-3.5" />
                                Left pad
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 justify-start gap-2 rounded-2xl"
                                onClick={() => onPatch(current.id, { x: Math.max(0, width - current.width - 48) })}
                            >
                                <MoveVertical className="size-3.5 rotate-90" />
                                Right pad
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <EditorField label="X">
                            <EditorTextInput
                                type="number"
                                value={current.x}
                                onChange={(event) => onPatch(current.id, { x: Number(event.target.value) })}
                            />
                        </EditorField>
                        <EditorField label="Y">
                            <EditorTextInput
                                type="number"
                                value={current.y}
                                onChange={(event) => onPatch(current.id, { y: Number(event.target.value) })}
                            />
                        </EditorField>
                        <EditorField label="Width">
                            <EditorTextInput
                                type="number"
                                value={current.width}
                                onChange={(event) => onPatch(current.id, { width: Number(event.target.value) })}
                            />
                        </EditorField>
                        <EditorField label="Height">
                            <EditorTextInput
                                type="number"
                                value={current.height}
                                onChange={(event) => onPatch(current.id, { height: Number(event.target.value) })}
                            />
                        </EditorField>
                        <EditorField label="Rotation" className="col-span-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={-180}
                                    max={180}
                                    value={current.rotation ?? 0}
                                    onChange={(event) => onPatch(current.id, { rotation: Number(event.target.value) })}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
                                />
                                <EditorTextInput
                                    className="w-20"
                                    type="number"
                                    value={current.rotation ?? 0}
                                    onChange={(event) => onPatch(current.id, { rotation: Number(event.target.value) })}
                                />
                            </div>
                        </EditorField>
                    </div>
                </>
            ) : (
                <NeedsSelection label="position and size" />
            )}
        </div>
    );
}

export type CardArtOption = {
    id: string;
    label: string;
    src: string;
};

export function CardBackgroundPanel({
    document,
    onDocument,
    cardArts = [],
}: {
    document: CardDocument;
    onDocument: (next: CardDocument) => void;
    cardArts?: CardArtOption[];
}) {
    const current = (document.backgroundImage ?? '').trim();

    return (
        <div className="mt-4 grid gap-4">
            <EditorNotice>Optional full-bleed art behind your invitation copy — only arts for this event type.</EditorNotice>
            {cardArts.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                        Template arts · {cardArts.length}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                        {cardArts.map((art) => (
                            <button
                                key={art.id}
                                type="button"
                                onClick={() => onDocument({ ...document, backgroundImage: art.src })}
                                className={
                                    current === art.src
                                        ? 'overflow-hidden rounded-2xl text-left ring-2 ring-zinc-900'
                                        : 'overflow-hidden rounded-2xl text-left ring-1 ring-zinc-950/5 transition hover:ring-zinc-400'
                                }
                            >
                                <img src={art.src} alt="" className="aspect-[3/4] w-full object-cover" />
                                <span className="block truncate px-2 py-1.5 text-[11px] font-medium text-zinc-600">
                                    {art.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
            <EditorField label="Background image URL" hint="Optional">
                <EditorTextInput
                    value={document.backgroundImage ?? ''}
                    placeholder="https://…/art.jpg"
                    onChange={(event) => onDocument({ ...document, backgroundImage: event.target.value || null })}
                />
            </EditorField>
            <EditorField label="Upload background">
                <EditorTextInput
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                            return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => onDocument({ ...document, backgroundImage: String(reader.result) });
                        reader.readAsDataURL(file);
                    }}
                />
            </EditorField>
            {document.backgroundImage ? (
                <div className="overflow-hidden rounded-2xl ring-1 ring-zinc-950/10">
                    <img src={document.backgroundImage} alt="" className="h-28 w-full object-cover" />
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full rounded-none border-0 border-t"
                        onClick={() => onDocument({ ...document, backgroundImage: null })}
                    >
                        Clear background image
                    </Button>
                </div>
            ) : null}
        </div>
    );
}

export function CardExportPanel({
    status,
    exporting = null,
    onSave,
    onGenerate,
    onDownload,
    onShare,
    onPrint,
}: {
    status: 'idle' | 'saving' | 'saved';
    exporting?: 'png' | 'jpg' | 'pdf' | 'share' | null;
    onSave: () => void;
    onGenerate: () => void;
    onDownload: (kind: 'png' | 'jpg') => void;
    onShare: () => void;
    onPrint: () => void;
}) {
    const [confirmGenerate, setConfirmGenerate] = useState(false);
    const busy = exporting != null;

    return (
        <div className="mt-4 grid gap-3">
            <EditorNotice>
                PNG, JPG, and PDF download the card exactly as you see it — art, text, and QR included.
            </EditorNotice>
            <Button type="button" className="h-11 rounded-full" onClick={onSave} disabled={busy}>
                {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save card'}
            </Button>
            <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full"
                onClick={() => setConfirmGenerate(true)}
                disabled={busy}
            >
                Generate from event
            </Button>
            <div className="grid grid-cols-2 gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl"
                    disabled={busy}
                    onClick={() => onDownload('png')}
                >
                    {exporting === 'png' ? 'Preparing…' : 'PNG'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl"
                    disabled={busy}
                    onClick={() => onDownload('jpg')}
                >
                    {exporting === 'jpg' ? 'Preparing…' : 'JPG'}
                </Button>
                <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={onPrint} disabled={busy}>
                    {exporting === 'pdf' ? 'Preparing…' : 'PDF'}
                </Button>
                <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={onShare} disabled={busy}>
                    {exporting === 'share' ? 'Sharing…' : 'Share'}
                </Button>
            </div>

            <ConfirmDialog
                open={confirmGenerate}
                onOpenChange={setConfirmGenerate}
                title="Rebuild card from event?"
                description="This replaces the current card layout with a fresh invitation generated from your event details."
                confirmLabel="Generate card"
                tone="default"
                onConfirm={onGenerate}
            />
        </div>
    );
}
