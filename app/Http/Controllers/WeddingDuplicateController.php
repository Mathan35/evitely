<?php

namespace App\Http\Controllers;

use App\Models\Wedding;
use App\Services\WeddingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class WeddingDuplicateController extends Controller
{
    public function store(Wedding $wedding, WeddingService $weddings): RedirectResponse
    {
        Gate::authorize('update', $wedding);
        $copy = $weddings->duplicate($wedding);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Wedding duplicated. Guests were not copied.',
        ]);

        return to_route('weddings.edit', $copy);
    }
}
