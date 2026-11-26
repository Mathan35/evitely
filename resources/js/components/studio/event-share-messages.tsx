import { router } from '@inertiajs/react';
import { Check, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ShareMessageTemplatesPanel } from '@/components/studio/share-message-templates-panel';
import { Button } from '@/components/ui/button';
import type { WeddingPage } from '@/types/wedding';

function buildPreviewVars(wedding: WeddingPage) {
    const fromServer = wedding.share_templates?.preview;
    if (fromServer) {
        return fromServer;
    }

    const title =
        wedding.title
        || [wedding.display?.bride, wedding.display?.groom].filter(Boolean).join(' & ')
        || 'Your celebration';
    const shareUrl = wedding.share_url || 'https://invite.example/your-event';

    return {
        title,
        date: wedding.wedding_date || '12 September 2026',
        time: wedding.wedding_time || '18:00',
        place: [wedding.venue_name, wedding.city, wedding.country].filter(Boolean).join(', ') || 'Venue',
        url: shareUrl,
        guest_name: 'Amira',
        guest_url: `${shareUrl.replace(/\/$/, '')}/g/sample`,
    };
}

/** Manage-page Share tab — public site share + personal guest WhatsApp/SMS copy. */
export function EventShareMessages({ wedding }: { wedding: WeddingPage }) {
    const templates = wedding.share_templates;
    const [publicTemplate, setPublicTemplate] = useState(templates?.public || '');
    const [guestTemplate, setGuestTemplate] = useState(templates?.guest || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setPublicTemplate(templates?.public || '');
        setGuestTemplate(templates?.guest || '');
    }, [templates?.public, templates?.guest, wedding.id]);

    const previewVars = useMemo(() => buildPreviewVars(wedding), [wedding]);
    const dirty =
        publicTemplate !== (templates?.public || '')
        || guestTemplate !== (templates?.guest || '');

    function save(): void {
        setSaving(true);
        setSaved(false);
        router.put(
            `/events/${wedding.id}`,
            {
                details: {
                    ...(wedding.details || {}),
                    share_public_template: publicTemplate,
                    share_guest_template: guestTemplate,
                },
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSaved(true);
                    window.setTimeout(() => setSaved(false), 2200);
                },
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <div className="min-w-0 w-full max-w-5xl space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                        Share messages
                    </p>
                    <h2 className="mt-1 font-serif text-2xl tracking-tight text-zinc-950 sm:text-[1.7rem]">
                        Customize what guests read
                    </h2>
                    <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
                        Public buttons and personal WhatsApp/SMS invites. Link preview title &amp; description stay
                        under Share &amp; SEO in the editor.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {saved ? (
                        <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-800">
                            <Check className="size-3.5" />
                            Saved
                        </span>
                    ) : dirty ? (
                        <span className="text-[12px] text-zinc-500">Unsaved changes</span>
                    ) : null}
                    <Button
                        type="button"
                        disabled={saving || !dirty}
                        className="h-10 rounded-xl px-4"
                        onClick={save}
                    >
                        <Share2 className="size-3.5" />
                        {saving ? 'Saving…' : 'Save messages'}
                    </Button>
                </div>
            </div>

            <ShareMessageTemplatesPanel
                mode="both"
                publicTemplate={publicTemplate}
                guestTemplate={guestTemplate}
                defaultPublicTemplate={
                    templates?.default_public
                    || "You're invited to {{title}}.\n{{date}}\n{{time}}\n{{place}}\n{{url}}"
                }
                defaultGuestTemplate={
                    templates?.default_guest
                    || "Hi {{guest_name}}, you're invited to {{title}}. Open your personal invite: {{guest_url}}"
                }
                previewVars={previewVars}
                onPublicTemplate={setPublicTemplate}
                onGuestTemplate={setGuestTemplate}
            />

            <p className="px-0.5 text-[12px] leading-relaxed text-zinc-500">
                Public copy feeds overview share buttons. Guest copy powers guest-book WhatsApp/SMS, Twilio, and
                scheduled auto-share on billing.
            </p>
        </div>
    );
}
