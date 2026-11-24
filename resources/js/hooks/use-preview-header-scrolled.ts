import { useEffect, useState, type RefObject } from 'react';

/**
 * True once the site scroller (framed) or window (live) moves past the hero.
 * Drives the sticky header: transparent at rest → frosted when scrolling.
 */
export function usePreviewHeaderScrolled(
    scrollRef: RefObject<HTMLElement | null>,
    framed: boolean,
    threshold = 20,
): boolean {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const read = () => {
            const y = framed ? (scrollRef.current?.scrollTop ?? 0) : window.scrollY || window.pageYOffset || 0;
            setScrolled(y > threshold);
        };

        read();

        if (framed) {
            const root = scrollRef.current;
            if (!root) {
                return;
            }

            root.addEventListener('scroll', read, { passive: true });

            return () => root.removeEventListener('scroll', read);
        }

        window.addEventListener('scroll', read, { passive: true });

        return () => window.removeEventListener('scroll', read);
    }, [framed, scrollRef, threshold]);

    return scrolled;
}
