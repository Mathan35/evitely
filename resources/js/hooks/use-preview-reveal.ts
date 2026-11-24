import { useEffect, type RefObject } from 'react';

function overlapsViewport(node: HTMLElement, bottomInset = 48): boolean {
    const r = node.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // Reveal once the top edge crosses the lower reveal line. Include sections
    // already scrolled past so fast jumps don't leave opacity-0 holes above.
    return r.top < vh - bottomInset;
}

function overlapsRoot(node: HTMLElement, root: HTMLElement, bottomInset = 48): boolean {
    const r = node.getBoundingClientRect();
    const b = root.getBoundingClientRect();

    return r.top < b.bottom - bottomInset;
}

/** True when the document (or framed scroller) is at / near its end. */
function isNearScrollEnd(scrollRoot: HTMLElement | null): boolean {
    if (scrollRoot) {
        return scrollRoot.scrollTop + scrollRoot.clientHeight >= scrollRoot.scrollHeight - 56;
    }

    const doc = document.documentElement;
    const body = document.body;
    const scrollHeight = Math.max(doc.scrollHeight, body?.scrollHeight ?? 0);
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const viewport = window.innerHeight || doc.clientHeight;

    return scrollTop + viewport >= scrollHeight - 56;
}

/** Only treat as a scroller when it actually scrolls (overflow + overflowed content). */
function isScrollContainer(el: HTMLElement): boolean {
    const { overflowY } = window.getComputedStyle(el);

    if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
        return false;
    }

    return el.scrollHeight > el.clientHeight + 2;
}

/**
 * Live View site sits under InvitationIntroGate as `invisible` + `aria-hidden`
 * until the intro finishes — wait until the tree is actually shown.
 */
function isRevealReady(el: HTMLElement): boolean {
    if (!el.isConnected) {
        return false;
    }

    if (el.closest('[aria-hidden="true"]')) {
        return false;
    }

    const style = window.getComputedStyle(el);

    if (style.visibility === 'hidden' || style.display === 'none') {
        return false;
    }

    const r = el.getBoundingClientRect();

    return r.width > 0 && r.height > 0;
}

function waitForImages(root: HTMLElement): Promise<void> {
    const images = Array.from(root.querySelectorAll('img'));

    if (images.length === 0) {
        return Promise.resolve();
    }

    return Promise.all(
        images.map(
            (img) =>
                img.complete
                    ? Promise.resolve()
                    : new Promise<void>((resolve) => {
                          const done = () => resolve();
                          img.addEventListener('load', done, { once: true });
                          img.addEventListener('error', done, { once: true });
                      }),
        ),
    ).then(() => undefined);
}

type PreviewRevealOptions = {
    /**
     * Editor / marketing device frame scrolls inside `rootRef`.
     * Live View site (`framed=false`) always uses the document viewport.
     */
    framed?: boolean;
};

/**
 * Scroll-reveal for site sections.
 * - Framed editor / marketing popup: observe inside the preview scroller.
 * - Live View site: wait for intro to finish, then reveal as sections enter the viewport.
 *
 * Important: never force-reveal off-screen sections on the live site — that finishes
 * the animation before the guest scrolls, so bottom content looks static.
 */
export function usePreviewReveal(
    rootRef: RefObject<HTMLElement | null>,
    resetKey: string,
    options: PreviewRevealOptions = {},
) {
    const framed = options.framed ?? true;

    useEffect(() => {
        const root = rootRef.current;

        if (!root) {
            return;
        }

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const collect = () => Array.from(root.querySelectorAll<HTMLElement>('[data-preview-reveal]'));
        // Editor framed canvas must stay instant — style/card clicks update live without a hide→reveal.
        const editorFrame = framed && Boolean(root.closest('[data-editor-preview], .editor-live-preview'));

        if (reduce || editorFrame) {
            collect().forEach((node) => node.classList.add('is-in'));

            return;
        }

        collect().forEach((node) => node.classList.remove('is-in'));

        let cancelled = false;
        let started = false;
        let observer: IntersectionObserver | null = null;
        let mutationObserver: MutationObserver | null = null;
        let readyPoll = 0;
        let fallbackTimer = 0;
        let settleTimer = 0;
        let framedCatchUpTimer = 0;
        let removeScrollListeners: (() => void) | null = null;

        const start = (): void => {
            if (cancelled || started || !rootRef.current) {
                return;
            }

            if (!isRevealReady(rootRef.current)) {
                return;
            }

            started = true;

            const nodes = collect();
            // Live site: window scrolls. Framed: only if root is a real overflow scroller.
            const scrollRoot = framed && isScrollContainer(root) ? root : null;
            const rootScrolls = Boolean(scrollRoot);
            const show = (node: Element) => node.classList.add('is-in');
            const isVisible = (node: HTMLElement, loose = false): boolean => {
                const inset = loose ? 8 : 48;

                return rootScrolls && scrollRoot
                    ? overlapsRoot(node, scrollRoot, inset)
                    : overlapsViewport(node, inset);
            };

            observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (!entry.isIntersecting) {
                            continue;
                        }

                        show(entry.target);
                        observer?.unobserve(entry.target);
                    }
                },
                {
                    root: scrollRoot,
                    // Fixed px bottom inset (not %) so short last sections still intersect at scroll end.
                    threshold: [0, 0.08, 0.16, 0.28],
                    rootMargin: '0px 0px -64px 0px',
                },
            );

            for (const node of nodes) {
                if (isVisible(node)) {
                    show(node);
                    continue;
                }

                observer.observe(node);
            }

            const syncVisible = () => {
                if (cancelled) {
                    return;
                }

                const nearEnd = isNearScrollEnd(scrollRoot);

                for (const node of collect()) {
                    if (node.classList.contains('is-in')) {
                        continue;
                    }

                    // Near document end, loosen the inset so footer / RSVP aren't stuck invisible
                    // behind the observer's rootMargin.
                    if (isVisible(node, nearEnd)) {
                        show(node);
                        observer?.unobserve(node);
                    }
                }
            };

            window.addEventListener('scroll', syncVisible, { passive: true });
            window.addEventListener('resize', syncVisible);
            scrollRoot?.addEventListener('scroll', syncVisible, { passive: true });
            removeScrollListeners = () => {
                window.removeEventListener('scroll', syncVisible);
                window.removeEventListener('resize', syncVisible);
                scrollRoot?.removeEventListener('scroll', syncVisible);
            };

            fallbackTimer = window.setTimeout(syncVisible, 160);
            // Second pass after fonts / layout settle — still only reveals in-view nodes.
            settleTimer = window.setTimeout(syncVisible, 600);

            // Framed marketing shells are short; catch up in-view nodes only.
            // Live sites must keep below-fold nodes pending until the guest scrolls.
            if (framed) {
                framedCatchUpTimer = window.setTimeout(() => {
                    if (cancelled) {
                        return;
                    }

                    collect().forEach((node) => {
                        if (!node.classList.contains('is-in') && isVisible(node, true)) {
                            show(node);
                            observer?.unobserve(node);
                        }
                    });
                }, 900);
            }
        };

        const arm = (): void => {
            if (cancelled || started) {
                return;
            }

            void waitForImages(root).then(() => {
                if (cancelled) {
                    return;
                }

                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(start);
                });
            });
        };

        const tryArm = (): void => {
            if (cancelled || started) {
                return;
            }

            if (isRevealReady(root)) {
                mutationObserver?.disconnect();
                mutationObserver = null;
                window.clearTimeout(readyPoll);
                arm();
            }
        };

        if (isRevealReady(root)) {
            arm();
        } else {
            // Intro gate toggles aria-hidden / classes on an ancestor — watch until ready.
            mutationObserver = new MutationObserver(tryArm);
            mutationObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class', 'style', 'aria-hidden', 'hidden'],
                subtree: true,
            });

            const poll = () => {
                if (cancelled || started) {
                    return;
                }

                tryArm();

                if (!started) {
                    readyPoll = window.setTimeout(poll, 100);
                }
            };

            readyPoll = window.setTimeout(poll, 80);
        }

        return () => {
            cancelled = true;
            window.clearTimeout(readyPoll);
            window.clearTimeout(fallbackTimer);
            window.clearTimeout(settleTimer);
            window.clearTimeout(framedCatchUpTimer);
            observer?.disconnect();
            mutationObserver?.disconnect();
            removeScrollListeners?.();
        };
    }, [framed, resetKey, rootRef]);
}
