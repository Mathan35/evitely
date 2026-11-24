<?php

return [

    /*
    | Owner admin console (/admin) — PLATFORM_ADMIN_EMAILS only.
    | Do not reuse BILLING_ADMIN_EMAILS here; billing has its own list.
    */
    'admin_emails' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('PLATFORM_ADMIN_EMAILS', '')),
    ))),

    /*
    | Host digest — daily email of new RSVPs / wishes / photos.
    */
    'host_digest_enabled' => (bool) env('HOST_DIGEST_ENABLED', true),

    'host_digest_hour' => (int) env('HOST_DIGEST_HOUR', 8),

    /*
    | Default RSVP reminder window (days before event start).
    */
    'rsvp_reminder_days_before' => (int) env('RSVP_REMINDER_DAYS_BEFORE', 7),

    'rsvp_reminders_default_enabled' => (bool) env('RSVP_REMINDERS_DEFAULT_ENABLED', true),

];
