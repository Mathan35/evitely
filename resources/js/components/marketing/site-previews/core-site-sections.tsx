import { useForm } from '@inertiajs/react';
import { ChevronDown, ExternalLink, Play, Sparkles } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { usePreviewLive } from '@/components/marketing/site-previews/preview-live';
import { SiteSectionChrome } from '@/components/marketing/site-previews/site-section-chrome';
import {
    CORE_SITE_SECTION_KEYS,
    giftCheckoutHref,
    giftKindLabel,
    isCoreSiteSectionEnabled,
    sampleCoreSiteExtras,
    type CoreSiteExtrasContent,
    type CoreSiteSectionKey,
} from '@/lib/core-site-sections';
import { inviteActionPath } from '@/lib/invite-actions';
import { cn } from '@/lib/utils';

function SectionShell({
    id,
    eyebrow,
    title,
    desktop,
    children,
    className,
}: {
    id: string;
    eyebrow: string;
    title: string;
    desktop?: boolean;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            id={id}
            data-preview-reveal
            className={cn(
                'site-core-section preview-reveal relative px-5 py-14',
                desktop && 'px-10 py-16',
                className,
            )}
        >
            <SiteSectionChrome eyebrow={eyebrow} title={title} />
            <div className="relative mt-10">{children}</div>
        </section>
    );
}

function FaqBlock({ data, desktop }: { data: CoreSiteExtrasContent; desktop?: boolean }) {
    const [openId, setOpenId] = useState<string | null>(data.faq[0]?.id ?? null);

    return (
        <SectionShell id="gh-faq" eyebrow="Good to know" title="FAQ" desktop={desktop}>
            <div className={cn('mx-auto max-w-xl space-y-2.5', desktop && 'max-w-2xl')}>
                {data.faq.map((item) => {
                    const open = openId === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setOpenId(open ? null : item.id)}
                            className={cn('site-core-faq w-full text-left', open && 'is-open')}
                        >
                            <span className="flex items-start justify-between gap-3">
                                <p className="font-serif text-[1.15rem] font-light text-[var(--w-ink)]">{item.question}</p>
                                <ChevronDown
                                    className={cn(
                                        'mt-1 size-4 shrink-0 text-[var(--w-accent)] transition-transform duration-300',
                                        open && 'rotate-180',
                                    )}
                                />
                            </span>
                            <div
                                className={cn(
                                    'grid transition-[grid-template-rows] duration-300 ease-out',
                                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                                )}
                            >
                                <div className="overflow-hidden">
                                    <p className="mt-2 text-sm leading-6 text-[var(--w-muted)]">{item.answer}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </SectionShell>
    );
}

function AttireBlock({ data, desktop }: { data: CoreSiteExtrasContent; desktop?: boolean }) {
    return (
        <section
            id="gh-attire"
            data-preview-reveal
            className={cn('site-core-attire preview-reveal relative overflow-hidden px-5 py-16', desktop && 'px-10')}
        >
            <div className="site-core-attire__wash" aria-hidden />
            <div className="relative mx-auto max-w-2xl text-center">
                <SiteSectionChrome
                    eyebrow="Attire"
                    title={data.attireTitle}
                    subtitle={
                        <p className="max-w-lg font-serif text-[17px] leading-[1.85] font-light text-[var(--w-muted)]">
                            {data.attireBody}
                        </p>
                    }
                />
            </div>
        </section>
    );
}

function GiftsBlock({ data, desktop }: { data: CoreSiteExtrasContent; desktop?: boolean }) {
    const live = usePreviewLive();
    const [claimId, setClaimId] = useState<string | null>(null);
    const claimForm = useForm({
        gift_item_id: '',
        gift_label: '',
        name: live?.guestName || '',
        email: '',
        note: '',
    });
    const claimCounts = live?.giftClaimCounts ?? {};
    const canClaim = Boolean(data.giftsClaimsEnabled && live?.inviteSlug);

    function startClaim(gift: { id: string; label: string }): void {
        setClaimId(gift.id);
        claimForm.setData({
            gift_item_id: gift.id,
            gift_label: gift.label,
            name: live?.guestName || claimForm.data.name,
            email: claimForm.data.email,
            note: '',
        });
    }

    function submitClaim(event: FormEvent): void {
        event.preventDefault();
        if (!live?.inviteSlug) {
            return;
        }
        claimForm.post(
            inviteActionPath(
                { slug: live.inviteSlug, invite_root_domain: live.inviteRootDomain },
                'gift-claims',
            ),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setClaimId(null);
                    claimForm.reset('note', 'email');
                },
            },
        );
    }

    return (
        <SectionShell id="gh-gifts" eyebrow="With love" title="Gifts" desktop={desktop}>
            <p className="mx-auto max-w-md text-center text-sm leading-6 text-[var(--w-muted)]">{data.giftsIntro}</p>
            {data.gifts.length ? (
                <ul className={cn('mx-auto mt-8 max-w-md space-y-2.5', desktop && 'max-w-xl')}>
                    {data.gifts.map((gift) => {
                        const claimed = claimCounts[gift.id] ?? 0;
                        const href = giftCheckoutHref(gift);
                        const isUpi = gift.kind === 'upi' || gift.kind === 'cash';
                        return (
                            <li key={gift.id} className="space-y-2">
                                <a
                                    href={href}
                                    target={isUpi ? undefined : '_blank'}
                                    rel={isUpi ? undefined : 'noreferrer'}
                                    className="site-core-gift group flex items-center justify-between gap-3"
                                >
                                    <span>
                                        <span className="block text-[10px] font-semibold tracking-[0.14em] text-[var(--w-accent)] uppercase">
                                            {giftKindLabel(gift.kind)}
                                            {gift.amount ? ` · ₹${gift.amount}` : ''}
                                        </span>
                                        <span className="font-serif text-lg font-light text-[var(--w-ink)]">
                                            {gift.label}
                                        </span>
                                        {gift.note ? (
                                            <span className="mt-0.5 block text-[12px] text-[var(--w-muted)]">
                                                {gift.note}
                                            </span>
                                        ) : null}
                                    </span>
                                    <ExternalLink className="size-4 shrink-0 text-[var(--w-accent)] opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                                </a>
                                {canClaim ? (
                                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                                        <p className="text-[11px] text-[var(--w-muted)]">
                                            {claimed > 0
                                                ? `${claimed} guest${claimed === 1 ? '' : 's'} noted this gift`
                                                : 'Optional — tell hosts if you plan this gift'}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => startClaim(gift)}
                                            className="text-[12px] font-semibold text-[var(--w-accent)] underline-offset-2 hover:underline"
                                        >
                                            I&apos;ll get this
                                        </button>
                                    </div>
                                ) : null}
                                {claimId === gift.id ? (
                                    <form
                                        onSubmit={submitClaim}
                                        className="site-core-panel space-y-2.5 px-4 py-3.5"
                                    >
                                        <input
                                            required
                                            value={claimForm.data.name}
                                            onChange={(e) => claimForm.setData('name', e.target.value)}
                                            placeholder="Your name"
                                            className="h-10 w-full rounded-xl border border-[var(--w-ink)]/10 bg-white/80 px-3 text-sm"
                                        />
                                        <input
                                            type="email"
                                            value={claimForm.data.email}
                                            onChange={(e) => claimForm.setData('email', e.target.value)}
                                            placeholder="Email (optional)"
                                            className="h-10 w-full rounded-xl border border-[var(--w-ink)]/10 bg-white/80 px-3 text-sm"
                                        />
                                        <textarea
                                            value={claimForm.data.note}
                                            onChange={(e) => claimForm.setData('note', e.target.value)}
                                            placeholder="Short note (optional)"
                                            rows={2}
                                            className="w-full rounded-xl border border-[var(--w-ink)]/10 bg-white/80 px-3 py-2 text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={claimForm.processing}
                                                className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-[var(--w-accent)] px-3 text-[12px] font-semibold text-white disabled:opacity-60"
                                            >
                                                {claimForm.processing ? 'Sending…' : 'Send note'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setClaimId(null)}
                                                className="inline-flex h-9 items-center justify-center rounded-full px-3 text-[12px] font-semibold text-[var(--w-muted)]"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </SectionShell>
    );
}

function TravelBlock({ data, desktop }: { data: CoreSiteExtrasContent; desktop?: boolean }) {
    return (
        <SectionShell id="gh-travel-stays" eyebrow="Plan your trip" title="Travel & stays" desktop={desktop}>
            <div className={cn('mx-auto grid max-w-3xl gap-6', desktop && 'grid-cols-2')}>
                <div className="site-core-panel px-5 py-5">
                    <p className="text-[10px] tracking-[0.22em] text-[var(--w-accent)] uppercase">Getting there</p>
                    <p className="mt-3 text-sm leading-6 text-[var(--w-muted)]">{data.travelNotes}</p>
                </div>
                <div className="space-y-2.5">
                    {data.stays.map((stay) => (
                        <div key={stay.id} className="site-core-panel px-4 py-3.5">
                            <div className="flex items-start justify-between gap-2">
                                <p className="font-serif text-lg font-light text-[var(--w-ink)]">{stay.name}</p>
                            </div>
                            <p className="mt-1 text-sm text-[var(--w-muted)]">{stay.detail}</p>
                            {stay.code ? (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-semibold tracking-[0.16em] text-[var(--w-accent)] uppercase">
                                        Room block code
                                    </span>
                                    <button
                                        type="button"
                                        className="rounded-full bg-[var(--w-accent)]/12 px-2.5 py-1 font-mono text-[12px] font-semibold tracking-wide text-[var(--w-accent)]"
                                        onClick={() => void navigator.clipboard?.writeText(stay.code || '')}
                                        title="Copy room block code"
                                    >
                                        {stay.code}
                                    </button>
                                </div>
                            ) : null}
                            {stay.url ? (
                                <a
                                    href={stay.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--w-ink)] underline-offset-2 hover:underline"
                                >
                                    Book
                                    <ExternalLink className="size-3 opacity-60" />
                                </a>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </SectionShell>
    );
}

function ExploreBlock({ data, desktop }: { data: CoreSiteExtrasContent; desktop?: boolean }) {
    return (
        <SectionShell id="gh-explore" eyebrow="While you are here" title="Things to do" desktop={desktop}>
            <div
                className={cn(
                    'flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    desktop && 'grid grid-cols-3 overflow-visible',
                )}
            >
                {data.explore.map((item) => (
                    <article
                        key={item.id}
                        className={cn('site-core-panel min-w-[14rem] flex-1 px-4 py-4', desktop && 'min-w-0')}
                    >
                        <span className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--w-accent)]/12 text-[var(--w-accent)]">
                            <Sparkles className="size-4" />
                        </span>
                        <p className="mt-3 font-serif text-xl font-light text-[var(--w-ink)]">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--w-muted)]">{item.note}</p>
                    </article>
                ))}
            </div>
        </SectionShell>
    );
}

function LivestreamBlock({ data, desktop }: { data: CoreSiteExtrasContent; desktop?: boolean }) {
    return (
        <section id="gh-livestream" data-preview-reveal className={cn('preview-reveal relative px-5 py-14', desktop && 'px-10')}>
            <div className="site-core-stream relative mx-auto max-w-2xl overflow-hidden px-6 py-10 text-center text-white">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,200,140,0.22),transparent_55%)]" />
                <p className="relative text-[10px] tracking-[0.34em] text-white/55 uppercase">Remote guests</p>
                <h3 className="relative mt-3 font-serif text-3xl font-light sm:text-4xl">{data.livestreamLabel}</h3>
                <p className="relative mx-auto mt-4 max-w-md text-sm leading-6 text-white/65">{data.livestreamNote}</p>
                <a
                    href={data.livestreamUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#1c1714] transition hover:scale-[1.02]"
                >
                    <Play className="size-4 fill-current" />
                    Open stream
                </a>
            </div>
        </section>
    );
}

function LineupBlock({ data, desktop }: { data: CoreSiteExtrasContent; desktop?: boolean }) {
    return (
        <SectionShell id="gh-lineup" eyebrow="The people" title="Hosts & party" desktop={desktop}>
            <ul className={cn('mx-auto grid max-w-md gap-3', desktop && 'max-w-3xl grid-cols-3')}>
                {data.lineup.map((person) => (
                    <li key={person.id} className="site-core-panel px-4 py-5 text-center">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--w-accent)]/15 font-serif text-xl text-[var(--w-accent)] ring-1 ring-[var(--w-accent)]/20">
                            {person.name.trim().charAt(0) || '•'}
                        </span>
                        <p className="mt-3 font-serif text-xl font-light text-[var(--w-ink)]">{person.name}</p>
                        <p className="mt-1 text-[10px] tracking-[0.2em] text-[var(--w-accent)] uppercase">{person.role}</p>
                        {person.blurb ? <p className="mt-2 text-sm text-[var(--w-muted)]">{person.blurb}</p> : null}
                    </li>
                ))}
            </ul>
        </SectionShell>
    );
}

function WishesBlock({ data, desktop }: { data: CoreSiteExtrasContent; desktop?: boolean }) {
    const live = usePreviewLive();
    const sampleNotes = useMemo(
        () => [
            { id: 'sample-1', name: 'Aisha', message: 'So happy for you both — forever starts now.', photo_url: null },
            { id: 'sample-2', name: 'Marcus', message: 'Cannot wait to celebrate. Love you!', photo_url: null },
            { id: 'sample-3', name: 'Elena', message: 'May every day feel like this one.', photo_url: null },
        ],
        [],
    );
    const liveNotes = live?.guestbook ?? [];
    const notes = liveNotes.length > 0 ? liveNotes : sampleNotes;
    const showForm = Boolean(live?.allowGuestbook && live?.inviteSlug);
    const [sent, setSent] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const form = useForm({
        name: live?.guestName ?? '',
        message: '',
    });

    return (
        <SectionShell id="gh-wishes" eyebrow="From the heart" title="Wishes" desktop={desktop}>
            <p className="mx-auto max-w-md text-center text-sm leading-6 text-[var(--w-muted)]">{data.wishesIntro}</p>
            <div className={cn('mx-auto mt-8 grid max-w-md gap-3', desktop && 'max-w-3xl grid-cols-3')}>
                {notes.map((note, index) => (
                    <blockquote
                        key={note.id}
                        className="site-core-wish px-4 py-4"
                        style={{ animationDelay: `${index * 0.15}s` }}
                    >
                        {note.photo_url ? (
                            <img
                                src={note.photo_url}
                                alt=""
                                className="mb-3 h-28 w-full rounded-xl object-cover"
                            />
                        ) : null}
                        <p className="font-serif text-[15px] leading-6 font-light text-[var(--w-ink)]">
                            “{note.message}”
                        </p>
                        <footer className="mt-3 text-[11px] tracking-[0.16em] text-[var(--w-accent)] uppercase">
                            — {note.name}
                        </footer>
                    </blockquote>
                ))}
            </div>

            {showForm ? (
                <div className="mx-auto mt-10 max-w-md">
                    {sent ? (
                        <p className="rounded-2xl border border-[var(--w-accent)]/20 bg-[var(--w-surface)] px-4 py-4 text-center text-sm text-[var(--w-muted)]">
                            Thank you — your wish was sent and will appear after the hosts approve it.
                        </p>
                    ) : (
                        <form
                            className="space-y-3 rounded-2xl border border-[var(--w-accent)]/15 bg-[var(--w-surface)] px-4 py-4"
                            noValidate
                            onSubmit={(event: FormEvent) => {
                                event.preventDefault();
                                const name = form.data.name.trim();
                                const message = form.data.message.trim();
                                if (!name) {
                                    setLocalError('Please enter your name.');
                                    return;
                                }
                                if (!message) {
                                    setLocalError('Please write a short wish.');
                                    return;
                                }
                                setLocalError(null);
                                if (!live?.inviteSlug) {
                                    return;
                                }
                                form.post(
                                    inviteActionPath(
                                        {
                                            slug: live.inviteSlug,
                                            invite_root_domain: live.inviteRootDomain,
                                        },
                                        'guestbook',
                                    ),
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setSent(true);
                                            form.reset('message');
                                        },
                                    },
                                );
                            }}
                        >
                            <p className="text-center text-[11px] font-semibold tracking-[0.16em] text-[var(--w-accent)] uppercase">
                                Leave a wish
                            </p>
                            <input
                                value={form.data.name}
                                onChange={(event) => {
                                    form.setData('name', event.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder="Your name"
                                className="site-rsvp-input h-11 w-full rounded-xl border border-[var(--w-accent)]/20 bg-white/80 px-3 text-sm text-[var(--w-ink)] outline-none"
                                aria-invalid={localError?.includes('name') ? true : undefined}
                            />
                            <textarea
                                value={form.data.message}
                                onChange={(event) => {
                                    form.setData('message', event.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                rows={3}
                                placeholder="A short wish for the hosts"
                                className="site-rsvp-input w-full rounded-xl border border-[var(--w-accent)]/20 bg-white/80 px-3 py-2.5 text-sm text-[var(--w-ink)] outline-none"
                                aria-invalid={localError?.includes('wish') ? true : undefined}
                            />
                            {localError || form.errors.name || form.errors.message ? (
                                <p className="text-[12px] text-rose-600" role="alert">
                                    {localError || form.errors.name || form.errors.message}
                                </p>
                            ) : null}
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--w-accent)] px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
                            >
                                {form.processing ? 'Sending…' : 'Send wish'}
                            </button>
                        </form>
                    )}
                </div>
            ) : null}
        </SectionShell>
    );
}

const BLOCKS: Record<CoreSiteSectionKey, (props: { data: CoreSiteExtrasContent; desktop?: boolean }) => ReactNode> = {
    faq: FaqBlock,
    attire: AttireBlock,
    gifts: GiftsBlock,
    travel_stays: TravelBlock,
    explore: ExploreBlock,
    livestream: LivestreamBlock,
    lineup: LineupBlock,
    wishes: WishesBlock,
};

/**
 * Renders enabled Core 8 sections. Prefers props, otherwise PreviewLive context.
 */
export function CoreSiteSections({
    desktop,
    sections: sectionsProp,
    extras,
    occasion,
}: {
    desktop?: boolean;
    sections?: Record<string, boolean> | null;
    extras?: CoreSiteExtrasContent | null;
    occasion?: string | null;
}) {
    const live = usePreviewLive();
    const sections = sectionsProp ?? live?.sections;
    const data = extras ?? live?.coreExtras ?? sampleCoreSiteExtras(occasion);

    const enabled = CORE_SITE_SECTION_KEYS.filter((key) => {
        if (isCoreSiteSectionEnabled(sections, key)) {
            return true;
        }
        // Classic guestbook section → gallery wishes wall (parity when Core wishes is off).
        if (key === 'wishes' && live && sections?.guestbook !== false) {
            return Boolean(live.allowGuestbook) || (live.guestbook?.length ?? 0) > 0;
        }
        return false;
    });
    if (!enabled.length) {
        return null;
    }

    return (
        <>
            {enabled.map((key) => {
                const Block = BLOCKS[key];
                return <Block key={key} data={data} desktop={desktop} />;
            })}
        </>
    );
}
