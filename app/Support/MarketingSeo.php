<?php

namespace App\Support;

use App\Http\Controllers\SeoPageController;

class MarketingSeo
{
    /**
     * Default social / Open Graph image (absolute URL).
     */
    public static function defaultImage(): string
    {
        return url('/images/gallery/wedding/card-black-tie-desktop.jpg');
    }

    /**
     * @param  list<array{q: string, a: string}>|null  $faqs
     * @return array{
     *     title: string,
     *     description: string,
     *     canonical: string,
     *     image: string,
     *     type: string,
     *     robots: string,
     *     faqs: list<array{q: string, a: string}>,
     *     json_ld: list<array<string, mixed>>
     * }
     */
    public static function page(
        string $title,
        string $description,
        string $path = '/',
        ?string $image = null,
        ?array $faqs = null,
        string $type = 'website',
        string $robots = 'index, follow',
        bool $includeOrganization = false,
    ): array {
        $canonical = self::canonical($path);
        $imageUrl = $image ?: self::defaultImage();
        $faqList = $faqs ?? [];

        $jsonLd = [];

        if ($includeOrganization) {
            $jsonLd[] = self::organizationSchema();
            $jsonLd[] = self::websiteSchema($canonical, $description);
        }

        if ($faqList !== []) {
            $jsonLd[] = self::faqSchema($faqList);
        }

        return [
            'title' => $title,
            'description' => $description,
            'canonical' => $canonical,
            'image' => $imageUrl,
            'type' => $type,
            'robots' => $robots,
            'faqs' => $faqList,
            'json_ld' => $jsonLd,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function home(): array
    {
        $trialDays = (int) config('billing.trial_days', 30);

        return self::page(
            'Free digital invitations & guest websites',
            "Create beautiful digital invitation cards free forever. Guest websites free for {$trialDays} days — RSVP, WhatsApp share, schedules, and maps. Start in minutes with Invidora.",
            '/',
            null,
            HomeMarketing::faqs(),
            'website',
            'index, follow',
            true,
        );
    }

    /**
     * @param  array<string, mixed>  $page
     * @return array<string, mixed>
     */
    public static function seoLanding(string $slug, array $page): array
    {
        $title = (string) ($page['title'] ?? 'Invitation');
        $description = (string) ($page['description'] ?? '');
        $faqs = is_array($page['faqs'] ?? null) ? $page['faqs'] : self::defaultLandingFaqs();

        return self::page(
            $title,
            $description,
            '/'.$slug,
            null,
            $faqs,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public static function designs(): array
    {
        return self::page(
            'Invitation designs for every event',
            'Browse unique event websites and digital cards for weddings, birthdays, corporate events, baby showers, parties, graduations, bridal showers, housewarmings, and custom celebrations.',
            '/designs',
        );
    }

    /**
     * @param  array<string, mixed>|null  $gallery
     * @return array<string, mixed>
     */
    public static function designOccasion(string $slug, ?array $gallery): array
    {
        $heading = is_array($gallery)
            ? (string) ($gallery['heading'] ?? $gallery['name'] ?? 'Invitation designs')
            : 'Invitation designs';
        $description = is_array($gallery)
            ? (string) ($gallery['description'] ?? 'Browse invitation websites and digital cards.')
            : 'Browse invitation websites and digital cards.';

        return self::page($heading, $description, '/designs/'.$slug);
    }

    /**
     * @return array<string, mixed>
     */
    public static function weddingFormats(): array
    {
        return self::page(
            'Choose your wedding invitation format',
            'Compare cinematic invitation cards and full guest websites — RSVP, maps, schedule, and WhatsApp-ready links for your wedding.',
            '/designs/weddings',
        );
    }

    /**
     * @return array<string, mixed>
     */
    public static function legal(string $name, string $path): array
    {
        $app = (string) config('app.name', 'Invidora');

        return self::page(
            "{$name} · {$app}",
            "{$name} for {$app} digital invitations and guest websites.",
            $path,
            null,
            [],
            'website',
            'index, follow',
        );
    }

    /**
     * Absolute URLs for the public XML sitemap.
     *
     * @return list<array{loc: string, changefreq: string, priority: string}>
     */
    public static function sitemapEntries(): array
    {
        $entries = [
            ['loc' => url('/'), 'changefreq' => 'weekly', 'priority' => '1.0'],
            ['loc' => url('/designs'), 'changefreq' => 'weekly', 'priority' => '0.9'],
            ['loc' => url('/designs/weddings'), 'changefreq' => 'monthly', 'priority' => '0.8'],
            ['loc' => url('/privacy'), 'changefreq' => 'yearly', 'priority' => '0.3'],
            ['loc' => url('/terms'), 'changefreq' => 'yearly', 'priority' => '0.3'],
            ['loc' => url('/cookies'), 'changefreq' => 'yearly', 'priority' => '0.3'],
            ['loc' => url('/refund'), 'changefreq' => 'yearly', 'priority' => '0.3'],
            ['loc' => url('/cancellation'), 'changefreq' => 'yearly', 'priority' => '0.3'],
            ['loc' => url('/support'), 'changefreq' => 'monthly', 'priority' => '0.5'],
        ];

        foreach (DesignGallery::occasions() as $occasion) {
            $slug = (string) ($occasion['slug'] ?? '');
            if ($slug === '') {
                continue;
            }
            $entries[] = [
                'loc' => url('/designs/'.$slug),
                'changefreq' => 'weekly',
                'priority' => '0.8',
            ];
        }

        foreach (array_keys(SeoPageController::pages()) as $page) {
            $entries[] = [
                'loc' => url('/'.$page),
                'changefreq' => 'monthly',
                'priority' => '0.85',
            ];
        }

        return $entries;
    }

    public static function canonical(string $path): string
    {
        $path = '/'.ltrim($path, '/');
        if ($path === '/') {
            return url('/');
        }

        return url($path);
    }

    /**
     * @return list<array{q: string, a: string}>
     */
    public static function defaultLandingFaqs(): array
    {
        $trialDays = (int) config('billing.trial_days', 30);
        $guestLimit = (int) config('billing.trial.guest_limit', 100);

        return [
            [
                'q' => 'Are digital invitation cards free?',
                'a' => "Yes. Invitation cards stay free forever on Invidora. Guest websites include a {$trialDays}-day free trial when you publish (up to {$guestLimit} guests).",
            ],
            [
                'q' => 'Do my guests need an account?',
                'a' => 'No. Guests open your link, RSVP, and leave wishes without signing up.',
            ],
            [
                'q' => 'Can I share the invitation on WhatsApp?',
                'a' => 'Yes. Share a personal link from your phone for free, or use optional message credits if you want Invidora to send bulk email, SMS, or WhatsApp invites for you.',
            ],
            [
                'q' => 'What is included in a guest website?',
                'a' => 'Schedule, map, RSVP, gallery, music, and travel notes — one link that works on any phone.',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function organizationSchema(): array
    {
        $name = (string) config('app.name', 'Invidora');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $name,
            'url' => url('/'),
            'logo' => url('/favicon.svg'),
            'description' => 'Digital invitation cards and guest websites for weddings and celebrations worldwide.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function websiteSchema(string $canonical, string $description): array
    {
        $name = (string) config('app.name', 'Invidora');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $name,
            'url' => $canonical,
            'description' => $description,
        ];
    }

    /**
     * @param  list<array{q: string, a: string}>  $faqs
     * @return array<string, mixed>
     */
    private static function faqSchema(array $faqs): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => array_values(array_map(static function (array $faq): array {
                return [
                    '@type' => 'Question',
                    'name' => (string) ($faq['q'] ?? ''),
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text' => (string) ($faq['a'] ?? ''),
                    ],
                ];
            }, $faqs)),
        ];
    }
}
