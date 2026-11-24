<?php

return [

    'key' => env('RAZORPAY_KEY'),

    'secret' => env('RAZORPAY_SECRET'),

    'webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    |
    | Razorpay amounts are always in the smallest currency unit (paise for INR).
    |
    */
    'currency' => strtoupper((string) env('RAZORPAY_CURRENCY', env('BILLING_CURRENCY', 'INR'))),

];
