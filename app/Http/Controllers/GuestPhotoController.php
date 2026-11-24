<?php

namespace App\Http\Controllers;

use App\Http\Requests\GuestPhotos\StoreGuestPhotoRequest;
use App\Models\Wedding;
use App\Notifications\GuestPhotoReceived;
use App\Services\ImageUploadService;
use App\Services\InvitationPasscode;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class GuestPhotoController extends Controller
{
    public function store(
        StoreGuestPhotoRequest $request,
        string $slug,
        ImageUploadService $images,
        InvitationPasscode $passcodes,
    ): RedirectResponse {
        $wedding = Wedding::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        if ($passcodes->enabled($wedding) && ! $passcodes->isUnlocked($wedding)) {
            abort(403);
        }

        $wedding->loadMissing('setting', 'user');
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        if (! in_array(strtolower(trim((string) ($details['photo_wall_enabled'] ?? ''))), ['1', 'true', 'yes', 'on'], true)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Photo wall uploads are not enabled.']);

            return back();
        }

        $path = $images->store($request->file('photo'), 'weddings/'.$wedding->id.'/guest-photos');

        $photo = $wedding->guestPhotos()->create([
            'name' => $request->validated('name'),
            'caption' => $request->validated('caption'),
            'photo_path' => $path,
            'status' => 'pending',
        ]);

        if ($wedding->user) {
            $wedding->user->notify(new GuestPhotoReceived($photo));
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Thank you — your photo will appear after the hosts approve it.',
        ]);

        return back();
    }
}
