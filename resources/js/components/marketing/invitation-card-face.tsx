import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GalleryLazyImage } from '@/components/marketing/gallery-lazy-image';
import type { GalleryDesign, GallerySample } from '@/types/gallery';
import type { PreviewDevice } from '@/lib/preview-device';
import { babyShowerSafeInset } from '@/lib/baby-shower-card-safe-zones';
import { birthdaySafeInset } from '@/lib/birthday-card-safe-zones';
import { bridalShowerSafeInset } from '@/lib/bridal-shower-card-safe-zones';
import { corporateFitBudget, corporateSafeInset } from '@/lib/corporate-card-safe-zones';
import { customFitBudget, customSafeInset } from '@/lib/custom-card-safe-zones';
import { housewarmingFitBudget, housewarmingSafeInset } from '@/lib/housewarming-card-safe-zones';
import { graduationSafeInset } from '@/lib/graduation-card-safe-zones';
import { partySafeInset } from '@/lib/party-card-safe-zones';
import { cn } from '@/lib/utils';

const cleanedArt = new Map<string, { src: string; paper: string; ink: string; dark: boolean }>();

function line(value: string | null | undefined): string | null {
    const text = value?.trim();
    return text ? text : null;
}

function artworkSrc(design: GalleryDesign): string | null {
    return design.image_mobile || design.image || null;
}

function artworkSrcSet(design: GalleryDesign): string | undefined {
    if (!design.image || !design.image_2x || !design.image_8k || !design.image_width) {
        return undefined;
    }

    return `${design.image} ${design.image_width}w, ${design.image_2x} ${design.image_width * 2}w, ${design.image_8k} ${design.image_width * 8}w`;
}

function luminance(r: number, g: number, b: number): number {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function saturation(r: number, g: number, b: number): number {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    return max === 0 ? 0 : (max - min) / max;
}

function splitDate(label: string | null | undefined): { weekday: string | null; day: string; month: string; year: string } | null {
    const text = label?.trim();

    if (!text) {
        return null;
    }

    const match = text.match(/^(?:([A-Za-z]+),\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);

    if (!match) {
        return null;
    }

    return { weekday: match[1] ?? null, day: match[2], month: match[3], year: match[4] };
}

function sampleCenterTone(image: HTMLImageElement, kind: string): { paper: string; ink: string; dark: boolean } | null {
    if (image.naturalWidth < 8) {
        return null;
    }

    const scale = Math.min(1, 720 / image.naturalWidth);
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
        return null;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;
    const cx = width / 2;
    const cy =
        kind === 'birthday' ||
        kind === 'baby-shower' ||
        kind === 'party' ||
        kind === 'graduation' ||
        kind === 'bridal-shower' ||
        kind === 'housewarming' ||
        kind === 'corporate'
            ? height * 0.42
            : height * 0.5;
    const rx =
        width *
        (kind === 'birthday' ||
        kind === 'baby-shower' ||
        kind === 'party' ||
        kind === 'graduation' ||
        kind === 'bridal-shower' ||
        kind === 'housewarming' ||
        kind === 'corporate'
            ? 0.24
            : 0.22);
    const ry =
        height *
        (kind === 'birthday' ||
        kind === 'baby-shower' ||
        kind === 'party' ||
        kind === 'graduation' ||
        kind === 'bridal-shower' ||
        kind === 'housewarming' ||
        kind === 'corporate'
            ? 0.26
            : 0.26);
    const samples: Array<{ r: number; g: number; b: number; lum: number }> = [];

    for (let y = Math.floor(cy - ry * 0.55); y <= Math.floor(cy + ry * 0.55); y += 3) {
        for (let x = Math.floor(cx - rx * 0.55); x <= Math.floor(cx + rx * 0.55); x += 3) {
            if (x < 0 || y < 0 || x >= width || y >= height) {
                continue;
            }

            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = luminance(r, g, b);
            const sat = saturation(r, g, b);

            // Keep saturated panel fills; skip only extreme florals/glints.
            if (lum < 0.03 || lum > 0.99 || sat > 0.82) {
                continue;
            }

            samples.push({ r, g, b, lum });
        }
    }

    if (samples.length === 0) {
        return null;
    }

    samples.sort((a, b) => a.lum - b.lum);
    const avgLum = samples.reduce((sum, sample) => sum + sample.lum, 0) / samples.length;
    const pool =
        avgLum >= 0.45
            ? samples.slice(Math.floor(samples.length * 0.55))
            : samples.slice(0, Math.max(1, Math.floor(samples.length * 0.4)));
    const source = pool.length ? pool : samples;
    const paperR = Math.round(source.reduce((sum, sample) => sum + sample.r, 0) / source.length);
    const paperG = Math.round(source.reduce((sum, sample) => sum + sample.g, 0) / source.length);
    const paperB = Math.round(source.reduce((sum, sample) => sum + sample.b, 0) / source.length);
    const paperLum = luminance(paperR, paperG, paperB);
    // Mid-tone brand fills (purple/teal panels) need light ink for contrast.
    const dark = paperLum < 0.58;

    return {
        paper: `rgb(${paperR}, ${paperG}, ${paperB})`,
        ink: dark ? '#f4efe6' : '#241c16',
        dark,
    };
}

function clearBakedLetters(image: HTMLImageElement, kind: string): { src: string; paper: string; ink: string; dark: boolean } | null {
    const key = `${image.src}:${kind}`;
    const cached = cleanedArt.get(key);

    if (cached) {
        return cached;
    }

    const tone = sampleCenterTone(image, kind);

    if (!tone || image.naturalWidth < 8) {
        return null;
    }

    const scale = Math.min(1, 720 / image.naturalWidth);
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
        return null;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    const frame = ctx.getImageData(0, 0, width, height);
    const data = frame.data;
    const cx = width / 2;
    const cy = kind === 'housewarming' ? height * 0.58 : height * 0.48;
    const rx = width * (kind === 'housewarming' ? 0.27 : 0.29);
    const ry = height * (kind === 'housewarming' ? 0.22 : 0.31);
    const paperMatch = tone.paper.match(/\d+/g);
    const paperR = Number(paperMatch?.[0] ?? 246);
    const paperG = Number(paperMatch?.[1] ?? 238);
    const paperB = Number(paperMatch?.[2] ?? 227);
    const paperLum = luminance(paperR, paperG, paperB);
    const dark = tone.dark;
    const ink = tone.ink;
    let title = false;

    if (kind === 'housewarming') {
        const values: number[] = [];

        for (let y = Math.floor(height * 0.08); y <= Math.floor(height * 0.3); y += 4) {
            for (let x = Math.floor(width * 0.34); x <= Math.floor(width * 0.66); x += 4) {
                const i = (y * width + x) * 4;
                values.push(luminance(data[i], data[i + 1], data[i + 2]));
            }
        }

        if (values.length > 0) {
            const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
            const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
            title = Math.sqrt(variance) < 0.16;
        }
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const nx = (x - cx) / rx;
            const ny = (y - cy) / ry;
            const inWell = nx * nx + ny * ny <= 1;
            const tx = (x - cx) / (width * 0.3);
            const ty = (y - height * 0.2) / (height * 0.1);
            const inTitle = title && tx * tx + ty * ty <= 1;

            if (!inWell && !inTitle) {
                continue;
            }

            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = luminance(r, g, b);
            const sat = saturation(r, g, b);
            const gold = r > 120 && r > g && g > b && r - b > 28 && sat < 0.62;
            const floral = sat > 0.3 && !gold && (Math.abs(g - r) > 18 || g > r + 12);

            if (floral) {
                continue;
            }

            const letter = dark ? lum > paperLum + 0.1 : lum < paperLum - 0.09 || (gold && lum < 0.82);

            if (!letter) {
                continue;
            }

            data[i] = paperR;
            data[i + 1] = paperG;
            data[i + 2] = paperB;
        }
    }

    ctx.putImageData(frame, 0, 0);
    const result = {
        src: canvas.toDataURL('image/jpeg', 0.88),
        paper: `rgb(${paperR}, ${paperG}, ${paperB})`,
        ink,
        dark,
    };
    cleanedArt.set(key, result);

    return result;
}

function SampleQr({ value, label, gold, size }: { value: string; label: string; gold: string; size: number }) {
    return (
        <div className="flex flex-col items-center gap-[2px]">
            <div className="rounded-[0.15rem] bg-white p-[2px] shadow-[0_4px_10px_-8px_rgba(43,36,28,0.45)]">
                <QRCodeSVG value={value} size={size} bgColor="#ffffff" fgColor="#1c1712" />
            </div>
            <p className="invitation-card-qr-label" style={{ color: gold }}>
                {label}
            </p>
        </div>
    );
}

export function InvitationCardFace({
    design,
    device = 'mobile',
    variant = 'full',
    className = '',
    imageSizes,
}: {
    design: GalleryDesign;
    device?: PreviewDevice;
    variant?: 'full' | 'compact';
    className?: string;
    imageSizes?: string;
}) {
    const sample = design.sample;
    const gold = design.palette.gold || '#b48a4a';
    const kind =
        sample.kind ??
        (design.event_type === 'housewarming'
            ? 'housewarming'
            : design.event_type === 'birthday'
              ? 'birthday'
              : design.event_type === 'baby-shower'
                ? 'baby-shower'
                : design.event_type === 'party'
                  ? 'party'
                  : design.event_type === 'graduation'
                    ? 'graduation'
                    : design.event_type === 'bridal-shower'
                      ? 'bridal-shower'
                      : design.event_type === 'corporate-event' || design.event_type === 'corporate'
                        ? 'corporate'
                        : design.event_type === 'custom' || design.event_type === 'custom-event' || design.event_type === 'other'
                          ? 'custom'
                          : 'wedding');
    const blankCenter =
        kind === 'wedding' ||
        kind === 'birthday' ||
        kind === 'baby-shower' ||
        kind === 'party' ||
        kind === 'graduation' ||
        kind === 'bridal-shower' ||
        kind === 'housewarming' ||
        kind === 'corporate' ||
        kind === 'custom';
    const mapUrl = sample.map_url || (sample.where ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sample.where)}` : null);
    const compact = variant === 'compact';
    const art = artworkSrc(design);
    const qrSize = compact ? 16 : device === 'desktop' ? 34 : 26;
    const date = splitDate(sample.date_label);
    const sectionedInvite =
        kind === 'party' ||
        kind === 'graduation' ||
        kind === 'bridal-shower' ||
        kind === 'housewarming' ||
        kind === 'corporate' ||
        kind === 'custom';
    const kicker =
        line(sample.blessing) ||
        (kind === 'birthday' || kind === 'party'
            ? "You're Invited!"
            : kind === 'graduation'
              ? 'The Caps Are Off!'
              : kind === 'bridal-shower'
                ? 'From Miss to Mrs!'
                : kind === 'housewarming'
                  ? 'Home Sweet Home!'
                  : kind === 'corporate'
                    ? 'Connect, Collaborate, Celebrate!'
                    : kind === 'baby-shower'
                      ? 'A New Adventure Begins!'
                      : 'You Are Invited To');
    const headline =
        line(sample.headline) ||
        (kind === 'housewarming'
            ? 'Home Sweet Home! 🏡'
            : kind === 'corporate'
              ? 'Connect, Collaborate, Celebrate! 🚀'
              : kind === 'birthday' || kind === 'party'
                ? "You're Invited!"
                : kind === 'graduation'
                  ? 'The Caps Are Off! 🎓'
                  : kind === 'bridal-shower'
                    ? 'From Miss to Mrs! 🥂'
                    : kind === 'baby-shower'
                      ? '✨ A New Adventure Begins!'
                      : 'Wedding');
    // Art already prints the invite line — avoid stacking a second headline.
    const showHeadline = !(kind === 'party' && design.style_key === 'confetti-flags');
    const headlineSub = line(sample.headline_sub);
    const [face, setFace] = useState(art);
    const [artReady, setArtReady] = useState(!art);
    const [tone, setTone] = useState({
        paper: design.palette.paper,
        ink: design.palette.ink,
        dark: luminance(
            Number.parseInt(design.palette.paper.slice(1, 3), 16) || 246,
            Number.parseInt(design.palette.paper.slice(3, 5), 16) || 238,
            Number.parseInt(design.palette.paper.slice(5, 7), 16) || 227,
        ) < 0.45,
    });
    const preparedFor = useRef<string | null>(null);
    const safeRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const [fitScale, setFitScale] = useState(1);

    useEffect(() => {
        preparedFor.current = null;
        setFace(art);
        setArtReady(!art);
        setFitScale(1);
    }, [art, kind]);

    const prepareArt = useCallback(
        (image: HTMLImageElement) => {
            const key = `${image.src}:${kind}`;

            if (preparedFor.current === key || image.src.startsWith('data:') || image.naturalWidth < 8) {
                return;
            }

            // Blank-center arts: sample ink/paper only (no letter scrub).
            if (blankCenter) {
                const toneSample = sampleCenterTone(image, kind) ?? {
                    paper: '#f7f1e6',
                    ink: '#241c16',
                    dark: false,
                };

                // Custom photo cards use a 40% dark wash + blur — always light ink.
                preparedFor.current = key;
                setTone(
                    kind === 'custom'
                        ? { paper: toneSample.paper, ink: '#f4efe6', dark: true }
                        : toneSample,
                );

                return;
            }

            const cleaned = clearBakedLetters(image, kind);

            if (!cleaned) {
                return;
            }

            preparedFor.current = key;
            setFace(cleaned.src);
            setTone({
                paper: cleaned.paper,
                ink: cleaned.ink,
                dark: cleaned.dark,
            });
        },
        [blankCenter, kind],
    );

    useLayoutEffect(() => {
        if (!blankCenter) {
            return;
        }

        const safe = safeRef.current;
        const measure = measureRef.current;

        if (!safe || !measure) {
            return;
        }

        const update = () => {
            // Use the content box only — clientWidth/Height include padding, which would
            // over-estimate room and let overflow:hidden clip the last lines.
            const styles = getComputedStyle(safe);
            const padX =
                (Number.parseFloat(styles.paddingLeft) || 0) + (Number.parseFloat(styles.paddingRight) || 0);
            const padY =
                (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
            const availW = Math.max(0, safe.clientWidth - padX);
            const availH = Math.max(0, safe.clientHeight - padY);
            const needW = Math.max(measure.scrollWidth, measure.offsetWidth);
            const needH = Math.max(measure.scrollHeight, measure.offsetHeight);

            if (availW < 8 || availH < 8 || needW < 8 || needH < 8) {
                return;
            }

            // Shrink only when content would spill past the blank art panel.
            // Baby shower / party never floors scale — clipped/hidden lines are not allowed.
            // Extra cushion: centered transform can still clip last lines by a few px at the edges.
            const freeScale =
                kind === 'baby-shower' ||
                kind === 'party' ||
                kind === 'graduation' ||
                kind === 'bridal-shower' ||
                kind === 'housewarming' ||
                kind === 'corporate' ||
                kind === 'custom';
            // Sectioned invites are denser/longer — extra cushion so closing lines never clip.
            const narrow =
                (kind === 'baby-shower' && design.style_key === 'ocean') ||
                (kind === 'bridal-shower' && design.style_key === 'left-ribbon');
            const panelBudget =
                kind === 'housewarming'
                    ? housewarmingFitBudget(design.style_key)
                    : kind === 'corporate'
                      ? corporateFitBudget(design.style_key)
                      : kind === 'custom'
                        ? customFitBudget(design.style_key)
                        : null;
            const cushion = panelBudget
                ? panelBudget.cushion
                : narrow
                  ? 0.68
                  : sectionedInvite
                    ? 0.82
                    : freeScale
                      ? 0.9
                      : 0.97;
            const ratio = Math.min(availW / Math.max(needW, 1), availH / Math.max(needH, 1)) * cushion;
            // Housewarming / corporate: grow into each card's blank panel (unique max).
            const ceiling = panelBudget?.maxScale ?? 1;
            const next = Math.min(ceiling, ratio);
            const clamped = freeScale ? next : Math.max(0.78, next);

            setFitScale((prev) => (Math.abs(prev - clamped) < 0.01 ? prev : clamped));
        };

        update();
        const frame = requestAnimationFrame(update);
        const observer = new ResizeObserver(update);
        observer.observe(safe);
        observer.observe(measure);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [blankCenter, kind, compact, variant, device, face, tone.ink, tone.paper, sample, qrSize, design.style_key, sectionedInvite]);

    const accent = tone.dark
        ? gold
        : `color-mix(in srgb, ${gold} 68%, ${tone.ink} 32%)`;

    const overlayDetails =
        kind === 'birthday' || kind === 'baby-shower' || sectionedInvite ? (
            <div className="invitation-card-details">
                {sectionedInvite ? (
                    <>
                        {headlineSub && (
                            <p className="invitation-card-detail-heading">{headlineSub}</p>
                        )}
                        {line(sample.date_label) && (
                            <p className="invitation-card-detail-line">{sample.date_label}</p>
                        )}
                        {line(sample.ceremony_time) && (
                            <p className="invitation-card-detail-line">{sample.ceremony_time}</p>
                        )}
                        {kind === 'custom' &&
                            (line(sample.venue_name) || line(sample.where)) && (
                                <p className="invitation-card-detail-line">
                                    📍 {[line(sample.venue_name), line(sample.venue_address) || line(sample.where)]
                                        .filter(Boolean)
                                        .filter((part, index, parts) => parts.indexOf(part) === index)
                                        .join(', ')}
                                </p>
                            )}
                        {line(sample.gift_note) && (
                            <p className="invitation-card-detail-heading">{sample.gift_note}</p>
                        )}
                        {line(sample.dress_code) && (
                            <p className="invitation-card-detail-line">{sample.dress_code}</p>
                        )}
                        {line(sample.rsvp_line) && (
                            <p className="invitation-card-detail-line">{sample.rsvp_line}</p>
                        )}
                    </>
                ) : (
                    <>
                        {line(sample.date_label) && (
                            <p className="invitation-card-detail-line">Date: {sample.date_label}</p>
                        )}
                        {line(sample.ceremony_time) && (
                            <p className="invitation-card-detail-line">Time: {sample.ceremony_time}</p>
                        )}
                        {kind === 'baby-shower' ? (
                            <>
                                {line(sample.venue_name) && (
                                    <p className="invitation-card-detail-line">Spot: {sample.venue_name}</p>
                                )}
                                {line(sample.venue_address) && (
                                    <p className="invitation-card-detail-line invitation-card-detail-loc">
                                        Loc: {sample.venue_address}
                                    </p>
                                )}
                            </>
                        ) : (
                            (line(sample.venue_name) || line(sample.venue_address) || line(sample.where)) && (
                                <p className="invitation-card-detail-line">
                                    Location:{' '}
                                    {[line(sample.venue_name), line(sample.venue_address)].filter(Boolean).join(', ') ||
                                        sample.where}
                                </p>
                            )
                        )}
                        {line(sample.rsvp_line) && (
                            <p className="invitation-card-detail-line">
                                {sample.rsvp_line.replace(/^RSVP:\s*/i, 'RSVP: ')}
                            </p>
                        )}
                    </>
                )}
            </div>
        ) : null;

    const copyBody =
        kind === 'birthday' || kind === 'baby-shower' || sectionedInvite ? (
            <>
                {showHeadline && headline && (
                    <h2
                        className={`invitation-card-headline ${
                            kind === 'birthday'
                                ? 'invitation-card-headline--birthday'
                                : kind === 'party'
                                  ? 'invitation-card-headline--party'
                                  : kind === 'graduation'
                                    ? 'invitation-card-headline--graduation'
                                    : kind === 'bridal-shower'
                                      ? 'invitation-card-headline--bridal-shower'
                                      : kind === 'housewarming'
                                        ? 'invitation-card-headline--housewarming'
                                        : kind === 'corporate'
                                          ? 'invitation-card-headline--corporate'
                                          : kind === 'custom'
                                            ? 'invitation-card-headline--custom'
                                            : 'invitation-card-headline--baby-shower'
                        }`}
                    >
                        {headline}
                    </h2>
                )}
                {line(sample.request_line) && (
                    <p className="invitation-card-request whitespace-pre-line">{sample.request_line}</p>
                )}
                <span className="invitation-card-rule" style={{ background: accent }} />
                {overlayDetails}
                {line(sample.compliments) && (
                    <p className="invitation-card-closing" style={{ color: accent }}>
                        {sample.compliments}
                    </p>
                )}
                {/* Blank-center baby shower / party / graduation arts have no room for a QR without crushing type. */}
                {variant === 'full' && mapUrl && kind !== 'baby-shower' && !sectionedInvite && (
                    <div className="invitation-card-qr">
                        <SampleQr value={mapUrl} label="Scan for map" gold={accent} size={qrSize} />
                    </div>
                )}
            </>
        ) : (
            <>
                <p className="invitation-card-kicker" style={{ color: gold }}>
                    {kicker}
                </p>
                {kind === 'housewarming' ? (
                    <>
                        {headline && <h2 className="invitation-card-headline">{headline}</h2>}
                        {headlineSub && (
                            <p className="invitation-card-headline-sub" style={{ color: gold }}>
                                {headlineSub}
                            </p>
                        )}
                        <HousewarmingNames sample={sample} compact={compact} />
                    </>
                ) : (
                    <>
                        <WeddingNames sample={sample} gold={gold} compact={compact} />
                        {line(sample.request_line) && (
                            <p className="invitation-card-request whitespace-pre-line">{sample.request_line}</p>
                        )}
                    </>
                )}
                <span className="invitation-card-rule" style={{ background: gold }} />
                {date ? (
                    <div className="invitation-card-dateboard">
                        <p className="invitation-card-dateboard-month">{date.month}</p>
                        <p className="invitation-card-dateboard-day">{date.day}</p>
                        <p className="invitation-card-dateboard-year">{date.year}</p>
                    </div>
                ) : (
                    line(sample.date_label) && <p className="invitation-card-date">{sample.date_label}</p>
                )}
                <div className="invitation-card-times">
                    {kind === 'housewarming' ? (
                        <>
                            {date?.weekday && <p>{date.weekday}</p>}
                            {line(sample.puja_time) && <p>{sample.puja_time}</p>}
                            {line(sample.meal_time) && <p>{sample.meal_time}</p>}
                        </>
                    ) : (
                        line(sample.ceremony_time) && <p>{sample.ceremony_time}</p>
                    )}
                </div>
                {(line(sample.venue_name) || line(sample.where)) && (
                    <p className="invitation-card-venue">{sample.venue_name || sample.where}</p>
                )}
                {line(sample.venue_address) && (
                    <p className="invitation-card-address whitespace-pre-line">{sample.venue_address}</p>
                )}
                {kind === 'wedding' && line(sample.reception_time) && (
                    <p className="invitation-card-times">{sample.reception_time}</p>
                )}
                {variant === 'full' && mapUrl && (
                    <div className="invitation-card-qr">
                        <SampleQr value={mapUrl} label="Scan for map" gold={gold} size={qrSize} />
                    </div>
                )}
                {variant === 'full' && (
                    <div className="invitation-card-notes">
                        {line(sample.rsvp_line) && <p>{sample.rsvp_line}</p>}
                        {line(sample.dress_code) && <p>{sample.dress_code}</p>}
                        {line(sample.hashtag) && (
                            <p className="invitation-card-hashtag" style={{ color: gold }}>
                                {sample.hashtag}
                            </p>
                        )}
                        {line(sample.contact) && <p className="invitation-card-contact">{sample.contact}</p>}
                    </div>
                )}
            </>
        );

    const blankInset =
        kind === 'birthday'
            ? birthdaySafeInset(design.style_key, compact)
            : kind === 'baby-shower'
              ? babyShowerSafeInset(design.style_key, compact)
              : kind === 'party'
                ? partySafeInset(design.style_key, compact)
                : kind === 'graduation'
                  ? graduationSafeInset(design.style_key, compact)
                  : kind === 'bridal-shower'
                    ? bridalShowerSafeInset(design.style_key, compact)
                    : kind === 'housewarming'
                      ? housewarmingSafeInset(design.style_key, compact)
                      : kind === 'corporate'
                        ? corporateSafeInset(design.style_key, compact)
                        : kind === 'custom'
                          ? customSafeInset(design.style_key, compact)
                          : null;
    const artAspect =
        design.image_width && design.image_height
            ? `${design.image_width} / ${design.image_height}`
            : null;
    const narrowBlank =
        (kind === 'baby-shower' && design.style_key === 'ocean') ||
        (kind === 'bridal-shower' && design.style_key === 'left-ribbon') ||
        (kind === 'housewarming' && housewarmingFitBudget(design.style_key).dense) ||
        (kind === 'corporate' && corporateFitBudget(design.style_key).dense) ||
        (kind === 'custom' && customFitBudget(design.style_key).dense);

    return (
        <article
            className={`invitation-card-face invitation-card-face--${kind} ${compact ? 'invitation-card-face--compact' : ''} ${art ? 'invitation-card-face--art' : ''} ${tone.dark ? 'invitation-card-face--dark' : ''} ${narrowBlank ? 'invitation-card-face--narrow-blank' : ''} ${className}`}
            style={{
                ['--invite-gold' as string]: gold,
                ['--invite-paper' as string]: tone.paper,
                ['--invite-ink' as string]: tone.ink,
                ['--invite-fit-scale' as string]: String(fitScale),
                ...(blankInset ? { ['--invite-safe-inset' as string]: blankInset } : {}),
                ...((kind === 'birthday' ||
                kind === 'baby-shower' ||
                kind === 'party' ||
                kind === 'graduation' ||
                kind === 'bridal-shower' ||
                kind === 'housewarming' ||
                kind === 'corporate' ||
                kind === 'custom') &&
                artAspect
                    ? { ['--invite-art-aspect' as string]: artAspect }
                    : {}),
            }}
        >
            {art ? (
                <GalleryLazyImage
                    src={face || art}
                    srcSet={artworkSrcSet(design)}
                    sizes={imageSizes ?? (compact ? '(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw' : 'min(100vw, 34rem)')}
                    alt=""
                    className="invitation-card-art"
                    width={design.image_width}
                    height={design.image_height}
                    loading="lazy"
                    decoding="async"
                    onReady={(image) => {
                        setArtReady(true);
                        prepareArt(image);
                    }}
                    onError={() => setArtReady(true)}
                />
            ) : (
                <div className="invitation-card-ornament" aria-hidden />
            )}
            {blankCenter ? (
                <div
                    ref={safeRef}
                    className={cn(
                        'invitation-card-copy invitation-card-copy--safe',
                        compact && 'invitation-card-copy--compact',
                        // Compact gallery tiles: keep copy off the shimmer until art paints.
                        compact && art && !artReady && 'opacity-0',
                        compact && art && artReady && 'opacity-100 transition-opacity duration-300',
                    )}
                >
                    <div className="invitation-card-copy-scale" style={{ transform: `scale(${fitScale})` }}>
                        <div ref={measureRef} className="invitation-card-copy-fit">
                            {copyBody}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className={cn(
                        'invitation-card-copy',
                        compact && 'invitation-card-copy--compact',
                        compact && art && !artReady && 'opacity-0',
                        compact && art && artReady && 'opacity-100 transition-opacity duration-300',
                    )}
                >
                    {copyBody}
                </div>
            )}
        </article>
    );
}

function WeddingNames({ sample, gold, compact }: { sample: GallerySample; gold: string; compact: boolean }) {
    if (sample.bride && sample.groom) {
        return (
            <h3 className={`invitation-card-hosts ${compact ? 'invitation-card-hosts--compact' : ''}`}>
                {sample.bride} <span style={{ color: gold }}>&</span> {sample.groom}
            </h3>
        );
    }

    return <h3 className={`invitation-card-hosts ${compact ? 'invitation-card-hosts--compact' : ''}`}>{sample.hosts}</h3>;
}

function HousewarmingNames({ sample, compact }: { sample: GallerySample; compact: boolean }) {
    return (
        <div className={`invitation-card-names invitation-card-names--house ${compact ? 'invitation-card-names--compact' : ''}`}>
            <h3>{sample.hosted_by || sample.hosts}</h3>
        </div>
    );
}
