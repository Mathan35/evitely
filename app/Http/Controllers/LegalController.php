<?php

namespace App\Http\Controllers;

use App\Support\MarketingSeo;
use Inertia\Inertia;
use Inertia\Response;

class LegalController extends Controller
{
    public function privacy(): Response
    {
        return Inertia::render('legal/privacy', [
            'appName' => config('app.name', 'Evitely'),
            'updatedAt' => '2026-11-21',
            'seo' => MarketingSeo::legal('Privacy Policy', '/privacy'),
        ]);
    }

    public function terms(): Response
    {
        return Inertia::render('legal/terms', [
            'appName' => config('app.name', 'Evitely'),
            'updatedAt' => '2026-11-21',
            'seo' => MarketingSeo::legal('Terms of Service', '/terms'),
        ]);
    }

    public function cookies(): Response
    {
        return Inertia::render('legal/cookies', [
            'appName' => config('app.name', 'Evitely'),
            'updatedAt' => '2026-11-21',
            'seo' => MarketingSeo::legal('Cookie Policy', '/cookies'),
        ]);
    }
}
