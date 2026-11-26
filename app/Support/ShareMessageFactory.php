<?php

namespace App\Support;

use App\Models\Wedding;
use App\Models\WeddingGuest;

class ShareMessageFactory
{
    public const MAX_LENGTH = 800;

    /**
     * Public site share message (WhatsApp / Telegram / SMS / email share buttons).
     */
    public static function text(Wedding $wedding, string $url): string
    {
        return self::publicText($wedding, $url);
    }

    public static function publicText(Wedding $wedding, string $url): string
    {
        $wedding->loadMissing(['eventType', 'setting']);
        $vars = self::baseVars($wedding, $url);
        $custom = self::detailTemplate($wedding, 'share_public_template');

        if ($custom !== '') {
            $body = self::fill($custom, $vars);
            if (! self::containsUrl($body, $url)) {
                $body = trim($body)."\n".$url;
            }

            return self::clamp(trim($body));
        }

        $slug = $wedding->eventType?->slug ?? 'wedding';
        $template = EventCatalog::configuration($slug)['share'] ?? "You're invited to {{title}}.";
        $intro = self::fill($template, ['title' => $vars['title']]);

        return self::clamp(trim(implode("\n", array_filter([
            $intro,
            $vars['date'] !== '' ? $vars['date'] : null,
            $vars['time'] !== '' ? $vars['time'] : null,
            $vars['place'] !== '' ? $vars['place'] : null,
            $url,
        ]))));
    }

    /**
     * Personal guest invite (manual WhatsApp/SMS + Twilio).
     */
    public static function guestText(Wedding $wedding, WeddingGuest $guest): string
    {
        $wedding->loadMissing(['eventType', 'setting']);
        $name = trim((string) $guest->first_name) ?: 'there';
        $guestUrl = InviteHost::guestUrl($wedding->slug, (string) $guest->guest_token);
        $vars = self::baseVars($wedding, $guestUrl) + [
            'guest_name' => $name,
            'guest_url' => $guestUrl,
        ];
        $custom = self::detailTemplate($wedding, 'share_guest_template');

        if ($custom !== '') {
            $body = self::fill($custom, $vars);
            if (! self::containsUrl($body, $guestUrl)) {
                $body = trim($body)."\n".$guestUrl;
            }

            return self::clamp(trim($body));
        }

        return self::clamp("Hi {$name}, you're invited to {$vars['title']}. Open your personal invite: {$guestUrl}");
    }

    /**
     * Occasion default public intro (for editor placeholder / empty state).
     */
    public static function defaultPublicTemplate(Wedding $wedding): string
    {
        $wedding->loadMissing('eventType');
        $slug = $wedding->eventType?->slug ?? 'wedding';
        $intro = EventCatalog::configuration($slug)['share'] ?? "You're invited to {{title}}.";

        return $intro."\n{{date}}\n{{time}}\n{{place}}\n{{url}}";
    }

    public static function defaultGuestTemplate(): string
    {
        return "Hi {{guest_name}}, you're invited to {{title}}. Open your personal invite: {{guest_url}}";
    }

    /**
     * Editor / billing payload for share message templates.
     *
     * @return array{
     *     public: string,
     *     guest: string,
     *     default_public: string,
     *     default_guest: string,
     *     public_placeholders: list<string>,
     *     guest_placeholders: list<string>,
     *     preview: array{title: string, date: string, time: string, place: string, url: string, guest_name: string, guest_url: string}
     * }
     */
    public static function editorState(Wedding $wedding): array
    {
        $wedding->loadMissing(['eventType', 'setting']);
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $shareUrl = InviteHost::publicUrl($wedding->slug);
        $vars = self::baseVars($wedding, $shareUrl);

        return [
            'public' => trim((string) ($details['share_public_template'] ?? '')),
            'guest' => trim((string) ($details['share_guest_template'] ?? '')),
            'default_public' => self::defaultPublicTemplate($wedding),
            'default_guest' => self::defaultGuestTemplate(),
            'public_placeholders' => ['title', 'date', 'time', 'place', 'url'],
            'guest_placeholders' => ['title', 'date', 'time', 'place', 'guest_name', 'guest_url'],
            'preview' => [
                'title' => $vars['title'] !== '' ? $vars['title'] : 'Your celebration',
                'date' => $vars['date'] !== '' ? $vars['date'] : '12 September 2026',
                'time' => $vars['time'] !== '' ? $vars['time'] : '18:00',
                'place' => $vars['place'] !== '' ? $vars['place'] : 'Venue',
                'url' => $shareUrl,
                'guest_name' => 'Amira',
                'guest_url' => rtrim($shareUrl, '/').'/g/sample',
            ],
        ];
    }

    /**
     * Persist share templates into setting.details (merge).
     *
     * @param  array{share_public_template?: mixed, share_guest_template?: mixed}  $input
     */
    public static function persistTemplates(Wedding $wedding, array $input): void
    {
        $wedding->loadMissing('setting');
        $setting = $wedding->setting;
        if ($setting === null) {
            return;
        }

        $details = is_array($setting->details) ? $setting->details : [];
        $changed = false;

        if (array_key_exists('share_public_template', $input)) {
            $details['share_public_template'] = mb_substr(trim((string) $input['share_public_template']), 0, self::MAX_LENGTH);
            $changed = true;
        }
        if (array_key_exists('share_guest_template', $input)) {
            $details['share_guest_template'] = mb_substr(trim((string) $input['share_guest_template']), 0, self::MAX_LENGTH);
            $changed = true;
        }

        if ($changed) {
            $setting->details = $details;
            $setting->save();
        }
    }

    /**
     * @return array{whatsapp: string, telegram: string, facebook: string, email: string, sms: string}
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

    /**
     * @return array{title: string, date: string, time: string, place: string, url: string}
     */
    private static function baseVars(Wedding $wedding, string $url): array
    {
        return [
            'title' => $wedding->displayTitle(),
            'date' => $wedding->starts_on?->format('j F Y') ?? '',
            'time' => $wedding->starts_at ? substr((string) $wedding->starts_at, 0, 5) : '',
            'place' => collect([$wedding->venue_name, $wedding->city, $wedding->country])->filter()->implode(', '),
            'url' => $url,
        ];
    }

    private static function detailTemplate(Wedding $wedding, string $key): string
    {
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $value = trim((string) ($details[$key] ?? ''));

        return mb_substr($value, 0, self::MAX_LENGTH);
    }

    /**
     * @param  array<string, string>  $vars
     */
    private static function fill(string $template, array $vars): string
    {
        $replacements = [];
        foreach ($vars as $key => $value) {
            $replacements['{{'.$key.'}}'] = $value;
        }

        return strtr($template, $replacements);
    }

    private static function containsUrl(string $body, string $url): bool
    {
        return $url !== '' && str_contains($body, $url);
    }

    private static function clamp(string $text): string
    {
        return mb_substr($text, 0, self::MAX_LENGTH + 200);
    }
}
