<?php

namespace App\Models;

use App\Enums\RsvpStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $wedding_id
 * @property int|null $wedding_guest_id
 * @property string $guest_name
 * @property string $email
 * @property RsvpStatus $status
 * @property int $guest_count
 * @property string|null $meal_preference
 * @property string|null $dietary_restrictions
 * @property string|null $message
 */
class WeddingRsvp extends Model
{
    protected $table = 'event_rsvps';

    protected $fillable = [
        'event_id', 'event_guest_id', 'guest_name', 'email', 'status', 'guest_count',
        'meal_preference', 'dietary_restrictions', 'message', 'answers',
    ];

    protected function casts(): array
    {
        return [
            'status' => RsvpStatus::class,
            'guest_count' => 'integer',
            'answers' => 'array',
        ];
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(WeddingGuest::class, 'event_guest_id');
    }

    public function eventReplies(): HasMany
    {
        return $this->hasMany(EventRsvp::class, 'event_rsvp_id');
    }
}
