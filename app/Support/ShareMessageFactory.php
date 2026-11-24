<?php

namespace App\Support;

use App\Models\Wedding;

class ShareMessageFactory
{
    public static function text(Wedding $wedding, string $url): string
    {
        $date = $wedding->starts_on?->format('j F Y');
        $time = $wedding->starts_at ? substr((string) $wedding->starts_at, 0, 5) : null;
        $place = collect([$wedding->venue_name, $wedding->city, $wedding->country])->filter()->implode(', ');
        $slug = $wedding->eventType?->slug ?? 'wedding';
        $template = EventCatalog::configuration($slug)['share'] ?? "You're invited to {{title}}.";
        $intro = str_replace('{{title}}', $wedding->displayTitle(), $template);

        return trim(implode("\n", array_filter([
            $intro,
            $date,
            $time,
            $place,
            $url,
        ])));
    }

    /**
     * @return array{whatsapp: string, telegram: string, facebook: string, email: string}
     */
    public static function links(string $text, string $url): array
    {
        return [
            'whatsapp' => 'https://wa.me/?text='.rawurlencode($text),
            'telegram' => 'https://t.me/share/url?url='.rawurlencode($url).'&text='.rawurlencode($text),
            'facebook' => 'https://www.facebook.com/sharer/sharer.php?u='.rawurlencode($url),
            'email' => 'mailto:?subject='.rawurlencode($text).'&body='.rawurlencode($text),
            'sms' => 'sms:?&body='.rawurlencode($text),
        ];
    }
}
