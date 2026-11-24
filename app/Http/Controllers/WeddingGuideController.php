<?php

namespace App\Http\Controllers;

use App\Http\Requests\Weddings\StoreAccommodationRequest;
use App\Http\Requests\Weddings\StoreTravelRequest;
use App\Models\Accommodation;
use App\Models\TravelDetail;
use App\Models\Wedding;
use App\Services\TravelStaysSync;
use Illuminate\Http\RedirectResponse;

class WeddingGuideController extends Controller
{
    public function storeTravel(StoreTravelRequest $request, Wedding $wedding): RedirectResponse
    {
        $wedding->travelDetails()->create([
            ...$request->validated(),
            'sort_order' => (int) $wedding->travelDetails()->max('sort_order') + 1,
        ]);
        app(TravelStaysSync::class)->remirror($wedding);

        return back();
    }

    public function destroyTravel(Wedding $wedding, TravelDetail $travel): RedirectResponse
    {
        abort_unless($travel->event_id === $wedding->id, 404);
        $travel->delete();
        app(TravelStaysSync::class)->remirror($wedding);

        return back();
    }

    public function storeStay(StoreAccommodationRequest $request, Wedding $wedding): RedirectResponse
    {
        $wedding->accommodations()->create([
            ...$request->validated(),
            'sort_order' => (int) $wedding->accommodations()->max('sort_order') + 1,
        ]);
        app(TravelStaysSync::class)->remirror($wedding);

        return back();
    }

    public function destroyStay(Wedding $wedding, Accommodation $accommodation): RedirectResponse
    {
        abort_unless($accommodation->event_id === $wedding->id, 404);
        $accommodation->delete();
        app(TravelStaysSync::class)->remirror($wedding);

        return back();
    }
}
