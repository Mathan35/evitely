<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Custom invite subdomains reuse the event slug as the host label:
 *   https://{slug}.{invite_root_domain}/
 */
class InviteHost
{
    public static function rootDomain(): string
    {
        $configured = trim((string) config('wedding.invite_root_domain', ''));
        if ($configured !== '') {
            return strtolower($configured);
        }

        $host = parse_url((string) config('app.url'), PHP_URL_HOST);

        return is_string($host) ? strtolower($host) : '';
    }

    public static function enabled(): bool
    {
        $flag = config('wedding.invite_subdomains_enabled');
        if ($flag === false || $flag === 0 || $flag === '0' || $flag === 'false') {
            return false;
        }
        if ($flag === true || $flag === 1 || $flag === '1' || $flag === 'true') {
            return self::rootDomain() !== '';
        }

        // Auto: on for real hosts (Herd / production), off for plain localhost.
        $root = self::rootDomain();
        if ($root === '' || self::isLocalApex($root)) {
            return false;
        }

        return true;
    }

    public static function isLocalApex(string $host): bool
    {
        $host = strtolower($host);

        return in_array($host, ['localhost', '127.0.0.1', '::1'], true)
            || str_ends_with($host, '.localhost');
    }

    /**
     * @return list<string>
     */
    public static function reserved(): array
    {
        $items = config('wedding.reserved_subdomains', []);

        return array_values(array_unique(array_map(
            static fn ($item): string => strtolower((string) $item),
            is_array($items) ? $items : [],
        )));
    }

    public static function isReserved(string $label): bool
    {
        return in_array(strtolower(trim($label)), self::reserved(), true);
    }

    public static function isValidLabel(string $label): bool
    {
        $label = strtolower(trim($label));

        return $label !== ''
            && strlen($label) <= 80
            && (bool) preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $label)
            && ! self::isReserved($label);
    }

    public static function publicUrl(string $slug, bool $absolute = true): string
    {
        $slug = strtolower(trim($slug));

        if (self::enabled() && self::isValidLabel($slug) && \Illuminate\Support\Facades\Route::has('weddings.subdomain.public')) {
            return route('weddings.subdomain.public', ['slug' => $slug], $absolute);
        }

        return route('weddings.public', ['slug' => $slug], $absolute);
    }

    public static function guestUrl(string $slug, string $token, bool $absolute = true): string
    {
        $slug = strtolower(trim($slug));

        if (self::enabled() && self::isValidLabel($slug) && \Illuminate\Support\Facades\Route::has('weddings.subdomain.guest')) {
            return route('weddings.subdomain.guest', ['slug' => $slug, 'token' => $token], $absolute);
        }

        return route('weddings.guest', ['slug' => $slug, 'token' => $token], $absolute);
    }

    public static function apexHost(): string
    {
        return self::rootDomain();
    }

    public static function previewHost(string $slug): string
    {
        $slug = strtolower(trim($slug)) ?: 'your-event';
        $root = self::rootDomain() ?: 'invidora.com';

        return $slug.'.'.$root;
    }

    /**
     * Extract invite subdomain label from a request host, or null when apex / unknown.
     */
    public static function labelFromHost(?string $host): ?string
    {
        if (! is_string($host) || $host === '') {
            return null;
        }

        $host = strtolower($host);
        // Strip port if present.
        if (str_contains($host, ':')) {
            $host = Str::before($host, ':');
        }

        $root = self::rootDomain();
        if ($root === '' || $host === $root || ! str_ends_with($host, '.'.$root)) {
            return null;
        }

        $label = substr($host, 0, -1 * (strlen($root) + 1));
        if ($label === '' || str_contains($label, '.')) {
            // Multi-level like a.b.root — not supported.
            return null;
        }

        return $label;
    }
}
