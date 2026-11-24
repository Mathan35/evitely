<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventCard extends Model
{
    protected $fillable = ['event_id', 'format', 'width', 'height', 'status', 'document', 'preview_path'];

    protected function casts(): array
    {
        return ['document' => 'array'];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }
}
