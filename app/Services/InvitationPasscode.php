<?php

namespace App\Services;

use App\Models\Wedding;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;

class InvitationPasscode
{
    public function details(Wedding $wedding): array
    {
        $wedding->loadMissing('setting');

        return is_array($wedding->setting?->details) ? $wedding->setting->details : [];
    }

    public function enabled(Wedding $wedding): bool
    {
        $details = $this->details($wedding);
        $enabled = trim((string) ($details['site_passcode_enabled'] ?? ''));
        $hash = trim((string) ($details['site_passcode_hash'] ?? ''));

        if ($hash === '') {
            return false;
        }

        if ($enabled === '') {
            return true;
        }

        return ! in_array(strtolower($enabled), ['0', 'false', 'off'], true);
    }

    public function check(Wedding $wedding, string $passcode): bool
    {
        $hash = trim((string) ($this->details($wedding)['site_passcode_hash'] ?? ''));
        if ($hash === '') {
            return false;
        }

        return Hash::check($passcode, $hash);
    }

    public function sessionKey(Wedding $wedding): string
    {
        return 'invite_passcode_unlocked:'.$wedding->id;
    }

    public function unlockToken(Wedding $wedding): string
    {
        $hash = trim((string) ($this->details($wedding)['site_passcode_hash'] ?? ''));

        return $hash !== '' ? hash('sha256', $hash) : '';
    }

    public function isUnlocked(Wedding $wedding): bool
    {
        $expected = $this->unlockToken($wedding);
        if ($expected === '') {
            return false;
        }

        $token = (string) Session::get($this->sessionKey($wedding), '');

        return $token !== '' && hash_equals($expected, $token);
    }

    public function unlock(Wedding $wedding): void
    {
        $token = $this->unlockToken($wedding);
        if ($token === '') {
            $this->lock($wedding);

            return;
        }

        Session::put($this->sessionKey($wedding), $token);
    }

    public function lock(Wedding $wedding): void
    {
        Session::forget($this->sessionKey($wedding));
    }

    /**
     * Normalize editor details before save: hash plain passcode, never persist plaintext.
     *
     * @param  array<string, mixed>  $details
     * @param  array<string, mixed>  $existing
     * @return array<string, mixed>
     */
    public function normalizeDetails(array $details, array $existing = []): array
    {
        $plain = isset($details['site_passcode']) ? trim((string) $details['site_passcode']) : null;
        unset($details['site_passcode'], $details['site_passcode_set']);

        if ($plain !== null && $plain !== '' && mb_strlen($plain) >= 4) {
            $details['site_passcode_hash'] = Hash::make($plain);
            if (! array_key_exists('site_passcode_enabled', $details)) {
                $details['site_passcode_enabled'] = '1';
            }
        }

        if (array_key_exists('site_passcode_clear', $details)) {
            $clear = $details['site_passcode_clear'];
            unset($details['site_passcode_clear']);
            if ($clear === true || $clear === 1 || $clear === '1') {
                $details['site_passcode_hash'] = '';
                $details['site_passcode_enabled'] = '0';
                $details['site_passcode_hint'] = '';
            }
        }

        // Empty string passcode from the form means "leave hash unchanged".
        // Guest hints were removed from the product — never persist new ones.
        $details['site_passcode_hint'] = '';

        if (array_key_exists('site_passcode_enabled', $details)) {
            $on = ! in_array(
                strtolower(trim((string) $details['site_passcode_enabled'])),
                ['0', 'false', 'off', ''],
                true,
            );
            $details['site_passcode_enabled'] = $on ? '1' : '0';
        }

        // Protection requires a stored hash — enabling alone cannot gate the live site.
        $resolvedHash = trim((string) (
            $details['site_passcode_hash']
            ?? $existing['site_passcode_hash']
            ?? ''
        ));
        if ($resolvedHash === '' && ($details['site_passcode_enabled'] ?? '') === '1') {
            $details['site_passcode_enabled'] = '0';
        }

        return $details;
    }

    /**
     * Safe details for Inertia payloads (never leak the hash).
     *
     * @param  array<string, mixed>  $details
     * @return array<string, mixed>
     */
    public function redactDetails(array $details): array
    {
        $hash = trim((string) ($details['site_passcode_hash'] ?? ''));
        unset($details['site_passcode_hash'], $details['site_passcode']);
        $details['site_passcode_set'] = $hash !== '' ? '1' : '0';

        return $details;
    }
}
