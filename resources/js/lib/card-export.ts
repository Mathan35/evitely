import { cardArtObjectFit } from '@/lib/card-art-fit';
import { cardFontStack } from '@/lib/card-editor';
import type { CardDocument, CardElement } from '@/types/wedding';

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        if (!src.startsWith('data:') && !src.startsWith('blob:')) {
            image.crossOrigin = 'anonymous';
        }
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 120)}`));
        image.src = src;
    });
}

function drawImageFit(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    fit: 'contain' | 'cover',
): void {
    const iw = Math.max(1, image.naturalWidth || image.width);
    const ih = Math.max(1, image.naturalHeight || image.height);
    const scale = fit === 'cover' ? Math.max(dw / iw, dh / ih) : Math.min(dw / iw, dh / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = dx + (dw - w) / 2;
    const y = dy + (dh - h) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();
    ctx.drawImage(image, x, y, w, h);
    ctx.restore();
}

function wrapLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
): string[] {
    const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
    const lines: string[] = [];

    for (const paragraph of paragraphs) {
        if (paragraph === '') {
            lines.push('');
            continue;
        }

        const words = paragraph.split(/\s+/);
        let current = '';

        for (const word of words) {
            const next = current ? `${current} ${word}` : word;
            if (ctx.measureText(next).width <= maxWidth || !current) {
                current = next;
                continue;
            }
            lines.push(current);
            current = word;
        }

        if (current) {
            lines.push(current);
        }
    }

    return lines.length > 0 ? lines : [''];
}

function isCustomArt(document: CardDocument, backgroundImage: string | null): boolean {
    const occasion = document.occasion || document.template || '';
    return (
        occasion === 'custom' ||
        occasion.startsWith('custom-') ||
        (backgroundImage || '').toLowerCase().includes('/gallery/custom/') ||
        (backgroundImage || '').toLowerCase().includes('/custom/')
    );
}

async function rasterizeDomQr(elementId: string, size: number): Promise<HTMLImageElement | null> {
    const safeId = elementId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const host = window.document.querySelector(`[data-card-layer="${safeId}"]`);
    if (!host) {
        return null;
    }

    const svg = host.querySelector('svg');
    if (svg) {
        const clone = svg.cloneNode(true) as SVGElement;
        if (!clone.getAttribute('xmlns')) {
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        clone.setAttribute('width', String(size));
        clone.setAttribute('height', String(size));
        const xml = new XMLSerializer().serializeToString(clone);
        return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`);
    }

    const img = host.querySelector('img');
    if (img?.src) {
        try {
            return await loadImage(img.src);
        } catch {
            return null;
        }
    }

    return null;
}

async function drawElement(
    ctx: CanvasRenderingContext2D,
    element: CardElement,
): Promise<void> {
    const rotation = Number(element.rotation ?? 0);
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;

    ctx.save();
    if (rotation) {
        ctx.translate(cx, cy);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
    }

    if (element.type === 'shape' || element.type === 'decoration' || element.type === 'icon') {
        ctx.fillStyle = element.background || element.color || '#b48a4a';
        if (element.type === 'shape') {
            ctx.fillRect(element.x, element.y, element.width, element.height);
        } else {
            const r = Math.min(element.width, element.height) / 2;
            ctx.beginPath();
            ctx.arc(element.x + element.width / 2, element.y + element.height / 2, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        return;
    }

    if (element.type === 'image' && element.src) {
        try {
            const image = await loadImage(element.src);
            drawImageFit(ctx, image, element.x, element.y, element.width, element.height, 'cover');
        } catch {
            /* skip broken layer art */
        }
        ctx.restore();
        return;
    }

    if (element.type === 'qr') {
        const size = Math.max(8, Math.min(element.width, element.height));
        const x = element.x + (element.width - size) / 2;
        const y = element.y + (element.height - size) / 2;
        try {
            const qr = await rasterizeDomQr(element.id, Math.round(size));
            if (qr) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, y, size, size);
                ctx.drawImage(qr, x, y, size, size);
            } else if (element.text) {
                // Fallback: white plate so export still looks intentional.
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, y, size, size);
                ctx.strokeStyle = '#1c1712';
                ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
            }
        } catch {
            /* skip */
        }
        ctx.restore();
        return;
    }

    if (element.type === 'text' && element.text) {
        const fontSize = Math.max(8, Number(element.fontSize ?? 32));
        const weight = element.fontWeight ?? 400;
        const align = element.align ?? 'center';
        const lineHeight = Number(element.lineHeight ?? 1.15);
        const letterSpacing = Number(element.letterSpacing ?? 0);
        const fontStyle = (element as CardElement & { fontStyle?: string }).fontStyle === 'italic' ? 'italic ' : '';

        ctx.fillStyle = element.color ?? '#1c1712';
        ctx.font = `${fontStyle}${weight} ${fontSize}px ${cardFontStack(element.font)}`;
        ctx.textBaseline = 'top';
        ctx.textAlign = align;

        const lines = wrapLines(ctx, element.text, Math.max(8, element.width));
        const blockHeight = lines.length * fontSize * lineHeight;
        let y = element.y + Math.max(0, (element.height - blockHeight) / 2);
        const x =
            align === 'left'
                ? element.x
                : align === 'right'
                  ? element.x + element.width
                  : element.x + element.width / 2;

        for (const line of lines) {
            if (letterSpacing) {
                // Canvas has no letterSpacing in all browsers — approximate.
                const chars = [...line];
                let total = 0;
                for (const ch of chars) {
                    total += ctx.measureText(ch).width + letterSpacing;
                }
                total -= letterSpacing;
                let cursor =
                    align === 'left'
                        ? element.x
                        : align === 'right'
                          ? element.x + element.width - total
                          : element.x + (element.width - total) / 2;
                ctx.textAlign = 'left';
                for (const ch of chars) {
                    ctx.fillText(ch, cursor, y);
                    cursor += ctx.measureText(ch).width + letterSpacing;
                }
                ctx.textAlign = align;
            } else {
                ctx.fillText(line, x, y);
            }
            y += fontSize * lineHeight;
        }
    }

    ctx.restore();
}

/**
 * Rasterize the live edited card document to a PNG/JPEG data URL (full canvas size).
 */
export async function cardDocumentToDataUrl(
    document: CardDocument,
    width: number,
    height: number,
    kind: 'png' | 'jpg' = 'png',
): Promise<string> {
    if (typeof document !== 'undefined' && 'fonts' in window.document) {
        try {
            await window.document.fonts.ready;
        } catch {
            /* continue without waiting */
        }
    }

    const canvas = window.document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas is not available in this browser.');
    }

    ctx.fillStyle = document.background ?? '#f4efe6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const artElement = (document.elements ?? []).find((element) => element.id === 'art' && element.type === 'image');
    const backgroundImage = document.backgroundImage || artElement?.src || null;
    const custom = isCustomArt(document, backgroundImage);

    if (backgroundImage) {
        try {
            const image = await loadImage(backgroundImage);
            const fit = cardArtObjectFit(backgroundImage);
            if (custom) {
                ctx.save();
                ctx.filter = 'blur(10px)';
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.scale(1.2, 1.2);
                ctx.translate(-canvas.width / 2, -canvas.height / 2);
                drawImageFit(ctx, image, 0, 0, canvas.width, canvas.height, 'cover');
                ctx.restore();
                ctx.fillStyle = 'rgb(28 23 18 / 40%)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                drawImageFit(ctx, image, 0, 0, canvas.width, canvas.height, fit);
            }
        } catch {
            /* keep paper fill if art fails */
        }
    }

    const layers = (document.elements ?? []).filter((element) => element.id !== 'art');
    for (const element of layers) {
        await drawElement(ctx, element);
    }

    if (kind === 'jpg') {
        return canvas.toDataURL('image/jpeg', 0.92);
    }

    return canvas.toDataURL('image/png');
}

export function triggerDataUrlDownload(dataUrl: string, filename: string): void {
    const link = window.document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.rel = 'noopener';
    window.document.body.appendChild(link);
    link.click();
    link.remove();
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

function dataUrlToBlob(dataUrl: string): Blob {
    const [header, data = ''] = dataUrl.split(',');
    const mime = /data:([^;]+)/.exec(header)?.[1] || 'image/png';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
}

function dataUrlToBytes(dataUrl: string): { mime: string; bytes: Uint8Array } {
    const [header, data = ''] = dataUrl.split(',');
    const mime = /data:([^;]+)/.exec(header)?.[1] || 'image/jpeg';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return { mime, bytes };
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}

const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

function pdfText(value: string): Uint8Array {
    if (textEncoder) {
        return textEncoder.encode(value);
    }
    const bytes = new Uint8Array(value.length);
    for (let i = 0; i < value.length; i += 1) {
        bytes[i] = value.charCodeAt(i) & 0xff;
    }
    return bytes;
}

/**
 * Build a single-page PDF that embeds the card JPEG at exact pixel size.
 * Avoids the browser print dialog (which produced misnamed / wrong “Save as PDF” files).
 */
export function jpegBytesToPdf(jpeg: Uint8Array, width: number, height: number): Blob {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const contentStream = `q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`;
    const contentBytes = pdfText(contentStream);

    const objects: Uint8Array[] = [];
    const pushObject = (body: Uint8Array): number => {
        objects.push(body);
        return objects.length;
    };

    pushObject(pdfText('<< /Type /Catalog /Pages 2 0 R >>'));
    pushObject(pdfText('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    pushObject(
        pdfText(
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
        ),
    );
    pushObject(
        concatBytes([
            pdfText(`<< /Length ${contentBytes.length} >>\nstream\n`),
            contentBytes,
            pdfText('endstream'),
        ]),
    );
    pushObject(
        concatBytes([
            pdfText(
                `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
            ),
            jpeg,
            pdfText('\nendstream'),
        ]),
    );

    const header = pdfText('%PDF-1.4\n');
    const parts: Uint8Array[] = [header];
    const offsets: number[] = [0];
    let cursor = header.length;

    for (let i = 0; i < objects.length; i += 1) {
        const objectHeader = pdfText(`${i + 1} 0 obj\n`);
        const objectEnd = pdfText('\nendobj\n');
        offsets.push(cursor);
        parts.push(objectHeader, objects[i], objectEnd);
        cursor += objectHeader.length + objects[i].length + objectEnd.length;
    }

    const xrefStart = cursor;
    let xref = `xref\n0 ${objects.length + 1}\n`;
    xref += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i += 1) {
        xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
    parts.push(pdfText(xref));

    return new Blob([concatBytes(parts)], { type: 'application/pdf' });
}

/** Rasterize the live card and return a downloadable PDF blob. */
export async function cardDocumentToPdfBlob(
    document: CardDocument,
    width: number,
    height: number,
): Promise<Blob> {
    const dataUrl = await cardDocumentToDataUrl(document, width, height, 'jpg');
    const { mime, bytes } = dataUrlToBytes(dataUrl);
    if (!mime.includes('jpeg') && !mime.includes('jpg')) {
        throw new Error('PDF export expects a JPEG raster of the card.');
    }
    return jpegBytesToPdf(bytes, width, height);
}

export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
    const blob = dataUrlToBlob(dataUrl);
    return new File([blob], filename, { type: blob.type || 'image/png' });
}

/** Open a clean print sheet with only the card image (not the editor chrome). */
export function printCardDataUrl(dataUrl: string, title = 'Invitation card'): void {
    const safeTitle = title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  @page { margin: 0; size: auto; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 12px;
    box-sizing: border-box;
  }
  img {
    display: block;
    max-width: 100%;
    max-height: 100vh;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  @media print {
    html, body, .sheet {
      height: 100%;
      min-height: 100%;
    }
    .sheet {
      padding: 0;
      place-items: center;
    }
    img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
    }
  }
</style>
</head>
<body>
  <div class="sheet"><img id="card" src="${dataUrl}" alt="${safeTitle}" /></div>
  <script>
    const img = document.getElementById('card');
    const run = () => {
      setTimeout(() => {
        window.focus();
        window.print();
      }, 50);
    };
    if (img.complete) run();
    else img.addEventListener('load', run, { once: true });
    window.addEventListener('afterprint', () => window.close(), { once: true });
  </script>
</body>
</html>`;

    const frame = window.document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    window.document.body.appendChild(frame);

    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) {
        frame.remove();
        const fallback = window.open('', '_blank', 'noopener,noreferrer');
        if (!fallback) {
            throw new Error('Pop-up blocked. Allow pop-ups to print the card.');
        }
        fallback.document.open();
        fallback.document.write(html);
        fallback.document.close();
        return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = (): void => {
        window.setTimeout(() => frame.remove(), 1500);
    };
    win.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 60_000);
}

export type ShareCardResult = 'shared' | 'copied' | 'downloaded' | 'aborted';

/** Share the card image when possible; otherwise share/copy the invite link. */
export async function shareCardArtifact(input: {
    dataUrl: string;
    filename: string;
    title: string;
    text: string;
    url: string;
}): Promise<ShareCardResult> {
    const file = await dataUrlToFile(input.dataUrl, input.filename);
    const payloadWithFile = { files: [file], title: input.title, text: input.text, url: input.url };
    const payloadLink = { title: input.title, text: input.text, url: input.url };

    if (typeof navigator.share === 'function') {
        try {
            if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                await navigator.share(payloadWithFile);
                return 'shared';
            }
            await navigator.share(payloadLink);
            return 'shared';
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return 'aborted';
            }
        }
    }

    try {
        if (navigator.clipboard?.writeText && input.url) {
            await navigator.clipboard.writeText(input.url);
            return 'copied';
        }
    } catch {
        /* fall through to download */
    }

    triggerDataUrlDownload(input.dataUrl, input.filename);
    return 'downloaded';
}
