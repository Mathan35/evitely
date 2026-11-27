import { Head, Link, usePage } from '@inertiajs/react';
import { Check, Globe, LayoutGrid, Mail, Plus } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CardPreview } from '@/components/marketing/gallery-previews';
import { HomeAppInstall } from '@/components/marketing/home-app-install';
import { HomeHostEdge } from '@/components/marketing/home-host-edge';
import { HomeSiteStrip, type HomeSiteDesign } from '@/components/marketing/home-site-strip';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';
import { SiteFooter } from '@/components/marketing/site-footer';
import { OccasionIcon, OccasionMark } from '@/components/marketing/occasion-icon';
import { register } from '@/routes';
import type { Auth } from '@/types';
import type { GalleryDesign } from '@/types/gallery';

const filters = ['All Events', 'Weddings', 'Birthdays', 'Corporate', 'Baby Showers', 'Parties', 'Graduations', 'Bridals', 'Housewarming', 'Custom'] as const;
type Filter = (typeof filters)[number];

type OccasionHero = {
    headline: string;
    sub: string;
    href: string;
    moreHref: string;
    galleryName: string;
    linksLabel: string;
    cardsLabel: string;
    phones: string;
    envelopes: string;
    phonesAlt: string;
    envelopesAlt: string;
    step: string;
};

const occasionHeroes: Record<Filter, OccasionHero> = {
    'All Events': {
        headline: 'Send Elegant Digital Cards or Build Full Event Websites',
        sub: 'Cards free forever · guest site free for 30 days. Personal links, bilingual pages, and WhatsApp share — publish when you are ready.',
        href: '/designs',
        moreHref: '/designs',
        galleryName: 'all event',
        linksLabel: '1. Event websites',
        cardsLabel: '2. Classic digital cards & envelopes',
        phones: '/images/home/occasions/all-phones.jpg',
        envelopes: '/images/home/occasions/all-envelopes.jpg',
        phonesAlt: 'Wedding countdown, birthday itinerary, and corporate guest wall on three phones',
        envelopesAlt: 'Wedding, birthday, and corporate envelope suites',
        step: 'Select between an interactive web link or a classic digital envelope and card template.',
    },
    Weddings: {
        headline: 'Send Elegant Wedding Cards or Build Full Wedding Websites',
        sub: 'Cards free forever · guest site free for 30 days. Personal guest links, bilingual invites, maps, and WhatsApp — ready in minutes.',
        href: '/designs/wedding',
        moreHref: '/designs/wedding',
        galleryName: 'wedding',
        linksLabel: '1. Event websites',
        cardsLabel: '2. Classic digital cards & envelopes',
        phones: '/images/wedding/hero-phones.jpg',
        envelopes: '/images/wedding/hero-envelopes.jpg',
        phonesAlt: 'Sophia and Daniel countdown, wedding itinerary and map, and registry with guest wall',
        envelopesAlt: 'Ethereal Floral, Modern Minimalist Luxe, and Black Tie Gala envelopes',
        step: 'Select between an interactive web link or a classic digital envelope and card template.',
    },
    Birthdays: {
        headline: 'Send Playful Birthday Cards or Build Party Websites',
        sub: 'Craft birthday cards, live RSVPs, playlists, and photo walls—then share one link that feels like the night.',
        href: '/designs/birthday',
        moreHref: '/designs/birthday',
        galleryName: 'birthday',
        linksLabel: '1. Event websites',
        cardsLabel: '2. Classic birthday cards & envelopes',
        phones: '/images/home/occasions/birthday-phones.jpg',
        envelopes: '/images/home/occasions/birthday-envelopes.jpg',
        phonesAlt: 'Leo’s 30th countdown, rooftop itinerary, and photo wall with song requests',
        envelopesAlt: 'Blush balloon, navy party, and gold birthday envelope suites',
        step: 'Choose a cinematic birthday card, a multi-page party link, or both.',
    },
    Corporate: {
        headline: 'Send Polished Corporate Cards or Build Event Portals',
        sub: 'Invite leadership, track attendance, publish the agenda, and host speakers—one branded link for the whole summit.',
        href: '/designs/corporate',
        moreHref: '/designs/corporate',
        galleryName: 'corporate',
        linksLabel: '1. Event websites',
        cardsLabel: '2. Classic corporate cards & envelopes',
        phones: '/images/home/occasions/corporate-phones.jpg',
        envelopes: '/images/home/occasions/corporate-envelopes.jpg',
        phonesAlt: 'Leadership summit countdown, agenda with venue map, and speaker wall',
        envelopesAlt: 'Charcoal deco, cream board dinner, and navy gala envelopes',
        step: 'Choose a foil corporate card, a branded attendee portal, or both.',
    },
    'Baby Showers': {
        headline: 'Send Sweet Shower Cards or Build Baby Websites',
        sub: 'Share the date, the registry, and a memory wall—so guests arrive already part of the story.',
        href: '/designs/baby-shower',
        moreHref: '/designs/baby-shower',
        galleryName: 'baby shower',
        linksLabel: '1. Event websites',
        cardsLabel: '2. Classic shower cards & envelopes',
        phones: '/images/home/occasions/baby-phones.jpg',
        envelopes: '/images/home/occasions/baby-envelopes.jpg',
        phonesAlt: 'Baby Maya countdown, brunch itinerary, and gift registry with memory wall',
        envelopesAlt: 'Powder blue, blush floral, and sage baby shower envelopes',
        step: 'Choose a folded shower card, a registry website, or both.',
    },
    Parties: {
        headline: 'Send Stylish Party Cards or Build Celebration Pages',
        sub: 'Set the dress code, the hour, the playlist, and the guest list—then watch replies roll in.',
        href: '/designs/party',
        moreHref: '/designs/party',
        galleryName: 'party',
        linksLabel: '1. Event websites',
        cardsLabel: '2. Classic party cards & envelopes',
        phones: '/images/home/occasions/party-phones.jpg',
        envelopes: '/images/home/occasions/party-envelopes.jpg',
        phonesAlt: 'Midnight Gold countdown, loft itinerary, and guest wall with jukebox',
        envelopesAlt: 'Emerald, black, and burgundy party envelope suites',
        step: 'Choose a foil party card, an after-dark website, or both.',
    },
    Graduations: {
        headline: 'Send Proud Graduation Cards or Build Ceremony Sites',
        sub: 'Share the procession, the lunch, and a wall of portraits—so family never miss the hour.',
        href: '/designs/graduation',
        moreHref: '/designs/graduation',
        galleryName: 'graduation',
        linksLabel: '1. Event websites',
        cardsLabel: '2. Classic graduation cards & envelopes',
        phones: '/images/home/occasions/graduation-phones.jpg',
        envelopes: '/images/home/occasions/graduation-envelopes.jpg',
        phonesAlt: 'Class of 2026 countdown, ceremony itinerary with campus map, and memory wall',
        envelopesAlt: 'Navy, maroon, and black graduation envelope suites',
        step: 'Choose a gold-foil graduate card, a ceremony website, or both.',
    },
    Bridals: {
        headline: 'Send Elegant Bridal Cards or Build Shower Websites',
        sub: 'Mehendi, brunch, and the registry on one link—plus cards guests keep on their phones.',
        href: '/designs/bridal-shower',
        moreHref: '/designs/bridal-shower',
        galleryName: 'bridal',
        linksLabel: '1. Event websites',
        cardsLabel: '2. Classic bridal cards & envelopes',
        phones: '/images/home/occasions/bridal-phones.jpg',
        envelopes: '/images/home/occasions/bridal-envelopes.jpg',
        phonesAlt: 'Priya’s bridal countdown, mehendi itinerary, and registry with memory wall',
        envelopesAlt: 'Blush brunch, ivory mehendi, and dusty rose bridal envelopes',
        step: 'Choose a bridal card, a shower website with registry, or both.',
    },
    Housewarming: {
        headline: 'Send Warm Housewarming Cards or Build Home Websites',
        sub: 'Share the new address, the tour hour, and a kitchen fund—so guests find the door and the table.',
        href: '/designs/housewarming',
        moreHref: '/designs/housewarming',
        galleryName: 'housewarming',
        linksLabel: '1. Event websites',
        cardsLabel: '2. Classic housewarming cards & envelopes',
        phones: '/images/home/occasions/housewarming-phones.jpg',
        envelopes: '/images/home/occasions/housewarming-envelopes.jpg',
        phonesAlt: 'New home countdown, open-house itinerary with map, and housewarming registry',
        envelopesAlt: 'Terracotta, sage botanical, and cream welcome-home envelopes',
        step: 'Choose a botanical house card, a map-and-registry website, or both.',
    },
    Custom: {
        headline: 'Send Custom Event Cards or Build Your Own Website',
        sub: 'Name the celebration, pick the modules, and send a card, a link, or both—without a bride-and-groom template.',
        href: '/designs/custom',
        moreHref: '/designs/custom',
        galleryName: 'custom',
        linksLabel: '1. Event websites',
        cardsLabel: '2. Classic custom cards & envelopes',
        phones: '/images/home/occasions/custom-phones.jpg',
        envelopes: '/images/home/occasions/custom-envelopes.jpg',
        phonesAlt: 'Custom celebration countdown, timeline with map, and guest modules',
        envelopesAlt: 'Ochre, slate monogram, and forest green custom envelopes',
        step: 'Start with a blank celebration, then add a card, a website, or both.',
    },
};

type HomeDesign = HomeSiteDesign & {
    card?: GalleryDesign;
};

type HomeSample = {
    eyebrow: string;
    title: string;
    text: string;
    href: string;
    cta: string;
    image: string;
    image_alt: string;
    card?: GalleryDesign;
};

type HomeDayPack = {
    id: string;
    name: string;
    tagline?: string;
    days: number;
    price: string;
    per_day?: string | null;
    credits: number;
    popular?: boolean;
};

type HomeCreditOption = {
    id: string;
    name: string;
    credits: number;
    price: string;
    note?: string;
};

type HomePrice = {
    name: string;
    tagline?: string;
    price: string;
    period?: string;
    note?: string;
    points: string[];
    includes_label?: string;
    badge?: string;
    highlight?: boolean;
    cta?: string;
    day_packs?: HomeDayPack[];
    credit_options?: HomeCreditOption[];
    custom?: {
        label: string;
        tagline?: string;
        range: string;
        per_day?: string | null;
    };
};

type HomeFaq = { q: string; a: string };

type HomeFlagship = {
    id: string;
    title: string;
    blurb: string;
    occasion: string;
    href: string;
    image: string;
};

type HomePayload = {
    designs: HomeDesign[];
    samples: HomeSample[];
    flagships?: HomeFlagship[];
    pricing: HomePrice[];
    faqs: HomeFaq[];
};

export default function Welcome({
    canRegister = true,
    home,
    seo,
}: {
    canRegister?: boolean;
    home?: HomePayload;
    seo?: MarketingSeoPayload;
}) {
    const [filter, setFilter] = useState<Filter>('Weddings');
    const [direction, setDirection] = useState<1 | -1>(1);
    const [demo, setDemo] = useState(false);
    const { auth } = usePage<{ auth: Auth }>().props;
    const signedIn = Boolean(auth?.user);
    const start = signedIn ? '/events?create=1' : canRegister ? register() : '/login';
    const startHref = signedIn ? '/events?create=1' : canRegister ? '/register' : '/login';
    const occasion = occasionHeroes[filter];
    const designs = home?.designs ?? [];
    const samples = home?.samples ?? [];
    const flagships = home?.flagships ?? [];
    const pricing = home?.pricing ?? [];
    const faqs = home?.faqs ?? [];
    const sampleInviteHref = samples[0]?.href ?? flagships[0]?.href ?? '/designs/wedding';

    return (
        <>
            {seo ? <MarketingSeoHead seo={seo} /> : (
                <Head title="Beautiful digital invitations">
                    <meta
                        name="description"
                        content="Free digital invitation cards forever. Guest websites free for 30 days. Personal guest links, bilingual pages, WhatsApp share, RSVPs — start in minutes."
                    />
                </Head>
            )}
            <div className="min-h-screen bg-background text-foreground">
                <MarketingHeader />

                <main>
                    <section className="mx-auto max-w-6xl px-5 pt-14 text-center">
                        <div className="mb-5 flex justify-center">
                            <OccasionMark slug={filter} size="lg" />
                        </div>
                        <AnimatedHeadline text={occasion.headline} swapKey={filter} />
                        <span key={`${filter}-rule`} className="occasion-rule mx-auto mt-5 block h-px w-24 bg-[#c6a36a]" />
                        <p key={`${filter}-sub`} className="occasion-sub mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#5e554c] sm:text-base">
                            {occasion.sub}
                        </p>
                        <p className="mx-auto mt-4 max-w-xl text-[12px] leading-relaxed text-[#8a7d6e] sm:text-[13px]">
                            Cards free forever · guest website free for 30 days on publish · personal WhatsApp share always free
                        </p>
                        <div className="mt-7 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Occasions">
                            {filters.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    role="tab"
                                    aria-selected={filter === item}
                                    onClick={() => {
                                        if (item === filter) {
                                            return;
                                        }
                                        setDirection(filters.indexOf(item) >= filters.indexOf(filter) ? 1 : -1);
                                        setFilter(item);
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-all duration-300 ease-out ${filter === item ? 'scale-[1.04] bg-[#241c16] text-[#f6f1e8] shadow-md' : 'bg-white text-[#241c16] shadow-sm hover:bg-[#fbf8f3]'}`}
                                >
                                    <OccasionIcon slug={item} className="h-3.5 w-3.5 shrink-0" />
                                    {item}
                                </button>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-center">
                            <Link
                                href={occasion.moreHref}
                                className="inline-flex items-center gap-2 rounded-full border border-[#c6a36a]/50 bg-white px-5 py-2.5 text-sm shadow-sm transition hover:border-[#c6a36a] hover:bg-[#fbf8f3]"
                            >
                                <LayoutGrid className="h-4 w-4 text-[#c6a36a]" aria-hidden />
                                {filter === 'All Events' ? 'Explore all designs' : `Explore ${occasion.galleryName} designs`}
                            </Link>
                        </div>
                        <EventTypeHero occasion={occasion} direction={direction} />
                    </section>

                    <section className="mx-auto max-w-6xl px-5 py-20">
                        <p className="text-center text-xs tracking-[0.22em] text-[#8a7d6e] uppercase">How it works</p>
                        <h2 className="mt-3 text-center font-serif text-4xl sm:text-5xl">Crafting Memories is Effortless</h2>
                        <ol className="mt-10 grid gap-4 lg:grid-cols-3">
                            <Step title="1. Choose Your Format" text={occasion.step} swapKey={filter} />
                            <Step title="2. Make It Unique" text="Customize text, images, music, and colors — add a second language if families need it." />
                            <Step title="3. Invite & Track" text="Send each guest a personal link on WhatsApp or SMS, or let Invidora auto-share at go-live. Watch opens and RSVPs by name." />
                        </ol>
                    </section>

                    {designs.length > 0 && <HomeSiteStrip designs={designs} />}

                    <HomeAppInstall />

                    {samples.length > 0 && <SampleInvites samples={samples} />}

                    {flagships.length > 0 ? (
                        <section className="mx-auto max-w-6xl px-5 pb-16">
                            <p className="text-center text-xs tracking-[0.22em] text-[#8a7d6e] uppercase">
                                Flagship demos
                            </p>
                            <h2 className="mt-3 text-center font-serif text-4xl sm:text-5xl">
                                Open a real guest invite
                            </h2>
                            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-[#5e554c]">
                                Mobile-perfect samples — the same polish your guests will feel.
                            </p>
                            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {flagships.slice(0, 5).map((item) => (
                                    <li key={item.id}>
                                        <Link
                                            href={item.href}
                                            className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-[#241c16]/8 transition hover:-translate-y-0.5 hover:shadow-md"
                                        >
                                            <div className="aspect-[16/10] overflow-hidden bg-[#f3eee6]">
                                                <img
                                                    src={item.image}
                                                    alt=""
                                                    className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="flex flex-1 flex-col p-4">
                                                <p className="text-[10px] font-semibold tracking-[0.16em] text-[#8a7d6e] uppercase">
                                                    {item.occasion}
                                                </p>
                                                <h3 className="mt-1 font-serif text-xl text-[#241c16]">{item.title}</h3>
                                                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-[#5e554c]">
                                                    {item.blurb}
                                                </p>
                                                <span className="mt-3 text-[12px] font-semibold text-[#241c16] underline-offset-2 group-hover:underline">
                                                    Open demo →
                                                </span>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    <HomeHostEdge startHref={startHref} />

                    <section id="planning" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20">
                        <p className="text-center text-xs tracking-[0.22em] text-[#8a7d6e] uppercase">Also in the studio</p>
                        <h2 className="mt-3 text-center font-serif text-4xl sm:text-5xl">Design, day plan, guest delight</h2>
                        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-[#5e554c]">
                            The host-edge tools above settle nerves. These finish the invitation.
                        </p>
                        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <SuiteCard id="designs" href="/designs" title="Design Galleries" text="Browse occasion-ready website and card designs, then customize every detail." visual={<Shot src="/images/home/ui-timeline.jpg" alt="Design gallery previews" />} />
                            <SuiteCard id="timeline" href="/designs/weddings" title="Schedule & Venue" text="Publish ceremony, reception, and day-of timing with maps guests can open." visual={<Shot src="/images/home/ui-timeline.jpg" alt="Event timeline with map pins" />} />
                            <SuiteCard id="rsvp" href="/events?create=1" title="RSVP inbox" text="Live replies with party size, meals, and notes — export CSV for catering." visual={<Shot src="/images/home/ui-rsvp.jpg" alt="RSVP counts and guest list" />} />
                            <SuiteCard id="wall" href="/events?create=1" title="Guest Wishes Wall" text="Collect messages on your invite; approve them before they go live." visual={<Shot src="/images/home/ui-wall.jpg" alt="Guest messages on the wall" />} />
                            <SuiteCard id="registry" href="/designs" title="Gifts, UPI & registry" text="Share gift preferences, UPI, or registry links right on your event website." visual={<Shot src="/images/home/ui-registry.jpg" alt="Gift registry cards" />} />
                            <SuiteCard id="analytics" href="/analytics" title="Invite Analytics" text="See views, shares, and replies so you know who opened and who responded." visual={<Shot src="/images/home/ui-cohost.jpg" alt="Analytics overview" />} />
                        </div>
                    </section>

                    <section id="formats" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20">
                        <h2 className="text-center font-serif text-4xl sm:text-5xl">Digital Card vs. Event Website</h2>
                        <p className="mt-3 text-center text-sm text-[#5e554c]">Which format is right for you?</p>
                        <div className="mt-8 grid gap-4 lg:grid-cols-2">
                            <FormatCard
                                title="Animated Digital Cards"
                                points={['Featuring wax seals', 'Unfolding, cinematic', 'Single page, SMS distribution']}
                                visual={<WaxSealPreview />}
                            />
                            <FormatCard
                                title="Interactive Event Websites"
                                points={[
                                    'Personal guest links & live RSVP',
                                    'Bilingual pages · maps · schedule',
                                    'Photo wall, music, QR & seating',
                                ]}
                                visual={<WebsitePreview />}
                            />
                        </div>
                    </section>

                    <section className="mx-auto grid max-w-6xl items-start gap-12 px-5 pb-16 lg:grid-cols-2">
                        <div id="guest-experiences">
                            <p className="text-center text-xs tracking-[0.22em] text-[#8a7d6e] uppercase">Real-time guest experiences</p>
                            <h2 className="mt-3 text-center font-serif text-4xl leading-tight">Delight Your Guests Before They Arrive</h2>
                            <div className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-4 sm:gap-6">
                                <PictureLink href={sampleInviteHref} src="/images/home/phone-jukebox.jpg" alt="Music jukebox on a phone" label="Music Jukebox" caption="Guests request songs for the playlist. Music plays on the invite." />
                                <PictureLink href={sampleInviteHref} src="/images/home/phone-photos.jpg" alt="Interactive photo wall on a phone" label="Interactive Photo Wall" caption="A shared album guests open, and add to, before the day." />
                            </div>
                        </div>
                        <div>
                            <p className="text-center text-xs tracking-[0.22em] text-[#8a7d6e] uppercase">Hosts and guests</p>
                            <h2 className="mt-3 text-center font-serif text-4xl leading-tight">Loved by Hosts and Guests</h2>
                            <div className="mt-6 grid gap-4">
                                <Quote name="Sam Morrison" role="Wedding host" photo="/images/home/avatar-sam.jpg" text="One link carried the week of events. Guests replied without creating an account." />
                                <Quote name="Elena Takan" role="Birthday host" photo="/images/home/avatar-elena.jpg" text="The card went out on WhatsApp, and the page showed the hour, the house, and who was coming." />
                            </div>
                        </div>
                    </section>

                    {(pricing.length > 0 || faqs.length > 0) && (
                        <PricingAndFaq pricing={pricing} faqs={faqs} start={start} signedIn={signedIn} />
                    )}

                    <section className="w-full">
                        <Masterpiece start={start} onDemo={() => setDemo(true)} />
                    </section>
                </main>

                <SiteFooter />
            </div>
            {demo && <Demo onClose={() => setDemo(false)} start={start} />}
        </>
    );
}

function AnimatedHeadline({ text, swapKey }: { text: string; swapKey: string }) {
    const words = text.trim().split(/\s+/);

    return (
        <h1
            key={swapKey}
            className="occasion-sub mx-auto max-w-3xl text-balance font-serif text-[2rem] leading-[1.12] sm:text-5xl sm:leading-[1.08] md:text-6xl"
        >
            {words.map((word, index) => (
                <span key={`${swapKey}-${index}-${word}`} className="inline">
                    <span className="occasion-word inline-block" style={{ animationDelay: `${index * 38}ms` }}>
                        {word}
                    </span>
                    {index < words.length - 1 ? ' ' : null}
                </span>
            ))}
        </h1>
    );
}

function CrossfadeImage({ src, alt, direction }: { src: string; alt: string; direction: 1 | -1 }) {
    const [front, setFront] = useState({ src, alt });
    const [back, setBack] = useState<{ src: string; alt: string } | null>(null);

    useEffect(() => {
        if (src === front.src) {
            return;
        }

        setBack(front);
        setFront({ src, alt });
        const timer = window.setTimeout(() => setBack(null), 480);
        return () => window.clearTimeout(timer);
    }, [alt, front.src, src]);

    const enter = direction === 1 ? 'occasion-in-right' : 'occasion-in-left';

    return (
        <span className="relative block overflow-hidden">
            {back && (
                <img src={back.src} alt="" className="occasion-out absolute inset-0 h-full w-full object-cover" />
            )}
            <img src={front.src} alt={front.alt} className={`relative w-full ${enter}`} />
        </span>
    );
}

function EventTypeHero({ occasion, direction }: { occasion: OccasionHero; direction: 1 | -1 }) {
    const linksHref = occasion.moreHref === '/designs' ? '/designs' : `${occasion.moreHref}?tab=links`;
    const cardsHref = occasion.moreHref === '/designs' ? '/designs' : `${occasion.moreHref}?tab=cards`;

    return (
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
            <div>
                <p key={`${occasion.linksLabel}-l`} className="occasion-label inline-flex w-full items-center justify-center gap-2 text-center text-[11px] tracking-[0.16em] text-[#8a7d6e] uppercase">
                    <Globe className="h-3.5 w-3.5 text-[#c6a36a]" aria-hidden />
                    {occasion.linksLabel}
                </p>
                <Link href={linksHref} className="mt-4 block">
                    <CrossfadeImage src={occasion.phones} alt={occasion.phonesAlt} direction={direction === 1 ? -1 : 1} />
                </Link>
            </div>
            <div>
                <p key={`${occasion.cardsLabel}-c`} className="occasion-label inline-flex w-full items-center justify-center gap-2 text-center text-[11px] tracking-[0.16em] text-[#8a7d6e] uppercase" style={{ animationDelay: '80ms' }}>
                    <Mail className="h-3.5 w-3.5 text-[#c6a36a]" aria-hidden />
                    {occasion.cardsLabel}
                </p>
                <Link href={cardsHref} className="mt-4 block">
                    <CrossfadeImage src={occasion.envelopes} alt={occasion.envelopesAlt} direction={direction} />
                </Link>
            </div>
        </div>
    );
}

function Step({ title, text, visual, swapKey }: { title: string; text: string; visual?: ReactNode; swapKey?: string }) {
    return (
        <li className="rounded-3xl bg-white p-5 text-left shadow-sm">
            {visual && <div className="mb-4 h-40 overflow-hidden rounded-2xl bg-[#f6f1e8]">{visual}</div>}
            <h3 className="font-medium">{title}</h3>
            <p key={swapKey} className="occasion-sub mt-2 text-sm leading-6 text-[#5e554c]">{text}</p>
        </li>
    );
}

function FormatCard({ title, points, visual }: { title: string; points: string[]; visual: ReactNode }) {
    return (
        <article className="grid items-center gap-4 rounded-[28px] bg-white p-5 shadow-sm sm:grid-cols-[1.1fr_0.9fr]">
            <div>
                <h3 className="font-medium">{title}</h3>
                <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[#5e554c]">
                    {points.map((point) => (
                        <li key={point} className="flex gap-2">
                            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#c6a36a]" />
                            {point}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="overflow-hidden rounded-2xl bg-[#f6f1e8]">{visual}</div>
        </article>
    );
}

function WaxSealPreview() {
    return (
        <div className="flex h-36 items-center justify-center gap-3 p-3">
            <svg viewBox="0 0 120 90" className="h-24 w-28" aria-hidden>
                <path d="M8 28h104l-10 52H18Z" fill="#f3e6d4" />
                <path d="M8 28 60 58 112 28" fill="#e7d3b8" />
                <path d="M18 80 48 48M102 80 72 48" fill="none" stroke="#d9c4a4" />
                <circle cx="60" cy="34" r="14" fill="#8d2f2f" />
                <circle cx="60" cy="34" r="8" fill="none" stroke="#f3d2b0" strokeWidth="1.2" />
            </svg>
            <div className="h-24 w-16 rounded-md bg-white p-2 shadow-sm">
                <p className="font-serif text-[10px] leading-tight">Sophia & Daniel</p>
                <div className="mt-2 h-px bg-[#e7dcc8]" />
                <div className="mt-2 space-y-1">
                    <span className="block h-1 w-10 rounded bg-[#e7dcc8]" />
                    <span className="block h-1 w-8 rounded bg-[#e7dcc8]" />
                </div>
            </div>
        </div>
    );
}

function WebsitePreview() {
    return (
        <div className="h-36 p-3">
            <div className="h-full overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="flex gap-1 border-b border-[#241c16]/5 px-2 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e7d3b0]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e7d3b0]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e7d3b0]" />
                </div>
                <div className="grid grid-cols-3 gap-1 p-1.5">
                    <img src="/images/home/design-floral.jpg" alt="" className="h-16 w-full rounded object-cover" />
                    <img src="/images/home/phone-photos.jpg" alt="" className="h-16 w-full rounded object-cover" />
                    <img src="/images/home/design-gold.jpg" alt="" className="h-16 w-full rounded object-cover" />
                </div>
            </div>
        </div>
    );
}

function SuiteCard({ id, href, title, text, visual }: { id: string; href: string; title: string; text: string; visual: ReactNode }) {
    return (
        <Link id={id} href={href} className="scroll-mt-24 rounded-3xl bg-white p-4 text-left shadow-sm">
            <div className="mb-4 h-40 overflow-hidden rounded-2xl bg-[#f6f1e8]">{visual}</div>
            <h3 className="font-medium">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#5e554c]">{text}</p>
        </Link>
    );
}

function Quote({ name, role, text, photo }: { name: string; role: string; text: string; photo: string }) {
    return (
        <figure className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <img src={photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                <figcaption className="text-sm">
                    <span className="font-medium">{name}</span>
                    <span className="block text-xs text-[#5e554c]">{role}</span>
                </figcaption>
                <p className="ml-auto text-[#c6a36a]" aria-label="5 stars">★★★★★</p>
            </div>
            <blockquote className="mt-3 text-sm leading-6">{text}</blockquote>
        </figure>
    );
}

function Shot({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} className="h-full w-full object-cover" />;
}

function PictureLink({ href, src, alt, label, caption }: { href: string; src: string; alt: string; label: string; caption: string }) {
    return (
        <Link href={href} className="block text-center">
            <img src={src} alt={alt} className="mx-auto w-full max-w-[220px] drop-shadow-xl" />
            <h3 className="mt-4 font-serif text-xl">{label}</h3>
            <p className="mx-auto mt-1 max-w-[200px] text-sm leading-6 text-[#5e554c]">{caption}</p>
        </Link>
    );
}

function SampleInvites({ samples }: { samples: HomeSample[] }) {
    return (
        <section className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20" aria-labelledby="samples-heading">
            <p className="text-center text-xs tracking-[0.22em] text-[#8a7d6e] uppercase">Try before you build</p>
            <h2 id="samples-heading" className="mt-3 text-center font-serif text-4xl sm:text-5xl">
                Open a sample invite
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-[#5e554c]">
                Open a live guest experience on your phone — then customize the same look free.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
                {samples.map((sample) => (
                    <article key={sample.href + sample.title} className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm">
                        <div
                            className={
                                sample.card
                                    ? 'flex aspect-[4/3] items-center justify-center bg-[#f6f1e8] p-4'
                                    : 'aspect-[4/3] overflow-hidden bg-[#efe6d8]'
                            }
                        >
                            {sample.card ? (
                                <div className="w-full max-w-[180px] [&>*]:!mx-auto [&>*]:!max-w-none">
                                    <CardPreview design={sample.card} />
                                </div>
                            ) : (
                                <img src={sample.image} alt={sample.image_alt} className="h-full w-full object-cover object-top" loading="lazy" />
                            )}
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                            <p className="text-[11px] tracking-[0.18em] text-[#c6a36a] uppercase">{sample.eyebrow}</p>
                            <h3 className="mt-2 font-serif text-2xl leading-snug">{sample.title}</h3>
                            <p className="mt-2 flex-1 text-sm leading-6 text-[#5e554c]">{sample.text}</p>
                            <div className="mt-5 flex flex-col gap-2">
                                <Link
                                    href={sample.href}
                                    className="inline-flex items-center justify-center rounded-full bg-[#241c16] px-4 py-2.5 text-sm text-[#f6f1e8] transition hover:bg-[#3a3128]"
                                >
                                    {sample.cta}
                                </Link>
                                <Link
                                    href="/designs"
                                    className="inline-flex items-center justify-center rounded-full border border-[#241c16]/15 px-4 py-2.5 text-sm text-[#241c16] transition hover:bg-[#f6f1e8]"
                                >
                                    Customize this look — free
                                </Link>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function planCtaLabel(cta: string | undefined, signedIn: boolean): string {
    const label = (cta ?? 'Get started').trim();
    if (!signedIn) {
        return label;
    }

    if (/create account|sign up|register/i.test(label)) {
        return 'Open studio';
    }

    if (/get started|start free/i.test(label)) {
        return 'Create an event';
    }

    return label;
}

function PricingAndFaq({
    pricing,
    faqs,
    start,
    signedIn = false,
}: {
    pricing: HomePrice[];
    faqs: HomeFaq[];
    start: ReturnType<typeof register> | string;
    signedIn?: boolean;
}) {
    return (
        <section id="pricing" className="scroll-mt-24 border-t border-[#e7dcc8]/80 py-20" aria-labelledby="pricing-heading">
            <div
                className="relative overflow-hidden"
                style={{
                    backgroundColor: '#f7f4ef',
                    backgroundImage:
                        'linear-gradient(to right, rgba(36,28,22,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(36,28,22,0.045) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }}
            >
                <div className="relative mx-auto max-w-6xl px-5 py-14 sm:py-16">
                    {pricing.length > 0 && (
                        <>
                            <h2 id="pricing-heading" className="text-center font-serif text-4xl text-[#241c16] sm:text-5xl">
                                Pricing Plans
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-[#5e554c]">
                                Free cards · pay for live-site days · message credits only if you want Invidora to
                                auto-send bulk invites to emails or phone numbers.
                            </p>

                            <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-3 lg:gap-4">
                                {pricing.map((plan) => (
                                    <article
                                        key={plan.name}
                                        className={
                                            plan.highlight
                                                ? 'relative flex flex-col rounded-[24px] border border-[#e7dcc8]/90 bg-white p-5 shadow-[0_18px_50px_rgba(36,28,22,0.08)] sm:p-6'
                                                : 'relative flex flex-col rounded-[24px] border border-[#ece4d8] bg-white p-5 shadow-[0_10px_30px_rgba(36,28,22,0.04)] sm:p-6'
                                        }
                                    >
                                        {plan.highlight && (
                                            <div
                                                aria-hidden
                                                className="pointer-events-none absolute -top-10 -right-8 h-36 w-36 rounded-full opacity-70 blur-2xl"
                                                style={{
                                                    background:
                                                        'radial-gradient(circle at center, rgba(198,163,106,0.55) 0%, rgba(246,241,232,0.2) 55%, transparent 70%)',
                                                }}
                                            />
                                        )}
                                        {plan.badge && (
                                            <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#241c16] px-3 py-1 text-[10px] font-medium tracking-wide text-white shadow-sm">
                                                {plan.badge}
                                            </span>
                                        )}

                                        <div className="relative">
                                            <h3 className="font-serif text-xl text-[#241c16] sm:text-2xl">{plan.name}</h3>
                                            {plan.tagline && (
                                                <p className="mt-1.5 text-sm leading-5 text-[#6f655b]">{plan.tagline}</p>
                                            )}

                                            <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                                <span className="font-serif text-3xl tracking-tight text-[#241c16] sm:text-[2.15rem]">
                                                    {plan.price}
                                                </span>
                                                {plan.period && (
                                                    <span className="text-sm text-[#8a7d6e]">/ {plan.period}</span>
                                                )}
                                            </div>

                                            <div className="mt-4 border-t border-[#ece4d8]" />

                                            {plan.includes_label && (
                                                <p className="mt-4 flex items-center gap-2 text-[13px] font-medium text-[#241c16]">
                                                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#c6a36a]/20 text-[#8a6a35]">
                                                        <Plus className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                                                    </span>
                                                    {plan.includes_label}
                                                </p>
                                            )}

                                            {plan.day_packs && plan.day_packs.length > 0 && (
                                                <ul className="mt-3 divide-y divide-[#f0e8dc] overflow-hidden rounded-2xl border border-[#ece4d8] bg-[#faf7f2]">
                                                    {plan.day_packs.map((pack) => (
                                                        <li
                                                            key={pack.id}
                                                            className={`flex items-center justify-between gap-3 px-3 py-2.5 ${pack.popular ? 'bg-[#241c16] text-[#f6f1e8]' : ''}`}
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                                                                    <span>{pack.days} days</span>
                                                                    {pack.popular ? (
                                                                        <span className="rounded bg-[#c6a36a] px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-[#1c1916] uppercase">
                                                                            Popular
                                                                        </span>
                                                                    ) : null}
                                                                </p>
                                                                <p className={`mt-0.5 text-[11px] ${pack.popular ? 'text-[#cfc4b6]' : 'text-[#8a7d6e]'}`}>
                                                                    {pack.per_day ? `~${pack.per_day}/day · site only` : pack.tagline}
                                                                </p>
                                                            </div>
                                                            <p className="shrink-0 font-serif text-lg tabular-nums">{pack.price}</p>
                                                        </li>
                                                    ))}
                                                    {plan.custom && (
                                                        <li className="flex items-center justify-between gap-3 px-3 py-2.5">
                                                            <div className="min-w-0">
                                                                <p className="text-[13px] font-medium text-[#241c16]">{plan.custom.label}</p>
                                                                <p className="mt-0.5 text-[11px] text-[#8a7d6e]">
                                                                    {plan.custom.range}
                                                                    {plan.custom.per_day ? ` · from ${plan.custom.per_day}/day` : ''}
                                                                </p>
                                                            </div>
                                                            <p className="shrink-0 text-[12px] font-medium text-[#8a6a35]">Quote</p>
                                                        </li>
                                                    )}
                                                </ul>
                                            )}

                                            {plan.credit_options && plan.credit_options.length > 0 && (
                                                <ul className="mt-3 divide-y divide-[#f0e8dc] overflow-hidden rounded-2xl border border-[#ece4d8] bg-[#faf7f2]">
                                                    {plan.credit_options.map((pack) => (
                                                        <li key={pack.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                                                            <div className="min-w-0">
                                                                <p className="text-[13px] font-medium text-[#241c16]">
                                                                    {pack.credits} credits
                                                                </p>
                                                                {pack.note ? (
                                                                    <p className="mt-0.5 text-[11px] text-[#8a7d6e]">{pack.note}</p>
                                                                ) : null}
                                                            </div>
                                                            <p className="shrink-0 font-serif text-lg tabular-nums text-[#241c16]">{pack.price}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            <ul className={`space-y-2 text-[13px] leading-5 text-[#5e554c] ${plan.day_packs || plan.credit_options ? 'mt-4' : 'mt-4'}`}>
                                                {plan.points.map((point) => (
                                                    <li key={point} className="flex gap-2.5">
                                                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#efe6d8] text-[#8a6a35]">
                                                            <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                                                        </span>
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {plan.note && (
                                                <p className="mt-3 text-[12px] leading-5 text-[#6f655b] italic">{plan.note}</p>
                                            )}
                                        </div>

                                        <div className="relative mt-auto pt-5">
                                            <Link
                                                href={start}
                                                className={
                                                    plan.highlight
                                                        ? 'inline-flex w-full items-center justify-center rounded-xl bg-[#241c16] px-4 py-2.5 text-sm font-medium text-[#f6f1e8] transition hover:bg-[#3a3128]'
                                                        : 'inline-flex w-full items-center justify-center rounded-xl bg-[#efeae2] px-4 py-2.5 text-sm font-medium text-[#241c16] transition hover:bg-[#e7dcc8]'
                                                }
                                            >
                                                {planCtaLabel(plan.cta, signedIn)}
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}

                    {faqs.length > 0 && (
                        <div className={pricing.length > 0 ? 'mt-14' : ''}>
                            <p className="text-center text-xs tracking-[0.22em] text-[#8a7d6e] uppercase">FAQ</p>
                            <h2 className="mt-3 text-center font-serif text-3xl sm:text-4xl">Common questions</h2>
                            <div className="mx-auto mt-8 max-w-2xl divide-y divide-[#e7dcc8]">
                                {faqs.map((faq) => (
                                    <details key={faq.q} className="group py-4">
                                        <summary className="cursor-pointer list-none font-medium text-[#241c16] marker:content-none [&::-webkit-details-marker]:hidden">
                                            <span className="flex items-start justify-between gap-4">
                                                <span>{faq.q}</span>
                                                <span
                                                    aria-hidden
                                                    className="mt-0.5 shrink-0 text-[#c6a36a] transition group-open:rotate-45"
                                                >
                                                    +
                                                </span>
                                            </span>
                                        </summary>
                                        <p className="mt-3 pr-8 text-sm leading-6 text-[#5e554c]">{faq.a}</p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function Masterpiece({ start, onDemo }: { start: ReturnType<typeof register> | string; onDemo: () => void }) {
    return (
        <article className="relative w-full overflow-hidden bg-[#1c1916] px-6 py-20 text-[#f6f1e8] sm:px-10 sm:py-24">
            <ClosedEnvelope className="pointer-events-none absolute bottom-6 left-6 w-14 -rotate-12 opacity-90 sm:w-16" />
            <GiftBox className="pointer-events-none absolute top-6 right-6 w-12 rotate-6 sm:w-14" />
            <PlayEnvelope className="pointer-events-none absolute right-8 bottom-6 w-14 rotate-6 opacity-90 sm:w-16" />
            <Star className="absolute top-10 left-[18%] h-3 w-3" />
            <Star className="absolute top-16 right-[24%] h-5 w-5" />
            <Star className="absolute bottom-10 left-[30%] h-3 w-3" />
            <Star className="absolute right-[16%] bottom-16 h-4 w-4" />
            <span className="absolute top-8 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#c6a36a]" />
            <span className="absolute bottom-8 left-[42%] h-1 w-1 rounded-full bg-[#f6f1e8]/70" />
            <div className="relative z-10 mx-auto max-w-md text-center">
                <h2 className="font-serif text-4xl leading-tight sm:text-5xl">Ready to start planning your next masterpiece?</h2>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link href={start} className="rounded-full bg-[#c6a36a] px-5 py-2.5 text-sm text-[#1c1916]">
                        Design Your First Invite
                    </Link>
                    <button type="button" onClick={onDemo} className="rounded-full border border-[#f6f1e8]/35 bg-transparent px-5 py-2.5 text-sm text-[#f6f1e8]">
                        Watch Demo Video
                    </button>
                </div>
            </div>
        </article>
    );
}

function ClosedEnvelope({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 56" className={className} aria-hidden>
            <rect x="2" y="8" width="76" height="46" rx="4" fill="#f7f1e4" stroke="#d9c7a4" />
            <path d="M2 12 40 36 78 12" fill="none" stroke="#c6a36a" strokeWidth="2" />
            <path d="M6 50 32 28M74 50 48 28" fill="none" stroke="#e4d3b0" />
        </svg>
    );
}

function GiftBox({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 72 72" className={className} aria-hidden>
            <rect x="10" y="28" width="52" height="36" rx="3" fill="#1e2a4a" />
            <rect x="8" y="20" width="56" height="12" rx="2" fill="#243456" />
            <rect x="32" y="20" width="8" height="44" fill="#c6a36a" />
            <rect x="8" y="24" width="56" height="6" fill="#e6d3a4" />
            <path d="M36 20c-8-14-20-8-14 0h14Zm0 0c8-14 20-8 14 0H36Z" fill="#c6a36a" />
        </svg>
    );
}

function PlayEnvelope({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 88 64" className={className} aria-hidden>
            <rect x="4" y="10" width="80" height="50" rx="4" fill="#f4e7cf" stroke="#d7c4a0" />
            <path d="M4 14 44 40 84 14" fill="none" stroke="#c6a36a" strokeWidth="2" />
            <circle cx="62" cy="40" r="12" fill="#fff" />
            <path d="M58 34v12l10-6Z" fill="#1e2a4a" />
        </svg>
    );
}

function Star({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 16 16" className={`fill-[#c6a36a] ${className}`} aria-hidden>
            <path d="M8 0 9.4 6.6 16 8 9.4 9.4 8 16 6.6 9.4 0 8l6.6-1.4Z" />
        </svg>
    );
}

function Demo({ onClose, start }: { onClose: () => void; start: ReturnType<typeof register> | string }) {
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/90 p-0 sm:items-center sm:bg-[#16120f]/85 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-title"
            onClick={onClose}
        >
            <div
                className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-[#0c0a08] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)] sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3">
                    <div className="min-w-0">
                        <p className="text-[0.65rem] tracking-[0.2em] text-[#c6a36a] uppercase">Product demo</p>
                        <h2 id="demo-title" className="truncate font-serif text-lg text-[#f6f1e8] sm:text-xl">
                            From home to publish
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-[#f6f1e8]/90 transition hover:bg-white/5"
                    >
                        Close
                    </button>
                </div>
                <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-black">
                    <video
                        className="aspect-video max-h-full max-w-full object-cover"
                        controls
                        autoPlay
                        playsInline
                        preload="metadata"
                        poster="/images/home/phone-wedding.jpg"
                    >
                        <source src="/videos/demo.mp4?v=7" type="video/mp4" />
                    </video>
                </div>
                <div className="flex shrink-0 flex-col gap-2.5 border-t border-white/10 px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:gap-3 sm:px-5 sm:py-3">
                    <p className="min-w-0 flex-1 text-sm leading-5 text-[#cfc4b6] sm:leading-6">
                        Follow the path from home to a live invite — then design yours.
                    </p>
                    <Link
                        href={start}
                        className="inline-flex w-full items-center justify-center rounded-full bg-[#c6a36a] px-5 py-2.5 text-sm font-medium text-[#1c1916] sm:w-auto sm:shrink-0"
                    >
                        Design Your First Invite
                    </Link>
                </div>
            </div>
        </div>
    );
}

