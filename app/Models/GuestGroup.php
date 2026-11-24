<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GuestGroup extends Model
{
    protected $table = 'event_guest_groups';

    protected $fillable = ['event_id', 'name', 'description'];

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }

    public function guests(): HasMany
    {
        return $this->hasMany(WeddingGuest::class);
    }
}
