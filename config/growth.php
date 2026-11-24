<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Referral rewards
    |--------------------------------------------------------------------------
    |
    | Friend signs up with your code, then publishes → you get bonus site days
    | on your latest active event + message credits.
    |
    */
    'referral' => [
        'enabled' => (bool) env('GROWTH_REFERRAL_ENABLED', true),
        'reward_site_days' => (int) env('GROWTH_REFERRAL_SITE_DAYS', 7),
        'reward_credits' => (int) env('GROWTH_REFERRAL_CREDITS', 25),
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
