import { Menu } from 'lucide-react';
import { useMemo } from 'react';
import { usePreviewLive } from '@/components/marketing/site-previews/preview-live';
import { SiteHeaderLanguageMenu } from '@/components/marketing/site-previews/preview-locale-switch';
import { resolveHeaderStyleId, type HeaderStyleId } from '@/lib/header-nav-styles';
import { filterSiteNavItems } from '@/lib/site-section-visibility';
import { cn } from '@/lib/utils';

export type SiteHeaderNavItem = {
    id: string;
    label: string;
};

export type SiteHeaderNavProps = {
    styleId?: string | null;
    brand: string;
    items: readonly SiteHeaderNavItem[];
    desktop?: boolean;
    scrolled?: boolean;
    onNavigate: (id: string) => void;
    onOpenMenu: () => void;
    className?: string;
};

function LinkButton({
    label,
    style,
    scrolled,
    onClick,
}: {
    label: string;
    style: HeaderStyleId;
    scrolled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'site-header__link relative transition-colors duration-300',
                style === 'quill' && 'font-serif text-[13px] tracking-[0.08em] normal-case',
                style !== 'quill' && 'text-[11px] tracking-[0.16em] uppercase',
                style === 'crest' && 'tracking-[0.2em]',
                style === 'luxe' && 'tracking-[0.2em]',
                scrolled
                    ? 'text-[var(--w-ink)]/75 hover:text-[var(--w-accent)]'
                    : 'text-white/88 hover:text-white',
            )}
        >
            <span className="site-header__link-label">{label}</span>
            <span className="site-header__link-ink" aria-hidden />
        </button>
    );
}

function BrandButton({
    brand,
    style,
    scrolled,
    onClick,
}: {
    brand: string;
    style: HeaderStyleId;
    scrolled: boolean;
    onClick: () => void;
}) {
    if (style === 'crest') {
        return (
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    'site-header__crest pointer-events-auto grid h-11 w-11 place-items-center rounded-full border transition duration-300',
                    scrolled
                        ? 'border-[var(--w-accent)]/35 bg-[var(--w-bg)]/90 text-[var(--w-accent)] shadow-sm'
                        : 'border-white/45 bg-white/10 text-white backdrop-blur-md',
                )}
                aria-label="Home"
            >
                <span className="font-serif text-[12px] tracking-[0.08em]">{brand.slice(0, 3)}</span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'site-header__brand pointer-events-auto min-w-0 max-w-[min(58%,14rem)] truncate transition-colors duration-300 sm:max-w-[min(52%,18rem)]',
                style === 'quill' ? 'font-serif text-[16px] tracking-[0.06em] sm:text-[17px]' : 'font-serif text-[14px] tracking-[0.14em] sm:text-[15px]',
                style === 'luxe' && 'tracking-[0.18em] sm:tracking-[0.2em]',
                scrolled
                    ? 'text-[var(--w-accent)]'
                    : 'text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]',
            )}
        >
            {brand}
        </button>
    );
}

/** Compact thumbnail for the editor header style picker. */
export function HeaderStyleThumb({ styleId, active }: { styleId: HeaderStyleId; active?: boolean }) {
    return (
        <div
            className={cn(
                'site-header-thumb relative h-[4.75rem] w-full overflow-hidden rounded-xl ring-1',
                `site-header-thumb--${styleId}`,
                active ? 'ring-zinc-950/25' : 'ring-zinc-950/10',
            )}
            aria-hidden
        >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950" />
            <div className="site-header-thumb__bar absolute inset-x-2 top-2 flex h-8 items-center gap-2 px-2">
                {styleId === 'crest' ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-white/50 text-[7px] text-white">A</span>
                ) : (
                    <span className="h-1.5 w-10 rounded-full bg-white/80" />
                )}
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="h-1 w-6 rounded-full bg-white/55" />
                    <span className="h-1 w-5 rounded-full bg-white/45" />
                    <span className="h-1 w-7 rounded-full bg-white/55" />
                </div>
            </div>
        </div>
    );
}

export function SiteHeaderNav({
    styleId,
    brand,
    items,
    desktop = false,
    scrolled = false,
    onNavigate,
    onOpenMenu,
    className,
}: SiteHeaderNavProps) {
    const live = usePreviewLive();
    const visibleItems = useMemo(
        () => filterSiteNavItems(items, live?.sections),
        [items, live?.sections],
    );
    const style = resolveHeaderStyleId(styleId);
    const mid = Math.ceil(visibleItems.length / 2);
    const leftItems = visibleItems.slice(0, mid);
    const rightItems = visibleItems.slice(mid);

    const shell = cn(
        'site-header sticky top-0 z-30 transition-[background-color,border-color,box-shadow,backdrop-filter,color,padding] duration-300',
        `site-header--${style}`,
        scrolled && 'site-header--scrolled',
        desktop ? 'site-header--desktop' : 'site-header--mobile',
        className,
    );

    if (style === 'aurora' && desktop) {
        return (
            <header className={cn(shell, 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-4')}>
                <nav className="site-header__nav site-header__nav--scroll flex items-center justify-end gap-x-3 xl:gap-x-5" aria-label="Page">
                    {leftItems.map((item) => (
                        <LinkButton key={item.id} label={item.label} style={style} scrolled={scrolled} onClick={() => onNavigate(item.id)} />
                    ))}
                </nav>
                <BrandButton brand={brand} style={style} scrolled={scrolled} onClick={() => onNavigate('home')} />
                <div className="flex min-w-0 items-center justify-start gap-2 xl:gap-3">
                    <nav className="site-header__nav site-header__nav--scroll flex min-w-0 items-center gap-x-3 xl:gap-x-5" aria-label="More">
                        {rightItems.map((item) => (
                            <LinkButton key={item.id} label={item.label} style={style} scrolled={scrolled} onClick={() => onNavigate(item.id)} />
                        ))}
                    </nav>
                    <SiteHeaderLanguageMenu scrolled={scrolled} />
                </div>
            </header>
        );
    }

    if (style === 'opal' && desktop) {
        return (
            <header className={cn(shell, 'flex justify-center')}>
                <div className="site-header__capsule flex max-w-[min(100%,56rem)] items-center gap-4 px-4 py-2.5 sm:gap-5 sm:px-6 sm:py-3">
                    <BrandButton brand={brand} style={style} scrolled={scrolled} onClick={() => onNavigate('home')} />
                    <span className="site-header__capsule-rule hidden h-4 w-px sm:block" aria-hidden />
                    <nav className="site-header__nav site-header__nav--scroll flex min-w-0 flex-1 items-center justify-end gap-x-3 xl:gap-x-5" aria-label="Page">
                        {visibleItems.map((item) => (
                            <LinkButton key={item.id} label={item.label} style={style} scrolled={scrolled} onClick={() => onNavigate(item.id)} />
                        ))}
                    </nav>
                    <SiteHeaderLanguageMenu scrolled={scrolled} />
                </div>
            </header>
        );
    }

    return (
        <header className={cn(shell, 'flex items-center justify-between gap-3')}>
            <BrandButton brand={brand} style={style} scrolled={scrolled} onClick={() => onNavigate('home')} />
            {desktop ? (
                <div className="flex min-w-0 max-w-[82%] items-center justify-end gap-2 xl:gap-3">
                    <nav
                        className={cn(
                            'site-header__nav site-header__nav--scroll flex min-w-0 items-center justify-end gap-x-3 xl:gap-x-5',
                            style === 'crest' && 'gap-x-2.5 xl:gap-x-3.5',
                            style === 'luxe' && 'gap-x-4 xl:gap-x-6',
                        )}
                        aria-label="Page"
                    >
                        {visibleItems.map((item, index) => (
                            <span key={item.id} className="inline-flex shrink-0 items-center gap-2.5 xl:gap-3">
                                {style === 'crest' && index > 0 ? <span className="site-header__diamond" aria-hidden /> : null}
                                {style === 'quill' && index > 0 ? <span className="site-header__dot" aria-hidden /> : null}
                                <LinkButton label={item.label} style={style} scrolled={scrolled} onClick={() => onNavigate(item.id)} />
                            </span>
                        ))}
                    </nav>
                    <SiteHeaderLanguageMenu scrolled={scrolled} />
                </div>
            ) : (
                <div className="flex shrink-0 items-center gap-0.5">
                    {/* Language before hamburger on mobile */}
                    <SiteHeaderLanguageMenu scrolled={scrolled} compact />
                    <button
                        type="button"
                        onClick={onOpenMenu}
                        className={cn(
                            'site-header__menu pointer-events-auto inline-flex h-11 w-11 shrink-0 items-center justify-center transition-colors duration-300',
                            scrolled ? 'text-[var(--w-accent)]' : 'text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]',
                        )}
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6" strokeWidth={1.25} />
                    </button>
                </div>
            )}
        </header>
    );
}
