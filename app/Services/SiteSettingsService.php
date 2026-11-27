<?php

namespace App\Services;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class SiteSettingsService
{
    public const FOOTER_SOCIAL_KEY = 'footer.social';

    public const CACHE_KEY = 'site_settings.footer.social.v1';

    /**
     * @return list<string>
     */
    public function socialNetworks(): array
    {
        return ['instagram', 'facebook', 'linkedin'];
    }

    /**
     * Full admin payload (all networks, including disabled / empty).
     *
     * @return array<string, array{network: string, label: string, url: string, enabled: bool}>
     */
    public function footerSocialAdmin(): array
    {
        $stored = $this->readFooterSocial();
        $out = [];

        foreach ($this->socialNetworks() as $network) {
            $row = $stored[$network] ?? [];
            $out[$network] = [
                'network' => $network,
                'label' => $this->labelFor($network),
                'url' => trim((string) ($row['url'] ?? '')),
                'enabled' => (bool) ($row['enabled'] ?? false),
            ];
        }

        return $out;
    }

    /**
     * Public footer payload — only enabled networks with a valid http(s) URL.
     *
     * @return list<array{network: string, label: string, url: string}>
     */
    public function footerSocialPublic(): array
    {
        try {
            if (! Schema::hasTable('site_settings')) {
                return [];
            }
        } catch (\Throwable) {
            return [];
        }

        return Cache::remember(self::CACHE_KEY, 300, function (): array {
            $items = [];
            foreach ($this->footerSocialAdmin() as $row) {
                if (! $row['enabled']) {
                    continue;
                }
                $url = $this->normalizeUrl($row['url']);
                if ($url === null) {
                    continue;
                }
                $items[] = [
                    'network' => $row['network'],
                    'label' => $row['label'],
                    'url' => $url,
                ];
            }

            return $items;
        });
    }

    /**
     * @param  array<int, array{network?: string, url?: string|null, enabled?: bool|int|string|null}>  $links
     * @return array<string, array{network: string, label: string, url: string, enabled: bool}>
     */
    public function saveFooterSocial(array $links, ?User $actor = null): array
    {
        $byNetwork = [];
        foreach ($links as $link) {
            $network = strtolower(trim((string) ($link['network'] ?? '')));
            if (! in_array($network, $this->socialNetworks(), true)) {
                continue;
            }
            $url = trim((string) ($link['url'] ?? ''));
            $enabled = filter_var($link['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
            // Empty URL cannot stay enabled.
            if ($url === '') {
                $enabled = false;
            }
            $byNetwork[$network] = [
                'url' => $url,
                'enabled' => $enabled,
            ];
        }

        $payload = [];
        foreach ($this->socialNetworks() as $network) {
            $payload[$network] = $byNetwork[$network] ?? ['url' => '', 'enabled' => false];
        }

        SiteSetting::query()->updateOrCreate(
            ['key' => self::FOOTER_SOCIAL_KEY],
            [
                'value' => $payload,
                'updated_by' => $actor?->id,
            ],
        );

        Cache::forget(self::CACHE_KEY);

        return $this->footerSocialAdmin();
    }

    /**
     * @return array<string, array{url?: string, enabled?: bool}>
     */
    private function readFooterSocial(): array
    {
        try {
            if (! Schema::hasTable('site_settings')) {
                return [];
            }
        } catch (\Throwable) {
            return [];
        }

        $row = SiteSetting::query()->find(self::FOOTER_SOCIAL_KEY);
        $value = $row?->value;

        return is_array($value) ? $value : [];
    }

    private function labelFor(string $network): string
    {
        return match ($network) {
            'instagram' => 'Instagram',
            'facebook' => 'Facebook',
            'linkedin' => 'LinkedIn',
            default => ucfirst($network),
        };
    }

    private function normalizeUrl(string $url): ?string
    {
        $url = trim($url);
        if ($url === '') {
            return null;
        }

        if (! preg_match('#^https?://#i', $url)) {
            $url = 'https://'.$url;
        }

        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            return null;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        if (! in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        return $url;
    }
}
