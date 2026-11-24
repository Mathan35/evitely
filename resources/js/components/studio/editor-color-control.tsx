import { useEffect, useId, useMemo, useState } from 'react';
import { Check, Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditorTextInput } from '@/components/studio/editor-fields';

function normalizeHex(value?: string | null): string {
    if (!value) {
        return '';
    }
    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
        return trimmed.toLowerCase();
    }
    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
        const [, a, b, c] = trimmed;
        return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
    }
    return trimmed;
}

function isHexColor(value: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(value);
}

function contrastInk(hex: string): string {
    const normalized = normalizeHex(hex);
    if (!isHexColor(normalized)) {
        return '#18181b';
    }
    const r = Number.parseInt(normalized.slice(1, 3), 16);
    const g = Number.parseInt(normalized.slice(3, 5), 16);
    const b = Number.parseInt(normalized.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? '#18181b' : '#ffffff';
}

export function EditorColorControl({
    label,
    value,
    onChange,
    presets,
    hint,
}: {
    label: string;
    value?: string | null;
    onChange: (color: string) => void;
    presets: readonly string[];
    hint?: string;
}) {
    const inputId = useId();
    const pickerId = useId();
    const hex = normalizeHex(value) || '#ffffff';
    const pickerValue = isHexColor(hex) ? hex : '#c6a36a';
    const [draft, setDraft] = useState(hex);

    useEffect(() => {
        setDraft(hex);
    }, [hex]);

    const display = useMemo(() => (draft || hex).toUpperCase(), [draft, hex]);

    async function pickFromScreen(): Promise<void> {
        const EyeDropperCtor = (window as Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
        if (!EyeDropperCtor) {
            document.getElementById(pickerId)?.click();
            return;
        }
        try {
            const result = await new EyeDropperCtor().open();
            const next = normalizeHex(result.sRGBHex);
            setDraft(next);
            onChange(next);
        } catch {
            // User cancelled eyedropper.
        }
    }

    return (
        <div className="grid gap-3">
            <div className="flex items-end justify-between gap-3 px-0.5">
                <label htmlFor={inputId} className="text-[11px] font-semibold tracking-[0.08em] text-zinc-500 uppercase">
                    {label}
                </label>
                {hint ? <span className="text-[11px] text-zinc-400">{hint}</span> : null}
            </div>

            <div
                className="relative overflow-hidden rounded-2xl ring-1 ring-zinc-950/10 shadow-sm"
                style={{ backgroundColor: pickerValue }}
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage:
                            'linear-gradient(45deg,#fff 25%,transparent 25%),linear-gradient(-45deg,#fff 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#fff 75%),linear-gradient(-45deg,transparent 75%,#fff 75%)',
                        backgroundSize: '12px 12px',
                        backgroundPosition: '0 0,0 6px,6px -6px,-6px 0',
                    }}
                    aria-hidden
                />
                <div className="relative flex items-center justify-between gap-3 px-3.5 py-3.5">
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: contrastInk(pickerValue) }}>
                            Active
                        </p>
                        <p className="mt-0.5 font-mono text-[15px] font-semibold tracking-wide" style={{ color: contrastInk(pickerValue) }}>
                            {display}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            title="Pick from screen"
                            aria-label="Pick color from screen"
                            onClick={() => void pickFromScreen()}
                            className="inline-flex size-9 items-center justify-center rounded-xl bg-black/25 text-white backdrop-blur transition hover:bg-black/35"
                        >
                            <Pipette className="size-4" />
                        </button>
                        <label
                            htmlFor={pickerId}
                            className="inline-flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-white/90 shadow-sm ring-1 ring-black/10"
                            title="Open color picker"
                        >
                            <span className="sr-only">Open color picker</span>
                            <span className="block size-5 rounded-md ring-1 ring-black/10" style={{ backgroundColor: pickerValue }} />
                            <input
                                id={pickerId}
                                type="color"
                                className="sr-only"
                                value={pickerValue}
                                onChange={(event) => {
                                    const next = normalizeHex(event.target.value);
                                    setDraft(next);
                                    onChange(next);
                                }}
                            />
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <EditorTextInput
                    id={inputId}
                    value={draft}
                    spellCheck={false}
                    className="font-mono uppercase"
                    placeholder="#F4EFE6"
                    onChange={(event) => {
                        const next = event.target.value;
                        setDraft(next);
                        const normalized = normalizeHex(next);
                        if (isHexColor(normalized)) {
                            onChange(normalized);
                        }
                    }}
                    onBlur={() => {
                        const normalized = normalizeHex(draft);
                        if (isHexColor(normalized)) {
                            setDraft(normalized);
                            onChange(normalized);
                        } else {
                            setDraft(hex);
                        }
                    }}
                />
            </div>

            <div className="grid grid-cols-5 gap-2">
                {presets.map((color) => {
                    const active = normalizeHex(value) === normalizeHex(color);
                    return (
                        <button
                            key={color}
                            type="button"
                            title={color}
                            aria-label={`Use ${color}`}
                            aria-pressed={active}
                            onClick={() => {
                                const next = normalizeHex(color);
                                setDraft(next);
                                onChange(next);
                            }}
                            className={cn(
                                'relative aspect-square rounded-xl ring-1 transition',
                                active ? 'ring-2 ring-zinc-900 ring-offset-2' : 'ring-zinc-950/10 hover:ring-zinc-400',
                            )}
                            style={{ backgroundColor: color }}
                        >
                            {active ? (
                                <span
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{ color: contrastInk(color) }}
                                >
                                    <Check className="size-3.5 stroke-[2.5]" />
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function EditorPaletteCard({
    name,
    paper,
    ink,
    accent,
    active,
    onApply,
}: {
    name: string;
    paper: string;
    ink: string;
    accent: string;
    active?: boolean;
    onApply: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onApply}
            aria-pressed={active}
            className={cn(
                'group overflow-hidden rounded-2xl text-left ring-1 transition',
                active
                    ? 'bg-zinc-900 text-white ring-zinc-900 shadow-md shadow-zinc-900/15'
                    : 'bg-zinc-50 ring-zinc-950/5 hover:bg-white hover:ring-zinc-950/10',
            )}
        >
            <div className="flex h-12 overflow-hidden">
                <span className="flex-1" style={{ backgroundColor: paper }} />
                <span className="w-8" style={{ backgroundColor: accent }} />
                <span className="w-10" style={{ backgroundColor: ink }} />
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-[12px] font-semibold">{name}</span>
                {active ? <Check className="size-3.5 shrink-0" /> : null}
            </div>
        </button>
    );
}
