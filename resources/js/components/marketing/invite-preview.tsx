export type ThemeSwatch = {
    id: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
};

export type InvitePreviewContent = {
    partnerOne?: string;
    partnerTwo?: string;
    date?: string;
    place?: string;
    events?: string[];
    /** Eyebrow above the names — defaults to theme name */
    label?: string;
    /** Single-name occasions (birthday, graduation, etc.) */
    headline?: string;
};

export function InvitePreview({
    theme,
    partnerOne = 'Ava',
    partnerTwo = 'Julian',
    date = '12 June 2027',
    place = 'Lake Como · Italy',
    events = ['Ceremony', 'Reception'],
    label,
    headline,
}: {
    theme: ThemeSwatch;
    partnerOne?: string;
    partnerTwo?: string;
    date?: string;
    place?: string;
    events?: string[];
    label?: string;
    headline?: string;
}) {
    const eyebrow = label ?? theme.name;
    const isDark = isDarkBackground(theme.backgroundColor);
    const soft = mixAlpha(theme.primaryColor, isDark ? 0.22 : 0.12);
    const wash = mixAlpha(theme.secondaryColor, isDark ? 0.18 : 0.2);
    const chips = events.slice(0, 3);

    return (
        <article
            className="invite-preview group relative flex h-full min-h-[22rem] flex-col overflow-hidden border shadow-[0_28px_80px_-36px_rgba(28,23,18,0.55)]"
            style={{
                background: theme.backgroundColor,
                color: theme.textColor,
                borderRadius: theme.borderRadius === '0px' ? '1.25rem' : theme.borderRadius,
                borderColor: mixAlpha(theme.textColor, 0.1),
            }}
        >
            {/* Atmospheric plane */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `
                        radial-gradient(120% 80% at 100% 0%, ${wash} 0%, transparent 55%),
                        radial-gradient(90% 70% at 0% 100%, ${soft} 0%, transparent 50%),
                        linear-gradient(165deg, ${mixAlpha(theme.primaryColor, isDark ? 0.35 : 0.08)} 0%, transparent 42%)
                    `,
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage: `linear-gradient(${mixAlpha(theme.textColor, 0.06)} 1px, transparent 1px), linear-gradient(90deg, ${mixAlpha(theme.textColor, 0.06)} 1px, transparent 1px)`,
                    backgroundSize: '28px 28px',
                    maskImage: 'radial-gradient(ellipse at 70% 30%, black 20%, transparent 70%)',
                }}
            />
            <div
                aria-hidden
                className="absolute -top-16 -right-10 h-48 w-48 rounded-full blur-3xl transition duration-700 group-hover:scale-110"
                style={{ background: mixAlpha(theme.secondaryColor, isDark ? 0.35 : 0.45) }}
            />

            {/* Top accent + live chip */}
            <div className="relative flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
                <div className="h-1 w-14 rounded-full" style={{ background: theme.primaryColor }} />
                <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold tracking-[0.18em] uppercase"
                    style={{
                        background: mixAlpha(theme.primaryColor, isDark ? 0.25 : 0.12),
                        color: theme.primaryColor,
                        boxShadow: `inset 0 0 0 1px ${mixAlpha(theme.primaryColor, 0.25)}`,
                    }}
                >
                    <span
                        className="size-1.5 animate-pulse rounded-full"
                        style={{ background: theme.primaryColor }}
                    />
                    Live preview
                </span>
            </div>

            <div className="relative flex flex-1 flex-col px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
                <p
                    className="text-[10px] font-medium tracking-[0.32em] uppercase"
                    style={{ color: theme.primaryColor }}
                >
                    {eyebrow}
                </p>

                {headline ? (
                    <h2 className="mt-5 font-serif text-[2.35rem] leading-[0.95] tracking-tight sm:text-5xl">
                        {headline}
                    </h2>
                ) : (
                    <div className="mt-5">
                        <p className="font-serif text-[2.55rem] leading-[0.92] tracking-tight sm:text-5xl">
                            {partnerOne}
                        </p>
                        <p
                            className="my-1 font-serif text-2xl italic leading-none sm:text-3xl"
                            style={{ color: theme.secondaryColor }}
                        >
                            &
                        </p>
                        <p className="font-serif text-[2.55rem] leading-[0.92] tracking-tight sm:text-5xl">
                            {partnerTwo}
                        </p>
                    </div>
                )}

                {/* Monogram ornament */}
                <div className="mt-6 flex items-center gap-3" aria-hidden>
                    <span className="h-px flex-1" style={{ background: mixAlpha(theme.textColor, 0.15) }} />
                    <span
                        className="grid size-9 place-items-center rounded-full font-serif text-xs tracking-wide"
                        style={{
                            color: theme.primaryColor,
                            boxShadow: `inset 0 0 0 1px ${mixAlpha(theme.primaryColor, 0.45)}`,
                            background: mixAlpha(theme.primaryColor, isDark ? 0.15 : 0.06),
                        }}
                    >
                        {monogram(headline, partnerOne, partnerTwo)}
                    </span>
                    <span className="h-px flex-1" style={{ background: mixAlpha(theme.textColor, 0.15) }} />
                </div>

                <div className="mt-auto pt-8">
                    <p className="text-[11px] font-medium tracking-[0.2em] uppercase">{date}</p>
                    <p className="mt-1.5 text-sm leading-snug opacity-75">{place}</p>

                    {chips.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {chips.map((event, index) => {
                                const solid = index === 0;
                                return (
                                    <span
                                        key={event}
                                        className="px-3 py-1.5 text-[10px] font-medium tracking-[0.16em] uppercase transition duration-300"
                                        style={
                                            solid
                                                ? {
                                                      background: theme.primaryColor,
                                                      color: isDark ? theme.backgroundColor : contrastOn(theme.primaryColor),
                                                      borderRadius: '999px',
                                                  }
                                                : {
                                                      color: theme.textColor,
                                                      boxShadow: `inset 0 0 0 1px ${mixAlpha(theme.primaryColor, 0.55)}`,
                                                      borderRadius: '999px',
                                                  }
                                        }
                                    >
                                        {event}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes invite-preview-rise {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .invite-preview {
                    animation: invite-preview-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
            `}</style>
        </article>
    );
}

function monogram(headline?: string, one?: string, two?: string): string {
    if (headline) {
        const letter = headline.trim().charAt(0);
        return letter ? letter.toUpperCase() : 'E';
    }
    const a = (one ?? 'A').trim().charAt(0).toUpperCase();
    const b = (two ?? 'B').trim().charAt(0).toUpperCase();
    return `${a}${b}`;
}

function isDarkBackground(hex: string): boolean {
    const rgb = parseHex(hex);
    if (!rgb) {
        return false;
    }
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance < 0.45;
}

function contrastOn(hex: string): string {
    return isDarkBackground(hex) ? '#f7f2ea' : '#1c1712';
}

function mixAlpha(hex: string, alpha: number): string {
    const rgb = parseHex(hex);
    if (!rgb) {
        return hex;
    }
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
    const raw = hex.replace('#', '').trim();
    if (raw.length === 3) {
        const r = Number.parseInt(raw[0] + raw[0], 16);
        const g = Number.parseInt(raw[1] + raw[1], 16);
        const b = Number.parseInt(raw[2] + raw[2], 16);
        return { r, g, b };
    }
    if (raw.length !== 6) {
        return null;
    }
    return {
        r: Number.parseInt(raw.slice(0, 2), 16),
        g: Number.parseInt(raw.slice(2, 4), 16),
        b: Number.parseInt(raw.slice(4, 6), 16),
    };
}
