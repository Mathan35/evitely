import { Link } from '@inertiajs/react';
import { Languages, Link2, MessageCircle, QrCode, Sparkles, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type HostEdgeBeat = {
    id: string;
    eyebrow: string;
    title: string;
    text: string;
    href: string;
    icon: LucideIcon;
    visual: ReactNode;
    featured?: boolean;
};

const BEATS: HostEdgeBeat[] = [
    {
        id: 'personal-links',
        eyebrow: 'Know who got it',
        title: 'Personal guest links',
        text: 'Every guest gets their own invite URL. Track opens and RSVPs by name — not a mystery group chat link.',
        href: '/events?create=1',
        icon: Link2,
        featured: true,
        visual: <PersonalLinksVisual />,
    },
    {
        id: 'bilingual',
        eyebrow: 'One invite, two languages',
        title: 'Bilingual guest sites',
        text: 'English + Spanish — or any pair you need. Guests switch language on the live page without a second design.',
        href: '/events?create=1',
        icon: Languages,
        visual: <BilingualVisual />,
    },
    {
        id: 'share-clarity',
        eyebrow: 'Your phone or ours',
        title: 'WhatsApp free · auto-send optional',
        text: 'Share from your phone for free. Or schedule Invidora to blast WhatsApp, SMS, and email when you go live.',
        href: '/#pricing',
        icon: MessageCircle,
        visual: <ShareClarityVisual />,
    },
    {
        id: 'trial-publish',
        eyebrow: 'Publish with confidence',
        title: 'Cards free · site trial 30 days',
        text: 'Invitation cards stay free forever. Publish a guest website and try it live for 30 days — extend only if you need more time.',
        href: '/#pricing',
        icon: Sparkles,
        visual: <TrialVisual />,
    },
    {
        id: 'day-of',
        eyebrow: 'When the day arrives',
        title: 'QR print pack & seating',
        text: 'Print table QR codes and build seating charts so guests find their place without a scavenger hunt.',
        href: '/events?create=1',
        icon: QrCode,
        visual: <DayOfVisual />,
    },
];

/** Highest-impression host hooks — personal links, bilingual, share clarity, trial, day-of. */
export function HomeHostEdge({ startHref }: { startHref: string }) {
    const featured = BEATS.find((beat) => beat.featured) ?? BEATS[0];
    const rest = BEATS.filter((beat) => beat.id !== featured.id);

    return (
        <section id="host-edge" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20" aria-labelledby="host-edge-heading">
            <div className="max-w-2xl">
                <p className="text-xs tracking-[0.22em] text-[#8a7d6e] uppercase">Why hosts choose Invidora</p>
                <h2 id="host-edge-heading" className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
                    The details that settle nerves
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#5e554c] sm:text-base">
                    Not another pretty template list — the hosting truths guests never see, and you lose sleep over.
                </p>
            </div>

            <article className="mt-10 overflow-hidden rounded-[1.75rem] bg-[#241c16] text-[#f6f1e8] shadow-[0_40px_80px_-48px_rgba(36,28,22,0.85)]">
                <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-[#c6a36a] uppercase">
                            {featured.eyebrow}
                        </p>
                        <h3 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">{featured.title}</h3>
                        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/70">{featured.text}</p>
                        <Link
                            href={startHref}
                            className="mt-6 inline-flex h-11 w-fit items-center justify-center rounded-full bg-[#c6a36a] px-5 text-sm font-semibold text-[#241c16] transition hover:bg-[#d4b57a]"
                        >
                            Start with personal links
                        </Link>
                    </div>
                    <div className="relative min-h-[220px] border-t border-white/10 bg-[radial-gradient(420px_220px_at_70%_20%,rgba(198,163,106,0.28),transparent_60%)] lg:border-t-0 lg:border-l lg:border-white/10">
                        <div className="flex h-full items-center justify-center p-6 sm:p-8">{featured.visual}</div>
                    </div>
                </div>
            </article>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                {rest.map((beat) => (
                    <HostEdgeCard key={beat.id} beat={beat} />
                ))}
            </div>
        </section>
    );
}

function HostEdgeCard({ beat }: { beat: HostEdgeBeat }) {
    const Icon = beat.icon;

    return (
        <Link
            id={beat.id}
            href={beat.href}
            className="group grid scroll-mt-24 gap-4 overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-[#241c16]/6 transition hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[1fr_0.9fr]"
        >
            <div className="flex flex-col justify-center p-5 sm:p-6">
                <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-[#f6f1e8] text-[#241c16] ring-1 ring-[#241c16]/6 transition group-hover:bg-[#241c16] group-hover:text-[#f6f1e8]">
                    <Icon className="size-4" />
                </span>
                <p className="mt-4 text-[11px] font-semibold tracking-[0.16em] text-[#8a7d6e] uppercase">
                    {beat.eyebrow}
                </p>
                <h3 className="mt-1.5 font-serif text-2xl tracking-tight text-[#241c16]">{beat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5e554c]">{beat.text}</p>
            </div>
            <div className="flex min-h-[160px] items-center justify-center bg-[#f6f1e8]/80 p-5 sm:min-h-0">
                {beat.visual}
            </div>
        </Link>
    );
}

function PersonalLinksVisual() {
    const rows = [
        { name: 'Maya Chen', state: 'Opened · RSVP yes', tone: 'ok' as const },
        { name: 'Jordan Lee', state: 'Sent · waiting', tone: 'wait' as const },
        { name: 'Sofia Rossi', state: 'Opened · maybe', tone: 'mid' as const },
    ];

    return (
        <div className="w-full max-w-[280px] space-y-2">
            {rows.map((row) => (
                <div
                    key={row.name}
                    className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10 backdrop-blur-sm"
                >
                    <span className="grid size-8 place-items-center rounded-full bg-[#c6a36a]/25 text-[11px] font-semibold text-[#f6f1e8]">
                        {row.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[#f6f1e8]">{row.name}</span>
                        <span
                            className={cn(
                                'block truncate text-[11px]',
                                row.tone === 'ok'
                                    ? 'text-emerald-300/90'
                                    : row.tone === 'mid'
                                      ? 'text-amber-200/90'
                                      : 'text-white/55',
                            )}
                        >
                            {row.state}
                        </span>
                    </span>
                    <Link2 className="size-3.5 shrink-0 text-[#c6a36a]" />
                </div>
            ))}
        </div>
    );
}

function BilingualVisual() {
    return (
        <div className="w-full max-w-[240px] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#241c16]/8">
            <div className="flex border-b border-[#241c16]/8 p-1.5">
                <span className="flex-1 rounded-xl bg-[#241c16] px-3 py-1.5 text-center text-[11px] font-semibold text-[#f6f1e8]">
                    English
                </span>
                <span className="flex-1 rounded-xl px-3 py-1.5 text-center text-[11px] font-semibold text-[#5e554c]">
                    Español
                </span>
            </div>
            <div className="space-y-2 p-4">
                <p className="font-serif text-lg leading-tight text-[#241c16]">Elena & Marcus</p>
                <p className="text-[12px] leading-relaxed text-[#5e554c]">
                    Together with their families · 12 Sep · Lisbon
                </p>
                <div className="h-8 rounded-full bg-[#241c16]/90 text-center text-[11px] leading-8 font-semibold text-white">
                    RSVP
                </div>
            </div>
        </div>
    );
}

function ShareClarityVisual() {
    return (
        <div className="grid w-full max-w-[250px] gap-2">
            <div className="rounded-2xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-[#241c16]/8">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8a7d6e] uppercase">From your phone</p>
                <p className="mt-1 text-[13px] font-semibold text-[#241c16]">WhatsApp · free</p>
                <p className="mt-0.5 text-[11px] text-[#5e554c]">You tap send. Credits stay at zero.</p>
            </div>
            <div className="rounded-2xl bg-[#241c16] px-3.5 py-3 text-[#f6f1e8] shadow-sm">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-[#c6a36a] uppercase">Optional</p>
                <p className="mt-1 text-[13px] font-semibold">Auto-share at go-live</p>
                <p className="mt-0.5 text-[11px] text-white/65">Invidora blasts the list for you.</p>
            </div>
        </div>
    );
}

function TrialVisual() {
    return (
        <div className="w-full max-w-[230px] rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#241c16]/8">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8a7d6e] uppercase">Guest site</p>
            <p className="mt-2 font-serif text-3xl tracking-tight text-[#241c16]">30</p>
            <p className="text-[13px] font-semibold text-[#241c16]">free days on publish</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#efe6d8]">
                <div className="h-full w-2/5 rounded-full bg-[#c6a36a]" />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#5e554c]">Cards stay free forever — no clock on those.</p>
        </div>
    );
}

function DayOfVisual() {
    return (
        <div className="flex w-full max-w-[250px] items-center gap-3">
            <div className="grid size-[4.5rem] place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-[#241c16]/8">
                <div className="grid grid-cols-3 gap-0.5">
                    {Array.from({ length: 9 }).map((_, index) => (
                        <span
                            key={index}
                            className={cn(
                                'size-2 rounded-[1px] bg-[#241c16]',
                                index === 4 && 'bg-transparent',
                            )}
                        />
                    ))}
                </div>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
                <div className="rounded-xl bg-white px-2.5 py-2 shadow-sm ring-1 ring-[#241c16]/8">
                    <p className="text-[11px] font-semibold text-[#241c16]">Table 4 · Rose</p>
                    <p className="text-[10px] text-[#5e554c]">Scan for seat map</p>
                </div>
                <div className="rounded-xl bg-white px-2.5 py-2 shadow-sm ring-1 ring-[#241c16]/8">
                    <p className="text-[11px] font-semibold text-[#241c16]">12 seated</p>
                    <p className="text-[10px] text-[#5e554c]">Place cards ready</p>
                </div>
            </div>
        </div>
    );
}
