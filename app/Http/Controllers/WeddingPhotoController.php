<?php

namespace App\Http\Controllers;

use App\Http\Requests\Weddings\StorePhotoRequest;
use App\Models\Wedding;
use App\Models\WeddingPhoto;
use App\Services\ImageUploadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class WeddingPhotoController extends Controller
{
    public function store(StorePhotoRequest $request, Wedding $wedding, ImageUploadService $images): RedirectResponse
    {
        $path = $images->store($request->file('photo'), 'weddings/'.$wedding->id);
        $isFirst = ! $wedding->photos()->exists();

        $photo = $wedding->photos()->create([
            'path' => $path,
            'caption' => $request->validated('caption'),
            'sort_order' => (int) $wedding->photos()->max('sort_order') + 1,
            'is_cover' => $isFirst,
        ]);

        if ($isFirst && $wedding->cover_image === null) {
            $wedding->cover_image = $path;
            $wedding->save();
        }

        $url = $photo->url();

        if ($request->boolean('as_hero')) {
            $wedding->loadMissing('setting');
            $setting = $wedding->setting()->firstOrCreate([]);
            $details = is_array($setting->details) ? $setting->details : [];
            $details['hero_image'] = $url;
            $setting->details = $details;
            $setting->save();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Photo added.']);
        Inertia::flash('uploaded_photo', [
            'id' => $photo->id,
            'url' => $url,
        ]);

        return back();
    }

    public function update(Request $request, Wedding $wedding, WeddingPhoto $photo): RedirectResponse
    {
        abort_unless($photo->event_id === $wedding->id, 404);
        Gate::authorize('update', $photo);

        $data = $request->validate([
            'caption' => ['nullable', 'string', 'max:180'],
        ]);

        $photo->update($data);

        return back();
    }

    public function cover(Wedding $wedding, WeddingPhoto $photo): RedirectResponse
    {
        abort_unless($photo->event_id === $wedding->id, 404);
        Gate::authorize('update', $photo);

        $wedding->photos()->update(['is_cover' => false]);
        $photo->is_cover = true;
        $photo->save();
        $wedding->cover_image = $photo->path;
        $wedding->save();

        return back();
    }

    public function reorder(Request $request, Wedding $wedding): RedirectResponse
    {
        Gate::authorize('update', $wedding);

        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ])['ids'];

        foreach (array_values($ids) as $index => $id) {
            $wedding->photos()->whereKey($id)->update(['sort_order' => $index + 1]);
        }

        return back();
    }

    public function destroy(Wedding $wedding, WeddingPhoto $photo): RedirectResponse
    {
        abort_unless($photo->event_id === $wedding->id, 404);
        Gate::authorize('delete', $photo);
        $photo->delete();

        if ($wedding->cover_image === $photo->path) {
            $next = $wedding->photos()->first();
            $wedding->cover_image = $next?->path;
            $wedding->save();
            if ($next) {
                $next->is_cover = true;
                $next->save();
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Photo removed.']);

        return back();
    }
}
