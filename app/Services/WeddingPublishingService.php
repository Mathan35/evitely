<?php

namespace App\Services;

use App\Enums\WeddingStatus;
use App\Models\Wedding;
use App\Services\Billing\SiteBillingService;
use App\Services\Growth\GrowthService;
use Illuminate\Validation\ValidationException;

class WeddingPublishingService
{
    public function __construct(
        private InvitationTranslationSync $translations,
        private SiteBillingService $siteBilling,
        private GrowthService $growth,
    ) {}

    public function publish(Wedding $wedding, bool $skipBillingHook = false): Wedding
    {
        // Fill / repair secondary-locale copy before the invite goes live,
        // so the guest language switch rewrites the full site (not just chrome).
        $this->translations->sync($wedding, force: false);

        if ($wedding->isLivePaused()) {
            return $this->resumeLive($wedding);
        }

        $wedding->status = WeddingStatus::Published;
        $wedding->published_at = $wedding->published_at ?? now();
        $wedding->live_paused_at = null;
        $wedding->save();

        $wedding = $wedding->refresh();

        if (! $skipBillingHook) {
            $this->siteBilling->handleAfterPublish($wedding);
            $this->growth->handleAfterPublish($wedding->fresh());
        }

        return $wedding->refresh();
    }

    /**
     * Host "Stop live" — keep published status / billing, hide from guests.
     */
    public function pauseLive(Wedding $wedding): Wedding
    {
        if (! $wedding->isPublic()) {
            throw ValidationException::withMessages([
                'live' => 'Publish the invitation before stopping the live site.',
            ]);
        }

        $wedding->forceFill([
            'live_paused_at' => now(),
        ])->save();

        return $wedding->refresh();
    }

    /**
     * Host "Go live" after a pause — billing window must still be active.
     */
    public function resumeLive(Wedding $wedding): Wedding
    {
        if (! $wedding->isPublic()) {
            throw ValidationException::withMessages([
                'live' => 'Publish the invitation before going live.',
            ]);
        }

        if (($wedding->invitation_mode ?? 'link') !== 'card') {
            $state = $this->siteBilling->state($wedding);
            if ($state->status === 'expired' || $state->isViewOnly) {
                throw ValidationException::withMessages([
                    'live' => 'This site plan has ended. Extend or buy a pack to go live again.',
                ]);
            }
        }

        $wedding->forceFill([
            'live_paused_at' => null,
        ])->save();

        return $wedding->refresh();
    }

    /**
     * Admin / destructive — returns to draft. Hosts should use pauseLive instead.
     */
    public function unpublish(Wedding $wedding): Wedding
    {
        $wedding->status = WeddingStatus::Draft;
        $wedding->live_paused_at = null;
        $wedding->save();

        return $wedding;
    }
}
