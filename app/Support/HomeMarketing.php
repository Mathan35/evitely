<?php

namespace App\Support;

use App\Enums\WeddingStatus;
use App\Models\Wedding;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class HomeMarketing
{
    /**
     * Curated home-page payload: gallery strip, live samples, pricing, FAQ.
     *
     * @return array{
     *     designs: list<array<string, mixed>>,
     *     samples: list<array<string, mixed>>,
     *     pricing: list<array<string, mixed>>,
     *     faqs: list<array{q: string, a: string}>
     * }
     */
    public static function payload(): array
    {
        return Cache::remember('home.marketing.payload.v8', 120, static function (): array {
            return [
                'designs' => self::designStrip(),
                'samples' => self::samples(),
                'flagships' => self::flagships(),
                'pricing' => self::pricing(),
                'faqs' => self::faqs(),
            ];
        });
    }

    /**
     * Curated “open a real invite” demos for marketing trust.
     *
     * @return list<array{id: string, title: string, blurb: string, occasion: string, href: string, image: string}>
     */
    public static function flagships(): array
    {
        $fromLive = collect(self::samples())
            ->take(3)
            ->values()
            ->map(function (array $sample, int $i): array {
                $eyebrow = (string) ($sample['eyebrow'] ?? 'Live invite');

                return [
                    'id' => 'live-'.$i,
                    'title' => (string) ($sample['title'] ?? 'Live celebration'),
                    'blurb' => (string) ($sample['text'] ?? 'Open the guest site — mobile-perfect.'),
                    'occasion' => Str::after($eyebrow, 'Live ') ?: 'Celebration',
                    'href' => (string) ($sample['href'] ?? '/designs'),
                    'image' => (string) ($sample['image'] ?? '/images/home/ui-timeline.jpg'),
                ];
            })
            ->all();

        if (count($fromLive) >= 3) {
            return $fromLive;
        }

        $catalog = [
            [
                'id' => 'flag-black-tie',
                'title' => 'Black Tie & candlelight',
                'blurb' => 'Formal night wedding — seal intro, countdown, RSVP.',
                'occasion' => 'Wedding',
                'href' => '/designs/wedding',
                'image' => '/images/home/ui-timeline.jpg',
            ],
            [
                'id' => 'flag-mehendi',
                'title' => 'Mehendi to reception',
                'blurb' => 'Multi-day Indian itinerary on one guest link.',
                'occasion' => 'Wedding',
                'href' => '/designs/wedding',
                'image' => '/images/home/ui-share.jpg',
            ],
            [
                'id' => 'flag-garden',
                'title' => 'Garden brunch vows',
                'blurb' => 'Soft daylight site with photo wall and music.',
                'occasion' => 'Wedding',
                'href' => '/designs/wedding',
                'image' => '/images/home/ui-timeline.jpg',
            ],
            [
                'id' => 'flag-midnight',
                'title' => 'Midnight birthday',
                'blurb' => 'Neon party site guests actually forward.',
                'occasion' => 'Birthday',
                'href' => '/designs/birthday',
                'image' => '/images/home/ui-share.jpg',
            ],
            [
                'id' => 'flag-naming',
                'title' => 'Baby naming morning',
                'blurb' => 'Warm family site with wishes wall.',
                'occasion' => 'Baby shower',
                'href' => '/designs/baby-shower',
                'image' => '/images/home/ui-timeline.jpg',
            ],
        ];

        return array_values(array_merge($fromLive, array_slice($catalog, 0, 5 - count($fromLive))));
    }

    /**
     * Hand-picked Design Gallery guest websites (same assets as /designs links tab).
     *
     * @return list<array<string, mixed>>
     */
    public static function designStrip(): array
    {
        /** @var list<string> Real site (link) design ids from DesignGallery */
        $picks = [
            'wedding-link-black-tie',
            'wedding-link-glasshouse',
            'wedding-link-rose-gold',
            'wedding-link-fairytale',
            'birthday-link-midnight-velvet',
            'birthday-link-gold-leaf-40',
            'corporate-link-tech-frontier',
            'corporate-link-leadership',
            'baby-shower-link-woodland',
            'party-link-neon-glow',
            'graduation-link-scholar-cap',
            'bridal-shower-link-miss-to-mrs',
            'housewarming-link-hearth',
        ];

        $items = [];

        foreach ($picks as $id) {
            $resolved = DesignGallery::find($id);

            if ($resolved === null || ($resolved['design']['kind'] ?? '') !== 'link') {
                continue;
            }

            $design = $resolved['design'];
            $slug = (string) $resolved['slug'];
            $occasion = DesignGallery::occasion($slug) ?? ['name' => Str::headline($slug), 'event_type' => $slug];

            $items[] = self::stripItem($slug, (string) ($occasion['name'] ?? $slug), $design);
        }

        return $items;
    }

    /**
     * Prefer live published guest sites; fall back to catalog site designs so home
     * always shows site samples alongside the Black Tie card.
     *
     * @return list<array<string, mixed>>
     */
    public static function samples(): array
    {
        $published = Wedding::query()
            ->where('status', WeddingStatus::Published)
            ->whereIn('invitation_mode', ['link', 'both'])
            ->with('eventType:id,slug,name')
            ->latest('published_at')
            ->limit(8)
            ->get();

        $samples = [];
        $usedIds = [];

        $wedding = $published->first(function (Wedding $wedding): bool {
            $slug = Str::lower((string) ($wedding->eventType?->slug ?? ''));

            return str_contains($slug, 'wedding') || str_contains(Str::lower($wedding->title), 'wedding');
        }) ?? $published->first(fn (Wedding $w) => str_contains(Str::lower($w->slug), 'wedding') || str_contains(Str::lower($w->slug), 'aria'));

        if ($wedding) {
            $usedIds[] = $wedding->id;
            $samples[] = [
                'eyebrow' => 'Live wedding site',
                'title' => $wedding->title,
                'text' => 'Open the guest experience — countdown, story, venue, and RSVP.',
                'href' => '/invite/'.$wedding->slug,
                'cta' => 'Open sample',
                'image' => self::coverOr('/images/wedding/hero-phones.jpg', $wedding->cover_image),
                'image_alt' => $wedding->title.' invitation preview',
            ];
        } else {
            $fallback = self::catalogSiteSample(
                'wedding-link-black-tie',
                'Sample wedding site',
                'Open a full guest website — countdown, story, venue, and RSVP.',
            );
            if ($fallback !== null) {
                $samples[] = $fallback;
            }
        }

        $second = $published->first(function (Wedding $wedding) use ($usedIds): bool {
            if (in_array($wedding->id, $usedIds, true)) {
                return false;
            }

            $slug = Str::lower((string) ($wedding->eventType?->slug ?? ''));

            return str_contains($slug, 'corporate')
                || str_contains($slug, 'conference')
                || str_contains(Str::lower($wedding->title), 'summit');
        }) ?? $published->first(fn (Wedding $wedding): bool => ! in_array($wedding->id, $usedIds, true));

        if ($second) {
            $typeSlug = Str::lower((string) ($second->eventType?->slug ?? 'event'));
            $label = str_contains($typeSlug, 'corporate') || str_contains($typeSlug, 'conference')
                ? 'Live corporate site'
                : 'Live '.Str::headline($typeSlug !== '' ? $typeSlug : 'event').' site';

            $samples[] = [
                'eyebrow' => $label,
                'title' => $second->title,
                'text' => 'See how agendas, schedule, and guest details feel on a phone.',
                'href' => '/invite/'.$second->slug,
                'cta' => 'Open sample',
                'image' => self::coverOr('/images/home/occasions/corporate-phones.jpg', $second->cover_image),
                'image_alt' => $second->title.' invitation preview',
            ];
        } else {
            $fallback = self::catalogSiteSample(
                'corporate-link-tech-frontier',
                'Sample corporate site',
                'See how agendas, speakers, and attendance feel on a phone.',
            ) ?? self::catalogSiteSample(
                'birthday-link-midnight-velvet',
                'Sample birthday site',
                'Open a guest birthday website — countdown, details, and wishes.',
            );
            if ($fallback !== null) {
                $samples[] = $fallback;
            }
        }

        $blackTie = DesignGallery::find('wedding-card-black-tie');

        if ($blackTie !== null && ($blackTie['design']['kind'] ?? '') === 'card') {
            $card = $blackTie['design'];
            $samples[] = [
                'eyebrow' => 'Sample wedding card',
                'title' => (string) $card['name'],
                'text' => 'The same Black Tie Grandeur card from Designs — sample names, date, and venue already filled in.',
                'href' => '/designs/wedding?tab=cards',
                'cta' => 'View sample card',
                'image' => (string) ($card['image_mobile'] ?? $card['image'] ?? ''),
                'image_alt' => (string) $card['name'].' invitation card',
                'card' => $card,
            ];
        }

        return array_values(array_slice($samples, 0, 3));
    }

    /**
     * Catalog link design used when no published live site is available.
     *
     * @return array<string, mixed>|null
     */
    private static function catalogSiteSample(string $designId, string $eyebrow, string $text): ?array
    {
        $resolved = DesignGallery::find($designId);

        if ($resolved === null || ($resolved['design']['kind'] ?? '') !== 'link') {
            return null;
        }

        $design = $resolved['design'];
        $slug = (string) $resolved['slug'];

        return [
            'eyebrow' => $eyebrow,
            'title' => (string) ($design['name'] ?? 'Guest website'),
            'text' => $text,
            'href' => '/designs/'.$slug.'?tab=links',
            'cta' => 'Open sample site',
            'image' => (string) ($design['image_mobile'] ?? $design['image'] ?? ''),
            'image_alt' => (string) ($design['name'] ?? 'Guest website').' invitation preview',
            'site' => $design,
        ];
    }

    /**
     * Product pricing: Free, day packs (billing catalog), Message credits.
     *
     * @return list<array<string, mixed>>
     */
    public static function pricing(): array
    {
        $free = config('billing.plans.free', []);
        $trialDays = (int) config('billing.trial_days', 30);
        $packs = config('billing.site_packs', []);
        $fromPack = $packs['site_15'] ?? reset($packs) ?: [];
        $creditPacks = config('billing.credit_packs', []);
        $creditFrom = $creditPacks['credits_100'] ?? reset($creditPacks) ?: [];
        $custom = config('billing.site_custom', []);
        $paid = config('billing.paid', []);

        $fromLabel = (string) ($fromPack['price_label_bare_inr'] ?? $fromPack['price_label_inr'] ?? '₹99');
        $fromDays = (int) ($fromPack['days'] ?? 15);
        $creditFromLabel = (string) ($creditFrom['price_label_inr'] ?? '₹299');
        $creditFromCount = (int) ($creditFrom['credits'] ?? 100);
        $guestPaid = (int) ($paid['guest_limit'] ?? 500);
        $coHostPaid = (int) ($paid['co_host_limit'] ?? 5);

        $dayPacks = [];
        foreach ($packs as $id => $pack) {
            if (! is_array($pack)) {
                continue;
            }

            $days = (int) ($pack['days'] ?? 0);
            $barePaise = (int) ($pack['price_bare_inr_paise'] ?? $pack['price_inr_paise'] ?? 0);
            $priceLabel = (string) ($pack['price_label_bare_inr'] ?? $pack['price_label_inr'] ?? '');
            $perDay = null;

            if ($days > 0 && $barePaise > 0) {
                $rupeesPerDay = round($barePaise / $days) / 100;
                $perDay = '₹'.($rupeesPerDay < 10
                    ? number_format($rupeesPerDay, 2, '.', '')
                    : number_format($rupeesPerDay, 0, '.', ''));
            }

            $dayPacks[] = [
                'id' => (string) $id,
                'name' => (string) ($pack['name'] ?? $days.' days'),
                'tagline' => (string) ($pack['tagline'] ?? ''),
                'days' => $days,
                'price' => $priceLabel,
                'per_day' => $perDay,
                'credits' => (int) ($pack['included_credits'] ?? 0),
                'popular' => (bool) ($pack['popular'] ?? false),
            ];
        }

        $creditOptions = [];
        foreach ($creditPacks as $id => $pack) {
            if (! is_array($pack)) {
                continue;
            }

            // Skip legacy aliases — only current top-up SKUs on the home page.
            if (! str_starts_with((string) $id, 'credits_') || in_array((string) $id, ['credits_200', 'credits_500'], true)) {
                continue;
            }

            $creditOptions[] = [
                'id' => (string) $id,
                'name' => (string) ($pack['name'] ?? ''),
                'credits' => (int) ($pack['credits'] ?? 0),
                'price' => (string) ($pack['price_label_inr'] ?? ''),
                'note' => (string) ($pack['price_note'] ?? ''),
            ];
        }

        $customMin = (int) ($custom['min_days'] ?? 8);
        $customMax = (int) ($custom['max_days'] ?? 180);
        $customDailyBare = (int) ($custom['daily_bare_inr_paise'] ?? 1800);
        $customPerDay = $customDailyBare > 0
            ? '₹'.number_format(round($customDailyBare) / 100, $customDailyBare < 1000 ? 2 : 0, '.', '')
            : null;

        return [
            [
                'name' => (string) ($free['name'] ?? 'Free'),
                'tagline' => (string) ($free['tagline'] ?? 'Cards free · site trial on publish'),
                'price' => 'Free',
                'period' => 'Forever',
                'note' => 'Publish starts a '.$trialDays.'-day guest-site trial. Extend with a day pack anytime.',
                'points' => [
                    'Invitation cards free forever',
                    '1 event · '.$trialDays.'-day site trial on publish',
                    'Share your invite link yourself from WhatsApp — free',
                    'Up to '.(int) (config('billing.trial.guest_limit') ?? $free['guest_limit'] ?? 100).' guests on trial',
                ],
                'cta' => 'Get started',
            ],
            [
                'name' => 'Guest websites',
                'tagline' => 'Pay only for the days your site stays live',
                'price' => $fromLabel,
                'period' => 'from · '.$fromDays.' days',
                'badge' => 'Most Popular',
                'highlight' => true,
                'includes_label' => 'Day packs (site only)',
                'note' => 'Prices above are site days only — not message sends. Add message credits at checkout if you want Invidora to email or text guests for you. Custom dates '.$customMin.'–'.$customMax.' days'
                    .($customPerDay ? ' · from '.$customPerDay.'/day' : '').'.',
                'points' => [
                    'Full studio: RSVP, maps, schedule, music & guest wall',
                    'Remove branding · custom subdomain · up to '.$guestPaid.' guests',
                    'Co-hosts ('.$coHostPaid.') · seating · vendors · analytics',
                ],
                'day_packs' => $dayPacks,
                'custom' => [
                    'label' => (string) ($custom['name'] ?? 'Custom dates'),
                    'tagline' => (string) ($custom['tagline'] ?? 'Exact From → To window'),
                    'range' => $customMin.'–'.$customMax.' days',
                    'per_day' => $customPerDay,
                ],
                'cta' => 'Get started',
            ],
            [
                'name' => 'Message credits',
                'tagline' => 'Pay only when Invidora sends invites for you',
                'price' => $creditFromLabel,
                'period' => 'from · '.$creditFromCount.' credits',
                'includes_label' => 'Credit packs',
                'note' => 'Optional. Skip this if you share the link yourself. Works with Free or a paid site.',
                'points' => [
                    'Automated bulk send to guest emails or phone numbers',
                    'Invidora delivers by email, SMS, or WhatsApp — 1 credit ≈ 1 send',
                    'Paste a list once; we message everyone for you',
                    'Personal link shares from your phone stay free forever',
                ],
                'credit_options' => $creditOptions,
                'cta' => 'Get started',
            ],
        ];
    }

    /**
     * @return list<array{q: string, a: string}>
     */
    public static function faqs(): array
    {
        return [
            [
                'q' => 'Are digital cards really free?',
                'a' => 'Yes. Invitation cards stay free forever. Guest websites include a '.(int) config('billing.trial_days', 30).'-day free trial when you publish (up to '.(int) config('billing.trial.guest_limit', 100).' guests). Paid site packs extend the live window and unlock extras. Sharing personal WhatsApp or SMS links from your phone stays free.',
            ],
            [
                'q' => 'What are personal guest links?',
                'a' => 'Each invitee gets their own URL. You see who opened, who replied, and can resend WhatsApp or SMS to that person — not a single shared link where everyone looks the same.',
            ],
            [
                'q' => 'Can the invite be bilingual?',
                'a' => 'Yes. Set a primary and secondary language in Preferences. Guests switch language on the live site without you designing two separate invites.',
            ],
            [
                'q' => 'Card or website — which should I pick?',
                'a' => 'Choose a cinematic card for a single elegant open. Choose a website when you need RSVP, maps, schedule, music, or a guest wall. Many hosts use both.',
            ],
            [
                'q' => 'Do my guests need an account?',
                'a' => 'No. Guests open your link, reply, and leave wishes without signing up.',
            ],
            [
                'q' => 'What are message credits?',
                'a' => 'Message credits pay for automated sharing: paste guest emails or phone numbers and Invidora sends the invite for you in bulk (email, SMS, or WhatsApp), including auto-share when a scheduled site goes live. One credit is roughly one send. Sharing the link yourself from your phone is always free — buy credits only if you want us to deliver for you.',
            ],
            [
                'q' => 'When should I publish?',
                'a' => 'Publish when the invite is ready for guests. Publishing starts a '.(int) config('billing.trial_days', 30).'-day free site try — share with friends first, then extend with a day pack if you need more time. Schedule a future go-live after you pick a paid pack.',
            ],
            [
                'q' => 'Do you support QR codes and seating?',
                'a' => 'Yes. On Manage you can print a QR pack for tables and build seating charts so guests find their place on the day.',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $design
     * @return array<string, mixed>
     */
    private static function stripItem(string $slug, string $occasionName, array $design): array
    {
        $id = (string) $design['id'];
        $kind = (string) ($design['kind'] ?? 'card');
        $theme = (string) ($design['theme'] ?? 'classic');
        $format = (string) ($design['format'] ?? 'portrait');
        $eventType = (string) ($design['event_type'] ?? $slug);

        $params = [
            'event_type' => $eventType,
            'invitation_mode' => $kind === 'card' ? 'card' : 'link',
            'gallery_template' => $id,
            'theme' => $theme,
        ];

        if ($kind === 'card') {
            $params['card_template'] = $id;
            $params['card_format'] = $format;
        }

        $item = [
            'id' => $id,
            'name' => (string) $design['name'],
            'kind' => $kind,
            'occasion' => $slug,
            'occasion_name' => $occasionName,
            'image' => (string) ($design['image_mobile'] ?? $design['image'] ?? ''),
            'href' => '/designs/'.$slug.'?tab='.($kind === 'link' ? 'links' : 'cards'),
            'customize_href' => '/events/create?'.http_build_query($params),
        ];

        if ($kind === 'link') {
            $item['site'] = $design;
        } else {
            $item['card'] = $design;
        }

        return $item;
    }

    private static function coverOr(string $fallback, ?string $cover): string
    {
        if (is_string($cover) && $cover !== '') {
            if (Str::startsWith($cover, ['http://', 'https://', '/'])) {
                return $cover;
            }

            return '/storage/'.$cover;
        }

        return $fallback;
    }
}
