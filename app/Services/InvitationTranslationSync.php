<?php

namespace App\Services;

use App\Models\Wedding;

/**
 * Ensures secondary-locale invitation copy exists for the live bilingual switch.
 * Fills empty keys by default; use $force to rebuild when secondary language changes
 * or when stored copy looks like the wrong script for the target locale.
 */
class InvitationTranslationSync
{
    /** @var list<string> */
    public const FIELD_KEYS = [
        'bride_display_name',
        'groom_display_name',
        'headline',
        'hero_message',
        'story_eyebrow',
        'story_heading',
        'story',
        'host_message',
        'gallery_eyebrow',
        'gallery_title',
        'gallery_intro',
        'guests_intro',
        'event_line',
        'attire_title',
        'attire_body',
        'gifts_intro',
        'travel_stays_notes',
        'livestream_label',
        'livestream_note',
        'wishes_intro',
        'ceremony_name',
        'reception_name',
        'ceremony_address',
        'reception_address',
        'dress_code',
        'gift_note',
        'rsvp_line',
    ];

    /** JSON detail blobs whose string leaves should be localized. */
    private const JSON_KEYS = [
        'schedule_json',
        'faq_json',
        'gifts_json',
        'travel_stays_json',
        'explore_json',
        'lineup_json',
    ];

    public function __construct(private ContentTranslator $translator) {}

    /**
     * @return array{synced: bool, locale: ?string, filled: int, forced: bool}
     */
    public function sync(Wedding $wedding, bool $force = false): array
    {
        $primary = trim((string) ($wedding->language ?: 'en'));
        $secondary = trim((string) ($wedding->secondary_language ?: ''));

        if ($secondary === '' || $secondary === $primary) {
            return ['synced' => false, 'locale' => null, 'filled' => 0, 'forced' => false];
        }

        $wedding->loadMissing('setting', 'translations', 'hosts');

        $source = $this->sourceFields($wedding);
        $existing = $wedding->translations->firstWhere('locale', $secondary)?->content ?? [];
        if (! is_array($existing)) {
            $existing = [];
        }

        if (! $force && $existing !== [] && $this->contentMismatchesLocale($secondary, $existing)) {
            $force = true;
        }

        $toTranslate = [];
        foreach ($source as $key => $value) {
            if ($value === '') {
                continue;
            }
            $current = trim((string) ($existing[$key] ?? ''));
            if (! $force && $current !== '') {
                continue;
            }
            $toTranslate[$key] = $value;
        }

        $jsonSource = $this->sourceJsonFields($wedding);
        foreach ($jsonSource as $key => $json) {
            $current = trim((string) ($existing[$key] ?? ''));
            if (! $force && $current !== '') {
                continue;
            }
            $toTranslate[$key] = $json;
        }

        if ($toTranslate === []) {
            return ['synced' => false, 'locale' => $secondary, 'filled' => 0, 'forced' => $force];
        }

        $scalars = [];
        $jsonPayloads = [];
        foreach ($toTranslate as $key => $value) {
            if (in_array($key, self::JSON_KEYS, true)) {
                $jsonPayloads[$key] = $value;
            } else {
                $scalars[$key] = $value;
            }
        }

        $translated = $scalars === []
            ? []
            : $this->translator->translateFields($scalars, $primary, $secondary);

        foreach ($jsonPayloads as $key => $json) {
            $translated[$key] = $this->translateJsonBlob($json, $primary, $secondary);
        }

        $merged = $force
            ? array_merge(
                collect($existing)->except(array_keys($translated))->all(),
                $translated,
            )
            : array_merge($existing, $translated);

        if ($force) {
            foreach (array_keys($translated) as $key) {
                $merged[$key] = $translated[$key];
            }
        }

        $wedding->translations()->updateOrCreate(
            ['locale' => $secondary],
            ['content' => $merged],
        );

        $wedding->unsetRelation('translations');

        return [
            'synced' => true,
            'locale' => $secondary,
            'filled' => count($translated),
            'forced' => $force,
        ];
    }

    /**
     * True when stored secondary copy clearly belongs to another script family
     * (e.g. Hindi Devanagari saved under Spanish locale after a prefs change).
     *
     * @param  array<string, mixed>  $content
     */
    public function contentMismatchesLocale(string $locale, array $content): bool
    {
        $sample = collect($content)
            ->filter(fn ($value): bool => is_string($value) && trim($value) !== '')
            ->take(8)
            ->implode(' ');

        if ($sample === '') {
            return false;
        }

        $hasDevanagari = (bool) preg_match('/\p{Devanagari}/u', $sample);
        $hasTamil = (bool) preg_match('/\p{Tamil}/u', $sample);
        $hasArabic = (bool) preg_match('/\p{Arabic}/u', $sample);
        $hasLatin = (bool) preg_match('/\p{Latin}/u', $sample);

        $locale = strtolower($locale);

        return match (true) {
            in_array($locale, ['es', 'fr', 'de', 'pt', 'it', 'en'], true) => $hasDevanagari || $hasTamil || $hasArabic,
            $locale === 'hi', $locale === 'mr' => $hasTamil || ($hasArabic && ! $hasDevanagari),
            $locale === 'ta' => $hasDevanagari || $hasArabic,
            $locale === 'ar' => $hasDevanagari || $hasTamil || ($hasLatin && ! $hasArabic),
            default => false,
        };
    }

    /**
     * @return array<string, string>
     */
    public function sourceFields(Wedding $wedding): array
    {
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];

        $storyBody = trim((string) ($wedding->story ?: ''));
        if ($storyBody === '') {
            $storyBody = trim((string) ($details['story_body'] ?? ''));
        }

        $hero = trim((string) ($details['hero_message'] ?? ''));
        if ($hero === '') {
            $hero = trim((string) ($wedding->host_message ?: ''));
        }
        if ($hero === '') {
            $hero = trim((string) ($wedding->headline ?: ''));
        }

        $wedding->loadMissing('hosts');

        return [
            'bride_display_name' => trim($wedding->displayBride()),
            'groom_display_name' => trim($wedding->displayGroom()),
            'headline' => trim((string) ($wedding->headline ?: ($details['kicker'] ?? ''))),
            'hero_message' => $hero,
            'story_eyebrow' => trim((string) ($details['story_eyebrow'] ?? '')),
            'story_heading' => trim((string) ($details['story_heading'] ?? '')),
            'story' => $storyBody,
            'host_message' => trim((string) ($wedding->host_message ?: '')),
            'gallery_eyebrow' => trim((string) ($details['gallery_eyebrow'] ?? '')),
            'gallery_title' => trim((string) ($details['gallery_title'] ?? '')),
            'gallery_intro' => trim((string) ($details['gallery_intro'] ?? '')),
            'guests_intro' => trim((string) ($details['guests_intro'] ?? '')),
            'event_line' => trim((string) ($details['event_line'] ?? '')),
            'attire_title' => trim((string) ($details['attire_title'] ?? '')),
            'attire_body' => trim((string) ($details['attire_body'] ?? '')),
            'gifts_intro' => trim((string) ($details['gifts_intro'] ?? '')),
            'travel_stays_notes' => trim((string) ($details['travel_stays_notes'] ?? '')),
            'livestream_label' => trim((string) ($details['livestream_label'] ?? '')),
            'livestream_note' => trim((string) ($details['livestream_note'] ?? '')),
            'wishes_intro' => trim((string) ($details['wishes_intro'] ?? '')),
            'ceremony_name' => trim((string) ($details['ceremony_name'] ?? '')),
            'reception_name' => trim((string) ($details['reception_name'] ?? '')),
            'ceremony_address' => trim((string) ($details['ceremony_address'] ?? '')),
            'reception_address' => trim((string) ($details['reception_address'] ?? '')),
            'dress_code' => trim((string) ($details['dress_code'] ?? '')),
            'gift_note' => trim((string) ($details['gift_note'] ?? '')),
            'rsvp_line' => trim((string) ($details['rsvp_line'] ?? '')),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function sourceJsonFields(Wedding $wedding): array
    {
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $out = [];
        foreach (self::JSON_KEYS as $key) {
            $raw = trim((string) ($details[$key] ?? ''));
            if ($raw === '' || $raw === '[]' || $raw === '{}') {
                continue;
            }
            $decoded = json_decode($raw, true);
            if (! is_array($decoded) || $decoded === []) {
                continue;
            }
            $out[$key] = $raw;
        }

        return $out;
    }

    private function translateJsonBlob(string $json, string $from, string $to): string
    {
        $decoded = json_decode($json, true);
        if (! is_array($decoded)) {
            return $json;
        }

        $strings = [];
        $this->collectTranslatableStrings($decoded, '', $strings);
        if ($strings === []) {
            return $json;
        }

        $translated = $this->translator->translateFields($strings, $from, $to);
        $next = $this->applyTranslatedStrings($decoded, '', $translated);

        return json_encode($next, JSON_UNESCAPED_UNICODE) ?: $json;
    }

    /**
     * @param  array<mixed>  $node
     * @param  array<string, string>  $bag
     */
    private function collectTranslatableStrings(array $node, string $path, array &$bag): void
    {
        $skipKeys = ['id', 'url', 'code', 'src', 'image', 'photo', 'time', 'date', 'lat', 'lng', 'latitude', 'longitude'];

        foreach ($node as $key => $value) {
            $segment = is_int($key) ? (string) $key : (string) $key;
            $nextPath = $path === '' ? $segment : $path.'.'.$segment;

            if (is_array($value)) {
                $this->collectTranslatableStrings($value, $nextPath, $bag);

                continue;
            }

            if (! is_string($value)) {
                continue;
            }

            $leaf = is_string($key) ? strtolower($key) : '';
            if (in_array($leaf, $skipKeys, true)) {
                continue;
            }

            $trimmed = trim($value);
            if ($trimmed === '' || filter_var($trimmed, FILTER_VALIDATE_URL)) {
                continue;
            }

            $bag[$nextPath] = $trimmed;
        }
    }

    /**
     * @param  array<mixed>  $node
     * @param  array<string, string>  $translated
     * @return array<mixed>
     */
    private function applyTranslatedStrings(array $node, string $path, array $translated): array
    {
        $out = [];
        foreach ($node as $key => $value) {
            $segment = is_int($key) ? (string) $key : (string) $key;
            $nextPath = $path === '' ? $segment : $path.'.'.$segment;

            if (is_array($value)) {
                $out[$key] = $this->applyTranslatedStrings($value, $nextPath, $translated);

                continue;
            }

            if (is_string($value) && isset($translated[$nextPath]) && trim($translated[$nextPath]) !== '') {
                $out[$key] = $translated[$nextPath];
            } else {
                $out[$key] = $value;
            }
        }

        return $out;
    }
}
