import { Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';
import { SiteFooter } from '@/components/marketing/site-footer';
import { register } from '@/routes';

const cards = [
    { label: 'A. Ethereal Floral', image: '/images/wedding/card-ethereal-floral.jpg', alt: 'Sage envelope and floral invitation for Olivia and Liam' },
    { label: 'B. Modern Minimalist Luxe', image: '/images/wedding/card-modern-luxe.jpg', alt: 'Black envelope and gold invitation for Sophia and Daniel' },
    { label: 'C. Black Tie Gala', image: '/images/wedding/card-black-tie.jpg', alt: 'Navy envelope and save-the-date for Grace and Michael' },
];

const moreCards = [
    { label: 'D. Garden Afternoon', image: '/images/wedding/card-garden.jpg', alt: 'Blush envelope and peony invitation for Meera and Arun' },
    { label: 'E. Temple Gold', image: '/images/wedding/card-temple.jpg', alt: 'Cream envelope and maroon invitation for Priya and Arun' },
];

export default function WeddingFormats({
    canRegister = true,
    seo,
}: {
    canRegister?: boolean;
    seo?: MarketingSeoPayload;
}) {
    const start = canRegister ? register() : '/login';

    return (
        <>
            {seo ? (
                <MarketingSeoHead seo={seo} />
            ) : (
                <MarketingSeoHead
                    seo={{
                        title: 'Choose your wedding invitation format',
                        description:
                            'Choose a digital wedding card and envelope, or an interactive wedding website. Select one, or blend both.',
                        canonical: '',
                        image: '',
                    }}
                />
            )}
            <div className="min-h-screen bg-background text-foreground">
                <MarketingHeader back={{ href: '/designs', label: 'Back to all event types' }} />
                <main className="mx-auto max-w-6xl px-5 py-8">
                    <p className="text-sm text-[#8a7d6e]">
                        <Link href="/">Home</Link>
                        <span className="px-2">›</span>
                        <Link href="/designs">Templates</Link>
                        <span className="px-2">›</span>
                        <span>Weddings</span>
                    </p>
                    <h1 className="mt-6 text-center font-serif text-4xl sm:text-5xl">Choose Your Wedding Invitation Format</h1>
                    <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-[#5e554c] sm:text-base">
                        Digital cards are free forever. Guest sites include a 30-day free try when you publish — share on WhatsApp first, then extend with a day pack if you need more time.
                    </p>
                    <WeddingColumns start={start} />
                    <MoreDesigns start={start} />
                </main>
                <SiteFooter />
            </div>
        </>
    );
}

export function WeddingTypeHero() {
    return (
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
            <div>
                <p className="text-center text-[11px] tracking-[0.16em] text-[#8a7d6e] uppercase">1. Interactive wedding websites & links</p>
                <Link href="/designs/weddings" className="mt-4 block">
                    <img src="/images/wedding/hero-phones.jpg" alt="Sophia and Daniel countdown, wedding itinerary and map, and registry with guest wall" className="w-full" />
                </Link>
            </div>
            <div>
                <p className="text-center text-[11px] tracking-[0.16em] text-[#8a7d6e] uppercase">2. Classic digital cards & envelopes</p>
                <Link href="/designs/weddings" className="mt-4 block">
                    <img src="/images/wedding/hero-envelopes.jpg" alt="Ethereal Floral, Modern Minimalist Luxe, and Black Tie Gala envelopes" className="w-full" />
                </Link>
            </div>
        </div>
    );
}

export function WeddingColumns({ start, moreHref }: { start: ReturnType<typeof register> | string; moreHref?: string }) {
    const [compare, setCompare] = useState(false);
    const [active, setActive] = useState<'cards' | 'links' | 'both'>('both');

    return (
        <div className="mt-8">
            <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => setActive(active === 'cards' ? 'both' : 'cards')}
                    className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm ${active !== 'links' ? 'border-[#241c16] bg-white' : 'border-[#241c16]/15 bg-white/60'}`}
                >
                    <HeartIcon /> Digital Cards & Envelopes
                </button>
                <button
                    type="button"
                    onClick={() => setActive(active === 'links' ? 'both' : 'links')}
                    className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm ${active !== 'cards' ? 'border-[#241c16] bg-white' : 'border-[#241c16]/15 bg-white/60'}`}
                >
                    <GlobeIcon /> Interactive Wedding Websites & Links
                </button>
            </div>

            <div className={`mt-10 grid items-start gap-10 ${active === 'both' ? 'lg:grid-cols-2' : ''}`}>
                {active !== 'links' && (
                    <section>
                        <h2 className="text-sm font-semibold tracking-wide">1. CLASSIC DIGITAL CARDS & ENVELOPES</h2>
                        <p className="mt-1 text-sm text-[#5e554c]">Labeled, featuring 3 premium wedding card & envelope suites in 3/4 perspective.</p>
                        <div className="mt-6 space-y-8">
                            {cards.map((card) => (
                                <figure key={card.label}>
                                    <img src={card.image} alt={card.alt} className="mx-auto w-full max-w-md rounded-2xl object-cover" />
                                    <figcaption className="mt-3 text-center text-sm font-medium">{card.label}</figcaption>
                                </figure>
                            ))}
                        </div>
                        <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#5e554c]">
                            <li className="inline-flex items-center gap-2"><Spark /> Envelope Unboxing</li>
                            <li className="inline-flex items-center gap-2"><Seal /> Custom Wax Seals</li>
                            <li className="inline-flex items-center gap-2"><Pages /> Single/Double-Paged Art</li>
                        </ul>
                    </section>
                )}

                {active !== 'cards' && (
                    <section>
                        <h2 className="text-sm font-semibold tracking-wide">2. INTERACTIVE EVENT WEBSITES & LINKS</h2>
                        <p className="mt-1 text-sm text-[#5e554c]">Responsive mobile screens in device frames showcasing rich guest modules.</p>
                        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8">
                            <PhoneBlock label="Interactive RSVP & Guest Hub">
                                <RsvpPhone />
                            </PhoneBlock>
                            <PhoneBlock label="Travel & Multi-Day Itinerary">
                                <ItineraryPhone />
                            </PhoneBlock>
                            <PhoneBlock label="Interactive Wedding Websites & Links">
                                <TravelPhone />
                            </PhoneBlock>
                            <PhoneBlock label="Registry, guest Wall & Memory Hub">
                                <RegistryPhone />
                            </PhoneBlock>
                        </div>
                        <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#5e554c]">
                            <li className="inline-flex items-center gap-2"><CalendarMark /> Multi-Day Schedules</li>
                            <li className="inline-flex items-center gap-2"><GiftMark /> Unified Registry</li>
                            <li className="inline-flex items-center gap-2"><PinMark /> Maps & Lodging</li>
                            <li className="inline-flex items-center gap-2"><WallMark /> Guest Memory Walls</li>
                        </ul>
                    </section>
                )}
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                <Link href={start} className="rounded-full bg-[#6d5a45] px-5 py-2.5 text-sm text-[#f6f1e8]">
                    Design Your Free Wedding Invitation
                </Link>
                <button type="button" onClick={() => setCompare((open) => !open)} className="rounded-full border border-[#241c16]/20 bg-white px-5 py-2.5 text-sm">
                    Compare All Features
                </button>
                {moreHref && (
                    <Link href={moreHref} className="rounded-full border border-[#241c16]/20 bg-white px-5 py-2.5 text-sm">
                        More
                    </Link>
                )}
            </div>
            {compare && <Comparison />}
            <p className="mx-auto mt-4 max-w-xl text-center text-xs leading-5 text-[#8a7d6e]">
                Full-width, borderless presentation, ensuring rich detail and typography read perfectly.
            </p>
        </div>
    );
}

function MoreDesigns({ start }: { start: ReturnType<typeof register> | string }) {
    return (
        <section id="more" className="mt-16 border-t border-[#241c16]/10 pt-12">
            <h2 className="text-center font-serif text-3xl">More wedding cards and links</h2>
            <p className="mt-2 text-center text-sm text-[#5e554c]">Same card-and-envelope suites, and more guest modules for the wedding link.</p>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
                {moreCards.map((card) => (
                    <figure key={card.label}>
                        <img src={card.image} alt={card.alt} className="w-full rounded-2xl object-cover" />
                        <figcaption className="mt-3 text-center text-sm font-medium">{card.label}</figcaption>
                    </figure>
                ))}
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6 sm:mx-auto sm:max-w-xl">
                <PhoneBlock label="Mehendi & Sangeet Weekend">
                    <WeekendPhone />
                </PhoneBlock>
                <PhoneBlock label="Family Groups & Seating">
                    <FamilyPhone />
                </PhoneBlock>
            </div>
            <div className="mt-8 text-center">
                <Link href={start} className="text-sm underline">
                    Start with any of these
                </Link>
            </div>
        </section>
    );
}

function Comparison() {
    const rows = [
        ['Format', 'Card and envelope', 'Multi-page website'],
        ['Art', 'Wax seal, single or double page', 'Live modules on the phone'],
        ['RSVP', 'Opens from the card link', 'Meal choice, plus-ones, and reminders'],
        ['Schedule', 'Printed on the card', 'Multi-day timeline with maps'],
        ['After the invite', 'Save and share the card', 'Registry, memory wall, and jukebox'],
    ];

    return (
        <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-[#f6f1e8] text-xs tracking-wide uppercase">
                    <tr>
                        <th className="px-4 py-3 font-medium"> </th>
                        <th className="px-4 py-3 font-medium">Digital cards</th>
                        <th className="px-4 py-3 font-medium">Wedding websites</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([label, card, site]) => (
                        <tr key={label} className="border-t border-[#241c16]/5">
                            <th className="px-4 py-3 font-medium">{label}</th>
                            <td className="px-4 py-3 text-[#5e554c]">{card}</td>
                            <td className="px-4 py-3 text-[#5e554c]">{site}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PhoneBlock({ label, children }: { label: string; children: ReactNode }) {
    return (
        <figure className="text-center">
            {children}
            <figcaption className="mt-3 text-sm font-medium">{label}</figcaption>
        </figure>
    );
}

function Phone({ children }: { children: ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-[220px] rounded-[1.8rem] border-[5px] border-[#1c1916] bg-[#fbf7f1] px-3 pt-2 pb-3 text-left shadow-lg">
            <div className="mx-auto mb-2 h-3.5 w-14 rounded-full bg-[#1c1916]" />
            {children}
        </div>
    );
}

function RsvpPhone() {
    const [meal, setMeal] = useState('Herb crust salmon');
    const [guests, setGuests] = useState(1);
    const meals = ['Herb crust salmon', 'Truffle risotto', 'Special bag'];

    return (
        <Phone>
            <p className="text-center font-serif text-sm leading-tight">The Wedding of Sophia & Daniel</p>
            <p className="mt-2 text-center text-[10px] tracking-wide text-[#8a7d6e] uppercase">Animated countdown</p>
            <p className="text-center font-serif text-2xl">54d : 12h</p>
            <Link href="/invite/arun-priya" className="mt-2 block rounded-full bg-[#c6a36a] py-1.5 text-center text-xs text-white">
                RSVP NOW
            </Link>
            <p className="mt-3 text-[11px] font-medium">Meal preferences</p>
            <ul className="mt-1 space-y-1">
                {meals.map((item) => (
                    <li key={item}>
                        <button type="button" onClick={() => setMeal(item)} className="flex items-center gap-2 text-[11px]">
                            <span className={`grid h-3 w-3 place-items-center rounded-full border ${meal === item ? 'border-[#c6a36a]' : 'border-[#241c16]/30'}`}>
                                {meal === item && <span className="h-1.5 w-1.5 rounded-full bg-[#c6a36a]" />}
                            </span>
                            {item}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="mt-2 flex items-center justify-between text-[11px]">
                <span>+{guests} RSVP</span>
                <span className="flex gap-1">
                    <button type="button" className="h-5 w-5 rounded-full border" onClick={() => setGuests((count) => Math.max(1, count - 1))}>-</button>
                    <button type="button" className="h-5 w-5 rounded-full border" onClick={() => setGuests((count) => Math.min(6, count + 1))}>+</button>
                </span>
            </div>
        </Phone>
    );
}

function ItineraryPhone() {
    return (
        <Phone>
            <ul className="space-y-2 text-[11px]">
                <li className="flex justify-between gap-2"><span>Ceremony</span><span>2:00 PM</span></li>
                <li className="flex justify-between gap-2"><span>Dinner & Dancing</span><span>6:00 PM</span></li>
                <li className="flex justify-between gap-2"><span>Farewell Brunch</span><span>11:00 AM</span></li>
            </ul>
            <div className="mt-3 h-24 rounded-xl bg-[#e7efe4] p-2">
                <div className="h-full rounded-lg bg-[linear-gradient(160deg,#d5e3d4,#f4f7f1)] p-2">
                    <p className="text-[10px] font-medium">The Glasshouse, NY</p>
                    <span className="mt-4 inline-block h-2 w-2 rounded-full bg-[#c45c4a]" />
                </div>
            </div>
        </Phone>
    );
}

function TravelPhone() {
    return (
        <Phone>
            <p className="font-serif text-sm leading-tight">The Wedding Sophia & Daniel</p>
            <p className="text-[10px] text-[#5e554c]">The Glasshouse, NY</p>
            <div className="mt-2 h-16 rounded-lg bg-[#e7efe4]" />
            <p className="mt-2 text-[11px] font-medium">Lodging codes</p>
            <p className="text-[11px] text-[#5e554c]">00063440083</p>
            <p className="mt-2 text-[11px] font-medium">Travel details</p>
            <p className="text-[11px] text-[#5e554c]">Cocktails and dinner · The Glasshouse, NY</p>
            <p className="mt-1 text-[11px]">Due 1st Feb · 6:00 PM</p>
        </Phone>
    );
}

function RegistryPhone() {
    return (
        <Phone>
            <p className="text-[11px] font-medium">Digital registry</p>
            <p className="text-[10px] text-[#5e554c]">Registry, cash fund</p>
            <div className="mt-2 rounded-xl bg-white p-2">
                <p className="text-[11px] font-medium">Honeymoon Fund</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f3ecdf]">
                    <div className="h-full w-2/3 bg-[#c6a36a]" />
                </div>
            </div>
            <p className="mt-2 text-[11px] font-medium">Guest Memory Wall</p>
            <div className="mt-1 grid grid-cols-3 gap-1">
                <img src="/images/home/design-floral.jpg" alt="" className="h-8 w-full rounded object-cover" />
                <img src="/images/home/avatar-elena.jpg" alt="" className="h-8 w-full rounded object-cover" />
                <img src="/images/home/avatar-sam.jpg" alt="" className="h-8 w-full rounded object-cover" />
            </div>
            <div className="mt-2 rounded-full bg-[#1c1916] px-2 py-1 text-[10px] text-[#f6f1e8]">Song jukebox · Request a song</div>
        </Phone>
    );
}

function WeekendPhone() {
    return (
        <Phone>
            <p className="font-serif text-sm">The wedding week</p>
            <ul className="mt-2 space-y-1.5 text-[11px]">
                <li>Thursday · Mehendi · 4:00 PM</li>
                <li>Friday · Sangeet · 7:00 PM</li>
                <li>Saturday · Ceremony · 9:30 AM</li>
                <li>Sunday · Brunch · 11:00 AM</li>
            </ul>
        </Phone>
    );
}

function FamilyPhone() {
    return (
        <Phone>
            <p className="font-serif text-sm">Family groups</p>
            <ul className="mt-2 space-y-1.5 text-[11px]">
                <li className="flex justify-between"><span>Sharma table</span><span>8 seats</span></li>
                <li className="flex justify-between"><span>Iyer table</span><span>6 seats</span></li>
                <li className="flex justify-between"><span>College friends</span><span>10 seats</span></li>
            </ul>
            <p className="mt-3 text-[10px] text-[#5e554c]">Each group gets one link and one reply.</p>
        </Phone>
    );
}

function HeartIcon() {
    return (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path d="M8 13s-4.5-2.7-4.5-5.2A2.4 2.4 0 0 1 8 6.2a2.4 2.4 0 0 1 4.5 1.6C12.5 10.3 8 13 8 13Z" fill="#c45c4a" />
        </svg>
    );
}

function GlobeIcon() {
    return (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="#3d6b8c" aria-hidden>
            <circle cx="8" cy="8" r="5.2" />
            <path d="M3 8h10M8 3c1.4 1.6 1.4 8.4 0 10M8 3c-1.4 1.6-1.4 8.4 0 10" />
        </svg>
    );
}

function Spark() {
    return <span aria-hidden className="text-[#c6a36a]">✦</span>;
}
function Seal() {
    return <span aria-hidden className="text-[#8d6b3e]">●</span>;
}
function Pages() {
    return <span aria-hidden className="text-[#5e554c]">▤</span>;
}
function CalendarMark() {
    return <span aria-hidden className="text-[#8d6b3e]">▦</span>;
}
function GiftMark() {
    return <span aria-hidden className="text-[#c45c4a]">▣</span>;
}
function PinMark() {
    return <span aria-hidden className="text-[#3d6b8c]">⌖</span>;
}
function WallMark() {
    return <span aria-hidden className="text-[#c6a36a]">♡</span>;
}
