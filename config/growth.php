<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Referral rewards
    |--------------------------------------------------------------------------
    |
    | Friend signs up with your code, then publishes → you get a coupon for
    | percent-off the *site pack cost only* (message credits stay full price).
    |
    */
    'referral' => [
        'enabled' => (bool) env('GROWTH_REFERRAL_ENABLED', true),
        'coupon_percent' => (int) env('GROWTH_REFERRAL_COUPON_PERCENT', 50),
        // Legacy keys kept for older env files; unused by the coupon reward path.
        'reward_site_days' => (int) env('GROWTH_REFERRAL_SITE_DAYS', 0),
        'reward_credits' => (int) env('GROWTH_REFERRAL_CREDITS', 0),
    ],

    /*
    | Partner / photographer codes — extra free trial days on first publish.
    | Seeded into partner_codes; admins can add more later via DB.
    */
    'partner' => [
        'enabled' => (bool) env('GROWTH_PARTNER_ENABLED', true),
        'default_bonus_days' => (int) env('GROWTH_PARTNER_BONUS_DAYS', 14),
        'seed' => [
            ['code' => 'PHOTOGRAPHY', 'label' => 'Photographers', 'bonus_trial_days' => 14],
            ['code' => 'PLANNER', 'label' => 'Wedding planners', 'bonus_trial_days' => 14],
            ['code' => 'MEHENDI', 'label' => 'Mehendi artists', 'bonus_trial_days' => 10],
        ],
    ],

    /*
    | Soft paywall: push day packs only after the host has shared at least once.
    */
    'defer_paywall_until_share' => true,
    'share_goal' => 3,

];
