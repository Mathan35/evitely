import { Check, Languages } from 'lucide-react';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { usePreviewLocale } from '@/components/marketing/site-previews/preview-locale-context';
import { cn } from '@/lib/utils';

export type PreviewLocaleOption = {
    code: string;
    label: string;
};

type MenuProps = {
    locales: PreviewLocaleOption[];
    active: string;
    onChange: (code: string) => void;
    /** When true, use ink tones for scrolled header; otherwise light-on-hero. */
    scrolled?: boolean;
    className?: string;
    style?: CSSProperties;
    /** Desktop header vs compact mobile trigger before the menu icon. */
    compact?: boolean;
};

/**
 * Product language control: icon trigger + neat dropdown with current language.
 * Used in the site header (desktop top-right / mobile before hamburger).
 */
export function SiteLanguageMenu({
    locales,
    active,
    onChange,
    scrolled = false,
    className,
    style,
    compact = false,
}: MenuProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const activeLocale = locales.find((item) => item.code === active) ?? locales[0];

    useEffect(() => {
        if (!open) {
            return;
        }

        function onPointerDown(event: MouseEvent): void {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function onKey(event: KeyboardEvent): void {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    if (locales.length < 2 || !activeLocale) {
        return null;
    }

    return (
        <div
            ref={rootRef}
            data-preview-locale-switch
            style={style}
            className={cn('pointer-events-auto relative shrink-0', className)}
        >
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={menuId}
                aria-label={`Language: ${activeLocale.label}`}
                title={activeLocale.label}
                className={cn(
                    'inline-flex items-center justify-center gap-1.5 rounded-full transition-[background-color,color,box-shadow,transform] duration-300',
                    compact ? 'h-11 w-11' : 'h-9 min-w-9 px-2.5 sm:px-3',
                    scrolled
                        ? 'bg-[color:var(--w-bg,#ffffff)]/90 text-[color:var(--w-accent,#3f3f46)] shadow-sm ring-1 ring-[color:var(--w-accent,#3f3f46)]/20 hover:bg-[color:var(--w-surface,#f4f4f5)]'
                        : 'bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)] hover:bg-white/25',
                    open && (scrolled ? 'ring-[color:var(--w-accent,#3f3f46)]/45' : 'bg-white/30'),
                )}
            >
                <Languages className="size-[1.15rem]" strokeWidth={1.5} />
                {!compact ? (
                    <span className="hidden max-w-[5.5rem] truncate text-[10px] font-semibold tracking-[0.14em] uppercase sm:inline">
                        {activeLocale.label}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div
                    id={menuId}
                    role="listbox"
                    aria-label="Language"
                    className={cn(
                        'absolute top-[calc(100%+0.45rem)] right-0 z-50 w-[min(14.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl bg-white/95 shadow-[0_18px_40px_-18px_rgba(24,24,27,0.55)] ring-1 ring-zinc-950/10 backdrop-blur-xl',
                        'animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-200',
                    )}
                >
                    <div className="border-b border-zinc-950/6 px-3.5 py-2.5">
                        <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                            Language
                        </p>
                        <p className="mt-0.5 truncate text-[13px] font-semibold text-zinc-900">
                            {activeLocale.label}
                        </p>
                    </div>
                    <ul className="p-1.5">
                        {locales.map((locale) => {
                            const selected = locale.code === active;
                            return (
                                <li key={locale.code}>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        onClick={() => {
                                            onChange(locale.code);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors',
                                            selected
                                                ? 'bg-zinc-950 text-white'
                                                : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950',
                                        )}
                                    >
                                        <span className="min-w-0 flex-1 truncate font-medium tracking-tight">
                                            {locale.label}
                                        </span>
                                        {selected ? (
                                            <Check className="size-3.5 shrink-0 opacity-90" strokeWidth={2.25} />
                                        ) : (
                                            <span className="size-3.5 shrink-0" aria-hidden />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}

/** Header-aware language menu that reads bilingual options from context. */
export function SiteHeaderLanguageMenu({
    scrolled = false,
    compact = false,
    className,
}: {
    scrolled?: boolean;
    compact?: boolean;
    className?: string;
}) {
    const locale = usePreviewLocale();
    if (!locale) {
        return null;
    }

    return (
        <SiteLanguageMenu
            locales={locale.locales}
            active={locale.active}
            onChange={locale.onChange}
            scrolled={scrolled}
            compact={compact}
            className={className}
        />
    );
}

/** @deprecated Use SiteLanguageMenu / SiteHeaderLanguageMenu — kept for import compatibility. */
export function PreviewLocaleSwitch(props: MenuProps) {
    return <SiteLanguageMenu {...props} />;
}
