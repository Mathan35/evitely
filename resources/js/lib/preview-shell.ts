import { cn } from '@/lib/utils';

/**
 * Framed = editor / marketing device shell (needs overflow + flex fill).
 * Page = public View site / unframed preview (document scroll only — no nested scrollbars).
 *
 * Note: `overflow-x: hidden` makes browsers compute `overflow-y: auto`, which
 * creates a second vertical scrollbar. Use `clip` on live pages instead.
 */
export function previewShellClass(framed = true): string {
    return cn(
        'relative bg-[var(--w-bg)] text-[var(--w-ink)]',
        framed
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
            : 'min-h-svh max-w-[100vw] overflow-x-clip',
    );
}

export function previewScrollClass(framed = true): string {
    return cn(
        'relative z-[1] min-w-0',
        // Locked via html.popup-scroll-lock while RSVP / modal sheets are open.
        framed && 'preview-scroll-pane',
        framed
            ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain'
            : 'max-w-[100vw] overflow-x-clip',
    );
}

/** Menus / lightboxes / RSVP sheets — pin to the viewport on live sites. */
export function previewOverlayClass(framed = true, className?: string): string {
    return cn(framed ? 'absolute inset-0' : 'fixed inset-0', className);
}

/** Sticky bottom chrome (e.g. RSVP bar) on live phones. */
export function previewDockClass(framed = true, className?: string): string {
    return cn(
        framed ? 'absolute inset-x-0 bottom-0' : 'fixed inset-x-0 bottom-0',
        className,
    );
}

/** Sticky site header — clear over the hero, frosted after scroll. */
export function previewHeaderClass(desktop: boolean, scrolled: boolean): string {
    return cn(
        'sticky top-0 z-30 flex items-center justify-between transition-[background-color,border-color,box-shadow,backdrop-filter,color] duration-300',
        desktop ? 'px-6 py-3.5 sm:px-8' : 'px-5 py-4',
        scrolled
            ? 'border-b border-[var(--w-accent)]/12 bg-[var(--w-bg)]/82 shadow-[0_10px_36px_-20px_rgba(28,24,20,0.45)] backdrop-blur-md'
            : 'border-b border-transparent bg-transparent',
    );
}

export function previewHeaderBrandClass(scrolled: boolean): string {
    return cn(
        'pointer-events-auto min-w-0 max-w-[55%] truncate font-serif text-[15px] tracking-[0.14em] transition-colors duration-300',
        scrolled ? 'text-[var(--w-accent)]' : 'text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]',
    );
}

export function previewHeaderNavClass(scrolled: boolean): string {
    return cn(
        'text-[11px] tracking-[0.16em] uppercase transition-colors duration-300',
        scrolled
            ? 'text-[var(--w-ink)]/75 hover:text-[var(--w-accent)]'
            : 'text-white/85 hover:text-white',
    );
}

export function previewHeaderMenuClass(scrolled: boolean): string {
    return cn(
        'pointer-events-auto transition-colors duration-300',
        scrolled ? 'text-[var(--w-accent)]' : 'text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]',
    );
}
