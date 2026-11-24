import { useEffect, useId, useState } from 'react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Minus,
    Pipette,
    Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CARD_FONT_OPTIONS, CARD_INK_COLORS, cardFontStack } from '@/lib/card-editor';
import { EditorSelect } from '@/components/studio/editor-fields';
import type { CardElement } from '@/types/wedding';

function normalizeHex(value?: string | null): string {
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

function isHex(value: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(value);
}

/**
 * Floating on-canvas toolbar — sits to the right of the selected text layer.
 */
export function CardSelectionToolbar({
    current,
    onPatch,
    className,
}: {
    current: CardElement;
    onPatch: (id: string, values: Partial<CardElement>) => void;
    className?: string;
}) {
    const pickerId = useId();
    const ink = normalizeHex(current.color);
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
        const EyeDropperCtor = (
            window as Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }
        ).EyeDropper;
        if (!EyeDropperCtor) {
            document.getElementById(pickerId)?.click();
            return;
        }
        try {
            const result = await new EyeDropperCtor().open();
            const next = normalizeHex(result.sRGBHex);
            setHexDraft(next);
            onPatch(current.id, { color: next });
        } catch {
            // cancelled
        }
    }

    return (
        <div
            data-card-selection-toolbar
            className={cn(
                'pointer-events-auto flex w-max max-w-[15.5rem] flex-col gap-1.5 rounded-2xl border border-zinc-200/80',
                'bg-white/95 p-1.5 text-zinc-900 shadow-[0_18px_40px_-18px_rgba(24,24,27,0.45)] backdrop-blur-xl',
                className,
            )}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <EditorSelect
                value={fontOption.id}
                onValueChange={(value) => onPatch(current.id, { font: value })}
                triggerStyle={{ fontFamily: fontOption.stack }}
                className="!h-8 !w-full !rounded-xl !border-0 !bg-zinc-50 !px-2.5 !text-[12px] !shadow-none !ring-1 !ring-zinc-950/8 hover:!bg-zinc-100"
                options={CARD_FONT_OPTIONS.map((option) => ({
                    value: option.id,
                    label: option.label,
                    previewStyle: { fontFamily: option.stack, fontSize: 14 },
                }))}
            />

            <div className="inline-flex h-8 w-full items-center overflow-hidden rounded-xl bg-zinc-50 ring-1 ring-zinc-950/8">
                <button
                    type="button"
                    aria-label="Decrease size"
                    className="grid size-8 place-items-center text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                    onClick={() => onPatch(current.id, { fontSize: Math.max(10, fontSize - 2) })}
                >
                    <Minus className="size-3.5" />
                </button>
                <span className="min-w-0 flex-1 text-center text-[12px] font-semibold tabular-nums text-zinc-900">
                    {fontSize}
                </span>
                <button
                    type="button"
                    aria-label="Increase size"
                    className="grid size-8 place-items-center text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                    onClick={() => onPatch(current.id, { fontSize: Math.min(160, fontSize + 2) })}
                >
                    <Plus className="size-3.5" />
                </button>
            </div>

            <div className="flex items-center gap-1">
                <ToolIcon
                    label="Bold"
                    pressed={isBold}
                    onClick={() => onPatch(current.id, { fontWeight: isBold ? 400 : 700 })}
                >
                    <Bold className="size-3.5" />
                </ToolIcon>

                <div className="inline-flex h-8 flex-1 items-center justify-between rounded-xl bg-zinc-50 p-0.5 ring-1 ring-zinc-950/8">
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
                                'grid size-7 place-items-center rounded-lg transition',
                                align === value ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-white hover:text-zinc-900',
                            )}
                        >
                            <Icon className="size-3.5" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-1">
                <label
                    htmlFor={pickerId}
                    className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-zinc-950/10"
                    title="Color"
                >
                    <span className="absolute inset-0" style={{ backgroundColor: ink }} />
                    <input
                        id={pickerId}
                        type="color"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        value={isHex(ink) ? ink : '#1c1712'}
                        onChange={(event) => {
                            const next = normalizeHex(event.target.value);
                            setHexDraft(next);
                            onPatch(current.id, { color: next });
                        }}
                    />
                </label>

                <button
                    type="button"
                    title="Pick from screen"
                    aria-label="Pick color from screen"
                    className="grid size-8 place-items-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                    onClick={() => void pickFromScreen()}
                >
                    <Pipette className="size-3.5" />
                </button>

                <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
                    {CARD_INK_COLORS.slice(0, 5).map((color) => {
                        const active = normalizeHex(current.color) === normalizeHex(color);
                        return (
                            <button
                                key={color}
                                type="button"
                                title={color}
                                aria-label={`Use ${color}`}
                                onClick={() => {
                                    setHexDraft(normalizeHex(color));
                                    onPatch(current.id, { color: normalizeHex(color) });
                                }}
                                className={cn(
                                    'size-5 rounded-full ring-1 transition',
                                    active ? 'ring-2 ring-zinc-900 ring-offset-1' : 'ring-zinc-950/15 hover:scale-110',
                                )}
                                style={{ backgroundColor: color }}
                            />
                        );
                    })}
                </div>
            </div>

            <span className="sr-only" style={{ fontFamily: cardFontStack(current.font) }}>
                {hexDraft}
            </span>
        </div>
    );
}

function ToolIcon({
    label,
    pressed,
    onClick,
    children,
}: {
    label: string;
    pressed?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
                'grid size-8 place-items-center rounded-xl transition',
                pressed ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-600 ring-1 ring-zinc-950/8 hover:bg-zinc-100 hover:text-zinc-900',
            )}
        >
            {children}
        </button>
    );
}
