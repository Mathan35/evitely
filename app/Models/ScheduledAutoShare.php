<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $event_id
 * @property bool $enabled
 * @property string $status
 * @property string $channel_mode
 * @property int $reserved_credits
 * @property int $spent_credits
 * @property Carbon|null $scheduled_for
 * @property Carbon|null $started_at
 * @property Carbon|null $finished_at
 * @property string|null $last_error
 */
class ScheduledAutoShare extends Model
{
    protected $fillable = [
        'event_id',
        'enabled',
        'status',
        'channel_mode',
        'reserved_credits',
        'spent_credits',
        'scheduled_for',
        'started_at',
        'finished_at',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'reserved_credits' => 'integer',
            'spent_credits' => 'integer',
            'scheduled_for' => 'datetime',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(ScheduledAutoShareRecipient::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending' && $this->enabled;
    }
}
