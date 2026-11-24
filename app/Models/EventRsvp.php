<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRsvp extends Model
{
    protected $table = 'event_schedule_responses';

    protected $fillable = ['event_rsvp_id', 'event_schedule_id', 'attending'];

    protected function casts(): array
    {
        return ['attending' => 'boolean'];
    }

    public function rsvp(): BelongsTo
    {
        return $this->belongsTo(WeddingRsvp::class, 'event_rsvp_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(WeddingEvent::class, 'event_schedule_id');
    }
}
