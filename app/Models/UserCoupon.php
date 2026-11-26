<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $code
 * @property string $type
 * @property int $percent_off
 * @property string $applies_to
 * @property string $status
 * @property int|null $source_user_id
 * @property int|null $redeemed_event_id
 * @property Carbon|null $redeemed_at
 * @property array<string, mixed>|null $meta
 */
class UserCoupon extends Model
{
    public const STATUS_AVAILABLE = 'available';

    public const STATUS_REDEEMED = 'redeemed';

    public const TYPE_REFERRAL_SITE_50 = 'referral_site_50';

    protected $fillable = [
        'user_id',
        'code',
        'type',
        'percent_off',
        'applies_to',
        'status',
        'source_user_id',
        'redeemed_event_id',
        'redeemed_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'percent_off' => 'integer',
            'redeemed_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sourceUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'source_user_id');
    }

    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_AVAILABLE;
    }
}
