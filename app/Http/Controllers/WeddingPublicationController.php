<?php

namespace App\Http\Controllers;

use App\Models\Wedding;
use App\Services\Growth\GrowthService;
use App\Services\WeddingPublishingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class WeddingPublicationController extends Controller
{
    public function store(Wedding $wedding, WeddingPublishingService $publishing, GrowthService $growth): RedirectResponse
    {
        Gate::authorize('update', $wedding);
        $publishing->publish($wedding);
        $wedding->refresh();

        $secondary = trim((string) ($wedding->secondary_language ?: ''));
        $message = $secondary !== ''
            ? 'Invitation published. Secondary language is ready on the live site.'
            : 'Invitation published.';

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $message,
        ]);

        // Growth checklist (share first — defer day-pack paywall).
        if (($wedding->invitation_mode ?? 'link') !== 'card') {
            Inertia::flash('publish_growth', [
                'open' => true,
                'share_url' => \App\Support\InviteHost::publicUrl($wedding->slug),
                'title' => $wedding->displayTitle(),
                'growth' => $growth->shareState($wedding),
            ]);
        }

        return back();
    }

    public function destroy(Wedding $wedding, WeddingPublishingService $publishing): RedirectResponse
    {
        Gate::authorize('update', $wedding);
        $publishing->unpublish($wedding);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Invitation unpublished.',
        ]);

        return back();
    }
}
