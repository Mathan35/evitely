<?php

namespace Tests\Unit;

use Tests\TestCase;

/**
 * Smoke-check that frontend intro/locale modules stay loadable via build-time TS;
 * PHP side asserts wedding locales include the Western set used by prefs.
 */
class IntroCopyTest extends TestCase
{
    public function test_preference_locales_include_western_and_indian_codes(): void
    {
        $locales = array_keys(config('wedding.locales', []));

        foreach (['en', 'ta', 'hi', 'es', 'fr', 'de', 'ar', 'pt', 'it'] as $code) {
            $this->assertContains($code, $locales, "Missing prefs locale: {$code}");
        }
    }
}
