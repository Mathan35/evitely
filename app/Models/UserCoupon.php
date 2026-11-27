<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $campaign_id
 * @property string $code
 * @property string $type
 * @property string $discount_type
 * @property int|null $percent_off
 * @property int|null $amount_off_minor
 * @property string $applies_to
 * @property string $status
 * @property Carbon|null $expires_at
 * @property int|null $source_user_id
 * @property int|null $redeemed_event_id
 * @property Carbon|null $redeemed_at
 * @property array<string, mixed>|null $meta
 */
class UserCoupon extends Model
{
    public const STATUS_AVAILABLE = 'available';

    public const STATUS_REDEEMED = 'redeemed';

    public const STATUS_EXPIRED = 'expired';

    public const TYPE_REFERRAL_SITE_50 = 'referral_site_50';

    public const TYPE_CAMPAIGN = 'campaign';

    public const DISCOUNT_PERCENT = 'percent';

    public const DISCOUNT_AMOUNT = 'amount';

    protected $fillable = [
        'user_id',
        'campaign_id',
        'code',
        'type',
        'discount_type',
        'percent_off',
        'amount_off_minor',
        'applies_to',
        'status',
        'expires_at',
        'source_user_id',
        'redeemed_event_id',
        'redeemed_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'percent_off' => 'integer',
            'amount_off_minor' => 'integer',
            'redeemed_at' => 'datetime',
            'expires_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(CouponCampaign::class, 'campaign_id');
    }

    public function sourceUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'source_user_id');
    }

    public function isAvailable(): bool
    {
        if ($this->status !== self::STATUS_AVAILABLE) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function discountLabel(): string
    {
        if ($this->discount_type === self::DISCOUNT_AMOUNT) {
            $minor = (int) ($this->amount_off_minor ?? 0);

            return '₹'.number_format($minor / 100, 0, '.', ',').' off';
        }

        return ((int) $this->percent_off).'% off';
    }
}
