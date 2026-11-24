<?php

namespace App\Services\Billing;

use Carbon\CarbonInterface;

readonly class SiteBillingState
{
    /**
     * @param  array<string, bool>  $features
     */
    public function __construct(
        public string $status,
        public bool $isCardOnly,
        public bool $isSite,
        public bool $canEdit,
        public bool $canUsePremium,
        public bool $canAutomate,
        public bool $canSchedulePublish,
        public bool $isPublicLive,
        public bool $isViewOnly,
        public bool $isScheduled,
        public bool $hasPaidPack,
        public bool $legacyAccountPro,
        public int $guestLimit,
        public int $coHostLimit,
        public ?string $packSku,
        public ?int $packDays,
        public ?CarbonInterface $trialEndsAt,
        public ?CarbonInterface $packStartsAt,
        public ?CarbonInterface $packEndsAt,
        public ?CarbonInterface $scheduledPublishAt,
        public string $scheduledPublishStatus,
        public ?string $customStartsOn,
        public ?string $customEndsOn,
        public array $features,
        public string $upgradeUrl,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'is_card_only' => $this->isCardOnly,
            'is_site' => $this->isSite,
            'can_edit' => $this->canEdit,
            'can_use_premium' => $this->canUsePremium,
            'can_automate' => $this->canAutomate,
            'can_schedule_publish' => $this->canSchedulePublish,
            'is_public_live' => $this->isPublicLive,
            'is_view_only' => $this->isViewOnly,
            'is_scheduled' => $this->isScheduled,
            'has_paid_pack' => $this->hasPaidPack,
            'legacy_account_pro' => $this->legacyAccountPro,
            'guest_limit' => $this->guestLimit,
            'co_host_limit' => $this->coHostLimit,
            'pack_sku' => $this->packSku,
            'pack_days' => $this->packDays,
            'trial_ends_at' => $this->trialEndsAt?->toIso8601String(),
            'pack_starts_at' => $this->packStartsAt?->toIso8601String(),
            'pack_ends_at' => $this->packEndsAt?->toIso8601String(),
            'scheduled_publish_at' => $this->scheduledPublishAt?->toIso8601String(),
            'scheduled_publish_status' => $this->scheduledPublishStatus,
            'custom_starts_on' => $this->customStartsOn,
            'custom_ends_on' => $this->customEndsOn,
            'features' => $this->features,
            'upgrade_url' => $this->upgradeUrl,
            'days_left' => $this->daysLeft(),
        ];
    }

    public function daysLeft(): ?int
    {
        $end = match ($this->status) {
            'trial' => $this->trialEndsAt,
            'paid' => $this->packEndsAt,
            default => null,
        };

        if ($end === null) {
            return null;
        }

        return max(0, (int) now()->diffInDays($end, false));
    }
}
