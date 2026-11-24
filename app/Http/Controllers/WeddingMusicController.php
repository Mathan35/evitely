<?php

namespace App\Http\Controllers;

use App\Models\Wedding;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WeddingMusicController extends Controller
{
    public function store(Request $request, Wedding $wedding): RedirectResponse
    {
        Gate::authorize('update', $wedding);

        $request->validate([
            'music' => ['required', 'file', 'max:12288', 'mimetypes:audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/aac'],
        ]);

        $file = $request->file('music');
        if ($file === null) {
            throw ValidationException::withMessages(['music' => 'Choose an audio file.']);
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: 'mp3');
        $allowed = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
        if (! in_array($extension, $allowed, true)) {
            throw ValidationException::withMessages(['music' => 'Upload an MP3, WAV, OGG, or M4A file.']);
        }

        $path = $file->storeAs(
            'weddings/'.$wedding->id.'/music',
            Str::uuid()->toString().'.'.$extension,
            'public',
        );

        $wedding->forceFill([
            'music_url' => url(Storage::disk('public')->url($path)),
            'music_enabled' => true,
        ])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Music uploaded.']);

        return back();
    }
}
