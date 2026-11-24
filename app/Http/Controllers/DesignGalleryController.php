<?php

namespace App\Http\Controllers;

use App\Support\DesignGallery;
use App\Support\MarketingSeo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class DesignGalleryController extends Controller
{
    public function show(Request $request, string $event): Response
    {
        $gallery = DesignGallery::forSlug($event);
        $requested = $request->query('tab');
        $fallback = is_array($gallery) ? ($gallery['default_tab'] ?? 'cards') : 'cards';
        $tab = $requested === 'links' || $requested === 'cards' ? $requested : $fallback;

        return Inertia::render('marketing/event-gallery', [
            'gallery' => $gallery,
            'slug' => $event,
            'tab' => $tab,
            'occasions' => DesignGallery::nav(),
            'canRegister' => Features::enabled(Features::registration()),
            'seo' => MarketingSeo::designOccasion($event, is_array($gallery) ? $gallery : null),
        ]);
    }
}
