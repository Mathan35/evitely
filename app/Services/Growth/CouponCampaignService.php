<?php

namespace App\Services\Growth;

use App\Jobs\NotifyCouponCampaignJob;
use App\Models\AppNotification;
use App\Models\CouponCampaign;
use App\Models\User;
use App\Models\UserCoupon;
use App\Services\Notifications\AppNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CouponCampaignService
{
    public function __construct(
        private AppNotificationService $notifications,
        private CouponService $coupons,
    ) {}

    public function tablesReady(): bool
    {
        try {
            return Schema::hasTable('coupon_campaigns') && Schema::hasTable('user_coupons');
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @param  array{
     *   code?: string|null,
     *   title: string,
     *   description?: string|null,
     *   discount_type: string,
     *   percent_off?: int|null,
     *   amount_off_minor?: int|null,
     *   currency?: string,
     *   starts_at?: string|null,
     *   ends_at?: string|null,
     *   max_claims: int,
     *   is_active?: bool,
     *   notify?: bool
     * }  $data
     */
    public function create(array $data, User $actor): CouponCampaign
    {
        if (! $this->tablesReady()) {
            throw ValidationException::withMessages([
                'coupon' => 'Coupon tables are not ready. Run migrations.',
            ]);
        }

        $type = $data['discount_type'] === CouponCampaign::DISCOUNT_AMOUNT
            ? CouponCampaign::DISCOUNT_AMOUNT
            : CouponCampaign::DISCOUNT_PERCENT;

        $code = strtoupper(trim((string) ($data['code'] ?? '')));
        if ($code === '') {
            $code = $this->uniqueCampaignCode($type === CouponCampaign::DISCOUNT_PERCENT ? 'PCT' : 'AMT');
        }

        if (CouponCampaign::query()->where('code', $code)->exists()) {
            throw ValidationException::withMessages([
                'code' => 'That coupon code is already in use.',
            ]);
        }

        $percent = null;
        $amount = null;
        if ($type === CouponCampaign::DISCOUNT_PERCENT) {
            $percent = max(1, min(90, (int) ($data['percent_off'] ?? 0)));
            if ($percent < 1) {
                throw ValidationException::withMessages(['percent_off' => 'Enter a percent between 1 and 90.']);
            }
        } else {
            $amount = max(100, (int) ($data['amount_off_minor'] ?? 0));
            if ($amount < 100) {
                throw ValidationException::withMessages(['amount_off_minor' => 'Amount must be at least ₹1 (100 paise).']);
            }
        }

        $campaign = CouponCampaign::query()->create([
            'code' => $code,
            'title' => trim((string) $data['title']),
            'description' => filled($data['description'] ?? null) ? trim((string) $data['description']) : null,
            'discount_type' => $type,
            'percent_off' => $percent,
            'amount_off_minor' => $amount,
            'currency' => strtolower((string) ($data['currency'] ?? 'inr')) === 'usd' ? 'usd' : 'inr',
            'applies_to' => 'site_cost',
            'starts_at' => $data['starts_at'] ?? now(),
            'ends_at' => $data['ends_at'] ?? null,
            'max_claims' => max(1, (int) $data['max_claims']),
            'claimed_count' => 0,
            'max_per_user' => 1,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'notify_status' => CouponCampaign::NOTIFY_PENDING,
            'notified_count' => 0,
            'created_by' => $actor->id,
        ]);

        if ((bool) ($data['notify'] ?? true)) {
            // Sync so shared hosting without a queue worker still notifies immediately.
            NotifyCouponCampaignJob::dispatchSync($campaign->id);
        }

        return $campaign;
    }

    /**
     * @param  array{
     *   title?: string,
     *   description?: string|null,
     *   starts_at?: mixed,
     *   ends_at?: mixed,
     *   max_claims?: int,
     *   is_active?: bool,
     *   sync_expiry_to_issued?: bool
     * }  $data
     */
    public function updateCampaign(CouponCampaign $campaign, array $data): CouponCampaign
    {
        $maxClaims = max(1, (int) ($data['max_claims'] ?? $campaign->max_claims));
        if ($maxClaims < (int) $campaign->claimed_count) {
            throw ValidationException::withMessages([
                'max_claims' => 'Claim limit cannot be below already claimed count ('.$campaign->claimed_count.').',
            ]);
        }

        $campaign->forceFill([
            'title' => isset($data['title']) ? trim((string) $data['title']) : $campaign->title,
            'description' => array_key_exists('description', $data)
                ? (filled($data['description']) ? trim((string) $data['description']) : null)
                : $campaign->description,
            'starts_at' => $data['starts_at'] ?? $campaign->starts_at,
            'ends_at' => array_key_exists('ends_at', $data) ? $data['ends_at'] : $campaign->ends_at,
            'max_claims' => $maxClaims,
            'is_active' => array_key_exists('is_active', $data)
                ? (bool) $data['is_active']
                : $campaign->is_active,
        ])->save();

        if ((bool) ($data['sync_expiry_to_issued'] ?? false)) {
            UserCoupon::query()
                ->where('campaign_id', $campaign->id)
                ->where('status', UserCoupon::STATUS_AVAILABLE)
                ->update([
                    'expires_at' => $campaign->ends_at,
                ]);

            if ($campaign->ends_at && $campaign->ends_at->isPast()) {
                UserCoupon::query()
                    ->where('campaign_id', $campaign->id)
                    ->where('status', UserCoupon::STATUS_AVAILABLE)
                    ->update(['status' => UserCoupon::STATUS_EXPIRED]);
            }
        }

        return $campaign->fresh();
    }

    public function toggleActive(CouponCampaign $campaign, bool $active): CouponCampaign
    {
        $campaign->forceFill(['is_active' => $active])->save();

        return $campaign->fresh();
    }

    /**
     * Claim (or re-fetch existing) a campaign coupon for a user.
     */
    public function claimForUser(CouponCampaign $campaign, User $user): UserCoupon
    {
        if (! $this->tablesReady()) {
            throw ValidationException::withMessages(['coupon' => 'Coupons are unavailable right now.']);
        }

        return DB::transaction(function () use ($campaign, $user) {
            /** @var CouponCampaign $locked */
            $locked = CouponCampaign::query()->whereKey($campaign->id)->lockForUpdate()->firstOrFail();

            $existing = UserCoupon::query()
                ->where('campaign_id', $locked->id)
                ->where('user_id', $user->id)
                ->where('status', UserCoupon::STATUS_AVAILABLE)
                ->first();

            if ($existing) {
                return $existing;
            }

            if (! $locked->isClaimable()) {
                throw ValidationException::withMessages([
                    'coupon' => $locked->hasClaimsRemaining()
                        ? 'This coupon is not active or has expired.'
                        : 'This coupon has reached its claim limit.',
                ]);
            }

            $alreadyRedeemed = UserCoupon::query()
                ->where('campaign_id', $locked->id)
                ->where('user_id', $user->id)
                ->where('status', UserCoupon::STATUS_REDEEMED)
                ->exists();

            if ($alreadyRedeemed && $locked->max_per_user <= 1) {
                throw ValidationException::withMessages([
                    'coupon' => 'You already used this coupon.',
                ]);
            }

            $coupon = $this->issueUserCoupon($locked, $user, notify: false);
            $locked->forceFill([
                'claimed_count' => (int) $locked->claimed_count + 1,
            ])->save();

            return $coupon;
        });
    }

    public function claimByCode(User $user, string $code): UserCoupon
    {
        $code = strtoupper(trim($code));
        $campaign = CouponCampaign::query()->where('code', $code)->first();

        if (! $campaign) {
            throw ValidationException::withMessages([
                'code' => 'We couldn’t find that coupon code.',
            ]);
        }

        return $this->claimForUser($campaign, $user);
    }

    /**
     * Distribute notifications + coupons: heavy event users first, then unused users.
     * No artificial delay between groups.
     */
    public function distributeNotifications(CouponCampaign $campaign): void
    {
        if (! $this->tablesReady()) {
            return;
        }

        $campaign->forceFill(['notify_status' => CouponCampaign::NOTIFY_RUNNING])->save();

        // Priority: hosts with the most events first (no delay between cohorts).
        User::query()
            ->whereNull('disabled_at')
            ->has('weddings')
            ->withCount('weddings')
            ->orderByDesc('weddings_count')
            ->orderBy('id')
            ->chunk(75, function ($users) use ($campaign): void {
                foreach ($users as $user) {
                    $this->notifyAndIssueIfPossible($campaign->fresh(), $user);
                }
            });

        // Then unused accounts (zero events), immediately after — no sleep/interval.
        User::query()
            ->whereNull('disabled_at')
            ->doesntHave('weddings')
            ->orderBy('id')
            ->chunkById(100, function ($users) use ($campaign): void {
                foreach ($users as $user) {
                    $this->notifyAndIssueIfPossible($campaign->fresh(), $user);
                }
            });

        $campaign->fresh()?->forceFill(['notify_status' => CouponCampaign::NOTIFY_DONE])->save();
    }

    public function notifyAndIssueIfPossible(?CouponCampaign $campaign, User $user): void
    {
        if (! $campaign || ! $campaign->is_active) {
            return;
        }

        DB::transaction(function () use ($campaign, $user): void {
            /** @var CouponCampaign $locked */
            $locked = CouponCampaign::query()->whereKey($campaign->id)->lockForUpdate()->first();
            if (! $locked || ! $locked->isClaimable()) {
                return;
            }

            $hasAny = UserCoupon::query()
                ->where('campaign_id', $locked->id)
                ->where('user_id', $user->id)
                ->exists();

            if ($hasAny) {
                return;
            }

            $coupon = $this->issueUserCoupon($locked, $user, notify: true);
            $locked->forceFill([
                'claimed_count' => (int) $locked->claimed_count + 1,
                'notified_count' => (int) $locked->notified_count + 1,
            ])->save();

            unset($coupon);
        });
    }

    private function issueUserCoupon(CouponCampaign $campaign, User $user, bool $notify): UserCoupon
    {
        $label = $campaign->discountLabel().' · '.$campaign->title;

        $coupon = UserCoupon::query()->create([
            'user_id' => $user->id,
            'campaign_id' => $campaign->id,
            'code' => $campaign->code,
            'type' => UserCoupon::TYPE_CAMPAIGN,
            'discount_type' => $campaign->discount_type,
            'percent_off' => $campaign->percent_off,
            'amount_off_minor' => $campaign->amount_off_minor,
            'applies_to' => 'site_cost',
            'status' => UserCoupon::STATUS_AVAILABLE,
            'expires_at' => $campaign->ends_at,
            'meta' => [
                'label' => $label,
                'campaign_title' => $campaign->title,
                'campaign_id' => $campaign->id,
            ],
        ]);

        if ($notify) {
            $this->notifications->push(
                $user,
                AppNotification::TYPE_COUPON,
                'campaign:'.$campaign->id,
                'New coupon: '.$campaign->discountLabel(),
                $campaign->title.' — use it on your next site pack. Code '.$campaign->code.'.',
                [
                    'href' => '/coupons',
                    'coupon_id' => $coupon->id,
                    'campaign_id' => $campaign->id,
                    'coupon_code' => $campaign->code,
                    'discount_type' => $campaign->discount_type,
                    'percent_off' => $campaign->percent_off,
                    'amount_off_minor' => $campaign->amount_off_minor,
                ],
                increment: false,
            );
        }

        return $coupon;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function publicCampaigns(?User $user): array
    {
        if (! $this->tablesReady()) {
            return [];
        }

        return CouponCampaign::query()
            ->active()
            ->latest('id')
            ->limit(30)
            ->get()
            ->filter(fn (CouponCampaign $c) => $c->isWithinValidity())
            ->map(function (CouponCampaign $campaign) use ($user) {
                $mine = null;
                $hasRedeemed = false;
                if ($user) {
                    $mine = UserCoupon::query()
                        ->where('campaign_id', $campaign->id)
                        ->where('user_id', $user->id)
                        ->where('status', UserCoupon::STATUS_AVAILABLE)
                        ->latest('id')
                        ->first();
                    $hasRedeemed = UserCoupon::query()
                        ->where('campaign_id', $campaign->id)
                        ->where('user_id', $user->id)
                        ->where('status', UserCoupon::STATUS_REDEEMED)
                        ->exists();
                }

                return [
                    'id' => $campaign->id,
                    'code' => $campaign->code,
                    'title' => $campaign->title,
                    'description' => $campaign->description,
                    'discount_type' => $campaign->discount_type,
                    'percent_off' => $campaign->percent_off,
                    'amount_off_minor' => $campaign->amount_off_minor,
                    'discount_label' => $campaign->discountLabel(),
                    'starts_at' => $campaign->starts_at?->toIso8601String(),
                    'ends_at' => $campaign->ends_at?->toIso8601String(),
                    'claims_remaining' => max(0, $campaign->max_claims - $campaign->claimed_count),
                    'claimable' => $user !== null
                        && $campaign->isClaimable()
                        && $mine === null
                        && ! $hasRedeemed,
                    'owned' => $mine ? $this->coupons->toPublic($mine) : null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function adminList(int $limit = 50): array
    {
        if (! $this->tablesReady()) {
            return [];
        }

        return CouponCampaign::query()
            ->latest('id')
            ->limit($limit)
            ->get()
            ->map(fn (CouponCampaign $c) => [
                'id' => $c->id,
                'code' => $c->code,
                'title' => $c->title,
                'description' => $c->description,
                'discount_type' => $c->discount_type,
                'percent_off' => $c->percent_off,
                'amount_off_minor' => $c->amount_off_minor,
                'discount_label' => $c->discountLabel(),
                'starts_at' => $c->starts_at?->toIso8601String(),
                'ends_at' => $c->ends_at?->toIso8601String(),
                'max_claims' => $c->max_claims,
                'claimed_count' => $c->claimed_count,
                'notified_count' => $c->notified_count,
                'notify_status' => $c->notify_status,
                'is_active' => $c->is_active,
                'created_at' => $c->created_at?->toIso8601String(),
            ])
            ->all();
    }

    private function uniqueCampaignCode(string $prefix): string
    {
        for ($i = 0; $i < 16; $i++) {
            $code = strtoupper($prefix).'-'.Str::upper(Str::random(6));
            if (! CouponCampaign::query()->where('code', $code)->exists()) {
                return $code;
            }
        }

        return strtoupper($prefix).'-'.Str::upper(Str::random(8));
    }
}
