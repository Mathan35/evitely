<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $scheduled_auto_share_id
 * @property int $event_guest_id
 * @property string|null $channel_override
 * @property string $send_status
 * @property string|null $resolved_channel
 * @property string|null $error
 */
class ScheduledAutoShareRecipient extends Model
{
    protected $fillable = [
        'scheduled_auto_share_id',
        'event_guest_id',
        'channel_override',
        'send_status',
        'resolved_channel',
        'error',
    ];

    public function share(): BelongsTo
    {
        return $this->belongsTo(ScheduledAutoShare::class, 'scheduled_auto_share_id');
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(WeddingGuest::class, 'event_guest_id');
    }
}
