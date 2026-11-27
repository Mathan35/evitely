<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $code
 * @property string $title
 * @property string|null $description
 * @property string $discount_type
 * @property int|null $percent_off
 * @property int|null $amount_off_minor
 * @property string $currency
 * @property string $applies_to
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property int $max_claims
 * @property int $claimed_count
 * @property int $max_per_user
 * @property bool $is_active
 * @property string $notify_status
 * @property int $notified_count
 * @property int|null $created_by
 */
class CouponCampaign extends Model
{
    public const DISCOUNT_PERCENT = 'percent';

    public const DISCOUNT_AMOUNT = 'amount';

    public const NOTIFY_PENDING = 'pending';

    public const NOTIFY_RUNNING = 'running';

    public const NOTIFY_DONE = 'done';

    protected $fillable = [
        'code',
        'title',
        'description',
        'discount_type',
        'percent_off',
        'amount_off_minor',
        'currency',
        'applies_to',
        'starts_at',
        'ends_at',
        'max_claims',
        'claimed_count',
        'max_per_user',
        'is_active',
        'notify_status',
        'notified_count',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'percent_off' => 'integer',
            'amount_off_minor' => 'integer',
            'max_claims' => 'integer',
            'claimed_count' => 'integer',
            'max_per_user' => 'integer',
            'is_active' => 'boolean',
            'notified_count' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function userCoupons(): HasMany
    {
        return $this->hasMany(UserCoupon::class, 'campaign_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function isWithinValidity(?Carbon $at = null): bool
    {
        $at ??= now();

        if ($this->starts_at && $at->lt($this->starts_at)) {
            return false;
        }

        if ($this->ends_at && $at->gt($this->ends_at)) {
            return false;
        }

        return true;
    }

    public function hasClaimsRemaining(): bool
    {
        return $this->claimed_count < $this->max_claims;
    }

    public function isClaimable(): bool
    {
        return $this->is_active && $this->isWithinValidity() && $this->hasClaimsRemaining();
    }

    public function discountLabel(): string
    {
        if ($this->discount_type === self::DISCOUNT_AMOUNT) {
            $minor = (int) ($this->amount_off_minor ?? 0);
            $currency = strtolower((string) $this->currency) === 'usd' ? 'usd' : 'inr';

            return $currency === 'usd'
                ? '$'.number_format($minor / 100, $minor % 100 === 0 ? 0 : 2, '.', ',').' off'
                : '₹'.number_format($minor / 100, 0, '.', ',').' off';
        }

        return ((int) $this->percent_off).'% off';
    }
}
