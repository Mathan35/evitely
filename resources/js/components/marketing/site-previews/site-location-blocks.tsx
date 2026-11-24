import { Copy, MapPin, Navigation } from 'lucide-react';
import type { ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SiteSectionChrome } from '@/components/marketing/site-previews/site-section-chrome';
import { cn } from '@/lib/utils';

export type SiteVenueBlock = {
    id: string;
    title: string;
    time: string;
    name: string;
    address: string;
    image: string;
    map: string;
    maps: string;
};

export function MapLabel({ children }: { children: ReactNode }) {
    return (
        <p className="absolute inset-x-0 top-[38%] px-4 text-center font-serif text-[clamp(1.6rem,4vw,2rem)] leading-tight text-white drop-shadow-[0_2px_14px_rgba(12,10,8,0.65)]">
            {children}
        </p>
    );
}

export function ItineraryStop({
    venue,
    overlay,
    desktop = false,
}: {
    venue: SiteVenueBlock;
    overlay?: ReactNode;
    desktop?: boolean;
}) {
    return (
        <article
            data-preview-reveal
            className={cn('site-itinerary-stop preview-reveal relative pb-12', desktop && 'pb-2')}
        >
            {desktop ? null : (
                <span className="site-itinerary-stop__dot" aria-hidden />
            )}
            <div className="site-itinerary-stop__media group relative overflow-hidden rounded-[1.5rem]">
                <img
                    src={venue.image}
                    alt=""
                    className="preview-zoom-media aspect-16/10 w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />
                {overlay}
                <span className="site-itinerary-stop__time-chip absolute top-3 left-3">{venue.time}</span>
            </div>
            <p className="mt-5 text-[10px] tracking-[0.28em] text-[var(--w-accent)] uppercase">{venue.time}</p>
            <h4 className="mt-2 font-serif text-[2rem] leading-tight font-light tracking-tight text-[var(--w-ink)]">
                {venue.title}
            </h4>
            <p className="mt-2 text-[17px] text-[var(--w-ink)]">{venue.name}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--w-muted)]">{venue.address}</p>
            <a
                href={venue.maps}
                target="_blank"
                rel="noreferrer"
                className="site-itinerary-stop__map mt-5 inline-flex items-center gap-2"
            >
                <MapPin className="h-3.5 w-3.5" />
                View map
            </a>
        </article>
    );
}

export function VenueCard({
    venue,
    kicker,
    copied,
    onCopy,
}: {
    venue: SiteVenueBlock;
    kicker: string;
    copied: string | null;
    onCopy: () => void;
}) {
    const lines = venue.address
        .split(',')
        .map((line) => line.trim())
        .filter(Boolean);

    return (
        <article data-preview-reveal className="site-venue-card preview-reveal text-left">
            <div className="group relative overflow-hidden rounded-[1.25rem]">
                <img src={venue.image} alt="" className="preview-zoom-media aspect-[16/9] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-[9px] tracking-[0.28em] uppercase opacity-80">{kicker}</p>
                    <h4 className="mt-1 font-serif text-[1.55rem] leading-tight font-light">{venue.name}</h4>
                </div>
            </div>
            <div className="mt-5 flex items-start justify-between gap-3 px-1">
                <p className="flex min-w-0 flex-1 gap-2 text-[13px] leading-6 text-[var(--w-muted)]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--w-accent)]" aria-hidden />
                    <span>
                        {lines.map((line) => (
                            <span key={line} className="block">
                                {line}
                            </span>
                        ))}
                    </span>
                </p>
                <div className="site-venue-card__qr shrink-0 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-[var(--w-ink)]/8">
                    <QRCodeSVG value={venue.maps} size={56} fgColor="currentColor" bgColor="transparent" />
                </div>
            </div>
            <div className="mx-1 mt-5 h-px bg-[var(--w-ink)]/8" />
            <div className="mt-5 flex gap-2 px-1 pb-1">
                <a
                    href={venue.maps}
                    target="_blank"
                    rel="noreferrer"
                    className="site-venue-card__primary inline-flex min-w-0 flex-1 items-center justify-center gap-1 px-2 py-2.5 sm:gap-1.5"
                >
                    <Navigation className="h-3.5 w-3.5" />
                    Get directions
                </a>
                <button
                    type="button"
                    onClick={onCopy}
                    className="site-venue-card__ghost inline-flex min-w-0 flex-1 items-center justify-center gap-1 px-2 py-2.5 sm:gap-1.5"
                >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === venue.id ? 'Copied' : 'Copy address'}
                </button>
            </div>
        </article>
    );
}

export function SiteItineraryHeading({
    eyebrow = 'The Celebration',
    title,
}: {
    eyebrow?: string;
    title: string;
}) {
    return <SiteSectionChrome eyebrow={eyebrow} title={title} className="mb-2" />;
}

export function SiteVenuesHeading({ title = 'Event Venues' }: { title?: string }) {
    return <SiteSectionChrome title={title} className="mb-2" />;
}
