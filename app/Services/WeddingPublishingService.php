<?php

namespace App\Services;

use App\Enums\WeddingStatus;
use App\Models\Wedding;
use App\Services\Billing\SiteBillingService;
use App\Services\Growth\GrowthService;

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

        $wedding->status = WeddingStatus::Published;
        $wedding->published_at = $wedding->published_at ?? now();
        $wedding->save();

        $wedding = $wedding->refresh();

        if (! $skipBillingHook) {
            $this->siteBilling->handleAfterPublish($wedding);
            $this->growth->handleAfterPublish($wedding->fresh());
        }

        return $wedding->refresh();
    }

    public function unpublish(Wedding $wedding): Wedding
    {
        $wedding->status = WeddingStatus::Draft;
        $wedding->save();

        return $wedding;
    }
}
