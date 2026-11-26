<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $type
 * @property string $group_key
 * @property string $title
 * @property string|null $body
 * @property int $count
 * @property array<string, mixed>|null $data
 * @property Carbon|null $read_at
 * @property Carbon|null $cleared_at
 * @property Carbon $last_occurred_at
 */
class AppNotification extends Model
{
    public const TYPE_COUPON = 'coupon';

    public const TYPE_RSVP = 'rsvp';

    public const TYPE_CELEBRATE = 'celebrate';

    public const TYPE_WISH = 'wish';

    public const TYPE_PHOTO = 'photo';

    protected $fillable = [
        'user_id',
        'type',
        'group_key',
        'title',
        'body',
        'count',
        'data',
        'read_at',
        'cleared_at',
        'last_occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'count' => 'integer',
            'data' => 'array',
            'read_at' => 'datetime',
            'cleared_at' => 'datetime',
            'last_occurred_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isUnread(): bool
    {
        return $this->read_at === null;
    }
}
