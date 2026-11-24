<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventHost extends Model
{
    protected $fillable = ['event_id', 'name', 'role', 'photo', 'description', 'sort_order'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }
}
