<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Stichoza\GoogleTranslate\GoogleTranslate;
use Throwable;

/**
 * Machine-translate invitation copy for bilingual sites.
 *
 * Drivers:
 * - google (default): stichoza/google-translate-php — free, no API key, strong Indian-language support
 * - mymemory: public MyMemory API
 * - deepl: TRANSLATION_DEEPL_KEY required
 * - fake: deterministic "[to]text" for tests
 */
class ContentTranslator
{
    private ?GoogleTranslate $google = null;

    /**
     * @param  array<string, string|null>  $fields
     * @return array<string, string>
     */
    public function translateFields(array $fields, string $from, string $to): array
    {
        $from = $this->normalizeLocale($from);
        $to = $this->normalizeLocale($to);

        if ($from === $to) {
            return collect($fields)
                ->map(fn ($value): string => trim((string) $value))
                ->all();
        }

        $translated = [];

        foreach ($fields as $key => $value) {
            $text = trim((string) $value);
            if ($text === '') {
                $translated[$key] = '';

                continue;
            }

            try {
                $translated[$key] = $this->translate($text, $from, $to);
            } catch (Throwable $exception) {
                Log::warning('Content translation failed', [
                    'key' => $key,
                    'from' => $from,
                    'to' => $to,
                    'error' => $exception->getMessage(),
                ]);
                $translated[$key] = $text;
            }
        }

        return $translated;
    }

    public function translate(string $text, string $from, string $to): string
    {
        $from = $this->normalizeLocale($from);
        $to = $this->normalizeLocale($to);
        $driver = config('services.translation.driver', 'google');

        return match ($driver) {
            'fake' => $this->viaFake($text, $to),
            'mymemory' => $this->viaMyMemory($text, $from, $to),
            'deepl' => $this->viaDeepL($text, $from, $to),
            default => $this->viaGoogle($text, $from, $to),
        };
    }

    private function viaGoogle(string $text, string $from, string $to): string
    {
        $tr = $this->google ??= new GoogleTranslate;
        $tr->setSource($from);
        $tr->setTarget($to);

        $out = trim((string) $tr->translate($text));
        if ($out === '') {
            throw new RuntimeException('Google translate returned empty text');
        }

        return $out;
    }

    private function viaFake(string $text, string $to): string
    {
        return '['.$to.']'.$text;
    }

    private function viaMyMemory(string $text, string $from, string $to): string
    {
        $response = Http::timeout(20)
            ->acceptJson()
            ->get('https://api.mymemory.translated.net/get', [
                'q' => $text,
                'langpair' => $from.'|'.$to,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('MyMemory translate request failed ('.$response->status().')');
        }

        $out = trim((string) data_get($response->json(), 'responseData.translatedText', ''));
        if ($out === '') {
            throw new RuntimeException('MyMemory translate returned empty text');
        }

        return html_entity_decode($out, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    private function viaDeepL(string $text, string $from, string $to): string
    {
        $key = (string) config('services.translation.deepl_key', '');
        if ($key === '') {
            throw new RuntimeException('TRANSLATION_DEEPL_KEY is not configured');
        }

        $endpoint = str_contains($key, ':fx')
            ? 'https://api-free.deepl.com/v2/translate'
            : 'https://api.deepl.com/v2/translate';

        $response = Http::timeout(20)
            ->asForm()
            ->withHeaders(['Authorization' => 'DeepL-Auth-Key '.$key])
            ->post($endpoint, [
                'text' => $text,
                'source_lang' => strtoupper($from),
                'target_lang' => strtoupper($to),
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('DeepL translate request failed ('.$response->status().')');
        }

        $out = trim((string) data_get($response->json(), 'translations.0.text', ''));
        if ($out === '') {
            throw new RuntimeException('DeepL translate returned empty text');
        }

        return $out;
    }

    private function normalizeLocale(string $locale): string
    {
        $locale = strtolower(trim($locale));
        $map = [
            'zh' => 'zh-CN',
            'pt' => 'pt',
            'iw' => 'he',
        ];

        return $map[$locale] ?? $locale;
    }
}
