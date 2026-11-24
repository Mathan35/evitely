import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { introCopyFor } from '@/lib/invitation-intro-copy';
import {
    DEFAULT_INTRO_STYLE,
    resolveIntroStyleId,
    type IntroStyleId,
} from '@/lib/invitation-intro-styles';
import { acquireDocumentScrollLock } from '@/lib/document-scroll-lock';
import { cn } from '@/lib/utils';

export type InvitationIntroContent = {
    /** "OUR HONORED GUEST" */
    honoredLabel?: string;
    /** "Dear Guest" / personalized guest name */
    dearLine?: string;
    /** "Manoj & MadhuShree invite you to celebrate their wedding." */
    inviteLine?: string;
    /** Seal monogram e.g. "M & M" */
    initials?: string;
    /** Preparing screen label */
    preparingLabel?: string;
    /** Preparing screen quote */
    preparingQuote?: string;
    /** Seal CTA — unique per event + locale */
    openCta?: string;
    /** Seal hint / aria-label — unique per event + locale */
    openHint?: string;
    /** Soft paper canvas */
    paper?: string;
    /** Body / heading ink */
    ink?: string;
    /** Wax seal + accent marks */
    seal?: string;
};

export type InvitationIntroPhase = 'preparing' | 'cover' | 'opening' | 'done';

export function invitationInitials(hosts: string, fallback = '·'): string {
    const parts = hosts
        .split(/\s*&\s*|\s+and\s+/i)
        .map((part) => part.trim())
        .filter(Boolean);
    if (parts.length >= 2) {
        const a = parts[0][0] ?? '';
        const b = parts[1][0] ?? '';
        return a && b ? `${a.toUpperCase()} & ${b.toUpperCase()}` : fallback;
    }
    const single = parts[0] ?? '';
    const words = single.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return (single.slice(0, 2) || fallback).toUpperCase();
}

export function buildInvitationIntroContent(input: {
    eventSlug?: string | null;
    locale?: string | null;
    hosts?: string | null;
    guestName?: string | null;
    paper?: string | null;
    ink?: string | null;
    seal?: string | null;
    inviteLine?: string | null;
    preparingQuote?: string | null;
}): InvitationIntroContent {
    const copy = introCopyFor(input.eventSlug, input.locale);
    const hosts = (input.hosts || '').trim() || copy.youAreInvited;
    const guest = (input.guestName || '').trim() || 'Guest';

    return {
        honoredLabel: copy.honoredLabel.toUpperCase(),
        dearLine: `${copy.dearPrefix} ${guest}`,
        inviteLine: input.inviteLine?.trim() || `${hosts} ${copy.inviteVerb}.`,
        initials: invitationInitials(hosts),
        preparingLabel: copy.preparingLabel,
        preparingQuote: input.preparingQuote?.trim() || copy.preparingQuote,
        openCta: copy.openCta,
        openHint: copy.openHint,
        paper: input.paper?.trim() || '#f9ebe7',
        ink: input.ink?.trim() || '#7a514d',
        seal: input.seal?.trim() || '#a67068',
    };
}

function IntroCoverCopy({
    content,
    compact,
}: {
    content: InvitationIntroContent;
    compact?: boolean;
}) {
    return (
        <div className="invitation-intro-copy">
            <p
                className={cn(
                    'invitation-intro-copy-label tracking-[0.36em] uppercase',
                    compact ? 'text-[7px]' : 'text-[10px] sm:text-[11px]',
                )}
            >
                {content.honoredLabel || 'OUR HONORED GUEST'}
            </p>
            <h2
                className={cn(
                    'invitation-intro-copy-title mt-3 font-serif leading-none font-light tracking-tight',
                    compact ? 'text-[1.15rem]' : 'mt-4 text-[2.35rem] sm:text-[3rem]',
                )}
            >
                {content.dearLine || 'Dear Guest'}
            </h2>
            <span className="invitation-intro-diamond mt-4" aria-hidden />
            <p
                className={cn(
                    'invitation-intro-copy-body mt-4 max-w-md font-serif leading-relaxed italic',
                    compact ? 'text-[9px] leading-4' : 'mt-5 text-[14px] leading-7 sm:text-[15px]',
                )}
            >
                {content.inviteLine}
            </p>
        </div>
    );
}

function IntroCta({
    styleId,
    initials,
    opening,
    onOpen,
    compact,
    openCta,
    openHint,
}: {
    styleId: IntroStyleId;
    initials?: string;
    opening: boolean;
    onOpen: () => void;
    compact?: boolean;
    openCta?: string;
    openHint?: string;
}) {
    void styleId;
    const cta = (openCta || 'Open').trim();
    const hint = (openHint || 'tap to open the invitation').trim();
    const className = cn(
        'invitation-intro-seal mt-8 touch-manipulation select-none',
        compact && 'invitation-intro-seal--compact mt-4',
        opening && 'invitation-intro-seal--break',
    );
    const body = (
        <>
            <span className="invitation-intro-seal-ring" aria-hidden />
            <span className="relative z-[1] flex flex-col items-center justify-center gap-1">
                <span
                    className={cn(
                        'font-serif leading-none tracking-wide text-white',
                        compact ? 'text-[0.85rem]' : 'text-[1.35rem]',
                    )}
                >
                    {initials || '·'}
                </span>
                <span
                    className={cn(
                        'font-semibold tracking-[0.18em] text-white/95 uppercase',
                        compact ? 'text-[6px]' : 'text-[9px]',
                    )}
                >
                    {cta}
                </span>
            </span>
        </>
    );

    // Compact thumbs sit inside a selectable card button — never nest <button>.
    if (compact) {
        return (
            <span className={className} aria-hidden>
                {body}
            </span>
        );
    }

    return (
        <button type="button" onClick={onOpen} className={className} aria-label={hint}>
            {body}
        </button>
    );
}

/**
 * Product intro: preparing → cover → open animation → reveal site.
 * `style` picks one of ten unique open animations.
 */
export function InvitationIntro({
    content,
    style = DEFAULT_INTRO_STYLE,
    active = true,
    showPreparing = true,
    preparingMs = 900,
    autoOpen = false,
    autoOpenMs = 900,
    fullscreen = false,
    compact = false,
    loop = false,
    onOpened,
    className,
}: {
    content: InvitationIntroContent;
    style?: IntroStyleId | string | null;
    /** When false, skip mounting (already opened this session). */
    active?: boolean;
    showPreparing?: boolean;
    preparingMs?: number;
    /** Studio canvases can auto-open after cover shows. */
    autoOpen?: boolean;
    autoOpenMs?: number;
    /** Public View site — pin overlay to the viewport. */
    fullscreen?: boolean;
    /** Tiny card thumbnails in the editor picker. */
    compact?: boolean;
    /** Replay preparing → cover → open forever (picker thumb). */
    loop?: boolean;
    onOpened?: () => void;
    className?: string;
}) {
    const styleId = resolveIntroStyleId(style);
    const [phase, setPhase] = useState<InvitationIntroPhase>(
        active ? (showPreparing ? 'preparing' : 'cover') : 'done',
    );

    const palette = useMemo(
        () => ({
            paper: content.paper || '#f9ebe7',
            ink: content.ink || '#7a514d',
            seal: content.seal || '#a67068',
            muted: content.ink || '#7a514d',
        }),
        [content.ink, content.paper, content.seal],
    );

    useEffect(() => {
        if (!active) {
            setPhase('done');
            return;
        }
        setPhase(showPreparing ? 'preparing' : 'cover');
    }, [
        active,
        showPreparing,
        content.initials,
        content.inviteLine,
        content.openCta,
        content.preparingLabel,
        content.dearLine,
        styleId,
    ]);

    useEffect(() => {
        if (phase !== 'preparing') {
            return;
        }
        const timer = window.setTimeout(() => setPhase('cover'), preparingMs);
        return () => window.clearTimeout(timer);
    }, [phase, preparingMs]);

    useEffect(() => {
        if (phase !== 'cover' || !autoOpen) {
            return;
        }
        const timer = window.setTimeout(() => setPhase('opening'), autoOpenMs);
        return () => window.clearTimeout(timer);
    }, [phase, autoOpen, autoOpenMs]);

    useEffect(() => {
        if (phase !== 'opening') {
            return;
        }
        const timer = window.setTimeout(() => {
            if (loop) {
                setPhase(showPreparing ? 'preparing' : 'cover');
                return;
            }
            setPhase('done');
            onOpened?.();
        }, compact ? 950 : 1350);
        return () => window.clearTimeout(timer);
    }, [phase, onOpened, loop, showPreparing, compact]);

    useEffect(() => {
        if (!fullscreen || !active || phase === 'done') {
            return;
        }

        return acquireDocumentScrollLock();
    }, [fullscreen, active, phase]);

    if (!active || phase === 'done') {
        return null;
    }

    function open(): void {
        if (phase !== 'cover') {
            return;
        }
        setPhase('opening');
    }

    const opening = phase === 'opening';
    const pad = compact ? 'px-3' : 'px-6';

    return (
        <div
            className={cn(
                'invitation-intro inset-0 z-[50] overflow-hidden',
                `invitation-intro--${styleId}`,
                fullscreen ? 'fixed' : 'absolute',
                opening && 'invitation-intro--opening',
                compact && 'invitation-intro--compact',
                className,
            )}
            style={
                {
                    ['--intro-paper' as string]: palette.paper,
                    ['--intro-ink' as string]: palette.ink,
                    ['--intro-seal' as string]: palette.seal,
                    ['--intro-muted' as string]: palette.muted,
                } as CSSProperties
            }
            role={compact ? undefined : 'dialog'}
            aria-modal={compact ? undefined : true}
            aria-label={compact ? undefined : content.openHint || content.openCta || 'Open invitation'}
            aria-hidden={compact || undefined}
        >
            {phase === 'preparing' ? (
                <div
                    className={cn(
                        'invitation-intro-preparing absolute inset-0 flex flex-col items-center justify-center text-center',
                        pad,
                    )}
                >
                    <div className={cn('invitation-intro-mono', compact && 'invitation-intro-mono--compact')} aria-hidden>
                        <span>{content.initials || '·'}</span>
                    </div>
                    <p
                        className={cn(
                            'invitation-intro-copy-label font-medium tracking-[0.34em] uppercase',
                            compact ? 'mt-3 text-[6px]' : 'mt-8 text-[11px]',
                        )}
                    >
                        {content.preparingLabel || 'Preparing your invitation'}
                    </p>
                    {!compact ? (
                        <>
                            <span className="invitation-intro-diamond mt-5" aria-hidden />
                            <p className="invitation-intro-copy-body mt-5 max-w-sm font-serif text-[15px] italic">
                                “{content.preparingQuote || 'The beginning of forever…'}”
                            </p>
                        </>
                    ) : null}
                    <div className={cn('invitation-intro-dots', compact ? 'mt-4' : 'mt-10')} aria-hidden>
                        <span />
                        <span />
                        <span />
                    </div>
                </div>
            ) : (
                <>
                    {/* Decorative layers always sit behind the readable content panel. */}
                    <div className="invitation-intro-fx pointer-events-none absolute inset-0 z-0" aria-hidden>
                        {styleId === 'gatefold' ? (
                            <div className="invitation-intro-doors absolute inset-0">
                                <div className="invitation-intro-door invitation-intro-door--left" />
                                <div className="invitation-intro-door invitation-intro-door--right" />
                                <div className="invitation-intro-seam" />
                            </div>
                        ) : null}

                        {styleId === 'lumen' ? (
                            <div className="invitation-intro-lumen absolute inset-0">
                                <span className="invitation-intro-lumen-glow" />
                                <span className="invitation-intro-lumen-ring invitation-intro-lumen-ring--a" />
                                <span className="invitation-intro-lumen-ring invitation-intro-lumen-ring--b" />
                                <span className="invitation-intro-lumen-ring invitation-intro-lumen-ring--c" />
                            </div>
                        ) : null}

                        {styleId === 'velvet' ? (
                            <div className="invitation-intro-velvet absolute inset-0">
                                <div className="invitation-intro-velvet-lid invitation-intro-velvet-lid--top" />
                                <div className="invitation-intro-velvet-lid invitation-intro-velvet-lid--bottom" />
                                <div className="invitation-intro-velvet-hinge" />
                            </div>
                        ) : null}

                        {styleId === 'orchid' ? (
                            <div className="invitation-intro-orchid absolute inset-0">
                                <span className="invitation-intro-orchid-wash" />
                                <span className="invitation-intro-orchid-vine invitation-intro-orchid-vine--left" />
                                <span className="invitation-intro-orchid-vine invitation-intro-orchid-vine--right" />
                                <span className="invitation-intro-orchid-bloom invitation-intro-orchid-bloom--a" />
                                <span className="invitation-intro-orchid-bloom invitation-intro-orchid-bloom--b" />
                            </div>
                        ) : null}

                        {styleId === 'noir' ? (
                            <div className="invitation-intro-noir absolute inset-0">
                                <span className="invitation-intro-noir-stage" />
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <span key={i} className={`invitation-intro-noir-blade invitation-intro-noir-blade--${i}`} />
                                ))}
                            </div>
                        ) : null}

                        {styleId === 'atelier' ? (
                            <div className="invitation-intro-atelier absolute inset-0">
                                <span className="invitation-intro-atelier-linen" />
                                <span className="invitation-intro-atelier-shadow" />
                                <span className="invitation-intro-atelier-edge" />
                            </div>
                        ) : null}

                        {styleId === 'celeste' ? (
                            <div className="invitation-intro-celeste absolute inset-0">
                                <span className="invitation-intro-celeste-sky" />
                                <span className="invitation-intro-celeste-stars" />
                                <span className="invitation-intro-celeste-constellation" />
                                <span className="invitation-intro-celeste-veil" />
                            </div>
                        ) : null}

                        {styleId === 'gilded' ? (
                            <div className="invitation-intro-gilded absolute inset-0">
                                <span className="invitation-intro-gilded-plate" />
                                <span className="invitation-intro-gilded-corner invitation-intro-gilded-corner--tl" />
                                <span className="invitation-intro-gilded-corner invitation-intro-gilded-corner--tr" />
                                <span className="invitation-intro-gilded-corner invitation-intro-gilded-corner--bl" />
                                <span className="invitation-intro-gilded-corner invitation-intro-gilded-corner--br" />
                                <span className="invitation-intro-gilded-rule invitation-intro-gilded-rule--h" />
                                <span className="invitation-intro-gilded-rule invitation-intro-gilded-rule--v" />
                            </div>
                        ) : null}

                        {styleId === 'silk' ? (
                            <div className="invitation-intro-silk absolute inset-0">
                                <div className="invitation-intro-silk-panel invitation-intro-silk-panel--top" />
                                <div className="invitation-intro-silk-panel invitation-intro-silk-panel--bottom" />
                                <span className="invitation-intro-silk-fold" />
                            </div>
                        ) : null}

                        {styleId === 'vault' ? (
                            <div className="invitation-intro-vault absolute inset-0">
                                <div className="invitation-intro-vault-cover invitation-intro-vault-cover--left" />
                                <div className="invitation-intro-vault-cover invitation-intro-vault-cover--right" />
                                <span className="invitation-intro-vault-spine" />
                                <span className="invitation-intro-vault-stitch" />
                            </div>
                        ) : null}
                    </div>

                    <div
                        className={cn(
                            'invitation-intro-panel relative z-10 flex h-full flex-col items-center justify-center text-center',
                            pad,
                            opening && 'invitation-intro-panel--opening',
                        )}
                    >
                        <IntroCoverCopy content={content} compact={compact} />
                        <IntroCta
                            styleId={styleId}
                            initials={content.initials}
                            opening={opening}
                            onOpen={open}
                            compact={compact}
                            openCta={content.openCta}
                            openHint={content.openHint}
                        />
                        {!compact ? (
                            <p className="invitation-intro-hint mt-4 text-[10px] tracking-[0.16em]">
                                {content.openHint || 'tap to open the invitation'}
                            </p>
                        ) : null}
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Wraps children and gates them behind the intro until opened.
 * Remembers open state per `sessionKey` for the current page lifetime.
 */
export function InvitationIntroGate({
    content,
    style = DEFAULT_INTRO_STYLE,
    sessionKey,
    enabled = true,
    showPreparing = true,
    autoOpen = false,
    preparingMs,
    autoOpenMs,
    persistSession = true,
    fullscreen = false,
    children,
    className,
}: {
    content: InvitationIntroContent;
    style?: IntroStyleId | string | null;
    sessionKey: string;
    enabled?: boolean;
    showPreparing?: boolean;
    autoOpen?: boolean;
    preparingMs?: number;
    autoOpenMs?: number;
    /** When false (editor style picker), never write sessionStorage. */
    persistSession?: boolean;
    /** Public View site — fixed full-viewport intro overlay. */
    fullscreen?: boolean;
    children: ReactNode;
    className?: string;
}) {
    const styleId = resolveIntroStyleId(style);
    const [opened, setOpened] = useState(() => {
        if (!enabled || typeof window === 'undefined') {
            return !enabled;
        }
        if (!persistSession) {
            return false;
        }
        try {
            return window.sessionStorage.getItem(`invite-intro:${sessionKey}`) === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        if (!enabled) {
            setOpened(true);
            return;
        }
        if (!persistSession) {
            setOpened(false);
            return;
        }
        try {
            setOpened(window.sessionStorage.getItem(`invite-intro:${sessionKey}`) === '1');
        } catch {
            setOpened(false);
        }
    }, [enabled, sessionKey, persistSession, styleId]);

    function handleOpened(): void {
        setOpened(true);
        if (!persistSession) {
            return;
        }
        try {
            window.sessionStorage.setItem(`invite-intro:${sessionKey}`, '1');
        } catch {
            // ignore quota / private mode
        }
    }

    return (
        <div className={cn('relative', fullscreen ? 'min-h-0' : 'min-h-0 flex-1', className)}>
            {/* Live fullscreen: keep the site out of view until the intro finishes (no skeleton flash). */}
            <div
                className={cn(
                    fullscreen && !opened && 'pointer-events-none invisible absolute inset-0 overflow-hidden',
                    fullscreen && opened && 'contents',
                    !fullscreen && 'contents',
                )}
                aria-hidden={fullscreen && !opened ? true : undefined}
            >
                {children}
            </div>
            {!opened ? (
                <InvitationIntro
                    key={`${styleId}:${sessionKey}`}
                    content={content}
                    style={styleId}
                    showPreparing={showPreparing}
                    preparingMs={preparingMs}
                    autoOpen={autoOpen}
                    autoOpenMs={autoOpenMs}
                    fullscreen={fullscreen}
                    onOpened={handleOpened}
                />
            ) : null}
        </div>
    );
}
