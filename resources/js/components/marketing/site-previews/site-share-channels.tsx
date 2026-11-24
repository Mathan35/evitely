import { router } from '@inertiajs/react';
import { Copy, Facebook, Mail, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '@/lib/clipboard';
import { inviteActionPath } from '@/lib/invite-actions';
import { buildShareLinks, type ShareChannelLinks } from '@/lib/share-links';
import { cn } from '@/lib/utils';

type Props = {
    links?: ShareChannelLinks | null;
    shareUrl?: string | null;
    shareMessage?: string | null;
    inviteSlug?: string | null;
    inviteRootDomain?: string | null;
    className?: string;
    /** Underline classic row vs pill action chips. */
    variant?: 'classic' | 'pills';
};

const CHANNELS: {
    id: keyof ShareChannelLinks | 'copy';
    label: string;
    icon: typeof MessageCircle;
}[] = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'telegram', label: 'Telegram', icon: Send },
    { id: 'facebook', label: 'Facebook', icon: Facebook },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageCircle },
    { id: 'copy', label: 'Copy link', icon: Copy },
];

export function SiteShareChannelsRow({
    links,
    shareUrl,
    shareMessage,
    inviteSlug,
    inviteRootDomain,
    className,
    variant = 'pills',
}: Props) {
    const [copied, setCopied] = useState(false);
    const url =
        (shareUrl || '').trim() ||
        (typeof window !== 'undefined' ? window.location.href : '');
    const message = (shareMessage || '').trim() || url;
    const resolved = links ?? buildShareLinks(message, url);

    function track(channel: string): void {
        if (!inviteSlug) {
            return;
        }
        router.post(
            inviteActionPath(
                { slug: inviteSlug, invite_root_domain: inviteRootDomain },
                'share',
            ),
            { channel },
            { preserveState: true, preserveScroll: true },
        );
    }

    async function copyLink(): Promise<void> {
        const ok = await copyToClipboard(url || message);
        if (!ok) {
            return;
        }
        setCopied(true);
        track('copy');
        window.setTimeout(() => setCopied(false), 1600);
    }

    return (
        <div
            className={cn(
                variant === 'pills'
                    ? 'flex flex-wrap items-center justify-center gap-2'
                    : 'flex flex-wrap items-center gap-x-4 gap-y-2 text-sm',
                className,
            )}
        >
            {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                if (channel.id === 'copy') {
                    return (
                        <button
                            key={channel.id}
                            type="button"
                            onClick={() => void copyLink()}
                            className={cn(
                                variant === 'pills'
                                    ? 'site-share-pill inline-flex items-center gap-1.5'
                                    : 'inline-flex min-h-11 items-center underline',
                            )}
                        >
                            <Icon className="size-3.5" aria-hidden />
                            {copied ? 'Copied' : channel.label}
                        </button>
                    );
                }

                const href = resolved[channel.id];
                if (!href) {
                    return null;
                }

                return (
                    <a
                        key={channel.id}
                        href={href}
                        target={channel.id === 'email' || channel.id === 'sms' ? undefined : '_blank'}
                        rel="noreferrer"
                        onClick={() => track(channel.id)}
                        className={cn(
                            variant === 'pills'
                                ? 'site-share-pill inline-flex items-center gap-1.5'
                                : 'inline-flex min-h-11 items-center underline',
                        )}
                    >
                        <Icon className="size-3.5" aria-hidden />
                        {channel.label}
                    </a>
                );
            })}
        </div>
    );
}
