<?php

namespace App\Jobs;

use App\Models\CouponCampaign;
use App\Services\Growth\CouponCampaignService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class NotifyCouponCampaignJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public int $campaignId) {}

    public function handle(CouponCampaignService $campaigns): void
    {
        $campaign = CouponCampaign::query()->find($this->campaignId);
        if (! $campaign) {
            return;
        }

        $campaigns->distributeNotifications($campaign);
    }

    public function failed(?Throwable $e): void
    {
        Log::error('Coupon campaign notify failed', [
            'campaign_id' => $this->campaignId,
            'error' => $e?->getMessage(),
        ]);

        CouponCampaign::query()->whereKey($this->campaignId)->update([
            'notify_status' => CouponCampaign::NOTIFY_DONE,
        ]);
    }
}
