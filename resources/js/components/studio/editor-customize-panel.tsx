import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeddingTheme } from '@/types/wedding';

const TEXTURE_OPTIONS = [
    { id: 'silk', label: 'Soft silk wash', swatch: 'linear-gradient(135deg, #f6efe4, #e8d7c0 45%, #d9c3a4)' },
    { id: 'linen', label: 'Warm linen', swatch: 'linear-gradient(135deg, #f3ece2, #e4d8c6 50%, #d2c2ad)' },
    { id: 'paper', label: 'Cream paper', swatch: 'linear-gradient(135deg, #fbf7f0, #efe6d8 55%, #e2d5c3)' },
    { id: 'marble', label: 'Pale marble', swatch: 'linear-gradient(135deg, #f8f5f1, #ebe4db 40%, #ddd3c7)' },
    { id: 'obsidian', label: 'Obsidian studio', swatch: 'linear-gradient(135deg, #1a1e28, #0c0f15 55%, #2a2430)' },
] as const;

export function EditorCustomizePanel({
    themes,
    themeId,
    onThemeChange,
    headingFont,
    bodyFont,
    onHeadingFontChange,
    onBodyFontChange,
    textureId,
    onTextureChange,
    formOpen,
    onFormOpenChange,
    formTitle,
    children,
}: {
    themes: WeddingTheme[];
    themeId: string;
    onThemeChange: (id: string) => void;
    headingFont: string;
    bodyFont: string;
    onHeadingFontChange: (value: string) => void;
    onBodyFontChange: (value: string) => void;
    textureId: string;
    onTextureChange: (id: string) => void;
    formOpen: boolean;
    onFormOpenChange: (open: boolean) => void;
    formTitle: string;
    children: ReactNode;
}) {
    const fonts = Array.from(
        new Set(themes.flatMap((theme) => [theme.headingFont, theme.bodyFont]).filter(Boolean)),
    );
    const texture = TEXTURE_OPTIONS.find((item) => item.id === textureId) ?? TEXTURE_OPTIONS[0];

    return (
        <aside className="flex w-[19.5rem] shrink-0 flex-col border-l border-white/[0.06] bg-[#12151c]/90 backdrop-blur-xl">
            <div className="border-b border-white/[0.06] px-5 py-4">
                <p className="text-[10px] font-medium tracking-[0.2em] text-[#8b93a7] uppercase">Studio</p>
                <p className="mt-1 font-[family-name:var(--font-display,'Fraunces',serif)] text-xl tracking-tight text-[#f0f2f7]">
                    Customize
                </p>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                <section>
                    <p className="text-[10px] font-medium tracking-[0.16em] text-[#8b93a7] uppercase">Typography</p>
                    <div className="mt-3 grid gap-2.5">
                        <label className="grid gap-1.5 text-xs text-[#8b93a7]">
                            Heading font
                            <select
                                className="h-10 rounded-xl border border-white/[0.08] bg-[#0c0f15] px-3 text-sm text-[#e8eaef]"
                                value={headingFont}
                                onChange={(event) => onHeadingFontChange(event.target.value)}
                            >
                                {fonts.map((font) => (
                                    <option key={font} value={font}>
                                        {font}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1.5 text-xs text-[#8b93a7]">
                            Body font
                            <select
                                className="h-10 rounded-xl border border-white/[0.08] bg-[#0c0f15] px-3 text-sm text-[#e8eaef]"
                                value={bodyFont}
                                onChange={(event) => onBodyFontChange(event.target.value)}
                            >
                                <option value={bodyFont}>Default Font</option>
                                {fonts
                                    .filter((font) => font !== bodyFont)
                                    .map((font) => (
                                        <option key={font} value={font}>
                                            {font}
                                        </option>
                                    ))}
                            </select>
                        </label>
                    </div>
                </section>

                <section>
                    <p className="text-[10px] font-medium tracking-[0.16em] text-[#8b93a7] uppercase">Theme colors</p>
                    <div className="mt-3 grid grid-cols-4 gap-2.5">
                        {themes.map((theme) => {
                            const active = theme.id === themeId;
                            return (
                                <button
                                    key={theme.id}
                                    type="button"
                                    title={theme.name}
                                    aria-label={theme.name}
                                    aria-pressed={active}
                                    onClick={() => onThemeChange(theme.id)}
                                    className={cn(
                                        'aspect-square rounded-xl border-2 transition',
                                        active
                                            ? 'border-[#d4a574] shadow-[0_0_0_2px_rgba(212,165,116,0.25)]'
                                            : 'border-transparent hover:border-white/20',
                                    )}
                                    style={{
                                        background: `linear-gradient(145deg, ${theme.backgroundColor}, ${theme.primaryColor} 55%, ${theme.secondaryColor})`,
                                    }}
                                />
                            );
                        })}
                    </div>
                </section>

                <section>
                    <p className="text-[10px] font-medium tracking-[0.16em] text-[#8b93a7] uppercase">Canvas atmosphere</p>
                    <div className="relative mt-3">
                        <select
                            className="h-12 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#0c0f15] py-2 pr-9 pl-12 text-sm text-[#e8eaef]"
                            value={texture.id}
                            onChange={(event) => onTextureChange(event.target.value)}
                        >
                            {TEXTURE_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <span
                            className="pointer-events-none absolute top-1/2 left-2.5 h-7 w-7 -translate-y-1/2 rounded-lg border border-white/10"
                            style={{ background: texture.swatch }}
                            aria-hidden
                        />
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#8b93a7]" />
                    </div>
                </section>

                <section className="rounded-2xl border border-white/[0.08] bg-[#0c0f15]/70">
                    <button
                        type="button"
                        onClick={() => onFormOpenChange(!formOpen)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                    >
                        <div>
                            <p className="text-[10px] font-medium tracking-[0.16em] text-[#8b93a7] uppercase">
                                Form settings
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-[#f0f2f7]">{formTitle}</p>
                        </div>
                        <ChevronDown
                            className={cn('h-4 w-4 text-[#8b93a7] transition', formOpen && 'rotate-180')}
                        />
                    </button>
                    {formOpen ? (
                        <div className="border-t border-white/[0.06] px-4 py-4 text-[#e8eaef] [&_label]:text-[#8b93a7] [&_input]:border-white/10 [&_input]:bg-[#12151c] [&_input]:text-[#e8eaef] [&_textarea]:border-white/10 [&_textarea]:bg-[#12151c] [&_textarea]:text-[#e8eaef] [&_select]:border-white/10 [&_select]:bg-[#12151c] [&_select]:text-[#e8eaef]">
                            {children}
                        </div>
                    ) : null}
                </section>
            </div>
        </aside>
    );
}
