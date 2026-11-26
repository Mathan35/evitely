import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Check,
    Copy,
    ExternalLink,
    Eye,
    Heart,
    Image,
    Inbox,
    Mail,
    MessageCircle,
    Pencil,
    QrCode,
    Share2,
    Sparkles,
    Users,
} from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EventActivityFeed } from '@/components/studio/event-activity-feed';
import { EventBudgetTracker } from '@/components/studio/event-budget-tracker';
import { EventVendors } from '@/components/studio/event-vendors';
import { EventCollaborators } from '@/components/studio/event-collaborators';
import { EventGuestBook } from '@/components/studio/event-guest-book';
import { EventGuestbookInbox } from '@/components/studio/event-guestbook-inbox';
import { EventPhotoWallInbox } from '@/components/studio/event-photo-wall-inbox';
import { EventPlanningChecklist } from '@/components/studio/event-planning-checklist';
import { EventRsvpInbox } from '@/components/studio/event-rsvp-inbox';
import { EventSeating } from '@/components/studio/event-seating';
import { EventShareMessages } from '@/components/studio/event-share-messages';
import { isPhotoWallEnabled, isRsvpRemindersEnabled } from '@/components/studio/preferences-panel';
import { useSitePublishFlow } from '@/components/studio/site-publish-flow';
import { staysFromAccommodations } from '@/lib/stays-from-accommodations';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import type { WeddingPage } from '@/types/wedding';

type ManageTab = 'overview' | 'share' | 'guests' | 'rsvps' | 'wishes' | 'photos' | 'seating';

function formatDate(value: string | null | undefined): string | null {
    if (!value) {
        return null;
    }
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function ManagePremiumGate({
    title,
    description,
    upgradeUrl,
}: {
    title: string;
    description: string;
    upgradeUrl: string;
}) {
    return (
        <div className="rounded-[1.35rem] border border-amber-200/80 bg-gradient-to-br from-amber-50 mt-3 to-white p-5 sm:p-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-amber-800/80 uppercase">Site plan</p>
            <h3 className="mt-2 font-serif text-xl tracking-tight text-zinc-950">{title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">{description}</p>
            <Link
                href={upgradeUrl}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white"
            >
                View site plans
            </Link>
        </div>
    );
}

export default function WeddingShow({ wedding }: { wedding: WeddingPage }) {
    const page = usePage<{ growth?: { trial_days?: number } }>();
    const trialDays = page.props.growth?.trial_days ?? 30;
    const owner = wedding.owner;
    const canvas = useRef<HTMLCanvasElement>(null);
    const [copied, setCopied] = useState(false);
    const [confirmStopLive, setConfirmStopLive] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [tab, setTab] = useState<ManageTab>('overview');
    const published = wedding.status === 'published';
    const siteBilling =
        owner?.messaging?.billing?.site
        ?? (wedding as { site_billing?: {
            can_use_premium?: boolean;
            upgrade_url?: string;
            features?: Record<string, boolean>;
            is_live_paused?: boolean;
            is_public_live?: boolean;
            trial_available?: boolean;
            trial_used_on?: { id: number; title: string; status: string } | null;
            has_paid_pack?: boolean;
            legacy_account_pro?: boolean;
            can_schedule_publish?: boolean;
            is_view_only?: boolean;
            is_card_only?: boolean;
            is_site?: boolean;
        } }).site_billing;
    const isLivePaused = Boolean(siteBilling?.is_live_paused);
    const canUsePremium = Boolean(siteBilling?.can_use_premium);
    const features = siteBilling?.features ?? null;
    const billingUpgradeUrl = siteBilling?.upgrade_url || `/events/${wedding.id}/billing`;

    const { beginSitePublish, sitePublishDialogs } = useSitePublishFlow({
        weddingId: wedding.id,
        invitationMode: wedding.invitation_mode,
        siteBilling,
        trialDays,
        publishing,
        onPublish: (paid) => {
            setPublishing(true);
            router.post(`/events/${wedding.id}/publish`, paid ? { paid: 1 } : {}, {
                preserveScroll: true,
                onFinish: () => setPublishing(false),
            });
        },
    });

    function requestPublish(): void {
        if (published && isLivePaused) {
            setPublishing(true);
            router.post(`/events/${wedding.id}/publish`, {}, {
                preserveScroll: true,
                onFinish: () => setPublishing(false),
            });
            return;
        }
        if (beginSitePublish()) {
            return;
        }
        setPublishing(true);
        router.post(`/events/${wedding.id}/publish`, {}, {
            preserveScroll: true,
            onFinish: () => setPublishing(false),
        });
    }
    const seatingLocked = !canUsePremium && features?.seating === false;
    const vendorsLocked = !canUsePremium && features?.vendors === false;
    const analyticsLocked = !canUsePremium && features?.analytics_advanced === false;
    const names = useMemo(() => {
        const bride = (wedding.display?.bride || '').trim();
        const groom = (wedding.display?.groom || '').trim();
        if (bride && groom && bride.toLowerCase() !== groom.toLowerCase()) {
            return `${bride} & ${groom}`;
        }
        return (wedding.title || bride || groom || 'Invitation').trim();
    }, [wedding.display?.bride, wedding.display?.groom, wedding.title]);
    const rsvpCount = owner?.rsvps?.length ?? owner?.counts?.responded ?? 0;
    const guestCount = owner?.guests?.length ?? owner?.counts?.invited ?? 0;
    const wishesQueue = owner?.guestbook_queue ?? [];
    const wishesPending = wishesQueue.filter((entry) => entry.status === 'pending').length;
    const wishesCount = wishesQueue.length;
    const metaLine = useMemo(
        () =>
            [formatDate(wedding.wedding_date), wedding.city, wedding.venue_name]
                .filter(Boolean)
                .join(' · '),
        [wedding.city, wedding.venue_name, wedding.wedding_date],
    );

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = (params.get('tab') || '').toLowerCase();
        const hash = window.location.hash.replace('#', '').toLowerCase();
        const key = fromQuery || hash;

        if (key === 'rsvps' || key === 'rsvp') {
            setTab('rsvps');
        } else if (key === 'share' || key === 'messages' || key === 'invite-message') {
            setTab('share');
        } else if (key === 'guests' || key === 'guest') {
            setTab('guests');
        } else if (key === 'wishes' || key === 'guestbook' || key === 'wall') {
            setTab('wishes');
        } else if (key === 'photos' || key === 'photo') {
            setTab('photos');
        } else if (key === 'seating' || key === 'tables') {
            setTab('seating');
        }
    }, []);

    function openPhotos(): void {
        setTab('photos');
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#photos`);
        window.requestAnimationFrame(() => {
            document.getElementById('photos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function printRoomBlocks(): void {
        const stays = staysFromAccommodations(wedding.accommodations ?? []).filter((stay) => stay.code);
        if (stays.length === 0) {
            return;
        }
        const cards = stays
            .map(
                (stay) => `<section style="break-inside:avoid;margin:0 0 16px;padding:16px;border:1px solid #e4e4e7;border-radius:16px;text-align:center">
              <p style="margin:0;font:11px/1.2 system-ui;letter-spacing:.14em;text-transform:uppercase;color:#71717a">Room block</p>
              <h2 style="margin:8px 0 4px;font:600 22px/1.2 Georgia,serif">${stay.name}</h2>
              <p style="margin:0;font:13px/1.45 system-ui;color:#52525b">${stay.detail || ''}</p>
              <p style="margin:14px 0 0;font:700 20px/1.2 ui-monospace,monospace;letter-spacing:.08em">${stay.code}</p>
              ${stay.url ? `<p style="margin:10px 0 0;font:12px/1.4 system-ui;word-break:break-all">${stay.url}</p>` : ''}
            </section>`,
            )
            .join('');
        const html = `<!doctype html><html><head><title>Room block codes</title>
          <style>body{font-family:system-ui,sans-serif;margin:20px;max-width:640px;color:#18181b}
          h1{font:600 26px Georgia,serif;margin:0 0 16px}@media print{body{margin:12mm}}</style></head>
          <body><h1>Hotel room blocks</h1>${cards}<script>window.onload=()=>window.print()</script></body></html>`;
        const win = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
        if (!win) return;
        win.document.write(html);
        win.document.close();
    }

    function openGuests(): void {
        setTab('guests');
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#guests`);
        window.requestAnimationFrame(() => {
            document.getElementById('guests')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function openRsvps(): void {
        setTab('rsvps');
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#rsvps`);
        window.requestAnimationFrame(() => {
            document.getElementById('rsvps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function openWishes(): void {
        setTab('wishes');
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#wishes`);
        window.requestAnimationFrame(() => {
            document.getElementById('wishes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    const stats = owner
        ? ([
              { label: 'Invited', value: owner.counts.invited, tone: 'ink' },
              { label: 'Viewed', value: owner.counts.viewed, tone: 'sky' },
              { label: 'Replied', value: owner.counts.responded, tone: 'teal' },
              { label: 'Attending', value: owner.counts.attending, tone: 'emerald' },
              { label: 'Declined', value: owner.counts.not_attending, tone: 'rose' },
              { label: 'Maybe', value: owner.counts.maybe, tone: 'amber' },
              { label: 'Pending', value: owner.counts.pending, tone: 'zinc' },
              { label: 'Seats', value: owner.counts.attending_guests, tone: 'gold' },
          ] as const)
        : [];

    const funnelViews = owner
        ? Math.max(1, (owner.analytics.views ?? 0) + (owner.analytics.guest_views ?? 0))
        : 1;
    const attention = owner
        ? ([
              { label: 'Views', value: owner.analytics.views, hint: 'Total invitation opens' },
              { label: 'Unique visitors', value: owner.analytics.unique_views, hint: 'Distinct browsers' },
              { label: 'Guest opens', value: owner.analytics.guest_views, hint: 'Personal guest links' },
              { label: 'QR scans', value: owner.analytics.qr_scans, hint: 'From your QR code' },
              { label: 'Shares', value: owner.analytics.shares, hint: 'Shared by guests' },
              {
                  label: 'RSVPs',
                  value: rsvpCount,
                  hint: `Conversion ${Math.round((rsvpCount / funnelViews) * 1000) / 10}% of views`,
              },
          ] as const)
        : [];

    const maxAttention = Math.max(1, ...attention.map((item) => item.value));

    function download(kind: 'png' | 'svg'): void {
        if (kind === 'png' && canvas.current) {
            const link = document.createElement('a');
            link.href = canvas.current.toDataURL('image/png');
            link.download = `${wedding.slug}.png`;
            link.click();
            return;
        }

        const svg = document.getElementById('wedding-qr');
        if (!svg) {
            return;
        }
        const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${wedding.slug}.svg`;
        link.click();
    }

    function printQrPack(): void {
        const png = canvas.current?.toDataURL('image/png');
        if (!png) {
            return;
        }
        const url = wedding.share_url.replace(/^https?:\/\//, '');
        const html = `<!doctype html><html><head><title>QR print pack — ${names}</title>
          <style>
            *{box-sizing:border-box} body{margin:0;font-family:Georgia,serif;color:#18181b;background:#fff}
            .sheet{width:100%;padding:18mm 14mm;page-break-after:always}
            .sheet:last-child{page-break-after:auto}
            .card{border:1px solid #e4e4e7;border-radius:18px;padding:22px;text-align:center}
            h1{font-size:26px;margin:0 0 6px;font-weight:600} p{margin:0;color:#71717a;font:13px/1.45 system-ui,sans-serif}
            img{width:180px;height:180px;margin:18px auto;display:block}
            .url{margin-top:10px;font:600 12px/1.4 system-ui,sans-serif;color:#18181b;word-break:break-all}
            .grid{display:grid;grid-template-columns:1fr 1fr;gap:12mm;padding:12mm}
            .mini{border:1px dashed #d4d4d8;border-radius:14px;padding:14px;text-align:center}
            .mini img{width:110px;height:110px;margin:10px auto}
            .mini h2{font-size:15px;margin:0;font-weight:600}
            @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
          </style></head><body>
          <section class="sheet"><div class="card">
            <h1>${names}</h1>
            <p>${metaLine || 'Scan to open the invitation'}</p>
            <img src="${png}" alt="QR" />
            <p class="url">${url}</p>
          </div></section>
          <section class="sheet"><div class="grid">
            ${[1, 2, 3, 4]
                .map(
                    () => `<div class="mini"><h2>${names}</h2><img src="${png}" alt="QR" /><p class="url" style="font-size:10px">${url}</p></div>`,
                )
                .join('')}
          </div></section>
          <script>window.onload=()=>window.print()</script></body></html>`;
        const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');
        if (!win) {
            return;
        }
        win.document.write(html);
        win.document.close();
    }

    async function copyLink(): Promise<void> {
        try {
            await navigator.clipboard.writeText(wedding.share_url);
        } catch {
            /* ignore */
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
        router.post(`/invite/${wedding.slug}/share`, { channel: 'copy' }, { preserveScroll: true, preserveState: true });
    }

    return (
        <>
            <Head title={names} />
            <div className="relative min-h-[calc(100dvh-4rem)] overflow-x-clip">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(920px_420px_at_8%_-8%,rgba(24,24,27,0.08),transparent_55%),radial-gradient(680px_360px_at_92%_0%,rgba(16,185,129,0.10),transparent_50%),linear-gradient(180deg,#fafafa_0%,#f4f4f5_48%,#eef2f0_100%)]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(24,24,27,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.03)_1px,transparent_1px)] [background-size:48px_48px]"
                />

                <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:gap-7 sm:px-6 sm:py-8 lg:gap-8 lg:py-10">
                    {/* Hero */}
                    <header className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
                        <div className="flex flex-col gap-4 sm:gap-5">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase',
                                            published
                                                ? 'bg-emerald-500/12 text-emerald-800 ring-1 ring-emerald-600/20'
                                                : 'bg-zinc-900/6 text-zinc-600 ring-1 ring-zinc-950/10',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'size-1.5 rounded-full',
                                                published ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]' : 'bg-zinc-400',
                                            )}
                                        />
                                        {published ? 'Live' : wedding.status}
                                    </span>
                                    {wedding.event_type_name ? (
                                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase ring-1 ring-zinc-950/5">
                                            {wedding.event_type_name}
                                        </span>
                                    ) : null}
                                </div>
                                <h1 className="mt-2.5 max-w-3xl break-words font-serif text-[clamp(1.85rem,7vw,3.5rem)] leading-[1.05] tracking-tight text-zinc-950 sm:mt-3">
                                    {names}
                                </h1>
                                {metaLine ? (
                                    <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 sm:mt-3 sm:text-[14px]">
                                        {metaLine}
                                    </p>
                                ) : (
                                    <p className="mt-2 text-[13px] text-zinc-500 sm:mt-3 sm:text-[14px]">
                                        Your invitation command center
                                    </p>
                                )}
                            </div>

                            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                                <Button
                                    type="button"
                                    onClick={openRsvps}
                                    className="h-10 justify-center rounded-full bg-emerald-600 px-3 text-[13px] text-white shadow-lg shadow-emerald-700/25 hover:bg-emerald-500 sm:px-4"
                                >
                                    <Inbox className="mr-1.5 size-3.5 shrink-0" />
                                    <span className="truncate">RSVPs</span>
                                    <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                                        {rsvpCount}
                                    </span>
                                </Button>
                                {(() => {
                                    const mode = wedding.invitation_mode || 'both';
                                    const showCard = mode === 'card' || mode === 'both';
                                    const showSite = mode === 'link' || mode === 'both';
                                    return (
                                        <>
                                            {showCard ? (
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="h-10 justify-center rounded-full border-zinc-200 bg-white/90 px-3 text-[13px] sm:px-4"
                                                >
                                                    <Link href={`/events/${wedding.id}/card`}>
                                                        <Pencil className="mr-1.5 size-3.5 shrink-0" />
                                                        {mode === 'both' ? 'Edit card' : 'Edit'}
                                                    </Link>
                                                </Button>
                                            ) : null}
                                            {showSite ? (
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="h-10 justify-center rounded-full border-zinc-200 bg-white/90 px-3 text-[13px] sm:px-4"
                                                >
                                                    <Link href={`/events/${wedding.id}/edit`}>
                                                        <Pencil className="mr-1.5 size-3.5 shrink-0" />
                                                        {mode === 'both' ? 'Edit site' : 'Edit'}
                                                    </Link>
                                                </Button>
                                            ) : null}
                                        </>
                                    );
                                })()}
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-10 justify-center rounded-full border-zinc-200 bg-white/90 px-3 text-[13px] sm:px-4"
                                >
                                    <Link
                                        href={`/events/${wedding.id}/preview${wedding.invitation_mode === 'card' ? '?from=card' : '?from=edit'}`}
                                        target="_blank"
                                    >
                                        <Eye className="mr-1.5 size-3.5 shrink-0" />
                                        Preview
                                    </Link>
                                </Button>
                                {wedding.invitation_mode !== 'card' ? (
                                    <Button
                                        variant="outline"
                                        className="h-10 justify-center rounded-full px-3 text-[13px] sm:px-4"
                                        asChild
                                    >
                                        <Link href={`/events/${wedding.id}/billing`}>Billing</Link>
                                    </Button>
                                ) : null}
                                {published ? (
                                    isLivePaused ? (
                                        <Button
                                            className="h-10 justify-center rounded-full bg-emerald-600 px-3 text-[13px] text-white shadow-lg shadow-emerald-700/25 hover:bg-emerald-500 sm:px-4"
                                            disabled={publishing}
                                            onClick={requestPublish}
                                        >
                                            <Sparkles className="mr-1.5 size-3.5 shrink-0" />
                                            Go live
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="h-10 justify-center rounded-full border-rose-200 bg-white/90 px-3 text-[13px] text-rose-700 hover:bg-rose-50 hover:text-rose-800 sm:px-4"
                                            onClick={() => setConfirmStopLive(true)}
                                        >
                                            Stop live
                                        </Button>
                                    )
                                ) : (
                                    <Button
                                        className="h-10 justify-center rounded-full bg-emerald-600 px-3 text-[13px] text-white shadow-lg shadow-emerald-700/25 hover:bg-emerald-500 sm:px-4"
                                        disabled={publishing}
                                        onClick={requestPublish}
                                    >
                                        <Sparkles className="mr-1.5 size-3.5 shrink-0" />
                                        {publishing ? 'Publishing…' : 'Publish'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </header>

                    {sitePublishDialogs}

                    <ConfirmDialog
                        open={confirmStopLive}
                        onOpenChange={setConfirmStopLive}
                        title="Stop the live site?"
                        description="Guests will not be able to open the public link until you go live again. Your trial or paid plan keeps running."
                        confirmLabel="Stop live"
                        tone="danger"
                        onConfirm={() => router.delete(`/events/${wedding.id}/publish`)}
                    />

                    <nav
                        aria-label="Manage sections"
                        className="-mx-4 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-visible sm:px-0"
                    >
                        <div className="flex w-max min-w-full gap-1 rounded-2xl bg-white/90 p-1.5 shadow-sm ring-1 ring-zinc-950/5 backdrop-blur sm:w-full sm:flex-wrap">
                            {(
                                [
                                    {
                                        id: 'overview' as const,
                                        label: 'Overview',
                                        onClick: () => {
                                            setTab('overview');
                                            window.history.replaceState(null, '', window.location.pathname);
                                        },
                                    },
                                    {
                                        id: 'share' as const,
                                        label: 'Share',
                                        icon: Share2,
                                        onClick: () => {
                                            setTab('share');
                                            window.history.replaceState(
                                                null,
                                                '',
                                                `${window.location.pathname}?tab=share`,
                                            );
                                        },
                                    },
                                    {
                                        id: 'guests' as const,
                                        label: 'Guests',
                                        icon: Users,
                                        count: guestCount,
                                        onClick: openGuests,
                                    },
                                    {
                                        id: 'rsvps' as const,
                                        label: 'RSVPs',
                                        icon: Inbox,
                                        count: rsvpCount,
                                        tone: 'emerald' as const,
                                        onClick: openRsvps,
                                    },
                                    {
                                        id: 'wishes' as const,
                                        label: 'Wishes',
                                        icon: Heart,
                                        count: wishesPending > 0 ? wishesPending : wishesCount,
                                        tone: wishesPending > 0 ? ('amber' as const) : undefined,
                                        onClick: openWishes,
                                    },
                                    ...(isPhotoWallEnabled(wedding.details) ||
                                    (owner?.guest_photo_queue?.length ?? 0) > 0
                                        ? [
                                              {
                                                  id: 'photos' as const,
                                                  label: 'Photos',
                                                  icon: Image,
                                                  count:
                                                      owner?.guest_photo_queue?.filter(
                                                          (photo) => photo.status === 'pending',
                                                      ).length ?? 0,
                                                  tone: 'amber' as const,
                                                  onClick: openPhotos,
                                              },
                                          ]
                                        : []),
                                    {
                                        id: 'seating' as const,
                                        label: 'Seating',
                                        onClick: () => {
                                            setTab('seating');
                                            window.history.replaceState(
                                                null,
                                                '',
                                                `${window.location.pathname}?tab=seating`,
                                            );
                                        },
                                    },
                                ] as const
                            ).map((item) => {
                                const Icon = 'icon' in item ? item.icon : null;
                                const active = tab === item.id;
                                const count = 'count' in item ? item.count : undefined;
                                const tone = 'tone' in item ? item.tone : undefined;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={item.onClick}
                                        className={cn(
                                            'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold transition sm:h-10 sm:rounded-full sm:px-3.5 sm:text-[13px]',
                                            active
                                                ? 'bg-zinc-950 text-white shadow-sm'
                                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
                                        )}
                                    >
                                        {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
                                        {item.label}
                                        {count != null ? (
                                            <span
                                                className={cn(
                                                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums sm:text-[11px]',
                                                    active
                                                        ? 'bg-white/20 text-white'
                                                        : tone === 'emerald'
                                                          ? 'bg-emerald-50 text-emerald-800'
                                                          : tone === 'amber'
                                                            ? 'bg-amber-50 text-amber-800'
                                                            : 'bg-zinc-100 text-zinc-700',
                                                )}
                                            >
                                                {count}
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {tab === 'share' ? (
                        <div className="min-w-0 w-full">
                            <EventShareMessages wedding={wedding} />
                        </div>
                    ) : null}

                    {tab === 'guests' ? (
                        <div className="min-w-0 w-full max-w-5xl">
                            <EventGuestBook
                                eventId={wedding.id}
                                guests={owner?.guests ?? []}
                                groups={owner?.groups ?? []}
                                eventTitle={names}
                                shareGuestTemplate={
                                    wedding.share_templates?.guest
                                    || wedding.details?.share_guest_template
                                    || null
                                }
                                shareDate={formatDate(wedding.wedding_date || wedding.starts_on)}
                                shareTime={wedding.wedding_time}
                                sharePlace={[wedding.venue_name, wedding.city, wedding.country]
                                    .filter(Boolean)
                                    .join(', ')}
                                messaging={owner?.messaging}
                            />
                        </div>
                    ) : null}

                    {tab === 'rsvps' ? (
                        <div className="min-w-0 w-full max-w-3xl">
                            <EventRsvpInbox
                                eventId={wedding.id}
                                rsvps={owner?.rsvps ?? []}
                                meals={wedding.options?.meals}
                                pendingCount={owner?.counts?.pending ?? 0}
                                remindableCount={owner?.counts?.remindable ?? owner?.counts?.pending ?? 0}
                                remindersEnabled={isRsvpRemindersEnabled(wedding.details)}
                            />
                        </div>
                    ) : null}

                    {tab === 'wishes' ? (
                        <div className="min-w-0 w-full max-w-3xl">
                            <EventGuestbookInbox eventId={wedding.id} entries={wishesQueue} />
                        </div>
                    ) : null}

                    {tab === 'photos' ? (
                        <div className="min-w-0 w-full max-w-3xl">
                            <EventPhotoWallInbox
                                eventId={wedding.id}
                                photos={owner?.guest_photo_queue ?? []}
                            />
                        </div>
                    ) : null}

                    {tab === 'seating' ? (
                        <div className="min-w-0 w-full max-w-4xl space-y-5 sm:space-y-6">
                            {seatingLocked ? (
                                <ManagePremiumGate
                                    title="Seating charts are on paid plans"
                                    description="Plan tables and place cards after you choose a site pack. Guests, RSVPs, and wishes stay available on trial."
                                    upgradeUrl={billingUpgradeUrl}
                                />
                            ) : (
                                <EventSeating
                                    eventId={wedding.id}
                                    tables={owner?.tables ?? []}
                                    guests={owner?.guests ?? []}
                                />
                            )}
                            <EventCollaborators
                                eventId={wedding.id}
                                collaborators={owner?.collaborators ?? []}
                                isOwner={Boolean(owner?.is_owner)}
                            />
                        </div>
                    ) : null}

                    {tab === 'overview' ? (
                    <div className="grid min-w-0 gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
                        <div className="min-w-0 space-y-5 sm:space-y-6">
                            {/* Share hub */}
                            <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 [animation-delay:60ms]">
                                <div className="overflow-hidden rounded-[1.35rem] bg-zinc-950 text-white shadow-[0_30px_80px_-40px_rgba(24,24,27,0.65)] sm:rounded-[1.6rem]">
                                    <div className="relative px-4 py-4 sm:px-6 sm:py-6">
                                        <div
                                            aria-hidden
                                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_220px_at_85%_0%,rgba(16,185,129,0.22),transparent_60%)]"
                                        />
                                        <div className="relative">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-[11px] font-semibold tracking-[0.18em] text-white/50 uppercase">
                                                    Guest link
                                                </p>
                                                {published ? (
                                                    <a
                                                        href={wedding.share_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-white/15"
                                                    >
                                                        Open live site
                                                        <ExternalLink className="size-3.5 opacity-70" />
                                                    </a>
                                                ) : null}
                                            </div>
                                            <p className="mt-3 break-all font-serif text-[clamp(1.15rem,4.5vw,1.85rem)] leading-snug tracking-tight text-white">
                                                {wedding.share_url.replace(/^https?:\/\//, '')}
                                            </p>
                                            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => void copyLink()}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-3 text-[12px] font-semibold text-zinc-950 transition hover:bg-zinc-100 sm:px-4 sm:text-[13px]"
                                                >
                                                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                                    {copied ? 'Copied' : 'Copy link'}
                                                </button>
                                                <a
                                                    href={wedding.share_links.whatsapp}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white/10 px-3 text-[12px] font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 sm:px-4 sm:text-[13px]"
                                                >
                                                    <MessageCircle className="size-3.5" />
                                                    WhatsApp
                                                </a>
                                                <a
                                                    href={wedding.share_links.email}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white/10 px-3 text-[12px] font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 sm:px-4 sm:text-[13px]"
                                                >
                                                    <Mail className="size-3.5" />
                                                    Email
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTab('share');
                                                        window.history.replaceState(
                                                            null,
                                                            '',
                                                            `${window.location.pathname}?tab=share`,
                                                        );
                                                    }}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white/10 px-3 text-[12px] font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 sm:px-4 sm:text-[13px]"
                                                >
                                                    <Share2 className="size-3.5" />
                                                    Edit messages
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => router.post(`/events/${wedding.id}/duplicate`)}
                                                    className="inline-flex h-10 items-center justify-center rounded-full px-3 text-[12px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-[13px]"
                                                >
                                                    Duplicate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* RSVP metrics */}
                            {owner ? (
                                <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 [animation-delay:120ms]">
                                    <div className="mb-3 flex flex-col gap-2 px-0.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                                        <div>
                                            <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">Guest pulse</p>
                                            <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950 sm:text-2xl">RSVP overview</h2>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                            <button
                                                type="button"
                                                onClick={openGuests}
                                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-700 transition hover:text-zinc-950"
                                            >
                                                Manage guests
                                            </button>
                                            <button
                                                type="button"
                                                onClick={openRsvps}
                                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 transition hover:text-emerald-900"
                                            >
                                                Open RSVP inbox
                                            </button>
                                            <Link
                                                href="/guests"
                                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500 transition hover:text-zinc-900"
                                            >
                                                <Users className="size-3.5" />
                                                All guests
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
                                        {stats.map((stat, index) => (
                                            <button
                                                type="button"
                                                key={stat.label}
                                                onClick={
                                                    ['Replied', 'Attending', 'Declined', 'Maybe'].includes(stat.label)
                                                        ? openRsvps
                                                        : ['Invited', 'Viewed', 'Pending'].includes(stat.label)
                                                          ? openGuests
                                                          : undefined
                                                }
                                                className="group rounded-[1.1rem] bg-white/90 p-3 text-left shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(24,24,27,0.35)] sm:rounded-[1.25rem] sm:p-3.5"
                                                style={{ animationDelay: `${index * 30}ms` }}
                                            >
                                                <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                                    {stat.label}
                                                </p>
                                                <p
                                                    className={cn(
                                                        'mt-1.5 font-sans text-[1.65rem] font-semibold leading-none tracking-tight tabular-nums sm:mt-2 sm:text-[2rem]',
                                                        toneClass(stat.tone),
                                                    )}
                                                >
                                                    {stat.value}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            <EventActivityFeed
                                rsvps={owner?.rsvps ?? []}
                                wishes={wishesQueue}
                                gifts={owner?.gift_claims ?? []}
                                photos={owner?.guest_photo_queue ?? []}
                                onOpenTab={(next) => {
                                    if (next === 'rsvps') openRsvps();
                                    else if (next === 'wishes') openWishes();
                                    else if (next === 'photos') openPhotos();
                                    else setTab('overview');
                                }}
                            />

                            {/* Attention */}
                            {owner ? (
                                <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 [animation-delay:180ms]">
                                    <div className="rounded-[1.6rem] bg-white/90 p-5 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05] backdrop-blur sm:p-6">
                                        <div className="flex flex-wrap items-end justify-between gap-2">
                                            <div>
                                                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                                    Attention
                                                </p>
                                                <h2 className="mt-1 font-serif text-2xl tracking-tight text-zinc-950">
                                                    How guests find you
                                                </h2>
                                            </div>
                                            {analyticsLocked ? (
                                                <Link
                                                    href={billingUpgradeUrl}
                                                    className="text-[12px] font-semibold text-amber-800 transition hover:text-amber-950"
                                                >
                                                    Unlock full analytics →
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={`/analytics?event=${wedding.id}`}
                                                    className="text-[12px] font-semibold text-zinc-500 transition hover:text-zinc-900"
                                                >
                                                    Full analytics →
                                                </Link>
                                            )}
                                        </div>
                                        <ul className="mt-6 space-y-4">
                                            {attention.map((item) => (
                                                <li key={item.label}>
                                                    <div className="flex items-baseline justify-between gap-3">
                                                        <div>
                                                            <p className="text-[13px] font-semibold text-zinc-800">{item.label}</p>
                                                            <p className="text-[11px] text-zinc-400">{item.hint}</p>
                                                        </div>
                                                        <p className="font-sans text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">
                                                            {item.value}
                                                        </p>
                                                    </div>
                                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-zinc-800 to-emerald-500 transition-[width] duration-700"
                                                            style={{
                                                                width: `${Math.max(4, Math.round((item.value / maxAttention) * 100))}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>
                            ) : null}
                        </div>

                        {/* QR panel */}
                        <aside className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 [animation-delay:140ms] lg:sticky lg:top-6 lg:self-start">
                            <div className="overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_28px_70px_-40px_rgba(24,24,27,0.45)] ring-1 ring-zinc-950/[0.06] backdrop-blur">
                                <div className="border-b border-zinc-100 px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="grid size-8 place-items-center rounded-full bg-zinc-950 text-white">
                                            <QrCode className="size-3.5" />
                                        </span>
                                        <div>
                                            <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                                Scan
                                            </p>
                                            <h2 className="font-serif text-xl tracking-tight text-zinc-950">QR code</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-5 py-5">
                                    <div className="mx-auto grid place-items-center rounded-[1.25rem] bg-[linear-gradient(160deg,#fafafa,#f4f4f5)] p-4 ring-1 ring-zinc-950/5">
                                        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-950/5">
                                            <QRCodeSVG id="wedding-qr" value={wedding.qr_url} size={200} level="M" />
                                            <QRCodeCanvas
                                                ref={canvas}
                                                value={wedding.qr_url}
                                                size={512}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => download('png')}
                                            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 text-[12px] font-semibold text-white transition hover:bg-zinc-800"
                                        >
                                            Download PNG
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => download('svg')}
                                            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-100 text-[12px] font-semibold text-zinc-800 transition hover:bg-zinc-200"
                                        >
                                            Download SVG
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={printQrPack}
                                        className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white text-[12px] font-semibold text-zinc-800 transition hover:bg-zinc-50"
                                    >
                                        Print pack
                                    </button>
                                    <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-400">
                                        Place this on stationery or tables — scans are counted when a guest opens the code. Print pack includes one large + four place-card sizes.
                                    </p>
                                </div>
                            </div>

                            <EventPlanningChecklist
                                eventId={wedding.id}
                                details={wedding.details as Record<string, string | null>}
                            />

                            <EventBudgetTracker
                                eventId={wedding.id}
                                details={wedding.details as Record<string, string | null>}
                                occasion={wedding.event_type || wedding.occasion}
                                guestCount={guestCount}
                                eventDate={formatDate(wedding.wedding_date)}
                            />

                            {vendorsLocked ? (
                                <ManagePremiumGate
                                    title="Vendors are on paid plans"
                                    description="Keep vendor contacts and notes after your site pack is active."
                                    upgradeUrl={billingUpgradeUrl}
                                />
                            ) : (
                                <EventVendors
                                    eventId={wedding.id}
                                    details={wedding.details as Record<string, string | null>}
                                />
                            )}

                            {staysFromAccommodations(wedding.accommodations ?? []).some((stay) => stay.code) ? (
                                <section className="mt-5 overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05]">
                                    <div className="border-b border-zinc-100 px-5 py-4">
                                        <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                            Travel
                                        </p>
                                        <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950">
                                            Room block codes
                                        </h2>
                                    </div>
                                    <ul className="divide-y divide-zinc-100">
                                        {staysFromAccommodations(wedding.accommodations ?? [])
                                            .filter((stay) => stay.code)
                                            .map((stay) => (
                                                <li
                                                    key={stay.id}
                                                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                                                >
                                                    <div>
                                                        <p className="text-[14px] font-semibold text-zinc-950">
                                                            {stay.name}
                                                        </p>
                                                        <p className="font-mono text-[13px] text-emerald-800">
                                                            {stay.code}
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                    </ul>
                                    <div className="border-t border-zinc-100 px-5 py-3">
                                        <button
                                            type="button"
                                            onClick={printRoomBlocks}
                                            className="inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50"
                                        >
                                            Print room cards
                                        </button>
                                    </div>
                                </section>
                            ) : null}

                            {(owner?.gift_claims?.length ?? 0) > 0 ? (
                                <section className="mt-5 overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.05]">
                                    <div className="border-b border-zinc-100 px-5 py-4">
                                        <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                            Optional
                                        </p>
                                        <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950">
                                            Gift claims
                                        </h2>
                                        <p className="mt-1 text-[12px] text-zinc-500">
                                            Guests who noted a registry item
                                        </p>
                                    </div>
                                    <ul className="divide-y divide-zinc-100">
                                        {(owner?.gift_claims ?? []).map((claim) => (
                                            <li
                                                key={claim.id}
                                                className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-[14px] font-semibold text-zinc-950">
                                                        {claim.name}
                                                    </p>
                                                    <p className="mt-0.5 text-[12px] text-zinc-500">
                                                        {claim.gift_label || claim.gift_item_id}
                                                        {claim.status !== 'claimed' ? ` · ${claim.status}` : ''}
                                                    </p>
                                                    {claim.note ? (
                                                        <p className="mt-1.5 text-[13px] text-zinc-600">{claim.note}</p>
                                                    ) : null}
                                                </div>
                                                {claim.status === 'claimed' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.post(
                                                                `/events/${wedding.id}/gift-claims/${claim.id}/release`,
                                                                {},
                                                                { preserveScroll: true },
                                                            )
                                                        }
                                                        className="text-[12px] font-semibold text-zinc-500 hover:text-zinc-900"
                                                    >
                                                        Release
                                                    </button>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ) : null}
                        </aside>
                    </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}

function toneClass(tone: string): string {
    switch (tone) {
        case 'emerald':
            return 'text-emerald-700';
        case 'sky':
            return 'text-sky-700';
        case 'teal':
            return 'text-teal-700';
        case 'rose':
            return 'text-rose-700';
        case 'amber':
            return 'text-amber-700';
        case 'gold':
            return 'text-[#9a7b3c]';
        default:
            return 'text-zinc-950';
    }
}
