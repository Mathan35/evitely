<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeddingTranslation extends Model
{
    protected $table = 'event_translations';

    protected $fillable = ['event_id', 'locale', 'content'];

    protected function casts(): array
    {
        return ['content' => 'array'];
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class, 'event_id');
    }
}
