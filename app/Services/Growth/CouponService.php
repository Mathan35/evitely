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
            'discount_type' => UserCoupon::DISCOUNT_PERCENT,
            'percent_off' => $percent,
            'amount_off_minor' => null,
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
                'href' => '/coupons',
                'coupon_id' => $coupon->id,
                'coupon_code' => $coupon->code,
                'percent_off' => $percent,
                'discount_type' => UserCoupon::DISCOUNT_PERCENT,
                'actor_name' => $friend->name,
            ],
        );

        return $coupon;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function availableForUser(?User $user): array
    {
        if (! $user || ! $this->tablesReady()) {
            return [];
        }

        $this->expireStaleForUser($user);

        return UserCoupon::query()
            ->where('user_id', $user->id)
            ->where('status', UserCoupon::STATUS_AVAILABLE)
            ->where(function ($q): void {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
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

        $this->expireStaleForUser($user);

        return UserCoupon::query()
            ->where('user_id', $user->id)
            ->where('status', UserCoupon::STATUS_AVAILABLE)
            ->where(function ($q): void {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->oldest('id')
            ->first();
    }

    /**
     * Split site vs credits amounts and apply percent or fixed amount off to site portion only.
     *
     * @return array{
     *   amount_minor: int,
     *   site_amount_minor: int,
     *   credits_amount_minor: int,
     *   discount_minor: int,
     *   coupon: ?array{id: int, code: string, percent_off: int|null, discount_type: string, amount_off_minor: int|null},
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
                if ($coupon->discount_type === UserCoupon::DISCOUNT_AMOUNT) {
                    $discount = min($siteAmount, max(0, (int) $coupon->amount_off_minor));
                    $discountedSite = max(0, $siteAmount - $discount);
                } else {
                    $percent = max(1, min(90, (int) $coupon->percent_off));
                    $discountedSite = (int) round($siteAmount * (100 - $percent) / 100);
                    $discount = max(0, $siteAmount - $discountedSite);
                }
            }
        }

        $amount = $discountedSite + $creditsAmount;
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
                'discount_type' => $coupon->discount_type ?: UserCoupon::DISCOUNT_PERCENT,
                'percent_off' => $coupon->percent_off !== null ? (int) $coupon->percent_off : null,
                'amount_off_minor' => $coupon->amount_off_minor !== null ? (int) $coupon->amount_off_minor : null,
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

        if (! $coupon || ! $coupon->isAvailable()) {
            return;
        }

        $coupon->forceFill([
            'status' => UserCoupon::STATUS_REDEEMED,
            'redeemed_at' => now(),
            'redeemed_event_id' => $wedding->id,
        ])->save();
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublic(UserCoupon $coupon): array
    {
        return [
            'id' => $coupon->id,
            'code' => $coupon->code,
            'discount_type' => $coupon->discount_type ?: UserCoupon::DISCOUNT_PERCENT,
            'percent_off' => $coupon->percent_off !== null ? (int) $coupon->percent_off : null,
            'amount_off_minor' => $coupon->amount_off_minor !== null ? (int) $coupon->amount_off_minor : null,
            'label' => (string) ($coupon->meta['label'] ?? $coupon->discountLabel()),
            'status' => $coupon->status,
            'expires_at' => $coupon->expires_at?->toIso8601String(),
            'campaign_id' => $coupon->campaign_id,
        ];
    }

    private function expireStaleForUser(User $user): void
    {
        UserCoupon::query()
            ->where('user_id', $user->id)
            ->where('status', UserCoupon::STATUS_AVAILABLE)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->update(['status' => UserCoupon::STATUS_EXPIRED]);
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
