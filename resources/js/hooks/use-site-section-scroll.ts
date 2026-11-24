import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

type Options = {
    /** Section id prefix — e.g. `gh-`, `hw-`, `cu-`. */
    prefix: string;
    /** Live View site uses document scroll (`framed=false`). */
    framed?: boolean;
    onBeforeScroll?: () => void;
};

/**
 * Live site section navigation.
 * - Normal sections: smooth scroll
 * - Returning to Home from another section: brief skeleton flag for the caller to render
 * Editor/framed canvases never flip the home-return skeleton flag.
 */
export function useSiteSectionScroll(
    rootRef: RefObject<HTMLElement | null>,
    { prefix, framed = true, onBeforeScroll }: Options,
): {
    scrollTo: (id: string) => void;
    showHomeSkeleton: boolean;
} {
    const [showHomeSkeleton, setShowHomeSkeleton] = useState(false);
    const timersRef = useRef<number[]>([]);

    const clearTimers = useCallback(() => {
        timersRef.current.forEach((id) => window.clearTimeout(id));
        timersRef.current = [];
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const scrollTo = useCallback(
        (id: string) => {
            onBeforeScroll?.();
            clearTimers();

            const root = rootRef.current;
            const target = root?.querySelector<HTMLElement>(`#${prefix}${id}`);
            if (!target) {
                return;
            }

            const live = !framed;
            const awayFromHome =
                live &&
                id === 'home' &&
                (typeof window !== 'undefined'
                    ? window.scrollY > Math.max(160, window.innerHeight * 0.45)
                    : false);

            if (awayFromHome) {
                setShowHomeSkeleton(true);
                const jump = window.setTimeout(() => {
                    target.scrollIntoView({ behavior: 'auto', block: 'start' });
                    window.scrollTo({ top: 0, behavior: 'auto' });
                    const hide = window.setTimeout(() => setShowHomeSkeleton(false), 420);
                    timersRef.current.push(hide);
                }, 260);
                timersRef.current.push(jump);
                return;
            }

            setShowHomeSkeleton(false);
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        [clearTimers, framed, onBeforeScroll, prefix, rootRef],
    );

    return { scrollTo, showHomeSkeleton };
}
