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
            'appName' => config('app.name', 'Invidora'),
            'updatedAt' => '2026-11-21',
            'seo' => MarketingSeo::legal('Privacy Policy', '/privacy'),
        ]);
    }

    public function terms(): Response
    {
        return Inertia::render('legal/terms', [
            'appName' => config('app.name', 'Invidora'),
            'updatedAt' => '2026-11-21',
            'seo' => MarketingSeo::legal('Terms of Service', '/terms'),
        ]);
    }

    public function cookies(): Response
    {
        return Inertia::render('legal/cookies', [
            'appName' => config('app.name', 'Invidora'),
            'updatedAt' => '2026-11-21',
            'seo' => MarketingSeo::legal('Cookie Policy', '/cookies'),
        ]);
    }

    public function refund(): Response
    {
        return Inertia::render('legal/refund', [
            'appName' => config('app.name', 'Invidora'),
            'updatedAt' => '2026-11-27',
            'seo' => MarketingSeo::legal('Refund Policy', '/refund'),
        ]);
    }

    public function cancellation(): Response
    {
        return Inertia::render('legal/cancellation', [
            'appName' => config('app.name', 'Invidora'),
            'updatedAt' => '2026-11-27',
            'seo' => MarketingSeo::legal('Cancellation Policy', '/cancellation'),
        ]);
    }
}
