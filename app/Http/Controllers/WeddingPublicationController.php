<?php

namespace App\Http\Controllers;

use App\Models\Wedding;
use App\Services\Billing\SiteBillingService;
use App\Services\Growth\GrowthService;
use App\Services\WeddingPublishingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WeddingPublicationController extends Controller
{
    public function store(
        Request $request,
        Wedding $wedding,
        WeddingPublishingService $publishing,
        GrowthService $growth,
        SiteBillingService $siteBilling,
    ): RedirectResponse {
        Gate::authorize('update', $wedding);

        if ($wedding->isLivePaused()) {
            $publishing->resumeLive($wedding);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Site is live again. Guests can open your link.',
            ]);

            return back();
        }

        // Paid path: send hosts to billing instead of consuming the free trial.
        if ($request->boolean('paid') && ($wedding->invitation_mode ?? 'link') !== 'card') {
            $state = $siteBilling->state($wedding);
            if (! $state->hasPaidPack && ! $state->legacyAccountPro) {
                return redirect()->to($state->upgradeUrl.'?intent=publish');
            }
        }

        try {
            $state = $siteBilling->state($wedding);
            if (($wedding->invitation_mode ?? 'link') !== 'card'
                && ! $state->hasPaidPack
                && ! $state->legacyAccountPro
            ) {
                $siteBilling->assertCanStartTrial($wedding);
            }

            $publishing->publish($wedding);
        } catch (ValidationException $e) {
            $messages = $e->errors();
            $usedOn = $wedding->user
                ? $siteBilling->accountTrialUsage($wedding->user, $wedding)['used_on']
                : null;
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $messages['publish'][0] ?? $messages['live'][0] ?? 'Could not publish.',
            ]);
            if (is_array($usedOn)) {
                Inertia::flash('trial_used_on', $usedOn);
            }

            return redirect()
                ->to('/events/'.$wedding->id.'/billing?intent=publish&trial=used')
                ->withErrors($e->errors());
        }

        $wedding->refresh();

        $secondary = trim((string) ($wedding->secondary_language ?: ''));
        $message = $secondary !== ''
            ? 'Invitation published. Secondary language is ready on the live site.'
            : 'Invitation published.';

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $message,
        ]);

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

    /**
     * Host "Stop live" — does not unpublish / does not reset billing.
     */
    public function destroy(Wedding $wedding, WeddingPublishingService $publishing): RedirectResponse
    {
        Gate::authorize('update', $wedding);
        $publishing->pauseLive($wedding);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Live site stopped. Guests cannot open the link until you go live again.',
        ]);

        return back();
    }
}
