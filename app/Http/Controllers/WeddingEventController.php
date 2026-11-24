<?php

namespace App\Http\Controllers;

use App\Http\Requests\Weddings\StoreWeddingEventRequest;
use App\Http\Requests\Weddings\UpdateWeddingEventRequest;
use App\Models\Wedding;
use App\Models\WeddingEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
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
