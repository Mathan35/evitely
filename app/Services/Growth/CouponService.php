<?php

namespace App\Services\Growth;

use App\Models\AppNotification;
use App\Models\User;
use App\Models\UserCoupon;
use App\Models\Wedding;
use App\Services\Notifications\AppNotificationService;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CouponService
{
    public function __construct(private AppNotificationService $notifications) {}

    public function tablesReady(): bool
    {
        try {
            return Schema::hasTable('user_coupons');
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Issue a 50% site-cost coupon to the referrer (once per referred friend publish).
     */
    public function issueReferralSiteCoupon(User $referrer, User $friend): ?UserCoupon
    {
        if (! $this->tablesReady()) {
            return null;
        }

        $percent = max(1, min(90, (int) config('growth.referral.coupon_percent', 50)));

        $coupon = UserCoupon::query()->create([
            'user_id' => $referrer->id,
            'code' => $this->uniqueCode(),
            'type' => UserCoupon::TYPE_REFERRAL_SITE_50,
            'percent_off' => $percent,
            'applies_to' => 'site_cost',
            'status' => UserCoupon::STATUS_AVAILABLE,
            'source_user_id' => $friend->id,
            'meta' => [
                'friend_name' => $friend->name,
                'label' => $percent.'% off site pack',
            ],
        ]);

        $this->notifications->push(
            $referrer,
            AppNotification::TYPE_COUPON,
            'coupon:'.$coupon->id,
            'You earned a '.$percent.'% site coupon',
            trim($friend->name).' published — use it on your next site pack (site cost only).',
            [
                'href' => '/settings/profile',
                'coupon_id' => $coupon->id,
                'coupon_code' => $coupon->code,
                'percent_off' => $percent,
                'actor_name' => $friend->name,
            ],
        );

        return $coupon;
    }

    /**
     * @return list<array{id: int, code: string, percent_off: int, label: string, status: string}>
     */
    public function availableForUser(?User $user): array
    {
        if (! $user || ! $this->tablesReady()) {
            return [];
        }

        return UserCoupon::query()
            ->where('user_id', $user->id)
            ->where('status', UserCoupon::STATUS_AVAILABLE)
            ->latest('id')
            ->get()
            ->map(fn (UserCoupon $coupon) => $this->toPublic($coupon))
            ->values()
            ->all();
    }

    public function firstAvailable(?User $user): ?UserCoupon
    {
        if (! $user || ! $this->tablesReady()) {
            return null;
        }

        return UserCoupon::query()
            ->where('user_id', $user->id)
            ->where('status', UserCoupon::STATUS_AVAILABLE)
            ->oldest('id')
            ->first();
    }

    /**
     * Split site vs credits amounts and apply percent-off to site portion only.
     *
     * @return array{
     *   amount_minor: int,
     *   site_amount_minor: int,
     *   credits_amount_minor: int,
     *   discount_minor: int,
     *   coupon: ?array{id: int, code: string, percent_off: int},
     *   price_label: string
     * }
     */
    public function priceWithOptionalCoupon(
        User $user,
        int $siteAmountMinor,
        int $totalWithCreditsMinor,
        bool $includeCredits,
        bool $useCoupon,
        string $currency = 'inr',
    ): array {
        $siteAmount = max(0, $siteAmountMinor);
        $withCredits = max($siteAmount, $totalWithCreditsMinor);
        $creditsAmount = $includeCredits ? max(0, $withCredits - $siteAmount) : 0;

        $coupon = null;
        $discount = 0;
        $discountedSite = $siteAmount;

        if ($useCoupon) {
            $coupon = $this->firstAvailable($user);
            if ($coupon) {
                $percent = max(1, min(90, (int) $coupon->percent_off));
                $discountedSite = (int) round($siteAmount * (100 - $percent) / 100);
                $discount = max(0, $siteAmount - $discountedSite);
            }
        }

        $amount = $discountedSite + $creditsAmount;
        // Payment gateways need a floor; keep at least 100 minor units when charging.
        if ($amount > 0 && $amount < 100) {
            $amount = 100;
        }

        return [
            'amount_minor' => $amount,
            'site_amount_minor' => $discountedSite,
            'credits_amount_minor' => $creditsAmount,
            'discount_minor' => $discount,
            'coupon' => $coupon ? [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'percent_off' => (int) $coupon->percent_off,
            ] : null,
            'price_label' => $this->formatMoney($amount, $currency),
        ];
    }

    public function redeem(?User $user, ?int $couponId, Wedding $wedding): void
    {
        if (! $user || ! $couponId || ! $this->tablesReady()) {
            return;
        }

        $coupon = UserCoupon::query()
            ->where('user_id', $user->id)
            ->where('id', $couponId)
            ->where('status', UserCoupon::STATUS_AVAILABLE)
            ->first();

        if (! $coupon) {
            return;
        }

        $coupon->forceFill([
            'status' => UserCoupon::STATUS_REDEEMED,
            'redeemed_at' => now(),
            'redeemed_event_id' => $wedding->id,
        ])->save();
    }

    /**
     * @return array{id: int, code: string, percent_off: int, label: string, status: string}
     */
    public function toPublic(UserCoupon $coupon): array
    {
        return [
            'id' => $coupon->id,
            'code' => $coupon->code,
            'percent_off' => (int) $coupon->percent_off,
            'label' => (string) ($coupon->meta['label'] ?? ($coupon->percent_off.'% off site pack')),
            'status' => $coupon->status,
        ];
    }

    private function uniqueCode(): string
    {
        for ($i = 0; $i < 16; $i++) {
            $code = 'SITE50-'.Str::upper(Str::random(6));
            if (! UserCoupon::query()->where('code', $code)->exists()) {
                return $code;
            }
        }

        return 'SITE50-'.Str::upper(Str::random(8));
    }

    private function formatMoney(int $amountMinor, string $currency): string
    {
        $currency = strtolower($currency) === 'usd' ? 'usd' : 'inr';

        return $currency === 'usd'
            ? '$'.number_format($amountMinor / 100, $amountMinor % 100 === 0 ? 0 : 2, '.', ',')
            : '₹'.number_format($amountMinor / 100, 0, '.', ',');
    }
}
