<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Billing driver / gateways
    |--------------------------------------------------------------------------
    |
    | India (INR) → Razorpay. Global (USD) → Stripe Checkout.
    | BILLING_DRIVER still gates local unlocks for tests.
    |
    */
    'driver' => env(
        'BILLING_DRIVER',
        filled(env('RAZORPAY_KEY')) && filled(env('RAZORPAY_SECRET'))
            ? 'razorpay'
            : 'local',
    ),

    'gateways' => [
        'in' => 'razorpay',
        'global' => 'stripe',
    ],

    'allow_local_activate' => (bool) env(
        'BILLING_ALLOW_LOCAL_ACTIVATE',
        strtolower((string) env('BILLING_DRIVER', '')) === 'local',
    ),

    'admin_emails' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('BILLING_ADMIN_EMAILS', '')),
    ))),

    'currency' => env('BILLING_CURRENCY', 'inr'),

    // Free guest-site window after publish (long enough for a real celebration).
    'trial_days' => (int) env('BILLING_TRIAL_DAYS', 30),

    'schedule' => [
        'min_lead_hours' => 1,
        'max_lead_days' => 180,
        'require_paid_pack' => true,
        'max_publish_retries' => 5,
    ],

    /*
    |--------------------------------------------------------------------------
    | Entitlement presets (trial vs paid site)
    |--------------------------------------------------------------------------
    */
    'trial' => [
        'guest_limit' => (int) env('BILLING_TRIAL_GUEST_LIMIT', 100),
        'co_host_limit' => 1,
        'automated_messaging' => false,
        'features' => [
            // Hero layout, backgrounds & intro unlocked on trial so guests can design fully
            'intro_styles' => true,
            'hero_image' => true,
            'site_background' => true,
            'gallery_options' => false,
            'countdown_timer' => false,
            // Invitation cards stay available on free / trial; premium_templates gates paid card packs only if needed later.
            'premium_templates' => true,
            'custom_music' => false,
            'seo' => false,
            'security' => false,
            'subdomain_custom' => false,
            'remove_branding' => false,
            // Studio manage tools
            'seating' => false,
            'vendors' => false,
            'co_hosts' => false,
            'analytics_advanced' => false,
            'automated_messaging' => false,
        ],
    ],

    'paid' => [
        'guest_limit' => 500,
        'co_host_limit' => 5,
        'automated_messaging' => true,
        'features' => [
            'intro_styles' => true,
            'hero_image' => true,
            'site_background' => true,
            'gallery_options' => true,
            'countdown_timer' => true,
            'premium_templates' => true,
            'custom_music' => true,
            'seo' => true,
            'security' => true,
            'subdomain_custom' => true,
            'remove_branding' => true,
            'seating' => true,
            'vendors' => true,
            'co_hosts' => true,
            'analytics_advanced' => true,
            'automated_messaging' => true,
        ],
    ],

    /*
    | Legacy account Free/Pro labels (grandfather + receipts).
    | New purchases do not set account Pro — they set per-site packs.
    */
    'plans' => [
        'free' => [
            'name' => 'Free',
            'tagline' => 'Cards free forever · guest site free for 30 days',
            'price_label' => '₹0',
            'guest_limit' => (int) env('BILLING_TRIAL_GUEST_LIMIT', 100),
            'co_host_limit' => 1,
            'event_limit' => 1,
            'monthly_credits' => 0,
            'automated_messaging' => false,
            'features' => [
                '1 event per account',
                'Card invitations free forever',
                '30-day free guest site on publish',
                'Hero layout, backgrounds & intro styles',
                'Share personal WhatsApp / SMS links free from your phone',
                'Up to 100 guests on free trial',
            ],
        ],
        'pro' => [
            'name' => 'Pro (legacy)',
            'tagline' => 'Grandfathered account pass',
            'price_label' => 'Legacy',
            'guest_limit' => 500,
            'co_host_limit' => 5,
            'event_limit' => null,
            'monthly_credits' => 0,
            'automated_messaging' => true,
            'features' => [
                'Paid-equivalent on all sites until plan ends',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fixed site day packs (slightly better value than custom)
    |--------------------------------------------------------------------------
    | price_inr_paise / price_usd_cents are minor units.
    | FX anchor: ~₹83 ≈ $1 (USD = round(INR / 83)).
    */
    'fx_inr_per_usd' => 83,

    /*
    | Bundled price = site + message credits. Bare price = site only (credits optional later).
    | FX: ~₹83 ≈ $1.
    */
    'site_packs' => [
        'site_15' => [
            'name' => '15 days',
            'tagline' => 'Short celebrations',
            'days' => 15,
            'price_inr_paise' => 29900,
            'price_usd_cents' => 400,
            'price_label_inr' => '₹299',
            'price_label_usd' => '$4',
            'price_bare_inr_paise' => 9900,
            'price_bare_usd_cents' => 100,
            'price_label_bare_inr' => '₹99',
            'price_label_bare_usd' => '$1',
            'included_credits' => 50,
            'popular' => false,
            'features' => [
                'Full site editor',
                'All paid site features',
                'Optional message credits',
            ],
        ],
        'site_30' => [
            'name' => '30 days',
            'tagline' => 'Most events',
            'days' => 30,
            'price_inr_paise' => 59900,
            'price_usd_cents' => 700,
            'price_label_inr' => '₹599',
            'price_label_usd' => '$7',
            'price_bare_inr_paise' => 19900,
            'price_bare_usd_cents' => 200,
            'price_label_bare_inr' => '₹199',
            'price_label_bare_usd' => '$2',
            'included_credits' => 150,
            'popular' => true,
            'features' => [
                'Full site editor',
                'All paid site features',
                'Optional message credits',
            ],
        ],
        'site_50' => [
            'name' => '50 days',
            'tagline' => 'Wedding window',
            'days' => 50,
            'price_inr_paise' => 89900,
            'price_usd_cents' => 1100,
            'price_label_inr' => '₹899',
            'price_label_usd' => '$11',
            'price_bare_inr_paise' => 34900,
            'price_bare_usd_cents' => 400,
            'price_label_bare_inr' => '₹349',
            'price_label_bare_usd' => '$4',
            'included_credits' => 250,
            'popular' => false,
            'features' => [
                'Full site editor',
                'All paid site features',
                'Optional message credits',
            ],
        ],
        'site_100' => [
            'name' => '100 days',
            'tagline' => 'Long season',
            'days' => 100,
            'price_inr_paise' => 149900,
            'price_usd_cents' => 1800,
            'price_label_inr' => '₹1,499',
            'price_label_usd' => '$18',
            'price_bare_inr_paise' => 69900,
            'price_bare_usd_cents' => 800,
            'price_label_bare_inr' => '₹699',
            'price_label_bare_usd' => '$8',
            'included_credits' => 400,
            'popular' => false,
            'features' => [
                'Full site editor',
                'All paid site features',
                'Optional message credits',
            ],
        ],
    ],

    'site_custom' => [
        'min_days' => 8,
        'max_days' => 180,
        // With credits: ~₹28/day · $0.34/day · Without: ~₹18/day · $0.22/day
        'daily_inr_paise' => 2800,
        'daily_usd_cents' => 34,
        'daily_bare_inr_paise' => 1800,
        'daily_bare_usd_cents' => 22,
        'credits_per_day' => 4,
        'undercut_floor_markup' => 1.10,
        'name' => 'Custom dates',
        'tagline' => 'Pick your exact From → To window',
        'features' => [
            'Full site editor',
            'Exact start and end dates',
            'Optional message credits',
        ],
    ],

    /*
    | Feature comparison shown on event billing (Free / trial vs Paid site).
    */
    'feature_comparison' => [
        [
            'label' => 'Events per account',
            'free' => '1',
            'paid' => 'More events with Pro / extra packs',
        ],
        [
            'label' => 'Platform branding on public site',
            'free' => 'Invidora badge',
            'paid' => 'Removable',
        ],
        [
            'label' => 'Card invitations',
            'free' => 'Free forever',
            'paid' => 'Free forever',
        ],
        [
            'label' => 'Site live window',
            'free' => '30-day trial',
            'paid' => 'Chosen pack length',
        ],
        [
            'label' => 'Edit names, story, venue & guests',
            'free' => true,
            'paid' => true,
        ],
        [
            'label' => 'Default intro, hero, gallery, countdown & music',
            'free' => true,
            'paid' => true,
        ],
        [
            'label' => 'All style options & backgrounds',
            'free' => true,
            'paid' => true,
        ],
        [
            'label' => 'Invitation cards',
            'free' => true,
            'paid' => true,
        ],
        [
            'label' => 'SEO & passcode protection',
            'free' => false,
            'paid' => true,
        ],
        [
            'label' => 'Custom guest subdomain',
            'free' => false,
            'paid' => true,
        ],
        [
            'label' => 'Seating, vendors & advanced analytics',
            'free' => false,
            'paid' => true,
        ],
        [
            'label' => 'Guest limit',
            'free' => '100',
            'paid' => '500',
        ],
        [
            'label' => 'Co-hosts',
            'free' => '1',
            'paid' => '5',
        ],
        [
            'label' => 'Automated Email / SMS / WhatsApp',
            'free' => 'Manual from your phone',
            'paid' => 'Uses message credits',
        ],
        [
            'label' => 'Message credits',
            'free' => 'Buy anytime',
            'paid' => 'Optional with pack · or top up later',
        ],
    ],

    /*
    | Credit top-ups (account wallet). Also keeps legacy pack keys for receipts.
    */
    'credit_packs' => [
        'credits_100' => [
            'name' => '100 message credits',
            'credits' => 100,
            'price_inr_paise' => 29900,
            'price_usd_cents' => 600,
            'price_label_inr' => '₹299',
            'price_label_usd' => '$6',
            'price_note' => 'Top-up',
        ],
        'credits_300' => [
            'name' => '300 message credits',
            'credits' => 300,
            'price_inr_paise' => 69900,
            'price_usd_cents' => 1400,
            'price_label_inr' => '₹699',
            'price_label_usd' => '$14',
            'price_note' => 'Best small bump',
        ],
        'credits_750' => [
            'name' => '750 message credits',
            'credits' => 750,
            'price_inr_paise' => 149900,
            'price_usd_cents' => 2900,
            'price_label_inr' => '₹1,499',
            'price_label_usd' => '$29',
            'price_note' => 'Bulk',
        ],
    ],

    // Alias used by older PlanCatalog::packs() call sites.
    'packs' => [
        'credits_100' => [
            'name' => '100 message credits',
            'credits' => 100,
            'price_label' => '₹299',
            'price_note' => 'Top-up',
            'price_cents' => 29900,
            'price_inr_paise' => 29900,
            'price_usd_cents' => 600,
            'price_label_inr' => '₹299',
            'price_label_usd' => '$6',
        ],
        'credits_300' => [
            'name' => '300 message credits',
            'credits' => 300,
            'price_label' => '₹699',
            'price_note' => 'Best small bump',
            'price_cents' => 69900,
            'price_inr_paise' => 69900,
            'price_usd_cents' => 1400,
            'price_label_inr' => '₹699',
            'price_label_usd' => '$14',
        ],
        'credits_750' => [
            'name' => '750 message credits',
            'credits' => 750,
            'price_label' => '₹1,499',
            'price_note' => 'Bulk',
            'price_cents' => 149900,
            'price_inr_paise' => 149900,
            'price_usd_cents' => 2900,
            'price_label_inr' => '₹1,499',
            'price_label_usd' => '$29',
        ],
        // Legacy keys still fulfill if an old order arrives.
        'credits_200' => [
            'name' => '200 message credits',
            'credits' => 200,
            'price_label' => '₹599',
            'price_note' => 'Legacy',
            'price_cents' => 59900,
            'price_inr_paise' => 59900,
            'price_usd_cents' => 1200,
            'price_label_inr' => '₹599',
            'price_label_usd' => '$12',
        ],
        'credits_500' => [
            'name' => '500 message credits',
            'credits' => 500,
            'price_label' => '₹1,199',
            'price_note' => 'Legacy',
            'price_cents' => 119900,
            'price_inr_paise' => 119900,
            'price_usd_cents' => 2400,
            'price_label_inr' => '₹1,199',
            'price_label_usd' => '$24',
        ],
    ],

    /*
    | Legacy season passes — unsold in UI; kept for receipts / in-flight orders.
    */
    'seasons' => [
        'pro_season_6' => [
            'name' => 'Pro · 6 months',
            'tagline' => 'Legacy season pass',
            'price_label' => '₹1,499',
            'price_note' => 'one-time · 6 months',
            'price_cents' => 149900,
            'duration_months' => 6,
            'included_credits' => 200,
            'plan' => 'pro',
            'popular' => false,
            'stripe_price_id' => env('STRIPE_PRICE_PRO_SEASON_6'),
            'features' => ['Legacy account Pro'],
        ],
        'pro_season_12' => [
            'name' => 'Pro · 12 months',
            'tagline' => 'Legacy season pass',
            'price_label' => '₹2,499',
            'price_note' => 'one-time · 12 months',
            'price_cents' => 249900,
            'duration_months' => 12,
            'included_credits' => 400,
            'plan' => 'pro',
            'popular' => true,
            'stripe_price_id' => env('STRIPE_PRICE_PRO_SEASON_12'),
            'features' => ['Legacy account Pro'],
        ],
    ],

    'legacy_seasons' => true,

];
