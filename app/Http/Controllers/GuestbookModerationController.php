<?php

namespace App\Http\Controllers;

use App\Enums\GuestbookStatus;
use App\Models\GuestbookEntry;
use App\Models\Wedding;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GuestbookModerationController extends Controller
{
    public function approve(Wedding $wedding, GuestbookEntry $entry): RedirectResponse
    {
        $this->guard($wedding, $entry);
        $entry->status = GuestbookStatus::Approved;
        $entry->save();

        return back();
    }

    public function hide(Wedding $wedding, GuestbookEntry $entry): RedirectResponse
    {
        $this->guard($wedding, $entry);
        $entry->status = GuestbookStatus::Hidden;
        $entry->save();

        return back();
    }

    public function destroy(Wedding $wedding, GuestbookEntry $entry): RedirectResponse
    {
        $this->guard($wedding, $entry);
        $entry->delete();

        return back();
    }

    public function bulk(Request $request, Wedding $wedding): RedirectResponse
    {
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'action' => ['required', Rule::in(['approve', 'hide', 'delete'])],
            'entry_ids' => ['required', 'array', 'min:1'],
            'entry_ids.*' => ['integer'],
        ]);

        $entries = $wedding->guestbookEntries()->whereIn('id', $data['entry_ids']);

        match ($data['action']) {
            'approve' => $entries->update(['status' => GuestbookStatus::Approved]),
            'hide' => $entries->update(['status' => GuestbookStatus::Hidden]),
            'delete' => $entries->delete(),
        };

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Guestbook updated.']);

        return back();
    }

    private function guard(Wedding $wedding, GuestbookEntry $entry): void
    {
        abort_unless($entry->event_id === $wedding->id, 404);
        Gate::authorize('update', $wedding);
    }
}
