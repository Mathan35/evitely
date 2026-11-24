<?php

namespace App\Http\Controllers;

use App\Enums\GuestbookStatus;
use App\Models\GuestPhoto;
use App\Models\Wedding;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GuestPhotoModerationController extends Controller
{
    public function approve(Wedding $wedding, GuestPhoto $photo): RedirectResponse
    {
        $this->guard($wedding, $photo);
        $photo->status = GuestbookStatus::Approved;
        $photo->save();

        return back();
    }

    public function hide(Wedding $wedding, GuestPhoto $photo): RedirectResponse
    {
        $this->guard($wedding, $photo);
        $photo->status = GuestbookStatus::Hidden;
        $photo->save();

        return back();
    }

    public function destroy(Wedding $wedding, GuestPhoto $photo): RedirectResponse
    {
        $this->guard($wedding, $photo);
        $photo->delete();

        return back();
    }

    public function bulk(Request $request, Wedding $wedding): RedirectResponse
    {
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'action' => ['required', Rule::in(['approve', 'hide', 'delete'])],
            'photo_ids' => ['required', 'array', 'min:1'],
            'photo_ids.*' => ['integer'],
        ]);

        $photos = $wedding->guestPhotos()->whereIn('id', $data['photo_ids']);

        match ($data['action']) {
            'approve' => $photos->update(['status' => GuestbookStatus::Approved]),
            'hide' => $photos->update(['status' => GuestbookStatus::Hidden]),
            'delete' => $photos->delete(),
        };

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Photo wall updated.']);

        return back();
    }

    private function guard(Wedding $wedding, GuestPhoto $photo): void
    {
        abort_unless($photo->event_id === $wedding->id, 404);
        Gate::authorize('update', $wedding);
    }
}
