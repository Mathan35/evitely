<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiftClaim extends Model
{
    protected $fillable = [
        'event_id', 'gift_item_id', 'gift_label', 'name', 'email', 'note', 'status',
    ];

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }
}
