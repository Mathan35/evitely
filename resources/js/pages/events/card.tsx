import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import '../../../css/editor-fonts.css';
import { CardCanvas } from '@/components/cards/card-canvas';
import { CardEditorCanvas } from '@/components/studio/card-editor-canvas';
import { EditorInspector } from '@/components/studio/editor-inspector';
import { EditorShell } from '@/components/studio/editor-shell';
import { EditorTopBar } from '@/components/studio/editor-top-bar';
import { CardEditorNav } from '@/components/studio/card-editor-nav';
import {
    CardBackgroundPanel,
    CardColorsPanel,
    CardContentPanel,
    CardExportPanel,
    CardLayoutPanel,
    CardTypographyPanel,
} from '@/components/studio/card-editor-panels';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cardStageFit, elementLabel, scaleCardDocument, type CardEditorSectionId } from '@/lib/card-editor';
import {
    cardDocumentToDataUrl,
    cardDocumentToPdfBlob,
    shareCardArtifact,
    triggerBlobDownload,
    triggerDataUrlDownload,
} from '@/lib/card-export';
import { acquireDocumentScrollLock } from '@/lib/document-scroll-lock';
import type { CardDocument, CardElement } from '@/types/wedding';
import { toast } from 'sonner';

type CardState = {
    format: string;
    width: number;
    height: number;
    status: string;
    document: CardDocument;
};

const SECTION_COPY: Record<CardEditorSectionId, { title: string; description: string }> = {
    content: { title: 'Content', description: 'Edit invitation copy on each layer.' },
    typography: { title: 'Typography', description: 'Fonts, letter size, weight, and alignment.' },
    colors: { title: 'Colors', description: 'Palettes, ink, and fills.' },
    layout: { title: 'Layout', description: 'Format, snap align, and layer position.' },
    background: { title: 'Background', description: 'Background art for the card.' },
    export: { title: 'Export', description: 'Save, generate, download, and share.' },
};

export default function CardEditor({
    eventId,
    title,
    slug,
    card,
    presets,
    inviteUrl,
    cardUrl,
    eventsHref = '/events',
    weddingStatus = 'draft',
    cardArts = [],
    editorSaved = false,
}: {
    eventId: number;
    title: string;
    slug: string;
    inviteUrl: string;
    cardUrl?: string;
    musicUrl?: string | null;
    /** @deprecated Card editor returns to Events; kept for older payloads. */
    galleryHref?: string;
    eventsHref?: string;
    weddingStatus?: string;
    occasionSlug?: string;
    editorSaved?: boolean;
    card: CardState | null;
    presets: { format: string; width: number; height: number; label: string }[];
    templates: { id: string; name: string }[];
    cardArts?: { id: string; label: string; src: string }[];
}) {
    const initial = card ?? {
        format: 'invite',
        width: 1080,
        height: 1440,
        status: 'draft',
        document: { background: '#f4efe6', elements: [] },
    };

    const [section, setSection] = useState<CardEditorSectionId>('content');
    const [navOpen, setNavOpen] = useState(true);
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [format, setFormat] = useState(initial.format);
    const [width, setWidth] = useState(initial.width);
    const [height, setHeight] = useState(initial.height);
    const [document, setDocument] = useState<CardDocument>(initial.document);
    const [selected, setSelected] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [dirty, setDirty] = useState(false);
    const [past, setPast] = useState<string[]>([]);
    const [future, setFuture] = useState<string[]>([]);
    const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(false);
    const skippingHistory = useRef(false);
    const dirtyRef = useRef(false);
    const documentRef = useRef(document);
    const hydratedRef = useRef(false);
    const stage = cardStageFit(width, height, stageSize);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        let wasDesktop = mq.matches;
        const sync = (): void => {
            const desktop = mq.matches;
            setIsMobile(!desktop);
            if (desktop && !wasDesktop) {
                setInspectorOpen(true);
                setNavOpen(true);
            } else if (!desktop && wasDesktop) {
                setInspectorOpen(false);
            }
            wasDesktop = desktop;
        };
        // Initial layout only — do not force-close an already-open mobile sheet.
        setIsMobile(!mq.matches);
        if (mq.matches) {
            setInspectorOpen(true);
            setNavOpen(true);
        }
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        if (!selected) {
            setPendingDelete(false);
        }
    }, [selected]);

    // Full-screen studio: lock page scroll so tool taps never jump the page.
    // Use shared lock — `document` here is the card JSON state, not window.document.
    useEffect(() => acquireDocumentScrollLock(), []);

    const current = useMemo(
        () => (document.elements ?? []).find((element) => element.id === selected) ?? null,
        [document.elements, selected],
    );
    const meta = SECTION_COPY[section];
    const previewHref = `/events/${eventId}/preview?from=card`;

    useEffect(() => {
        dirtyRef.current = dirty;
    }, [dirty]);

    useEffect(() => {
        documentRef.current = document;
    }, [document]);

    // Local state starts from props. Re-apply server card only when clean (Generate / external refresh).
    useEffect(() => {
        if (!card) {
            return;
        }
        if (!hydratedRef.current) {
            hydratedRef.current = true;
            return;
        }
        if (dirtyRef.current) {
            return;
        }
        setFormat(card.format);
        setWidth(card.width);
        setHeight(card.height);
        setDocument(card.document);
    }, [card]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent): void => {
            const target = event.target as HTMLElement | null;
            const tag = target?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
                return;
            }
            const mod = event.metaKey || event.ctrlKey;
            if (!mod) {
                return;
            }
            const key = event.key.toLowerCase();
            if (key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
                return;
            }
            if ((key === 'z' && event.shiftKey) || key === 'y') {
                event.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [past, future, document, format, width, height, selected]);

    useEffect(() => {
        const onBeforeUnload = (event: BeforeUnloadEvent): void => {
            if (!dirtyRef.current) {
                return;
            }
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, []);

    function snapshot(): string {
        return JSON.stringify({ document, format, width, height, selected });
    }

    function pushHistory(): void {
        if (skippingHistory.current) {
            return;
        }
        setPast((stack) => [...stack.slice(-39), snapshot()]);
        setFuture([]);
    }

    function markDirty(): void {
        setDirty(true);
    }

    function persist(
        nextDocument = document,
        nextFormat = format,
        nextWidth = width,
        nextHeight = height,
        then?: () => void,
        onFail?: () => void,
    ): void {
        const savedSnapshot = JSON.stringify(nextDocument);
        setStatus('saving');
        router.put(
            `/events/${eventId}/card`,
            { format: nextFormat, width: nextWidth, height: nextHeight, document: nextDocument },
            {
                preserveScroll: true,
                preserveState: true,
                // Quiet autosave — don't re-merge page props (avoids canvas hitch / reload feel).
                only: [],
                onSuccess: () => {
                    // Keep dirty if the user edited again while the request was in flight.
                    if (JSON.stringify(documentRef.current) === savedSnapshot) {
                        setDirty(false);
                        setStatus('saved');
                    } else {
                        setStatus('idle');
                    }
                    then?.();
                },
                onError: () => {
                    setStatus('idle');
                    onFail?.();
                },
            },
        );
    }

    function setDocumentTracked(next: CardDocument): void {
        pushHistory();
        setDocument(next);
        markDirty();
    }

    /** Discrete edit — one undo step. */
    function patch(id: string, values: Partial<CardElement>): void {
        pushHistory();
        setDocument((prev) => ({
            ...prev,
            elements: (prev.elements ?? []).map((element) => (element.id === id ? { ...element, ...values } : element)),
        }));
        markDirty();
    }

    /** Continuous gesture frame — local UI only (no dirty/save until gesture ends). */
    function patchLive(id: string, values: Partial<CardElement>): void {
        setDocument((prev) => ({
            ...prev,
            elements: (prev.elements ?? []).map((element) => (element.id === id ? { ...element, ...values } : element)),
        }));
    }

    /** User finished placing — start debounced persist. */
    function commitGesture(): void {
        markDirty();
    }

    function removeElement(id: string): void {
        pushHistory();
        setDocument((prev) => ({
            ...prev,
            elements: (prev.elements ?? []).filter((element) => element.id !== id),
        }));
        if (selected === id) {
            setSelected(null);
        }
        markDirty();
    }

    function addTextLayer(): void {
        const id = `text-${Date.now()}`;
        const next: CardElement = {
            id,
            type: 'text',
            text: 'New text',
            x: Math.round(width * 0.12),
            y: Math.round(height * 0.42),
            width: Math.round(width * 0.76),
            height: Math.round(height * 0.08),
            fontSize: Math.max(28, Math.round(width * 0.045)),
            fontWeight: 500,
            color: '#1c1712',
            align: 'center',
            font: 'serif',
            lineHeight: 1.2,
        };
        pushHistory();
        setDocument((prev) => ({
            ...prev,
            elements: [...(prev.elements ?? []), next],
        }));
        setSelected(id);
        setSection('content');
        markDirty();
        if (isMobile) {
            setInspectorOpen(true);
        }
    }

    function applyScaledCanvas(nextWidth: number, nextHeight: number, nextFormat = format, trackHistory = true): void {
        const safeWidth = Math.max(100, Math.round(nextWidth));
        const safeHeight = Math.max(100, Math.round(nextHeight));
        if (safeWidth === width && safeHeight === height && nextFormat === format) {
            return;
        }

        if (trackHistory) {
            pushHistory();
        }
        setFormat(nextFormat);
        setDocument(scaleCardDocument(document, width, height, safeWidth, safeHeight));
        setWidth(safeWidth);
        setHeight(safeHeight);
        markDirty();
    }

    function resizeCanvas(nextWidth: number, nextHeight: number, nextFormat = format): void {
        applyScaledCanvas(nextWidth, nextHeight, nextFormat, true);
    }

    function applyGeneratedCard(next: CardState): void {
        setFormat(next.format);
        setWidth(next.width);
        setHeight(next.height);
        setDocument(next.document);
        setPast([]);
        setFuture([]);
        setSelected(null);
        dirtyRef.current = false;
        setDirty(false);
        setStatus('saved');
    }

    function changeFormat(nextFormat: string): void {
        if (nextFormat === format) {
            return;
        }

        const preset = presets.find((item) => item.format === nextFormat);
        if (preset && nextFormat !== 'custom') {
            pushHistory();
            setStatus('saving');
            router.post(
                `/events/${eventId}/card/generate`,
                { format: nextFormat },
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['card'],
                    onSuccess: (page) => {
                        const next = (page.props as { card?: CardState | null }).card;
                        if (!next) {
                            // Server regenerated but props missing — scale locally so layout still updates.
                            applyScaledCanvas(preset.width, preset.height, nextFormat, false);
                            setStatus('saved');
                            return;
                        }
                        applyGeneratedCard(next);
                    },
                    onError: () => {
                        applyScaledCanvas(preset.width, preset.height, nextFormat, false);
                        setStatus('idle');
                        toast.error('Could not rebuild this format. Layout scaled locally instead.');
                    },
                },
            );
            return;
        }

        pushHistory();
        setFormat(nextFormat);
        markDirty();
    }

    function undo(): void {
        const previous = past[past.length - 1];
        if (!previous) {
            return;
        }
        skippingHistory.current = true;
        setFuture((stack) => [snapshot(), ...stack]);
        setPast((stack) => stack.slice(0, -1));
        const parsed = JSON.parse(previous) as {
            document: CardDocument;
            format: string;
            width: number;
            height: number;
            selected: string | null;
        };
        setDocument(parsed.document);
        setFormat(parsed.format);
        setWidth(parsed.width);
        setHeight(parsed.height);
        setSelected(parsed.selected);
        markDirty();
        queueMicrotask(() => {
            skippingHistory.current = false;
        });
    }

    function redo(): void {
        const next = future[0];
        if (!next) {
            return;
        }
        skippingHistory.current = true;
        setPast((stack) => [...stack, snapshot()]);
        setFuture((stack) => stack.slice(1));
        const parsed = JSON.parse(next) as {
            document: CardDocument;
            format: string;
            width: number;
            height: number;
            selected: string | null;
        };
        setDocument(parsed.document);
        setFormat(parsed.format);
        setWidth(parsed.width);
        setHeight(parsed.height);
        setSelected(parsed.selected);
        markDirty();
        queueMicrotask(() => {
            skippingHistory.current = false;
        });
    }

    function selectLayer(id: string | null): void {
        setSelected(id);
        if (!id) {
            return;
        }
        const element = (document.elements ?? []).find((item) => item.id === id);
        if (element?.type === 'text' || element?.type === 'qr' || element?.type === 'video') {
            setSection('content');
        }
        // Mobile: keep selected + show Edit/Delete tip; drag is always available.
    }

    function openMobileEdit(): void {
        setSection('content');
        setInspectorOpen(true);
    }

    function requestLeave(): void {
        if (!dirty) {
            router.visit(leaveHref);
            return;
        }
        setLeaveOpen(true);
    }

    function discardAndLeave(): void {
        setLeaving(true);
        setDirty(false);
        if (!editorSaved) {
            router.delete(`/events/${eventId}`, {
                onSuccess: () => router.visit(leaveHref),
                onError: () => router.visit(leaveHref),
                onFinish: () => setLeaving(false),
            });
            return;
        }
        router.visit(leaveHref, {
            onFinish: () => setLeaving(false),
        });
    }

    function saveAndLeave(): void {
        setLeaving(true);
        persist(document, format, width, height, () => {
            router.visit(leaveHref, {
                onFinish: () => setLeaving(false),
            });
        }, () => setLeaving(false));
    }

    function openPreview(): void {
        const tab = window.open('about:blank', '_blank');

        const go = () => {
            if (tab && !tab.closed) {
                tab.location.href = previewHref;
                return;
            }
            window.location.assign(previewHref);
        };

        if (!dirty) {
            go();
            return;
        }

        persist(document, format, width, height, go, () => tab?.close());
    }

    const [exporting, setExporting] = useState<'png' | 'jpg' | 'pdf' | 'share' | null>(null);
    const [publishing, setPublishing] = useState(false);
    const [weddingPublished, setWeddingPublished] = useState(weddingStatus === 'published');
    const leaveHref = eventsHref || '/events';
    const publicCardUrl = cardUrl || (slug ? `/invite/${slug}/card` : inviteUrl);
    const exportFileBase = title.trim().replace(/[^\w\s-]+/g, '').replace(/\s+/g, '-') || 'invitation-card';

    async function ensureSavedForExport(): Promise<boolean> {
        if (!dirty) {
            return true;
        }

        return new Promise<boolean>((resolve) => {
            persist(
                document,
                format,
                width,
                height,
                () => resolve(true),
                () => resolve(false),
            );
        });
    }

    function recordExport(kind: 'png' | 'jpg' | 'pdf' | 'share'): void {
        router.post(`/events/${eventId}/card/export`, { kind }, { preserveScroll: true, preserveState: true, only: [] });
    }

    function publish(): void {
        if (publishing) {
            return;
        }
        setPublishing(true);

        const go = (): void => {
            if (weddingPublished) {
                window.open(inviteUrl || `/events/${eventId}/preview?from=card`, '_blank');
                setPublishing(false);
                return;
            }

            router.post(
                `/events/${eventId}/publish`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => setWeddingPublished(true),
                    onFinish: () => setPublishing(false),
                },
            );
        };

        if (!dirty) {
            go();
            return;
        }

        persist(document, format, width, height, go, () => setPublishing(false));
    }

    async function download(kind: 'png' | 'jpg'): Promise<void> {
        if (exporting) {
            return;
        }

        setExporting(kind);

        const ready = await ensureSavedForExport();
        if (!ready) {
            setExporting(null);
            toast.error('Could not save the card before download.');
            return;
        }

        try {
            // Wait a frame so QR SVGs (and any just-saved art) are painted before rasterize.
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const dataUrl = await cardDocumentToDataUrl(document, width, height, kind);
            triggerDataUrlDownload(dataUrl, `${exportFileBase}.${kind === 'jpg' ? 'jpg' : 'png'}`);
            recordExport(kind);
            toast.success(kind === 'jpg' ? 'JPG downloaded.' : 'PNG downloaded.');
        } catch (error) {
            console.error(error);
            toast.error('Could not download the card. Please try again.');
        } finally {
            setExporting(null);
        }
    }

    async function downloadPdf(printReady = false): Promise<void> {
        if (exporting) {
            return;
        }

        setExporting('pdf');
        const ready = await ensureSavedForExport();
        if (!ready) {
            setExporting(null);
            toast.error('Could not save the card before creating the PDF.');
            return;
        }

        try {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const pdf = await cardDocumentToPdfBlob(document, width, height, {
                printReady,
                bleedMm: printReady ? 3 : 0,
            });
            triggerBlobDownload(
                pdf,
                `${exportFileBase}${printReady ? '-print-ready' : ''}.pdf`,
            );
            recordExport('pdf');
            toast.success(
                printReady
                    ? 'Print-ready PDF downloaded (≈300 DPI + 3mm bleed).'
                    : 'PDF downloaded.',
            );
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Could not create the PDF. Please try again.');
        } finally {
            setExporting(null);
        }
    }

    async function shareCard(): Promise<void> {
        if (exporting) {
            return;
        }

        setExporting('share');
        const ready = await ensureSavedForExport();
        if (!ready) {
            setExporting(null);
            toast.error('Could not save the card before sharing.');
            return;
        }

        try {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const dataUrl = await cardDocumentToDataUrl(document, width, height, 'png');
            const result = await shareCardArtifact({
                dataUrl,
                filename: `${exportFileBase}.png`,
                title: title || 'Invitation card',
                text: `You're invited — view the card: ${publicCardUrl}`,
                url: publicCardUrl,
            });

            if (result === 'aborted') {
                return;
            }

            recordExport('share');
            if (result === 'copied') {
                toast.success('Card link copied.');
            } else if (result === 'downloaded') {
                toast.success('Sharing unavailable here — card image downloaded instead.');
            } else {
                toast.success('Card shared.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Could not share the card. Please try again.');
        } finally {
            setExporting(null);
        }
    }

    const savedLabel = status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : dirty ? 'Unsaved' : 'Ready';

    return (
        <>
            <Head title={`Card · ${title}`} />
            <EditorShell
                navOpen={navOpen}
                inspectorOpen={inspectorOpen}
                onToggleNav={() => setNavOpen((open) => !open)}
                onToggleInspector={() => setInspectorOpen((open) => !open)}
                topBar={
                    <EditorTopBar
                        projectName={title}
                        savedAt={savedLabel}
                        canUndo={past.length > 0}
                        canRedo={future.length > 0}
                        onUndo={undo}
                        onRedo={redo}
                        onSave={() => persist()}
                        saving={status === 'saving'}
                        onPublish={publish}
                        publishing={publishing}
                        publishLabel={publishing ? 'Publishing…' : weddingPublished ? 'View site' : 'Publish'}
                        onPreview={openPreview}
                        previewHref={previewHref}
                        eventsHref={leaveHref}
                        eventsLabel="← Events"
                        onBack={requestLeave}
                    />
                }
                nav={
                    <CardEditorNav
                        active={section}
                        onSelect={(id) => {
                            setSection(id);
                            if (window.matchMedia('(max-width: 767px)').matches) {
                                setInspectorOpen(true);
                                // Reset sheet scroll without scrolling the page.
                                requestAnimationFrame(() => {
                                    const sheet = window.document.querySelector<HTMLElement>('[data-mobile-editor-sheet]');
                                    sheet
                                        ?.querySelector<HTMLElement>('[data-editor-inspector-scroll]')
                                        ?.scrollTo({ top: 0, behavior: 'smooth' });
                                });
                            }
                        }}
                    />
                }
                canvas={
                    <CardEditorCanvas
                        stageMaxWidth={stage.stageMaxWidth}
                        onStageSize={setStageSize}
                        onDeselect={() => setSelected(null)}
                    >
                        <CardCanvas
                            key={`${format}-${width}x${height}`}
                            document={document}
                            width={width}
                            height={height}
                            fitWidth={stage.fitWidth}
                            selectedId={selected}
                            onSelect={(id) => selectLayer(id || null)}
                            onChange={patchLive}
                            onPatch={patch}
                            onGestureStart={pushHistory}
                            onGestureEnd={commitGesture}
                            showSelectionTools={!isMobile}
                            mobileActions={
                                isMobile && current && !inspectorOpen
                                    ? {
                                          onEdit: openMobileEdit,
                                          onDelete: () => setPendingDelete(true),
                                      }
                                    : null
                            }
                        />
                    </CardEditorCanvas>
                }
                inspector={
                    <EditorInspector title={meta.title} description={meta.description} panelKey={section}>
                        {section === 'content' && (
                            <CardContentPanel
                                current={current}
                                elements={document.elements ?? []}
                                selectedId={selected}
                                onSelect={selectLayer}
                                onPatch={patch}
                                onDelete={removeElement}
                                onAddText={addTextLayer}
                            />
                        )}
                        {section === 'typography' && <CardTypographyPanel current={current} onPatch={patch} />}
                        {section === 'colors' && (
                            <CardColorsPanel
                                current={current}
                                document={document}
                                onPatch={patch}
                                onDocument={setDocumentTracked}
                            />
                        )}
                        {section === 'layout' && (
                            <CardLayoutPanel
                                current={current}
                                format={format}
                                width={width}
                                height={height}
                                presets={presets}
                                onPatch={patch}
                                onFormat={changeFormat}
                                onWidth={(value) => resizeCanvas(value, height, 'custom')}
                                onHeight={(value) => resizeCanvas(width, value, 'custom')}
                            />
                        )}
                        {section === 'background' && (
                            <CardBackgroundPanel
                                document={document}
                                onDocument={setDocumentTracked}
                                cardArts={cardArts}
                            />
                        )}
                        {section === 'export' && (
                            <CardExportPanel
                                status={status}
                                exporting={exporting}
                                onSave={() => persist()}
                                onGenerate={() => {
                                    dirtyRef.current = false;
                                    setDirty(false);
                                    setStatus('saving');
                                    router.post(
                                        `/events/${eventId}/card/generate`,
                                        { format },
                                        {
                                            preserveScroll: true,
                                            preserveState: true,
                                            only: ['card'],
                                            onSuccess: (page) => {
                                                const next = (page.props as { card?: CardState | null }).card;
                                                if (!next) {
                                                    setStatus('idle');
                                                    toast.error('Card generated, but the editor could not refresh.');
                                                    return;
                                                }
                                                applyGeneratedCard(next);
                                            },
                                            onError: () => {
                                                setStatus('idle');
                                                toast.error('Could not generate the card.');
                                            },
                                        },
                                    );
                                }}
                                onDownload={(kind) => void download(kind)}
                                onShare={() => void shareCard()}
                                onPrint={() => void downloadPdf(false)}
                                onPrintReady={() => void downloadPdf(true)}
                            />
                        )}
                    </EditorInspector>
                }
            />

            <ConfirmDialog
                open={pendingDelete && current != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDelete(false);
                    }
                }}
                title="Remove this layer?"
                description={current ? `“${elementLabel(current)}” will be removed from the card. You can undo afterward.` : undefined}
                confirmLabel="Remove layer"
                tone="danger"
                onConfirm={() => {
                    if (current) {
                        removeElement(current.id);
                    }
                    setPendingDelete(false);
                }}
            />

            <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                <DialogContent className="gap-5 rounded-[1.35rem] border-zinc-200/80 p-6 shadow-2xl shadow-zinc-950/15 sm:max-w-md">
                    <DialogHeader className="gap-2 text-left">
                        <DialogTitle className="text-[17px] font-semibold tracking-tight text-zinc-900">
                            Leave card editor?
                        </DialogTitle>
                        <DialogDescription className="text-[13px] leading-relaxed text-zinc-500">
                            You have unsaved changes. Save them before returning to Events, or discard and leave.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-full px-5"
                            disabled={leaving}
                            onClick={() => setLeaveOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-full px-5 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            disabled={leaving}
                            onClick={discardAndLeave}
                        >
                            Discard
                        </Button>
                        <Button
                            type="button"
                            className="h-10 rounded-full bg-zinc-900 px-5 text-white hover:bg-zinc-800"
                            disabled={leaving}
                            onClick={saveAndLeave}
                        >
                            {leaving ? 'Working…' : 'Save & leave'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
