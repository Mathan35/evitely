import { Check, Copy, ImageIcon, MessageCircle, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

export type ShareKitPayload = {
    title: string;
    public_url: string;
    guest_url?: string | null;
    qr_url: string;
    whatsapp_url: string;
    sms_url: string;
    email_url: string;
    public_text: string;
    guest_text?: string | null;
    story_caption: string;
    story_image_hint?: string;
};

export function EventShareKit({ kit, className }: { kit: ShareKitPayload; className?: string }) {
    const [copied, setCopied] = useState<string | null>(null);

    async function copy(key: string, value: string): Promise<void> {
        const ok = await copyToClipboard(value);
        if (ok) {
            setCopied(key);
            window.setTimeout(() => setCopied(null), 1800);
        }
    }

    function downloadQr(): void {
        const svg = document.getElementById('share-kit-qr');
        if (!svg) {
            return;
        }
        const xml = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${kit.title.replace(/\s+/g, '-').toLowerCase() || 'invite'}-qr.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className={cn('space-y-5', className)}>
            <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                    Share kit
                </p>
                <h2 className="mt-1 font-serif text-2xl tracking-tight text-zinc-950">
                    Link, QR, WhatsApp & story
                </h2>
                <p className="mt-1.5 max-w-xl text-[13px] text-zinc-500">
                    Everything hosts need to share without waiting on Twilio — copy, scan, or open WhatsApp.
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
                    <QRCodeSVG id="share-kit-qr" value={kit.qr_url} size={140} level="M" includeMargin />
                    <Button type="button" variant="outline" className="h-9 w-full rounded-full text-[12px]" onClick={downloadQr}>
                        <QrCode className="size-3.5" />
                        Download QR
                    </Button>
                </div>

                <div className="space-y-3">
                    <KitRow
                        label="Guest link"
                        value={kit.public_url}
                        copied={copied === 'url'}
                        onCopy={() => void copy('url', kit.public_url)}
                    />
                    <KitRow
                        label="WhatsApp / SMS message"
                        value={kit.public_text}
                        multiline
                        copied={copied === 'text'}
                        onCopy={() => void copy('text', kit.public_text)}
                    />
                    <KitRow
                        label="Story caption"
                        value={kit.story_caption}
                        multiline
                        copied={copied === 'story'}
                        onCopy={() => void copy('story', kit.story_caption)}
                    />
                    {kit.guest_text ? (
                        <KitRow
                            label="Personal guest message"
                            value={kit.guest_text}
                            multiline
                            copied={copied === 'guest'}
                            onCopy={() => void copy('guest', kit.guest_text!)}
                        />
                    ) : null}

                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button asChild className="h-10 rounded-full">
                            <a href={kit.whatsapp_url} target="_blank" rel="noreferrer">
                                <MessageCircle className="size-3.5" />
                                WhatsApp
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="h-10 rounded-full">
                            <a href={kit.sms_url}>SMS</a>
                        </Button>
                        <Button asChild variant="outline" className="h-10 rounded-full">
                            <a href={kit.email_url}>Email</a>
                        </Button>
                        <span className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-medium text-zinc-600">
                            <ImageIcon className="size-3.5" />
                            Story: export card as Story format
                        </span>
                    </div>
                    {kit.story_image_hint ? (
                        <p className="text-[12px] text-zinc-500">{kit.story_image_hint}</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function KitRow({
    label,
    value,
    multiline,
    copied,
    onCopy,
}: {
    label: string;
    value: string;
    multiline?: boolean;
    copied: boolean;
    onCopy: () => void;
}) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">{label}</p>
                <button
                    type="button"
                    onClick={onCopy}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950"
                >
                    {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <p
                className={cn(
                    'mt-1.5 text-[13px] text-zinc-800',
                    multiline ? 'whitespace-pre-wrap leading-relaxed' : 'truncate font-medium',
                )}
            >
                {value}
            </p>
        </div>
    );
}
