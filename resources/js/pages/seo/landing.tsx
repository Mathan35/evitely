import { Link } from '@inertiajs/react';
import { InvitePreview, type ThemeSwatch } from '@/components/marketing/invite-preview';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';
import { SiteFrame } from '@/components/marketing/site-frame';
import { register } from '@/routes';

const related = [
    ['/wedding-invitation', 'Weddings worldwide'],
    ['/indian-wedding-invitation', 'Indian weddings'],
    ['/destination-wedding-invitation', 'Destination'],
    ['/luxury-wedding-invitation', 'Luxury'],
    ['/online-wedding-invitation', 'Multi-city'],
    ['/whatsapp-wedding-invitation', 'WhatsApp'],
    ['/wedding-website', 'Wedding website'],
    ['/wedding-rsvp', 'RSVP'],
    ['/birthday-invitation', 'Birthday'],
    ['/designs', 'Designs'],
];

type SeoPreview = {
    partner_one?: string;
    partner_two?: string;
    headline?: string;
    date?: string;
    place?: string;
    events?: string[];
    label?: string;
};

export default function SeoLanding({
    page,
    themes = [],
    seo,
}: {
    page: {
        title: string;
        description: string;
        body: string;
        points: string[];
        kicker?: string;
        theme?: string;
        preview?: SeoPreview;
        faqs?: Array<{ q: string; a: string }>;
    };
    themes?: ThemeSwatch[];
    seo?: MarketingSeoPayload;
}) {
    const theme = themes.find((item) => item.id === page.theme) ?? themes[0];
    const preview = page.preview ?? {};
    const faqs = page.faqs ?? seo?.faqs ?? [];

    return (
        <>
            {seo ? (
                <MarketingSeoHead seo={seo} />
            ) : (
                <MarketingSeoHead
                    seo={{
                        title: page.title,
                        description: page.description,
                        canonical: '',
                        image: '',
                        faqs,
                    }}
                />
            )}
            <SiteFrame>
                <main className="relative overflow-hidden">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem]"
                        style={{
                            background:
                                'radial-gradient(ellipse 80% 60% at 15% 0%, rgba(198,163,106,0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 10%, rgba(28,23,18,0.06), transparent 50%)',
                        }}
                    />

                    <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:py-16">
                        <p className="text-[11px] font-medium tracking-[0.28em] text-[#8a7d6e] uppercase">
                            {page.kicker ?? 'Wedding invitation'}
                        </p>

                        <div className="mt-5 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
                            <div>
                                <h1 className="max-w-xl font-serif text-4xl leading-[1.02] tracking-tight text-[#241c16] sm:text-5xl lg:text-[3.35rem]">
                                    {page.title}
                                </h1>
                                <p className="mt-5 max-w-xl text-lg leading-8 text-[#3a3128]">{page.description}</p>
                                <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#5e554c]">{page.body}</p>

                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center justify-center rounded-xl bg-[#241c16] px-5 py-3 text-sm font-medium text-[#f6f1e8] transition hover:bg-[#3a3128]"
                                    >
                                        Create your invitation
                                    </Link>
                                    <Link
                                        href="/designs"
                                        className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-[#241c16] ring-1 ring-[#241c16]/15 transition hover:bg-[#241c16]/5"
                                    >
                                        Browse designs
                                    </Link>
                                </div>

                                <p className="mt-5 text-[12px] leading-5 text-[#8a7d6e]">
                                    Works for celebrations anywhere — share one link with guests across cities and countries.
                                </p>
                            </div>

                            {theme && (
                                <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
                                    <div
                                        aria-hidden
                                        className="absolute -inset-4 -z-10 rounded-[2rem] opacity-80 blur-2xl"
                                        style={{
                                            background: `radial-gradient(circle at 40% 30%, ${theme.secondaryColor}55, transparent 65%)`,
                                        }}
                                    />
                                    <InvitePreview
                                        theme={theme}
                                        partnerOne={preview.partner_one}
                                        partnerTwo={preview.partner_two}
                                        headline={preview.headline}
                                        date={preview.date}
                                        place={preview.place}
                                        events={preview.events}
                                        label={preview.label}
                                    />
                                </div>
                            )}
                        </div>

                        <ol className="mt-16 grid gap-5 md:grid-cols-3">
                            {page.points.map((point, index) => (
                                <li
                                    key={point}
                                    className="rounded-2xl border border-[#e7dcc8]/90 bg-white/70 p-5 shadow-[0_10px_30px_rgba(36,28,22,0.04)] backdrop-blur-sm"
                                >
                                    <p className="text-[10px] font-semibold tracking-[0.2em] text-[#c6a36a] uppercase">
                                        0{index + 1}
                                    </p>
                                    <p className="mt-3 font-serif text-xl leading-snug text-[#241c16] sm:text-2xl">
                                        {point}
                                    </p>
                                </li>
                            ))}
                        </ol>

                        {faqs.length > 0 && (
                            <div className="mt-16 border-t border-[#e7dcc8]/80 pt-10">
                                <p className="text-[11px] font-medium tracking-[0.22em] text-[#8a7d6e] uppercase">
                                    FAQ
                                </p>
                                <h2 className="mt-3 font-serif text-3xl text-[#241c16]">Common questions</h2>
                                <div className="mt-6 divide-y divide-[#e7dcc8]">
                                    {faqs.map((faq) => (
                                        <details key={faq.q} className="group py-4">
                                            <summary className="cursor-pointer list-none font-medium text-[#241c16] marker:content-none [&::-webkit-details-marker]:hidden">
                                                <span className="flex items-start justify-between gap-4">
                                                    <span>{faq.q}</span>
                                                    <span aria-hidden className="mt-0.5 shrink-0 text-[#c6a36a] transition group-open:rotate-45">
                                                        +
                                                    </span>
                                                </span>
                                            </summary>
                                            <p className="mt-3 max-w-2xl pr-8 text-sm leading-6 text-[#5e554c]">{faq.a}</p>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-16 border-t border-[#e7dcc8]/80 pt-10">
                            <p className="text-[11px] font-medium tracking-[0.22em] text-[#8a7d6e] uppercase">
                                Explore worldwide
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2.5">
                                {related.map(([href, label]) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className="rounded-full border border-[#241c16]/12 bg-white/60 px-3.5 py-2 text-sm text-[#3a3128] transition hover:border-[#241c16]/25 hover:bg-white"
                                    >
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </SiteFrame>
        </>
    );
}
