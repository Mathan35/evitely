import { router } from '@inertiajs/react';
import { Check, Copy, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { buildShareLinks } from '@/lib/share-links';

type GrowthState = {
    share_count?: number;
    share_goal?: number;
    has_shared?: boolean;
    goal_met?: boolean;
    defer_paywall?: boolean;
};

export function PostPublishGrowthDialog({
    open,
    onOpenChange,
    eventId,
    shareUrl,
    title,
    growth,
    billingUrl,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: number | string;
    shareUrl: string;
    title?: string | null;
    growth?: GrowthState | null;
    billingUrl?: string | null;
}) {
    const [copied, setCopied] = useState(false);
    const [shareCount, setShareCount] = useState(growth?.share_count ?? 0);
    const goal = growth?.share_goal ?? 3;
    const deferPaywall = growth?.defer_paywall !== false;

    useEffect(() => {
        if (open) {
            setShareCount(growth?.share_count ?? 0);
            setCopied(false);
        }
    }, [open, growth?.share_count]);

    const message = useMemo(() => {
        const label = (title || 'our celebration').trim();
        return `You're invited to ${label}!\n${shareUrl}`;
    }, [shareUrl, title]);

    const links = useMemo(() => buildShareLinks(message, shareUrl), [message, shareUrl]);

    function trackShare(callback?: () => void): void {
        router.post(
            `/events/${eventId}/growth/share`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                showProgress: false,
                onSuccess: (page) => {
                    const next = (page.props as { flash?: { publish_growth?: { growth?: GrowthState } } })?.flash;
                    // Local bump; server also increments.
                    setShareCount((c) => c + 1);
                    callback?.();
                    void next;
                },
                onError: () => {
                    setShareCount((c) => c + 1);
                    callback?.();
                },
            },
        );
    }

    async function copyLink(): Promise<void> {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            trackShare();
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            trackShare();
        }
    }

    const steps = [
        { id: 'copy', label: 'Copy your invite link', done: shareCount >= 1 || copied },
        { id: 'wa', label: 'Share on WhatsApp', done: shareCount >= 1 },
        { id: 'three', label: `Share with ${goal} people`, done: shareCount >= goal },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-[1.5rem] border-zinc-200 p-0 sm:max-w-md">
                <div className="bg-gradient-to-br from-emerald-950 via-zinc-900 to-zinc-950 px-6 py-6 text-white">
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-emerald-200 uppercase ring-1 ring-white/10">
                        <Sparkles className="size-3" />
                        You're live
                    </p>
                    <DialogHeader className="mt-4 space-y-2 text-left">
                        <DialogTitle className="font-serif text-2xl tracking-tight text-white">
                            Share before you worry about plans
                        </DialogTitle>
                        <DialogDescription className="text-[13px] leading-relaxed text-zinc-300">
                            Cards stay free forever. Your guest site is on a free trial — send the link to friends first.
                            Day packs can wait until you've shared.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="space-y-4 px-6 py-5">
                    <ul className="space-y-2">
                        {steps.map((step) => (
                            <li
                                key={step.id}
                                className="flex items-center gap-2.5 rounded-xl bg-zinc-50 px-3 py-2.5 text-[13px] text-zinc-700 ring-1 ring-zinc-950/5"
                            >
                                <span
                                    className={`grid size-6 place-items-center rounded-full ${
                                        step.done ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'
                                    }`}
                                >
                                    <Check className="size-3.5" />
                                </span>
                                <span className={step.done ? 'text-emerald-800' : ''}>{step.label}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="grid gap-2">
                        <Button type="button" className="h-11 w-full rounded-xl" onClick={() => void copyLink()}>
                            <Copy className="mr-2 size-4" />
                            {copied ? 'Link copied' : 'Copy invite link'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 w-full rounded-xl"
                            onClick={() => {
                                trackShare(() => {
                                    window.open(links.whatsapp, '_blank', 'noopener,noreferrer');
                                });
                            }}
                        >
                            <MessageCircle className="mr-2 size-4" />
                            Share on WhatsApp
                        </Button>
                        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 w-full rounded-xl"
                                onClick={() => {
                                    trackShare(() => {
                                        void navigator.share({ title: title || 'Invitation', text: message, url: shareUrl });
                                    });
                                }}
                            >
                                <Share2 className="mr-2 size-4" />
                                More share options
                            </Button>
                        ) : null}
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button type="button" variant="ghost" className="h-10 w-full rounded-xl" onClick={() => onOpenChange(false)}>
                            Back to editor
                        </Button>
                        {!deferPaywall || shareCount >= 1 ? (
                            billingUrl ? (
                                <button
                                    type="button"
                                    className="text-center text-[12px] text-zinc-500 underline-offset-2 hover:underline"
                                    onClick={() => window.location.assign(billingUrl)}
                                >
                                    Need more days? View site packs
                                </button>
                            ) : null
                        ) : (
                            <p className="text-center text-[11px] text-zinc-400">
                                Site packs unlock after your first share — no rush.
                            </p>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
