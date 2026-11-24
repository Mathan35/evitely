<?php

namespace App\Services;

class WeddingThemeService
{
    /**
     * @return array<string, mixed>
     */
    public function resolve(string $theme): array
    {
        $themes = config('wedding.themes');

        return $themes[$theme] ?? $themes['classic'];
    }
}
