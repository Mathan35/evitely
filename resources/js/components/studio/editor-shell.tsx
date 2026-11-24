import { useEffect, useState, type ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SHEET_MS = 380;

function useIsDesktop(): boolean {
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
    );

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const sync = (): void => setIsDesktop(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    return isDesktop;
}

export function EditorShell({
    topBar,
    nav,
    canvas,
    inspector,
    mobileSelectionBar,
    navOpen = true,
    inspectorOpen = true,
    onToggleNav,
    onToggleInspector,
    className,
}: {
    topBar: ReactNode;
    nav: ReactNode;
    canvas: ReactNode;
    inspector: ReactNode;
    /** Mobile-only action bar (Edit / Move / Delete) shown above the dock when a layer is selected. */
    mobileSelectionBar?: ReactNode;
    navOpen?: boolean;
    inspectorOpen?: boolean;
    onToggleNav?: () => void;
    onToggleInspector?: () => void;
    className?: string;
}) {
    const isDesktop = useIsDesktop();
    const [sheetMounted, setSheetMounted] = useState(false);
    const [sheetEntered, setSheetEntered] = useState(false);

    useEffect(() => {
        if (isDesktop) {
            setSheetMounted(false);
            setSheetEntered(false);
            return;
        }

        let enterFrame = 0;
        let exitTimer = 0;

        if (inspectorOpen) {
            setSheetMounted(true);
            enterFrame = window.requestAnimationFrame(() => {
                enterFrame = window.requestAnimationFrame(() => setSheetEntered(true));
            });
        } else {
            setSheetEntered(false);
            exitTimer = window.setTimeout(() => setSheetMounted(false), SHEET_MS);
        }

        return () => {
            window.cancelAnimationFrame(enterFrame);
            window.clearTimeout(exitTimer);
        };
    }, [inspectorOpen, isDesktop]);

    return (
        <div
            className={cn(
                'relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden overscroll-none bg-zinc-100 text-zinc-900',
                className,
            )}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_12%_-10%,rgba(24,24,27,0.08),transparent_55%),radial-gradient(700px_360px_at_88%_0%,rgba(82,82,91,0.08),transparent_50%)]"
            />
            <div className="relative z-10 flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden">
                <div className="shrink-0">{topBar}</div>

                {isDesktop ? (
                    <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 p-2 pt-0 lg:p-3 lg:pt-0">
                        <div
                            className={cn(
                                'relative grid min-h-0 w-full min-w-0 max-w-full flex-1 overflow-hidden',
                                'rounded-[1.35rem] bg-white/70 shadow-[0_30px_80px_-40px_rgba(24,24,27,0.45)] ring-1 ring-zinc-950/5 backdrop-blur-xl',
                                'transition-[grid-template-columns] duration-300 ease-out',
                                navOpen && inspectorOpen && 'grid-cols-[auto_minmax(0,1fr)_minmax(15.5rem,min(21.5rem,32vw))]',
                                navOpen && !inspectorOpen && 'grid-cols-[auto_minmax(0,1fr)_0fr]',
                                !navOpen && inspectorOpen && 'grid-cols-[0fr_minmax(0,1fr)_minmax(15.5rem,min(21.5rem,32vw))]',
                                !navOpen && !inspectorOpen && 'grid-cols-[0fr_minmax(0,1fr)_0fr]',
                            )}
                        >
                            <div
                                className={cn(
                                    'flex min-h-0 min-w-0 flex-col overflow-hidden transition-opacity duration-300',
                                    navOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
                                )}
                            >
                                {nav}
                            </div>

                            <div className="relative flex min-h-0 min-w-0 overflow-hidden">
                                {onToggleNav ? (
                                    <button
                                        type="button"
                                        onClick={onToggleNav}
                                        title={navOpen ? 'Close left panel' : 'Open left panel'}
                                        aria-label={navOpen ? 'Close left panel' : 'Open left panel'}
                                        className="absolute top-3 left-3 z-20 inline-flex size-9 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 ring-1 ring-zinc-950/20 transition duration-300 hover:scale-105 hover:bg-zinc-800"
                                    >
                                        {navOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
                                    </button>
                                ) : null}
                                {onToggleInspector ? (
                                    <button
                                        type="button"
                                        onClick={onToggleInspector}
                                        title={inspectorOpen ? 'Close right panel' : 'Open right panel'}
                                        aria-label={inspectorOpen ? 'Close right panel' : 'Open right panel'}
                                        className="absolute top-3 right-3 z-20 inline-flex size-9 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 ring-1 ring-zinc-950/20 transition duration-300 hover:scale-105 hover:bg-zinc-800"
                                    >
                                        {inspectorOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
                                    </button>
                                ) : null}
                                {canvas}
                            </div>

                            <div
                                className={cn(
                                    'min-h-0 min-w-0 overflow-hidden transition-opacity duration-300',
                                    inspectorOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
                                )}
                            >
                                {inspector}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden overscroll-none touch-manipulation">
                        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#efefef]">
                            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">{canvas}</div>

                            {sheetMounted && onToggleInspector ? (
                                <button
                                    type="button"
                                    aria-label="Dismiss editor panel"
                                    className={cn(
                                        'absolute inset-0 z-[60] bg-zinc-950/50 transition-opacity duration-[380ms] ease-out',
                                        sheetEntered ? 'opacity-100' : 'pointer-events-none opacity-0',
                                    )}
                                    onClick={onToggleInspector}
                                />
                            ) : null}

                            {sheetMounted ? (
                                <div
                                    data-mobile-editor-sheet
                                    role="dialog"
                                    aria-modal="true"
                                    className={cn(
                                        'absolute inset-x-0 bottom-0 z-[70] flex max-h-[min(78dvh,36rem)] min-h-[min(48dvh,26rem)] flex-col overflow-hidden rounded-t-[1.4rem] bg-white shadow-[0_-22px_60px_-18px_rgba(24,24,27,0.5)] ring-1 ring-zinc-950/10',
                                        'origin-bottom will-change-transform',
                                        'transition-[transform,opacity] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
                                        sheetEntered ? 'translate-y-0 opacity-100' : 'translate-y-[108%] opacity-0',
                                    )}
                                >
                                    <div className="relative flex shrink-0 items-center justify-center px-3 pt-3 pb-1.5">
                                        <span className="h-1.5 w-11 rounded-full bg-zinc-300" aria-hidden />
                                        {onToggleInspector ? (
                                            <button
                                                type="button"
                                                onClick={onToggleInspector}
                                                aria-label="Close editor"
                                                className="absolute top-2.5 right-2.5 inline-flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900 active:scale-95"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="min-h-0 flex-1 overflow-hidden">{inspector}</div>
                                </div>
                            ) : null}

                            {!inspectorOpen && mobileSelectionBar ? (
                                <div
                                    className={cn(
                                        'pointer-events-none absolute inset-x-0 bottom-3 z-[55] px-3',
                                        'transition-[transform,opacity] duration-300 ease-out',
                                        sheetMounted ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
                                    )}
                                >
                                    <div className="pointer-events-auto">{mobileSelectionBar}</div>
                                </div>
                            ) : null}
                        </div>

                        <div
                            data-mobile-editor-dock
                            className="relative z-[80] shrink-0 border-t border-zinc-200/90 bg-white pb-[env(safe-area-inset-bottom)]"
                        >
                            {nav}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
