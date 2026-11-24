import { Link } from '@inertiajs/react';
import { LayoutGrid, LayoutList, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormatSwitch } from '@/components/marketing/format-switch';
import { GalleryDesignCard } from '@/components/marketing/gallery-design-card';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';
import { OccasionIcon, OccasionMark, occasionAccent } from '@/components/marketing/occasion-icon';
import { SiteFooter } from '@/components/marketing/site-footer';
import { useGalleryFavorites } from '@/hooks/use-gallery-favorites';
import type { GalleryDesign } from '@/types/gallery';

type OccasionCatalog = {
    slug: string;
    name: string;
    href: string;
    event_type: string;
    heading: string;
    description: string;
    links: GalleryDesign[];
    cards: GalleryDesign[];
    link_count: number;
    card_count: number;
};

function FeaturedGrid({
    designs,
    accent,
    href,
    tab,
    view,
    savedIds,
    onFavorite,
}: {
    designs: GalleryDesign[];
    accent: string;
    href: string;
    tab: 'links' | 'cards';
    view: 'grid' | 'list';
    savedIds: string[];
    onFavorite: (id: string) => void;
}) {
    return (
        <ul className={view === 'list' ? 'mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-2' : 'mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4'}>
            {designs.map((design) => (
                <li key={design.id} className="min-w-0">
                    <GalleryDesignCard
                        design={design}
                        view={view}
                        saved={savedIds.includes(design.id)}
                        onFavorite={onFavorite}
                        preview={{ type: 'link', href: `${href}?tab=${tab}` }}
                        accent={accent}
                        showStyle
                    />
                </li>
            ))}
        </ul>
    );
}

export default function Designs({
    occasions,
    seo,
}: {
    occasions: OccasionCatalog[];
    canRegister?: boolean;
    seo?: MarketingSeoPayload;
}) {
    const [tab, setTab] = useState<'links' | 'cards'>('links');
    const [type, setType] = useState('all');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const favorites = useGalleryFavorites();

    const visible = useMemo(
        () => (type === 'all' ? occasions : occasions.filter((occasion) => occasion.slug === type)),
        [occasions, type],
    );

    return (
        <>
            {seo ? (
                <MarketingSeoHead seo={seo} />
            ) : (
                <MarketingSeoHead
                    seo={{
                        title: 'Invitation designs for every event',
                        description:
                            'Browse unique event websites and digital cards for weddings, birthdays, corporate events, baby showers, parties, graduations, bridals, housewarmings, and custom celebrations.',
                        canonical: '',
                        image: '',
                    }}
                />
            )}
            <div className="min-h-svh bg-background text-foreground">
                <MarketingHeader back={{ href: '/', label: 'Back to home' }} />

                <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
                    <div className="flex flex-col items-center">
                        <OccasionMark slug={type === 'all' ? 'all' : type} size="lg" />
                        <h1 className="mt-4 text-center font-serif text-3xl leading-tight sm:text-4xl">Invitation Designs For Every Event</h1>
                    </div>
                    <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-6 text-[#6d645b]">
                        Each occasion has its own visual language — phones for interactive websites, envelopes for digital cards. Choose an event type, then preview or customize a template.
                    </p>

                    <div className="mt-6 rounded-2xl border border-[#2b241c]/8 bg-white/80 p-3 shadow-sm sm:p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="inline-flex items-center gap-1 text-[11px] tracking-[0.14em] text-[#9a9188] uppercase">
                                <SlidersHorizontal className="h-3 w-3" aria-hidden />
                                Filters
                            </p>
                            <div className="inline-flex rounded-full border border-[#2b241c]/10 bg-white p-0.5" role="group" aria-label="View">
                                <button type="button" aria-pressed={view === 'grid'} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${view === 'grid' ? 'bg-[#2b241c] text-[#f4efe6]' : 'text-[#7a7168]'}`} onClick={() => setView('grid')}>
                                    <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                                    Grid
                                </button>
                                <button type="button" aria-pressed={view === 'list'} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${view === 'list' ? 'bg-[#2b241c] text-[#f4efe6]' : 'text-[#7a7168]'}`} onClick={() => setView('list')}>
                                    <LayoutList className="h-3.5 w-3.5" aria-hidden />
                                    List
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2" role="tablist" aria-label="Event types">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={type === 'all'}
                                onClick={() => setType('all')}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${type === 'all' ? 'bg-[#2b241c] text-[#f4efe6]' : 'border border-[#2b241c]/10 bg-white'}`}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                                All Event Types
                            </button>
                            {occasions.map((occasion) => (
                                <Link
                                    key={occasion.slug}
                                    href={occasion.href}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2b241c]/10 bg-white px-3 py-1.5 text-xs hover:border-[#2b241c]/25"
                                >
                                    <OccasionIcon slug={occasion.slug} className="h-3.5 w-3.5" style={{ color: occasionAccent(occasion.slug) }} />
                                    {occasion.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <FormatSwitch
                        tab={tab}
                        onChange={setTab}
                        linkCount={occasions.reduce((sum, item) => sum + item.link_count, 0)}
                        cardCount={occasions.reduce((sum, item) => sum + item.card_count, 0)}
                    />

                    {visible.map((occasion) => {
                        const accent = occasionAccent(occasion.slug);
                        const designs = tab === 'cards' ? occasion.cards : occasion.links;
                        const count = tab === 'cards' ? occasion.card_count : occasion.link_count;

                        return (
                            <section key={occasion.slug} className="mt-12 border-t border-[#2b241c]/8 pt-8">
                                <div className="flex flex-wrap items-end justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <OccasionMark slug={occasion.slug} />
                                        <div>
                                            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: accent }}>
                                                <OccasionIcon slug={occasion.slug} className="h-3.5 w-3.5" style={{ color: accent }} />
                                                {occasion.name}
                                            </p>
                                            <h2 className="mt-1 font-serif text-2xl">{occasion.heading}</h2>
                                            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6d645b]">{occasion.description}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`${occasion.href}?tab=${tab}`}
                                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-white"
                                        style={{ backgroundColor: accent }}
                                    >
                                        Explore {count} {occasion.name.toLowerCase()} {tab}
                                    </Link>
                                </div>
                                <FeaturedGrid designs={designs} accent={accent} href={occasion.href} tab={tab} view={view} savedIds={favorites.ids} onFavorite={favorites.toggle} />
                            </section>
                        );
                    })}

                    <section className="mt-16 border-t border-[#2b241c]/10 pt-12 text-center">
                        <h2 className="font-serif text-3xl">Ready to start planning your next masterpiece?</h2>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <Link href="/register" className="inline-flex rounded-full bg-[#2b241c] px-6 py-3 text-sm text-[#f4efe6]">
                                Design Your Free Invite
                            </Link>
                            <Link href="/" className="inline-flex rounded-full border border-[#2b241c]/15 bg-white px-6 py-3 text-sm">
                                Browse Event Types
                            </Link>
                        </div>
                    </section>
                </main>
                <SiteFooter />
            </div>
        </>
    );
}
