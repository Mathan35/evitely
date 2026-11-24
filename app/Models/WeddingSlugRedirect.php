<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeddingSlugRedirect extends Model
{
    protected $table = 'event_slug_redirects';

    protected $fillable = ['event_id', 'slug'];

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }
}
