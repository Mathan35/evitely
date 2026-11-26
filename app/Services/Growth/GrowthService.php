<?php

namespace App\Services\Growth;

use App\Models\GrowthReward;
use App\Models\PartnerCode;
use App\Models\User;
use App\Models\Wedding;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class GrowthService
{
    public function tablesReady(): bool
    {
        try {
            return Schema::hasTable('partner_codes')
                && Schema::hasColumn('users', 'referral_code')
                && Schema::hasColumn('events', 'growth_share_count');
        } catch (\Throwable) {
            return false;
        }
    }

    public function ensureReferralCode(User $user): string
    {
        if (! $this->tablesReady()) {
            return '';
        }

        if (filled($user->referral_code)) {
            return (string) $user->referral_code;
        }

        $code = $this->uniqueReferralCode($user);
        $user->forceFill(['referral_code' => $code])->save();

        return $code;
    }

    public function attachSignupCodes(User $user, ?string $referralCode, ?string $partnerCode): void
    {
        if (! $this->tablesReady()) {
            return;
        }

        $this->ensureReferralCode($user);

        $referralCode = strtoupper(trim((string) $referralCode));
        if ($referralCode !== '' && blank($user->referred_by_user_id)) {
            $referrer = User::query()
                ->where('referral_code', $referralCode)
                ->where('id', '!=', $user->id)
                ->first();

            if ($referrer) {
                $user->forceFill(['referred_by_user_id' => $referrer->id])->save();
            }
        }

        $partnerCode = strtoupper(trim((string) $partnerCode));
        if ($partnerCode !== '' && blank($user->partner_code_id)) {
            $partner = PartnerCode::query()
                ->where('code', $partnerCode)
                ->where('active', true)
                ->first();

            if ($partner) {
                $user->forceFill(['partner_code_id' => $partner->id])->save();
                $partner->increment('uses_count');
            }
        }
    }

    /**
     * After a host publishes a guest site: partner bonus days + referrer reward.
     */
    public function handleAfterPublish(Wedding $wedding): void
    {
        if (! $this->tablesReady() || ($wedding->invitation_mode ?? 'link') === 'card') {
            return;
        }

        $user = $wedding->user;
        if (! $user) {
            return;
        }

        $this->ensureReferralCode($user);
        $this->applyPartnerBonus($user, $wedding);
        $this->rewardReferrer($user, $wedding);
    }

    public function recordShare(Wedding $wedding): array
    {
        if (! $this->tablesReady()) {
            return [
                'share_count' => 0,
                'first_shared_at' => null,
                'share_goal' => (int) config('growth.share_goal', 3),
                'defer_paywall' => (bool) config('growth.defer_paywall_until_share', true),
            ];
        }

        $count = (int) $wedding->growth_share_count + 1;
        $wedding->forceFill([
            'growth_share_count' => $count,
            'first_shared_at' => $wedding->first_shared_at ?? now(),
        ])->save();

        return $this->shareState($wedding->fresh());
    }

    public function shareState(?Wedding $wedding): array
    {
        $goal = (int) config('growth.share_goal', 3);

        $firstShared = $wedding?->first_shared_at;
        if ($firstShared instanceof \DateTimeInterface) {
            $firstSharedIso = $firstShared->format(\DateTimeInterface::ATOM);
        } elseif (is_string($firstShared) && $firstShared !== '') {
            $firstSharedIso = $firstShared;
        } else {
            $firstSharedIso = null;
        }

        return [
            'share_count' => (int) ($wedding?->growth_share_count ?? 0),
            'first_shared_at' => $firstSharedIso,
            'share_goal' => $goal,
            'defer_paywall' => (bool) config('growth.defer_paywall_until_share', true),
            'has_shared' => (int) ($wedding?->growth_share_count ?? 0) >= 1,
            'goal_met' => (int) ($wedding?->growth_share_count ?? 0) >= $goal,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function publicProps(?User $user = null): array
    {
        $trialDays = (int) config('billing.trial_days', 30);
        $guestLimit = (int) config('billing.trial.guest_limit', 100);
        $code = $user && $this->tablesReady() ? $this->ensureReferralCode($user) : null;
        $couponPercent = max(1, min(90, (int) config('growth.referral.coupon_percent', 50)));
        $coupons = app(CouponService::class)->availableForUser($user);

        return [
            'trial_days' => $trialDays,
            'guest_limit' => $guestLimit,
            'share_goal' => (int) config('growth.share_goal', 3),
            'defer_paywall_until_share' => (bool) config('growth.defer_paywall_until_share', true),
            'referral_enabled' => (bool) config('growth.referral.enabled', true),
            'referral_coupon_percent' => $couponPercent,
            'referral_reward_days' => 0,
            'referral_reward_credits' => 0,
            'referral_code' => $code ?: null,
            'referral_url' => $code ? url('/register?ref='.$code) : url('/register'),
            'partner_enabled' => (bool) config('growth.partner.enabled', true),
            'coupons' => $coupons,
            'has_site_coupon' => $coupons !== [],
        ];
    }

    public function seedPartnerCodes(): void
    {
        if (! $this->tablesReady()) {
            return;
        }

        foreach (config('growth.partner.seed', []) as $row) {
            PartnerCode::query()->updateOrCreate(
                ['code' => strtoupper((string) $row['code'])],
                [
                    'label' => $row['label'] ?? null,
                    'bonus_trial_days' => (int) ($row['bonus_trial_days'] ?? config('growth.partner.default_bonus_days', 14)),
                    'active' => true,
                ],
            );
        }
    }

    private function applyPartnerBonus(User $user, Wedding $wedding): void
    {
        if (! config('growth.partner.enabled', true) || filled($user->partner_rewarded_at)) {
            return;
        }

        $partner = $user->partner_code_id
            ? PartnerCode::query()->where('active', true)->find($user->partner_code_id)
            : null;

        if (! $partner) {
            return;
        }

        $days = max(0, (int) $partner->bonus_trial_days);
        if ($days < 1) {
            return;
        }

        DB::transaction(function () use ($user, $wedding, $partner, $days): void {
            $this->extendSiteWindow($wedding, $days);
            $user->forceFill(['partner_rewarded_at' => now()])->save();

            GrowthReward::query()->create([
                'user_id' => $user->id,
                'type' => 'partner_publish',
                'site_days' => $days,
                'credits' => 0,
                'event_id' => $wedding->id,
                'meta' => ['partner_code' => $partner->code],
            ]);
        });
    }

    private function rewardReferrer(User $friend, Wedding $wedding): void
    {
        if (! config('growth.referral.enabled', true) || blank($friend->referred_by_user_id)) {
            return;
        }

        if (filled($friend->referral_rewarded_at)) {
            return;
        }

        $referrer = User::query()->find($friend->referred_by_user_id);
        if (! $referrer) {
            return;
        }

        DB::transaction(function () use ($friend, $referrer, $wedding): void {
            $coupon = app(CouponService::class)->issueReferralSiteCoupon($referrer, $friend);

            $friend->forceFill(['referral_rewarded_at' => now()])->save();

            GrowthReward::query()->create([
                'user_id' => $referrer->id,
                'type' => 'referral_coupon',
                'site_days' => 0,
                'credits' => 0,
                'source_user_id' => $friend->id,
                'event_id' => $wedding->id,
                'meta' => [
                    'friend_user_id' => $friend->id,
                    'coupon_id' => $coupon?->id,
                    'coupon_code' => $coupon?->code,
                    'percent_off' => $coupon?->percent_off,
                    'applies_to' => 'site_cost',
                ],
            ]);
        });
    }

    private function extendSiteWindow(Wedding $wedding, int $days): void
    {
        if ($days < 1) {
            return;
        }

        if ($wedding->site_billing_status === 'trial') {
            $base = $wedding->site_trial_ends_at && $wedding->site_trial_ends_at->isFuture()
                ? $wedding->site_trial_ends_at->copy()
                : now();
            $wedding->forceFill([
                'site_trial_ends_at' => $base->addDays($days),
            ])->save();

            return;
        }

        if ($wedding->site_billing_status === 'paid') {
            $base = $wedding->site_pack_ends_at && $wedding->site_pack_ends_at->isFuture()
                ? $wedding->site_pack_ends_at->copy()
                : now();
            $wedding->forceFill([
                'site_pack_ends_at' => $base->addDays($days),
                'site_pack_days' => (int) ($wedding->site_pack_days ?? 0) + $days,
            ])->save();
        }
    }

    private function uniqueReferralCode(User $user): string
    {
        $base = strtoupper(preg_replace('/[^A-Z0-9]/', '', Str::substr(Str::slug($user->name, ''), 0, 4)) ?: 'EV');
        for ($i = 0; $i < 12; $i++) {
            $code = $base.Str::upper(Str::random(4));
            if (! User::query()->where('referral_code', $code)->exists()) {
                return Str::substr($code, 0, 12);
            }
        }

        return Str::upper(Str::random(8));
    }
}
