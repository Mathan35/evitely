<?php

namespace App\Support;

class WeddingCatalog
{
    /**
     * @return array<string, mixed>
     */
    public static function options(): array
    {
        return [
            'themes' => array_values(config('wedding.themes')),
            'styles' => config('wedding.styles'),
            'cultures' => config('wedding.cultures'),
            'locales' => config('wedding.locales'),
            'meals' => config('wedding.meal_preferences'),
            'event_suggestions' => config('wedding.event_suggestions'),
            'occasions' => config('wedding.occasions'),
            'timezones' => [
                'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London',
                'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', 'UTC',
            ],
            'sections' => config('wedding.sections'),
        ];
    }
}
