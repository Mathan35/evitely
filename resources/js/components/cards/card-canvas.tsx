import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CardMobileLayerActions } from '@/components/studio/card-mobile-layer-actions';
import { CardSelectionToolbar } from '@/components/studio/card-selection-toolbar';
import { cardArtObjectFit } from '@/lib/card-art-fit';
import { cardFontStack } from '@/lib/card-editor';
import { cn } from '@/lib/utils';
import type { CardDocument, CardElement } from '@/types/wedding';

export function CardCanvas({
    document,
    width,
    height,
    musicUrl,
    selectedId,
    onSelect,
    onChange,
    onPatch,
    onGestureStart,
    onGestureEnd,
    fitWidth = 480,
    className,
    showSelectionTools = true,
    mobileActions = null,
}: {
    document: CardDocument;
    width: number;
    height: number;
    musicUrl?: string | null;
    selectedId?: string | null;
    onSelect?: (id: string) => void;
    /** Live updates during drag/resize (no undo step / save per frame). */
    onChange?: (id: string, values: Partial<CardElement>) => void;
    /** Discrete toolbar edits (one undo step each). */
    onPatch?: (id: string, values: Partial<CardElement>) => void;
    /** Push one undo snapshot before a continuous gesture (drag/resize). */
    onGestureStart?: () => void;
    /** Commit after the user finishes placing (debounce save from here). */
    onGestureEnd?: () => void;
    fitWidth?: number;
    className?: string;
    showSelectionTools?: boolean;
    /** Compact Edit/Delete tooltip for mobile — does not block drag. */
    mobileActions?: { onEdit: () => void; onDelete: () => void } | null;
}) {
    const scale = Math.min(1, fitWidth / Math.max(width, 1));
    const displayWidth = width * scale;
    const displayHeight = height * scale;
    const frameRef = useRef<HTMLDivElement>(null);
    const [toolbarPos, setToolbarPos] = useState<{ left: number; top: number } | null>(null);
    const [mobileTipPos, setMobileTipPos] = useState<{ left: number; top: number } | null>(null);
    const [dragging, setDragging] = useState(false);
    const TOOLBAR_GAP = 14;
    const MOBILE_TIP_GAP = 10;

    const artElement = (document.elements ?? []).find((element) => element.id === 'art' && element.type === 'image');
    const backgroundImage = document.backgroundImage || artElement?.src || null;
    const occasion = document.occasion || document.template || '';
    const isCustomArt =
        occasion === 'custom' ||
        occasion.startsWith('custom-') ||
        (backgroundImage || '').toLowerCase().includes('/gallery/custom/') ||
        (backgroundImage || '').toLowerCase().includes('/custom/');
    const layers = (document.elements ?? []).filter((element) => element.id !== 'art');
    const selected = layers.find((element) => element.id === selectedId) ?? null;
    const toolbarPatch = onPatch ?? onChange;
    const showToolbar = Boolean(showSelectionTools && toolbarPatch && selected && selected.type === 'text');
    const showMobileTip = Boolean(mobileActions && selected && !dragging);

    useLayoutEffect(() => {
        if (!selected || !frameRef.current) {
            setToolbarPos(null);
            setMobileTipPos(null);
            return;
        }

        const frame = frameRef.current;
        const update = (): void => {
            const layerLeft = selected.x * scale;
            const layerRight = layerLeft + selected.width * scale;
            const layerTop = selected.y * scale;
            const layerMidY = layerTop + (selected.height * scale) / 2;
            const layerCenterX = layerLeft + (selected.width * scale) / 2;

            if (showToolbar) {
                setToolbarPos({
                    left: layerRight + TOOLBAR_GAP,
                    top: Math.max(24, layerMidY),
                });
            } else {
                setToolbarPos(null);
            }

            if (showMobileTip) {
                // Float just above the selection center — clear of the drag handle.
                setMobileTipPos({
                    left: layerCenterX,
                    top: Math.max(8, layerTop - MOBILE_TIP_GAP),
                });
            } else {
                setMobileTipPos(null);
            }
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(frame);
        return () => observer.disconnect();
    }, [showToolbar, showMobileTip, selected, scale, displayWidth, displayHeight]);

    function drag(event: ReactPointerEvent, element: CardElement, mode: 'move' | 'resize'): void {
        if (!onChange) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        onSelect?.(element.id);

        const startX = event.clientX;
        const startY = event.clientY;
        const origin = { x: element.x, y: element.y, width: element.width, height: element.height };
        let moved = false;
        let historyPushed = false;

        const move = (pointer: PointerEvent): void => {
            const dx = (pointer.clientX - startX) / scale;
            const dy = (pointer.clientY - startY) / scale;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                if (!historyPushed) {
                    onGestureStart?.();
                    historyPushed = true;
                    setDragging(true);
                }
                moved = true;
            }

            if (!moved) {
                return;
            }

            if (mode === 'resize') {
                onChange(element.id, {
                    width: Math.max(40, Math.round(origin.width + dx)),
                    height: Math.max(40, Math.round(origin.height + dy)),
                });
                return;
            }

            onChange(element.id, {
                x: Math.round(origin.x + dx),
                y: Math.round(origin.y + dy),
            });
        };

        const stop = (): void => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('pointercancel', stop);
            setDragging(false);
            if (moved) {
                onGestureEnd?.();
            }
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
    }

    return (
        <div className={cn('relative mx-auto', className)} style={{ width: displayWidth }}>
            <style>{`
                @media print {
                    .card-sheet-scale { transform: none !important; width: ${width}px !important; height: ${height}px !important; }
                    .card-sheet-frame { width: ${width}px !important; height: ${height}px !important; }
                }
            `}</style>
            <div
                ref={frameRef}
                data-card-sheet
                className="card-sheet-frame relative mx-auto overflow-visible"
                style={{ width: displayWidth, height: displayHeight }}
            >
                <div
                    className="overflow-hidden rounded-[1.2rem] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.35)] ring-1 ring-zinc-950/10"
                    style={{ width: displayWidth, height: displayHeight }}
                >
                    <div
                        className="card-sheet-scale origin-top-left"
                        style={{
                            width,
                            height,
                            transform: `scale(${scale})`,
                        }}
                    >
                        <article
                            className="card-sheet relative touch-none"
                            style={{
                                width,
                                height,
                                backgroundColor: document.background ?? '#f4efe6',
                            }}
                            onPointerDown={() => onSelect?.('')}
                        >
                            {backgroundImage ? (
                                <img
                                    src={backgroundImage}
                                    alt=""
                                    draggable={false}
                                    className={cn(
                                        'pointer-events-none absolute inset-0 h-full w-full object-center select-none',
                                        // Same fit rules as InvitationCardFace / design preview popup.
                                        cardArtObjectFit(backgroundImage) === 'contain'
                                            ? 'object-contain'
                                            : 'object-cover',
                                        // Custom website-photo cards: soft blur + scale (InvitationCardFace).
                                        isCustomArt && 'origin-center scale-[1.2] blur-[10px]',
                                    )}
                                />
                            ) : null}
                            {isCustomArt && backgroundImage ? (
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 z-[1] bg-[rgb(28_23_18/40%)]"
                                />
                            ) : null}

                            {layers.map((element) => {
                                const isSelected = selectedId === element.id;
                                return (
                                    <div
                                        key={element.id}
                                        data-card-layer={element.id}
                                        className={cn(
                                            'absolute touch-none',
                                            isSelected && onChange
                                                ? 'z-10 ring-2 ring-[#c6a36a] ring-offset-2 ring-offset-transparent'
                                                : 'z-[1]',
                                        )}
                                        style={{
                                            left: element.x,
                                            top: element.y,
                                            width: element.width,
                                            height: element.height,
                                        }}
                                        onPointerDown={(event) => {
                                            event.stopPropagation();
                                            if (!onChange) {
                                                onSelect?.(element.id);
                                                return;
                                            }
                                            drag(event, element, 'move');
                                        }}
                                    >
                                        <CardElementView element={{ ...element, x: 0, y: 0 }} />
                                        {onChange && isSelected ? (
                                            <>
                                                <span className="pointer-events-none absolute -top-1 -left-1 size-2 rounded-full bg-[#c6a36a] shadow" />
                                                <span className="pointer-events-none absolute -top-1 -right-1 size-2 rounded-full bg-[#c6a36a] shadow" />
                                                <span className="pointer-events-none absolute -bottom-1 -left-1 size-2 rounded-full bg-[#c6a36a] shadow" />
                                                <button
                                                    type="button"
                                                    aria-label="Resize"
                                                    className="absolute -right-1 -bottom-1 size-3.5 cursor-nwse-resize rounded-sm bg-zinc-900 shadow ring-2 ring-white"
                                                    onPointerDown={(event) => drag(event, element, 'resize')}
                                                />
                                            </>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </article>
                    </div>
                </div>

                {showToolbar && selected && toolbarPos ? (
                    <div
                        className="pointer-events-none absolute z-30 hidden -translate-y-1/2 md:block"
                        style={{ left: toolbarPos.left, top: toolbarPos.top }}
                    >
                        <CardSelectionToolbar current={selected} onPatch={toolbarPatch!} />
                    </div>
                ) : null}

                {showMobileTip && mobileTipPos && mobileActions ? (
                    <div
                        className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-full md:hidden"
                        style={{ left: mobileTipPos.left, top: mobileTipPos.top }}
                    >
                        <CardMobileLayerActions onEdit={mobileActions.onEdit} onDelete={mobileActions.onDelete} />
                    </div>
                ) : null}
            </div>
            {musicUrl ? <audio className="mt-3 w-full" controls src={musicUrl} /> : null}
        </div>
    );
}

function CardElementView({ element }: { element: CardElement }) {
    const align = element.align ?? 'center';
    const style = {
        position: 'absolute' as const,
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation ?? 0}deg)`,
        color: element.color,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight ?? 400,
        letterSpacing: element.letterSpacing != null ? `${element.letterSpacing}px` : undefined,
        lineHeight: element.lineHeight ?? 1.15,
        textAlign: align,
        fontFamily: cardFontStack(element.font),
        background: element.background,
        whiteSpace: 'pre-wrap' as const,
        overflowWrap: 'anywhere' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        boxSizing: 'border-box' as const,
    };

    if (element.type === 'qr') {
        const target = (element.text ?? '').trim() || 'https://example.com';
        const size = Math.max(24, Math.min(element.width, element.height));
        return (
            <div
                style={{
                    ...style,
                    background: '#ffffff',
                    padding: Math.max(2, Math.round(size * 0.04)),
                    boxSizing: 'border-box',
                }}
                aria-label="Invitation QR"
            >
                <QRCodeSVG
                    value={target}
                    size={Math.max(16, size - Math.max(4, Math.round(size * 0.08)))}
                    bgColor="#ffffff"
                    fgColor="#1c1712"
                    className="h-full w-full"
                />
            </div>
        );
    }

    if (element.type === 'image' && element.src) {
        return (
            <img
                alt=""
                src={element.src}
                style={{ ...style, objectFit: 'cover', objectPosition: element.objectPosition ?? 'center' }}
            />
        );
    }

    if (element.type === 'video' && element.text) {
        return (
            <a href={element.text} style={style} className="underline">
                Video
            </a>
        );
    }

    if (element.type === 'shape' || element.type === 'decoration' || element.type === 'icon') {
        return <div style={{ ...style, borderRadius: element.type === 'shape' ? 0 : 999 }} />;
    }

    return (
        <p style={style} className="m-0 w-full">
            <span className="block w-full" style={{ textAlign: align }}>
                {element.text}
            </span>
        </p>
    );
}
