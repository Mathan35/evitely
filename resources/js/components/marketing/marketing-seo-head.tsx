import { Head } from '@inertiajs/react';

export type MarketingFaq = { q: string; a: string };

export type MarketingSeoPayload = {
    title: string;
    description: string;
    canonical: string;
    image: string;
    type?: string;
    robots?: string;
    faqs?: MarketingFaq[];
    json_ld?: Array<Record<string, unknown>>;
};

/**
 * Search Console–ready head tags for marketing / SEO landings.
 * Titles are still suffixed with the app name by Inertia's title callback.
 */
export function MarketingSeoHead({ seo }: { seo: MarketingSeoPayload }) {
    const type = seo.type ?? 'website';
    const robots = seo.robots ?? 'index, follow';
    const schemas = seo.json_ld ?? [];

    return (
        <Head title={seo.title}>
            <meta head-key="description" name="description" content={seo.description} />
            <meta head-key="robots" name="robots" content={robots} />
            <link head-key="canonical" rel="canonical" href={seo.canonical} />

            <meta head-key="og:type" property="og:type" content={type} />
            <meta head-key="og:site_name" property="og:site_name" content="Evitely" />
            <meta head-key="og:title" property="og:title" content={seo.title} />
            <meta head-key="og:description" property="og:description" content={seo.description} />
            <meta head-key="og:url" property="og:url" content={seo.canonical} />
            <meta head-key="og:image" property="og:image" content={seo.image} />

            <meta head-key="twitter:card" name="twitter:card" content="summary_large_image" />
            <meta head-key="twitter:title" name="twitter:title" content={seo.title} />
            <meta head-key="twitter:description" name="twitter:description" content={seo.description} />
            <meta head-key="twitter:image" name="twitter:image" content={seo.image} />

            {schemas.map((schema, index) => (
                <script
                    // Inertia Head merges by key — keep FAQ / Org / WebSite distinct.
                    head-key={`ld-json-${index}`}
                    key={`ld-json-${index}`}
                    type="application/ld+json"
                >
                    {JSON.stringify(schema)}
                </script>
            ))}
        </Head>
    );
}
