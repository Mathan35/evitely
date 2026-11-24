<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    /*
     * Resend — preferred transactional mailer for invite / RSVP emails.
     * https://resend.com → API Keys. Pair with MAIL_MAILER=resend.
     */
    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    /*
     * Twilio — automated Email (SendGrid) + SMS / WhatsApp.
     * Email: Twilio SendGrid API key → mailer "twilio_email"
     * SMS from: E.164 like +14155552671
     * WhatsApp from: whatsapp:+14155238886 (sandbox or approved sender)
     */
    'twilio' => [
        'account_sid' => env('TWILIO_ACCOUNT_SID'),
        'auth_token' => env('TWILIO_AUTH_TOKEN'),
        'sms_from' => env('TWILIO_SMS_FROM'),
        'whatsapp_from' => env('TWILIO_WHATSAPP_FROM'),
        'sendgrid_api_key' => env('TWILIO_SENDGRID_API_KEY', env('SENDGRID_API_KEY')),
    ],

    'sendgrid' => [
        'key' => env('TWILIO_SENDGRID_API_KEY', env('SENDGRID_API_KEY')),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Invitation content auto-translate (Preferences → Secondary copy + publish sync).
    | Drivers: google (stichoza/google-translate-php, default, no key),
    | mymemory, deepl (TRANSLATION_DEEPL_KEY), fake (tests).
    */
    'translation' => [
        'driver' => env('TRANSLATION_DRIVER', 'google'),
        'deepl_key' => env('TRANSLATION_DEEPL_KEY'),
    ],

    /*
     * Optional Sentry — install sentry/sentry-laravel, then set the DSN.
     * Without the package, the DSN is ignored safely.
     */
    'sentry' => [
        'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),
    ],

];
