import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { usePreviewLive } from '@/components/marketing/site-previews/preview-live';
import { useInvitationCopy } from '@/hooks/use-invitation-copy';
import { cn } from '@/lib/utils';

const CELEBRATE_ICON_SRC = '/images/celebrate-popper.png';

type Piece = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    w: number;
    h: number;
    rot: number;
    vrot: number;
    color: string;
    shape: 'rect' | 'circle' | 'ribbon' | 'diamond';
    wobble: number;
    age: number;
    maxAge: number;
    drag: number;
};

/** Soft celebration palette — previous brightness. */
const PALETTE = [
    '#ff5f6d',
    '#ffc145',
    '#4be3ac',
    '#6c8cff',
    '#ff8ecf',
    '#ffd166',
    '#a96cff',
    '#f6e7c1',
    '#e8b4a0',
    '#ffffff',
];

function reducedMotion(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function viewportProfile() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const diagonal = Math.hypot(w, h);
    const isMobile = w < 640;
    const isTablet = w >= 640 && w < 1024;

    return {
        w,
        h,
        diagonal,
        burstA: isMobile ? 70 : isTablet ? 95 : 120,
        burstB: isMobile ? 55 : isTablet ? 75 : 95,
        burstC: isMobile ? 40 : isTablet ? 55 : 70,
        speedMin: diagonal * (isMobile ? 0.008 : 0.01),
        speedMax: diagonal * (isMobile ? 0.018 : 0.022),
        sizeMin: isMobile ? 5 : 6,
        sizeMax: isMobile ? 12 : 16,
    };
}

function celebrateEndpoint(slug: string): string {
    if (typeof window === 'undefined') {
        return `/invite/${slug}/celebrate`;
    }
    const path = window.location.pathname;
    if (path.startsWith('/invite/')) {
        return `/invite/${slug}/celebrate`;
    }
    // Subdomain live sites mount celebrate at the domain root.
    return '/celebrate';
}

/**
 * Bottom-left celebrate control — fires a full-screen party-cracker confetti burst.
 * Portaled out of overflow/transform shells so live-site clicks always hit.
 * Transparent FAB — same look as before (no bg pill).
 */
export function PreviewCelebrateBurst({
    className,
    style,
    enabled,
}: {
    className?: string;
    style?: CSSProperties;
    enabled?: boolean;
}) {
    const live = usePreviewLive();
    const ui = useInvitationCopy();
    const show = enabled ?? live?.celebrateEnabled ?? true;

    const buttonRef = useRef<HTMLButtonElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const anchorRef = useRef<HTMLSpanElement>(null);
    const piecesRef = useRef<Piece[]>([]);
    const rafRef = useRef<number | null>(null);
    const [pulse, setPulse] = useState(false);
    const [host, setHost] = useState<HTMLElement | null>(null);
    const [framed, setFramed] = useState(false);

    useLayoutEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }
        const anchor = anchorRef.current;
        const shell = anchor?.closest(
            '[data-editor-preview], .editor-live-preview, .site-live-preview',
        ) as HTMLElement | null;
        const isFramed = Boolean(shell);
        setFramed(isFramed);

        // Live sites portal into a dedicated body root so StrictMode remounts
        // replace one node instead of stacking orphan celebrate FABs.
        let portalHost: HTMLElement;
        if (isFramed && shell) {
            portalHost = shell;
            const computed = window.getComputedStyle(shell);
            if (computed.position === 'static') {
                shell.style.position = 'relative';
            }
        } else {
            let root = document.getElementById('celebrate-fab-root');
            if (!root) {
                root = document.createElement('div');
                root.id = 'celebrate-fab-root';
                root.setAttribute('data-celebrate-root', '');
                document.body.appendChild(root);
            }
            // Drop any stale FAB nodes left from a previous mount/HMR.
            root.replaceChildren();
            portalHost = root;
        }

        setHost(portalHost);

        return () => {
            setHost(null);
        };
    }, []);

    const resize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext('2d');
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }, []);

    useEffect(() => {
        resize();
        window.addEventListener('resize', resize);
        return () => {
            window.removeEventListener('resize', resize);
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [resize]);

    const loop = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) {
            return;
        }

        const step = () => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            ctx.clearRect(0, 0, w, h);
            const pieces = piecesRef.current;

            for (let i = pieces.length - 1; i >= 0; i -= 1) {
                const p = pieces[i];
                p.age += 1;
                p.vy += 0.075;
                p.vx *= p.drag;
                p.x += p.vx + Math.sin(p.age * 0.045 + p.wobble) * 0.55;
                p.y += p.vy;
                p.rot += p.vrot;

                const life = 1 - p.age / p.maxAge;
                if (life <= 0 || p.y > h + 80 || p.x < -80 || p.x > w + 80) {
                    pieces.splice(i, 1);
                    continue;
                }

                ctx.save();
                const fade = life * life * (3 - 2 * life);
                ctx.globalAlpha = Math.max(0, Math.min(1, fade * 1.05));
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.shadowColor = `${p.color}66`;
                ctx.shadowBlur = 5;

                if (p.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.shape === 'diamond') {
                    ctx.beginPath();
                    ctx.moveTo(0, -p.size / 2);
                    ctx.lineTo(p.size / 2, 0);
                    ctx.lineTo(0, p.size / 2);
                    ctx.lineTo(-p.size / 2, 0);
                    ctx.closePath();
                    ctx.fill();
                } else if (p.shape === 'ribbon') {
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                } else {
                    ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.55);
                }
                ctx.restore();
            }

            if (pieces.length) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                rafRef.current = null;
                ctx.clearRect(0, 0, w, h);
            }
        };

        if (rafRef.current == null) {
            rafRef.current = requestAnimationFrame(step);
        }
    }, []);

    const spawnBurst = useCallback(
        (
            originX: number,
            originY: number,
            count: number,
            spreadDeg: number,
            tilt: number,
            profile: ReturnType<typeof viewportProfile>,
        ) => {
            const pieces = piecesRef.current;
            const speedSpan = profile.speedMax - profile.speedMin;

            for (let i = 0; i < count; i += 1) {
                const angle = tilt + ((Math.random() - 0.5) * spreadDeg * Math.PI) / 180;
                const speed = profile.speedMin + Math.random() * speedSpan;
                const roll = Math.random();
                const shape: Piece['shape'] =
                    roll > 0.72 ? 'ribbon' : roll > 0.5 ? 'rect' : roll > 0.28 ? 'circle' : 'diamond';
                const size = profile.sizeMin + Math.random() * (profile.sizeMax - profile.sizeMin);

                pieces.push({
                    x: originX + (Math.random() - 0.5) * 14,
                    y: originY + (Math.random() - 0.5) * 10,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size,
                    w: size * (0.35 + Math.random() * 0.5),
                    h: size * (1.4 + Math.random() * 1.2),
                    rot: Math.random() * Math.PI * 2,
                    vrot: (Math.random() - 0.5) * 0.22,
                    color: PALETTE[(Math.random() * PALETTE.length) | 0],
                    shape,
                    wobble: Math.random() * Math.PI * 2,
                    age: 0,
                    maxAge: 260 + Math.random() * 220,
                    drag: 0.991 + Math.random() * 0.006,
                });
            }
            loop();
        },
        [loop],
    );

    const notifyHost = useCallback(() => {
        const slug = live?.inviteSlug;
        if (!slug || typeof window === 'undefined') {
            return;
        }
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const guestName = typeof live?.guestName === 'string' ? live.guestName.trim() : '';
        void fetch(celebrateEndpoint(slug), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(token ? { 'X-CSRF-TOKEN': token } : {}),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ name: guestName || undefined }),
        }).catch(() => undefined);
    }, [live?.guestName, live?.inviteSlug]);

    const celebrate = useCallback(() => {
        notifyHost();

        if (reducedMotion()) {
            setPulse(true);
            window.setTimeout(() => setPulse(false), 400);
            return;
        }

        const btn = buttonRef.current;
        if (!btn) {
            return;
        }

        resize();
        const profile = viewportProfile();
        const rect = btn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        setPulse(true);
        window.setTimeout(() => setPulse(false), 560);

        spawnBurst(x, y, profile.burstA, 118, -Math.PI / 2.55, profile);
        window.setTimeout(() => spawnBurst(x + 6, y - 6, profile.burstB, 140, -Math.PI / 2.15, profile), 140);
        window.setTimeout(() => spawnBurst(x + 14, y - 12, profile.burstC, 160, -Math.PI / 2.7, profile), 280);
        window.setTimeout(
            () => spawnBurst(x + 10, y - 8, Math.round(profile.burstC * 0.55), 175, -Math.PI / 2.35, profile),
            420,
        );
    }, [notifyHost, resize, spawnBurst]);

    if (!show) {
        return <span ref={anchorRef} className="hidden" aria-hidden />;
    }

    const overlay = (
        <>
            <canvas
                ref={canvasRef}
                aria-hidden
                className={cn(
                    'pointer-events-none inset-0 z-[56]',
                    framed ? 'absolute' : 'fixed',
                )}
            />
            <button
                ref={buttonRef}
                type="button"
                data-preview-celebrate={framed ? 'framed' : 'live'}
                data-ripple="off"
                onClick={celebrate}
                style={style}
                aria-label={ui.celebrate}
                title={ui.celebrate}
                className={cn(
                    'group pointer-events-auto flex h-14 w-14 items-center justify-center',
                    framed ? 'absolute' : 'fixed',
                    'left-4 z-[55] rounded-full bg-transparent transition duration-300',
                    'bottom-[max(1rem,env(safe-area-inset-bottom))]',
                    'outline-none focus-visible:ring-2 focus-visible:ring-[#c9963a]/40 focus-visible:ring-offset-2',
                    'hover:scale-105 active:scale-95 md:left-5',
                    'celebrate-fab',
                    pulse && 'celebrate-fab-fire',
                    className,
                )}
            >
                <img
                    src={CELEBRATE_ICON_SRC}
                    alt=""
                    draggable={false}
                    className={cn(
                        'relative h-9 w-9 select-none object-contain drop-shadow-[0_2px_6px_rgba(40,24,12,0.25)] transition duration-300',
                        pulse && '-rotate-12 scale-110',
                    )}
                />
            </button>
        </>
    );

    return (
        <>
            <span ref={anchorRef} className="hidden" aria-hidden />
            {host ? createPortal(overlay, host) : null}
        </>
    );
}
