<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class GalleryFavoriteController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'design_id' => ['required', 'string', 'max:120'],
        ]);

        $request->user()->galleryFavorites()->firstOrCreate([
            'design_id' => $data['design_id'],
        ]);

        return back();
    }

    public function destroy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'design_id' => ['required', 'string', 'max:120'],
        ]);

        $request->user()->galleryFavorites()->where('design_id', $data['design_id'])->delete();

        return back();
    }
}
