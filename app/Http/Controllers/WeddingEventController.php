<?php

namespace App\Http\Controllers;

use App\Http\Requests\Weddings\StoreWeddingEventRequest;
use App\Http\Requests\Weddings\UpdateWeddingEventRequest;
use App\Models\Wedding;
use App\Models\WeddingEvent;
use App\Services\ScheduleSync;
use App\Support\IndianWeddingItinerary;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class WeddingEventController extends Controller
{
    public function store(StoreWeddingEventRequest $request, Wedding $wedding): RedirectResponse
    {
        $data = $request->validated();
        $data['sort_order'] = $data['sort_order'] ?? ($wedding->events()->max('sort_order') + 1);
        $data['timezone'] = $data['timezone'] ?? $wedding->timezone;
        $data['event_type'] = $data['event_type'] ?? 'custom';
        $data['is_public'] = $data['is_public'] ?? true;
        $wedding->events()->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Event added.']);

        return back();
    }

    /**
     * One-tap Indian / destination ceremony pack → full multi-day itinerary.
     */
    public function applyItineraryPreset(Request $request, Wedding $wedding, ScheduleSync $schedules): RedirectResponse
    {
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'preset' => ['required', 'string', Rule::in(array_keys(IndianWeddingItinerary::presets()))],
            'replace' => ['sometimes', 'boolean'],
        ]);

        $rows = IndianWeddingItinerary::expand($data['preset'], $wedding->starts_on);
        if ($rows === []) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Unknown ceremony pack.']);

            return back();
        }

        $schedules->applyCeremonyPack($wedding, $rows, $request->boolean('replace', true));

        $wedding->loadMissing('setting');
        $setting = $wedding->setting;
        if ($setting) {
            $details = is_array($setting->details) ? $setting->details : [];
            $details['itinerary_pack_id'] = $data['preset'];
            $setting->details = $details;
            $setting->save();
        }

        $name = IndianWeddingItinerary::presets()[$data['preset']]['name'] ?? 'Ceremony pack';
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $name.' applied — '.$wedding->events()->count().' moments on your schedule.',
        ]);

        return back();
    }

    public function update(UpdateWeddingEventRequest $request, Wedding $wedding, WeddingEvent $event): RedirectResponse
    {
        abort_unless($event->event_id === $wedding->id, 404);
        Gate::authorize('update', $event);
        $event->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Event saved.']);

        return back();
    }

    public function destroy(Wedding $wedding, WeddingEvent $event): RedirectResponse
    {
        abort_unless($event->event_id === $wedding->id, 404);
        Gate::authorize('delete', $event);
        $event->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Event removed.']);

        return back();
    }
}
